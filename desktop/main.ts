// Setups Works Office desktop app. It starts the same HQ server the CLI runs (as a child
// process, on a free localhost port, for the project folder you pick) and shows its UI in a window.
import { app, BrowserWindow, dialog, Menu, shell, type MenuItemConstructorOptions } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, type WriteStream } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { appPath } from "./shellPath";
import { checkForUpdatesNow, setupUpdater } from "./updater";
import { uninstall } from "./uninstall";

// Same folder in dev and packaged builds, whatever the npm package name is.
app.setName("Setups Works Office");
app.setPath("userData", join(app.getPath("appData"), "Setups Works Office"));

const REPO_URL = "https://github.com/Setups-Works/setups-works-office";
const APP_ROOT = join(__dirname, ".."); // repo root in dev, resources/app when packaged
const SERVER_ENTRY = join(APP_ROOT, "dist-server", "main.mjs");
const SMOKE = process.env.SWO_SMOKE === "1";

interface Settings {
  lastRepo?: string;
  recent: string[];
  bounds?: { width: number; height: number };
}

const settingsFile = () => join(app.getPath("userData"), "settings.json");
function loadSettings(): Settings {
  try {
    const s = JSON.parse(readFileSync(settingsFile(), "utf8")) as Settings;
    return { ...s, recent: (s.recent ?? []).filter((p) => existsSync(p)) };
  } catch {
    return { recent: [] };
  }
}
function saveSettings(s: Settings) {
  if (frozen) return;
  try {
    mkdirSync(app.getPath("userData"), { recursive: true });
    writeFileSync(settingsFile(), JSON.stringify(s, null, 2));
  } catch {
    /* not critical */
  }
}

let settings: Settings = { recent: [] };
let win: BrowserWindow | null = null;
let child: ChildProcess | null = null;
let logStream: WriteStream | null = null;
let currentUrl: string | null = null;
let currentRepo: string | null = null;
let quitting = false;
let frozen = false; // set while uninstalling so nothing is written back to disk

const logFile = () => join(app.getPath("userData"), "logs", "server.log");

function splash(message: string, sub = "") {
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;background:#4a8f3d;font-family:system-ui,sans-serif;color:#241a2e">
<div style="background:#fff6e9;border:4px solid #241a2e;box-shadow:6px 6px 0 #241a2e;padding:28px 36px;text-align:center;max-width:520px">
<div style="width:40px;height:40px;margin:0 auto 14px;background:#29adff;border:4px solid #241a2e"></div>
<div style="font-size:22px;font-weight:700">${message}</div><div style="margin-top:8px;color:#7d6b73;font-size:14px;white-space:pre-wrap">${sub}</div></div>`;
  return win?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function freePort(preferred: number): Promise<number> {
  const tryPort = (port: number) =>
    new Promise<number>((resolve, reject) => {
      const s = createServer();
      s.once("error", reject);
      s.listen(port, "127.0.0.1", () => {
        const bound = (s.address() as { port: number }).port; // read before closing (0 asks the OS for any free port)
        s.close(() => resolve(bound));
      });
    });
  return tryPort(preferred).catch(() => tryPort(0));
}

function isGitRepo(dir: string) {
  try {
    return statSync(dir).isDirectory() && existsSync(join(dir, ".git"));
  } catch {
    return false;
  }
}

function killServer(): Promise<void> {
  const c = child;
  child = null;
  if (!c || c.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    c.once("exit", done);
    if (process.platform === "win32" && c.pid) spawn("taskkill", ["/pid", String(c.pid), "/T", "/F"], { windowsHide: true });
    else c.kill("SIGTERM");
    setTimeout(() => {
      try {
        c.kill("SIGKILL");
      } catch {
        /* already gone */
      }
      done();
    }, 4000);
  });
}

/** Start HQ for `repo` and resolve with the UI URL (it includes the browser token). */
async function startServer(repo: string): Promise<string> {
  await killServer();
  const port = await freePort(7420);
  const PATH = await appPath();
  mkdirSync(join(app.getPath("userData"), "logs"), { recursive: true });
  logStream?.end();
  logStream = createWriteStream(logFile(), { flags: "w" });

  const c = spawn(process.execPath, [SERVER_ENTRY, "--repo", repo, "--port", String(port), "--no-open"], {
    cwd: repo,
    env: { ...process.env, PATH, Path: PATH, ELECTRON_RUN_AS_NODE: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child = c;

  return new Promise<string>((resolve, reject) => {
    let buf = "";
    let ready = false;
    const timer = setTimeout(() => !ready && fail("The server didn't start within 40 seconds."), 40_000);
    const fail = (why: string) => {
      clearTimeout(timer);
      void killServer();
      reject(new Error(`${why}\n\n${buf.split("\n").slice(-12).join("\n")}`.trim()));
    };
    const onData = (d: Buffer) => {
      const text = d.toString();
      logStream?.write(text);
      buf = (buf + text).slice(-4000);
      const m = buf.match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s\x1b]+/);
      if (m && !ready) {
        ready = true;
        clearTimeout(timer);
        resolve(m[0]);
      }
    };
    c.stdout?.on("data", onData);
    c.stderr?.on("data", onData);
    c.once("error", (e) => fail(`Couldn't launch the server: ${e.message}`));
    c.once("exit", (code) => {
      if (!ready) return fail(`The server stopped (exit code ${code}).`);
      if (!quitting && child === c) {
        child = null;
        void dialog.showMessageBox({ type: "warning", message: "The Setups Works Office server stopped", detail: "Use File → Restart Server to start it again. Logs: File → Show Server Log." });
      }
    });
  });
}

