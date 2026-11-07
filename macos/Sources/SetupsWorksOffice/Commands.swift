import SwiftUI

struct AppCommands: Commands {
    @ObservedObject var app: AppState

    var body: some Commands {
        CommandGroup(after: .appInfo) {
            Button("Check for Updates…") { app.updater.checkForUpdates(nil) }
        }
        CommandGroup(replacing: .newItem) {
            Button("Open Project…") { app.chooseProject() }.keyboardShortcut("o")
            Menu("Open Recent") {
                ForEach(app.recents, id: \.self) { url in Button(url.lastPathComponent) { app.open(url) } }
                if !app.recents.isEmpty { Divider(); Button("Clear Menu") { app.clearRecents() } }
            }.disabled(app.recents.isEmpty)
            Divider()
            Button("Restart Server") { app.server.restart() }.keyboardShortcut("r", modifiers: [.command, .shift])
            Button("Open in Browser") { app.openInBrowser() }
            Button("Show Server Log") { app.revealLog() }
        }
        CommandGroup(after: .toolbar) {
            Button("Reload Office") { app.web.reload() }.keyboardShortcut("r")
            Divider()
            Button("Zoom In") { app.web.zoom(by: 0.1) }.keyboardShortcut("+")
            Button("Zoom Out") { app.web.zoom(by: -0.1) }.keyboardShortcut("-")
            Button("Actual Size") { app.web.resetZoom() }.keyboardShortcut("0")
        }
        CommandGroup(replacing: .help) {
            Link("Documentation", destination: URL(string: "https://github.com/Setups-Works/setups-works-office#readme")!)
            Link("Report an Issue", destination: URL(string: "https://github.com/Setups-Works/setups-works-office/issues")!)
        }
    }
}

struct SettingsView: View {
    @AppStorage("notificationsEnabled") private var notifications = true
    @AppStorage("reopenLast") private var reopenLast = true
    @ObservedObject private var app = AppState.shared

    var body: some View {
        Form {
            Toggle("Notify me when an agent needs me", isOn: $notifications)
            Toggle("Reopen the last project at launch", isOn: $reopenLast)
            Toggle("Open at login", isOn: Binding(get: { app.launchAtLogin }, set: { app.launchAtLogin = $0 }))
            Divider()
            Toggle("Check for updates automatically", isOn: Binding(
                get: { app.updater.updater.automaticallyChecksForUpdates },
                set: { app.updater.updater.automaticallyChecksForUpdates = $0 }))
            HStack {
                Button("Check for Updates Now") { app.updater.checkForUpdates(nil) }
                Text("Version \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "dev")")
                    .foregroundStyle(.secondary)
            }
            Divider()
            Button("Show Server Log") { app.revealLog() }
        }
        .formStyle(.grouped)
        .frame(width: 440)
        .padding(.vertical, 8)
    }
}

struct MenuBarContent: View {
    @ObservedObject var app: AppState
    @ObservedObject var office: OfficeModel
    @ObservedObject var server: ServerManager

    var body: some View {
        if case .running = server.state, !office.members.isEmpty {
            Text("\(server.repo?.lastPathComponent ?? "Office") · \(office.needsYou > 0 ? "\(office.needsYou) need you" : "all good")")
            Divider()
            ForEach(office.members) { m in
                Text("\(m.name)  —  \(AgentLook.label(office.agents[m.id]?.state ?? "idle"))")
            }
            Divider()
        } else if case .starting = server.state {
            Text("Starting…")
            Divider()
        }
        Button("Show Window") { app.showMainWindow() }
        Button("Open Project…") { app.chooseProject() }
        Divider()
        Button("Quit Setups Works Office") { NSApp.terminate(nil) }.keyboardShortcut("q")
    }
}
