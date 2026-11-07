// "Uninstall Setups Works Office…": removes the app and everything it created.
//  - Windows: runs the installer's own uninstaller (it also clears app data, see build/installer.nsh).
//  - macOS: there is no uninstaller for a dragged-in app, so this does the cleanup, then moves the app to the Trash.
import { app, dialog, shell, type BrowserWindow } from "electron";
import { execFile, spawn } from "node:child_process";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const BUNDLE_ID = "com.setupsworks.office";
const APP_NAME = "Setups Works Office";

export interface UninstallDeps {
  win: () => BrowserWindow | null;
  stopServer: () => Promise<void>;
  recentRepos: () => string[];
  /** Called right before deleting so the app stops writing its settings back. */
  freeze: () => void;
}

/** Where the app keeps things on macOS (only the ones that exist are returned). */
export function appFootprint(): string[] {
  const lib = join(homedir(), "Library");
  const all = [
    app.getPath("userData"), // ~/Library/Application Support/Setups Works Office
    join(lib, "Caches", APP_NAME),
    join(lib, "Caches", BUNDLE_ID),
    join(lib, "Caches", `${BUNDLE_ID}.ShipIt`), // the auto-updater's download cache
    join(lib, "Preferences", `${BUNDLE_ID}.plist`),
    join(lib, "Saved Application State", `${BUNDLE_ID}.savedState`),
    join(lib, "HTTPStorages", BUNDLE_ID),
    join(lib, "Logs", APP_NAME),
  ];
  return [...new Set(all)].filter((p) => existsSync(p));
}

/** Teams' data: ~/.swoffic/<project>/<agent> folders, tokens and plans. */
export const teamsHome = () => join(homedir(), ".swoffic");

/** tmux sessions and sandboxes HQ made are named hq-<project>-<agent>, matching ~/.swoffic/<project>/<agent>. */
export function agentSessionNames(): string[] {
  const names: string[] = [];
  try {
    for (const project of readdirSync(teamsHome())) {
      const dir = join(teamsHome(), project);
      if (!statSync(dir).isDirectory()) continue;
      for (const agent of readdirSync(dir)) {
        if (statSync(join(dir, agent)).isDirectory()) names.push(`hq-${project}-${agent}`);
      }
    }
  } catch {
    /* no teams yet */
  }
  return names;
}

const run = (file: string, args: string[]) =>
  new Promise<void>((resolve) => {
    const p = execFile(file, args, { timeout: 20_000 }, () => resolve());
    p.on("error", () => resolve());
  });

export async function uninstall(d: UninstallDeps) {
  const win = d.win();
  const box = (o: Electron.MessageBoxOptions) => (win ? dialog.showMessageBox(win, o) : dialog.showMessageBox(o));

  if (process.platform === "win32") {
    const exe = join(dirname(process.execPath), `Uninstall ${APP_NAME}.exe`);
    if (!existsSync(exe)) {
      await box({ type: "info", message: "Uninstall from Windows Settings", detail: "Open Settings → Apps → Installed apps, find Setups Works Office and choose Uninstall." });
      return;
    }
    const { response } = await box({ type: "warning", buttons: ["Uninstall…", "Cancel"], defaultId: 1, cancelId: 1, message: `Uninstall ${APP_NAME}?`, detail: "This closes the app and starts the uninstaller. It removes the app and its data." });
    if (response !== 0) return;
    await d.stopServer();
    spawn(exe, [], { detached: true, stdio: "ignore" }).unref();
    app.exit(0);
    return;
  }

  if (process.platform !== "darwin") {
    await box({ type: "info", message: "Uninstall from your package manager", detail: "Remove the app the way you installed it." });
    return;
  }

  // ---- macOS
  const bundle = join(dirname(process.execPath), "..", "..");
  const isBundle = bundle.endsWith(".app") && existsSync(bundle);
  const sessions = agentSessionNames();
  const teams = existsSync(teamsHome());
  const footprint = appFootprint();

  const first = await box({
    type: "warning",
    buttons: ["Uninstall", "Cancel"],
    defaultId: 1,
    cancelId: 1,
    message: `Uninstall ${APP_NAME}?`,
    detail: [
      "This removes:",
      isBundle ? `• the app (moved to the Trash)` : "• (running from a development build: the app itself is kept)",
      "• its settings, caches, logs and saved window state",
      "",
      "Your git repositories are not touched.",
    ].join("\n"),
    checkboxLabel: teams ? `Also delete my teams' data (~/.swoffic: agent folders, tokens${sessions.length ? `, ${sessions.length} agent sandbox/tmux session${sessions.length === 1 ? "" : "s"}` : ""})` : undefined,
    checkboxChecked: teams,
  });
  if (first.response !== 0) return;
  const deleteTeams = teams && first.checkboxChecked;

  let repoDirs: string[] = [];
  if (deleteTeams) {
    const found = d.recentRepos().map((r) => join(r, ".swoffic")).filter((p) => existsSync(p));
    if (found.length) {
      const second = await box({
        type: "question",
        buttons: ["Remove them", "Keep them"],
        defaultId: 1,
        cancelId: 1,
        message: `Also remove the .swoffic folder from ${found.length} project${found.length === 1 ? "" : "s"}?`,
        detail: `${found.join("\n")}\n\nThese hold each project's team config and plan.`,
      });
      if (second.response === 0) repoDirs = found;
    }
  }

  d.freeze();
  await d.stopServer();

  if (deleteTeams) {
    // Stop and remove the agents' tmux sessions and sandboxes (best effort: the tools may not be installed).
    await Promise.all(sessions.flatMap((n) => [run("tmux", ["kill-session", "-t", `=${n}`]), run("sbx", ["rm", "-f", n])]));
  }

  const targets = [...footprint, ...(deleteTeams ? [teamsHome()] : []), ...repoDirs];
  for (const p of targets) rmSync(p, { recursive: true, force: true });

  // Electron writes a few files while quitting; clear the data folders once more after it has exited.
  const late = [app.getPath("userData"), ...footprint].map((p) => `'${p.replace(/'/g, "'\\''")}'`).join(" ");
  spawn("/bin/sh", ["-c", `sleep 3; rm -rf ${late}`], { detached: true, stdio: "ignore" }).unref();

  let trashed = false;
  if (isBundle) {
    try {
      await shell.trashItem(bundle);
      trashed = true;
    } catch {
      /* reported below */
    }
  }
  await box({
    type: "info",
    message: `${APP_NAME} was uninstalled`,
    detail: isBundle && !trashed ? `Its data is removed, but the app couldn't be moved to the Trash. Delete it by hand:\n${bundle}` : "Its data and the app are gone. Thanks for trying it!",
  });
  app.exit(0);
}