async function openProject(repo: string, remember = true) {
  if (!isGitRepo(repo)) {
    await dialog.showMessageBox({ type: "warning", message: "That folder isn't a git repository", detail: `${repo}\n\nChoose the folder of a git repo (it has a .git folder).` });
    return false;
  }
  currentRepo = repo;
  win?.setTitle(`Setups Works Office — ${repo.split(/[\\/]/).pop()}`);
  await splash("Starting your office…", repo);
  try {
    currentUrl = await startServer(repo);
  } catch (e) {
    currentUrl = null;
    await splash("Couldn't start the office", String((e as Error).message));
    const { response } = await dialog.showMessageBox({ type: "error", message: "Couldn't start the office", detail: String((e as Error).message).slice(0, 600), buttons: ["Choose another project…", "Retry", "Quit"], defaultId: 1, cancelId: 2 });
    if (response === 0) return chooseProject();
    if (response === 1) return openProject(repo, remember);
    app.quit();
    return false;
  }
  // A repo forced through SWO_REPO (tests, scripts) is not remembered as your project.
  if (remember) {
    settings = { ...settings, lastRepo: repo, recent: [repo, ...settings.recent.filter((p) => p !== repo)].slice(0, 8) };
    saveSettings(settings);
  }
  buildMenu();
  await win?.loadURL(currentUrl);
  return true;
}

async function chooseProject(): Promise<boolean> {
  const opts = { title: "Choose the git repo for your team", properties: ["openDirectory" as const], defaultPath: currentRepo ?? settings.lastRepo };
  const r = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
  const dir = r.filePaths[0];
  if (r.canceled || !dir) return false;
  return openProject(dir);
}

function createWindow() {
  win = new BrowserWindow({
    width: settings.bounds?.width ?? 1440,
    height: settings.bounds?.height ?? 900,
    minWidth: 1280, // the UI lays out at 1280px and up
    minHeight: 720,
    backgroundColor: "#4a8f3d",
    title: "Setups Works Office",
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.once("ready-to-show", () => win?.show());
  // Only the HQ UI may live in this window; everything else opens in your browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (url.startsWith("data:") || (currentUrl && new URL(url).origin === new URL(currentUrl).origin)) return;
    e.preventDefault();
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
  });
  win.on("close", () => {
    if (win && !win.isMaximized() && !win.isFullScreen()) {
      const [width, height] = win.getSize();
      if (width && height) saveSettings({ ...settings, bounds: { width, height } });
    }
  });
  win.on("closed", () => (win = null));
}

