// A Mac app started from the Dock doesn't get your shell's PATH, so git, gh, tmux, sbx and
// claude wouldn't be found. Ask a login shell for its PATH and add the usual install folders.
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

const MARK = "__SWO_PATH__";

function fromLoginShell(): Promise<string | undefined> {
  const shell = process.env.SHELL || "/bin/zsh";
  return new Promise((resolve) => {
    execFile(shell, ["-ilc", `printf '%s' "${MARK}$PATH${MARK}"`], { timeout: 6000 }, (err, out) => {
      if (err && !out) return resolve(undefined);
      resolve(out.match(new RegExp(`${MARK}(.*)${MARK}`, "s"))?.[1]);
    });
  });
}

export async function appPath(): Promise<string> {
  if (process.platform === "win32") return process.env.PATH ?? process.env.Path ?? "";
  const extra = ["/opt/homebrew/bin", "/opt/homebrew/sbin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin", join(homedir(), ".local", "bin"), join(homedir(), ".claude", "local")];
  const parts = [...((await fromLoginShell()) ?? "").split(delimiter), ...(process.env.PATH ?? "").split(delimiter), ...extra].filter(Boolean);
  return [...new Set(parts)].join(delimiter);
}
