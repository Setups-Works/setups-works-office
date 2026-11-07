import SwiftUI
import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        Task { @MainActor in AppState.shared.launch() }
    }

    func applicationWillTerminate(_ notification: Notification) {
        MainActor.assumeIsolated { AppState.shared.quit() }
    }

    // Closing the window keeps the server (and notifications) running; the menu bar item and Dock icon bring it back.
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag { Task { @MainActor in AppState.shared.showMainWindow() } }
        return true
    }
}

@main
struct SetupsWorksOfficeApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var delegate
    @StateObject private var app = AppState.shared

    var body: some Scene {
        Window("Setups Works Office", id: "main") {
            ContentView()
        }
        .defaultSize(width: 1500, height: 920)
        .windowToolbarStyle(.unified)
        .commands { AppCommands(app: app) }

        MenuBarExtra {
            MenuBarContent(app: app, office: app.office, server: app.server)
        } label: {
            MenuBarLabel(office: app.office)
        }
        .menuBarExtraStyle(.menu)

        Settings { SettingsView() }
    }
}

struct MenuBarLabel: View {
    @ObservedObject var office: OfficeModel
    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: office.needsYou > 0 ? "exclamationmark.bubble.fill" : "building.2.fill")
            if office.needsYou > 0 { Text("\(office.needsYou)") }
        }
    }
}