function runUninstall() {
  return uninstall({
    win: () => win,
    stopServer: () => {
      quitting = true;
      return killServer();
    },
    recentRepos: () => settings.recent,
    freeze: () => {
      frozen = true;
    },
  });
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const recent: MenuItemConstructorOptions[] = settings.recent.length
    ? settings.recent.map((p) => ({ label: p, click: () => void openProject(p) }))
    : [{ label: "No recent projects", enabled: false }];
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([{ label: app.name, submenu: [{ role: "about" }, { label: "Check for Updates…", click: () => void checkForUpdatesNow() }, { type: "separator" }, { role: "services" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit" }] }] as MenuItemConstructorOptions[])
      : []),
    {
      label: "File",
      submenu: [
        { label: "Open Project…", accelerator: "CmdOrCtrl+O", click: () => void chooseProject() },
        { label: "Recent Projects", submenu: recent },
        { type: "separator" },
        { label: "Restart Server", click: () => currentRepo && void openProject(currentRepo) },
        { label: "Open in Browser", enabled: !!currentUrl, click: () => currentUrl && void shell.openExternal(currentUrl) },
        { label: "Show Server Log", click: () => shell.showItemInFolder(logFile()) },
        { type: "separator" },
        ...((isMac ? [] : [{ label: "Check for Updates…", click: () => void checkForUpdatesNow() }, { type: "separator" }, { role: "quit" }]) as MenuItemConstructorOptions[]),
        ...((isMac ? [{ role: "close" }] : []) as MenuItemConstructorOptions[]),
      ],
    },
    { role: "editMenu" },
    { label: "View", submenu: [{ role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
    { role: "windowMenu" },
    { role: "help", submenu: [{ label: "Documentation", click: () => void shell.openExternal(`${REPO_URL}#readme`) }, { label: "Report an Issue", click: () => void shell.openExternal(`${REPO_URL}/issues`) }, { type: "separator" }, { label: "Uninstall Setups Works Office…", click: () => void runUninstall() }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.on("before-quit", () => {
    quitting = true;
    void killServer();
  });
  app.on("window-all-closed", () => app.quit());

  void app.whenReady().then(async () => {
    settings = loadSettings();
    buildMenu();
    createWindow();
    setupUpdater(() => win, () => {
      quitting = true;
      void killServer();
    });

    let repo = process.env.SWO_REPO ?? settings.lastRepo;
    if (!repo || !isGitRepo(repo)) {
      await splash("Welcome to Setups Works Office", "Choose the git repo your team will work on.");
      const ok = await chooseProject();
      if (!ok && !currentUrl) return app.quit();
      repo = currentRepo ?? undefined;
    } else if (!(await openProject(repo, !process.env.SWO_REPO))) {
      return;
    }
    if (SMOKE) {
      // Used by CI and by hand: wait until the window shows the HQ UI, say so, and quit.
      const t0 = Date.now();
      const poll = setInterval(async () => {
        const w = win;
        const ok = !!w && !!currentUrl && !w.webContents.isLoading() && w.webContents.getURL().startsWith(new URL(currentUrl).origin);
        if (ok && w) {
          const title = await w.webContents.executeJavaScript("document.title").catch(() => "");
          const root = await w.webContents.executeJavaScript("document.getElementById('root')?.children.length ?? 0").catch(() => 0);
          console.log(`SMOKE_OK ${new URL(currentUrl!).origin} title="${title}" rootChildren=${root}`);
          clearInterval(poll);
          setTimeout(() => app.quit(), 500);
        } else if (Date.now() - t0 > 30_000) {
          console.log("SMOKE_FAIL window never showed the UI");
          clearInterval(poll);
          app.exit(1);
        }
      }, 500);
    }
  });
}
