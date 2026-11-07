// Auto-update from GitHub Releases (electron-updater). Checks shortly after start and every
// few hours, downloads in the background, then asks to restart. Does nothing in development.
import { app, dialog, type BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";

const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;
let manual = false;
let downloaded = false;

export function setupUpdater(win: () => BrowserWindow | null, beforeRestart: () => void) {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = null;

  autoUpdater.on("update-downloaded", (info) => {
    downloaded = true;
    const w = win();
    const opts = {
      type: "info" as const,
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      cancelId: 1,
      message: `Setups Works Office ${info.version} is ready`,
      detail: "Restart to finish updating. Your agents' sandboxes and folders are kept.",
    };
    void (w ? dialog.showMessageBox(w, opts) : dialog.showMessageBox(opts)).then(({ response }) => {
      if (response === 0) {
        beforeRestart();
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on("update-not-available", () => {
    if (!manual) return;
    manual = false;
    void dialog.showMessageBox({ type: "info", message: "You're up to date", detail: `Setups Works Office ${app.getVersion()} is the latest version.` });
  });

  autoUpdater.on("error", (err) => {
    if (!manual) return;
    manual = false;
    void dialog.showMessageBox({ type: "warning", message: "Couldn't check for updates", detail: String(err?.message ?? err).slice(0, 400) });
  });

  if (!app.isPackaged) return;
  setTimeout(() => void autoUpdater.checkForUpdates().catch(() => {}), 10_000);
  setInterval(() => void autoUpdater.checkForUpdates().catch(() => {}), CHECK_EVERY_MS);
}

export async function checkForUpdatesNow() {
  if (!app.isPackaged) {
    await dialog.showMessageBox({ type: "info", message: "Updates are off in development builds." });
    return;
  }
  if (downloaded) {
    autoUpdater.quitAndInstall();
    return;
  }
  manual = true;
  try {
    const r = await autoUpdater.checkForUpdates();
    if (r?.updateInfo && r.updateInfo.version !== app.getVersion()) manual = false; // the downloaded dialog takes over
  } catch {
    /* the error handler above reports it */
  }
}
