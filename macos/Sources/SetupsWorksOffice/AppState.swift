import SwiftUI
import AppKit
import Combine
import Sparkle
import ServiceManagement

/// Everything the windows, menus and menu bar share.
@MainActor
final class AppState: ObservableObject {
    static let shared = AppState()

    let server = ServerManager()
    let office = OfficeModel()
    let web = WebController()
    let updater: SPUStandardUpdaterController

    @Published private(set) var recents: [URL] = []
    private var bag = Set<AnyCancellable>()

    private let recentsKey = "recentProjects"
    private let lastKey = "lastProject"

    private init() {
        // Sparkle only starts in a real build that has a feed URL (see build-app.sh).
        let hasFeed = Bundle.main.object(forInfoDictionaryKey: "SUFeedURL") != nil
        updater = SPUStandardUpdaterController(startingUpdater: hasFeed, updaterDelegate: nil, userDriverDelegate: nil)
        recents = (UserDefaults.standard.stringArray(forKey: recentsKey) ?? []).map { URL(fileURLWithPath: $0) }
            .filter { FileManager.default.fileExists(atPath: $0.path) }

        // Server up → follow the office over WebSocket. Server down → stop.
        server.$state.sink { [weak self] state in
            guard let self else { return }
            if case .running(let url) = state { self.office.connect(to: url) } else { self.office.disconnect() }
        }.store(in: &bag)

        // Dock badge follows "needs you".
        office.$members.combineLatest(office.$agents, office.$actions).sink { [weak self] _, _, _ in
            guard let self else { return }
            let n = self.office.needsYou
            NSApp?.dockTile.badgeLabel = n > 0 ? String(n) : nil
        }.store(in: &bag)

        office.onNeedsInput = { member, note in
            Notifier.shared.post(title: "\(member.name) needs you", body: note ?? "Open Setups Works Office to answer.", id: "needs-\(member.id)")
        }
        office.onActionOpened = { item in
            Notifier.shared.post(title: "\(item.from) is waiting for you", body: item.title, id: "action-\(item.id)")
        }
        office.onReviewPassed = { member in
            Notifier.shared.post(title: "Review passed", body: "\(member.name)'s pull request is ready to merge.", id: "review-\(member.id)")
        }
    }

    // MARK: Launch / quit

    func launch() {
        Notifier.shared.setup()
        let env = ProcessInfo.processInfo.environment["SWO_REPO"]
        if let env { return open(URL(fileURLWithPath: env), remember: false) }
        let reopen = UserDefaults.standard.object(forKey: "reopenLast") as? Bool ?? true
        if reopen, let last = UserDefaults.standard.string(forKey: lastKey), isGitRepo(URL(fileURLWithPath: last)) {
            open(URL(fileURLWithPath: last))
        }
    }

    func quit() { server.stopForQuit() }

    // MARK: Projects

    func isGitRepo(_ url: URL) -> Bool {
        var isDir: ObjCBool = false
        return FileManager.default.fileExists(atPath: url.path, isDirectory: &isDir) && isDir.boolValue
            && FileManager.default.fileExists(atPath: url.appendingPathComponent(".git").path)
    }

    func open(_ url: URL, remember: Bool = true) {
        guard isGitRepo(url) else {
            let alert = NSAlert()
            alert.messageText = "That folder isn't a git repository"
            alert.informativeText = "\(url.path)\n\nChoose the folder of a git repo (it has a .git folder)."
            alert.runModal()
            return
        }
        if remember {
            recents = ([url] + recents.filter { $0 != url }).prefix(8).map { $0 }
            UserDefaults.standard.set(recents.map(\.path), forKey: recentsKey)
            UserDefaults.standard.set(url.path, forKey: lastKey)
        }
        server.start(repo: url)
        showMainWindow()
    }

    func chooseProject() {
        let panel = NSOpenPanel()
        panel.title = "Choose the git repo for your team"
        panel.prompt = "Open"
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.directoryURL = server.repo ?? recents.first
        if panel.runModal() == .OK, let url = panel.url { open(url) }
    }

    func clearRecents() {
        recents = []
        UserDefaults.standard.removeObject(forKey: recentsKey)
    }

    func showMainWindow() {
        NSApp.activate(ignoringOtherApps: true)
        if let w = NSApp.windows.first(where: { $0.canBecomeMain }) { w.makeKeyAndOrderFront(nil) }
    }

    func openInBrowser() {
        if case .running(let url) = server.state { NSWorkspace.shared.open(url) }
    }

    func revealLog() { NSWorkspace.shared.activateFileViewerSelecting([ServerManager.logURL]) }

    var launchAtLogin: Bool {
        get { SMAppService.mainApp.status == .enabled }
        set { try? (newValue ? SMAppService.mainApp.register() : SMAppService.mainApp.unregister()); objectWillChange.send() }
    }
}
