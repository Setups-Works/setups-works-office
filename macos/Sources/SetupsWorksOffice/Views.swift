import SwiftUI
import AppKit

// MARK: Window

struct ContentView: View {
    @ObservedObject private var app = AppState.shared
    @ObservedObject private var server = AppState.shared.server
    @ObservedObject private var office = AppState.shared.office

    var body: some View {
        NavigationSplitView {
            SidebarView()
                .navigationSplitViewColumnWidth(min: 230, ideal: 270, max: 360)
        } detail: {
            DetailView()
        }
        .navigationTitle(title)
        .navigationSubtitle(subtitle)
        .toolbar { MainToolbar() }
        .frame(minWidth: 980, minHeight: 640)
        .onDrop(of: [.fileURL], isTargeted: nil) { providers in
            guard let p = providers.first else { return false }
            _ = p.loadObject(ofClass: URL.self) { url, _ in
                if let url { DispatchQueue.main.async { AppState.shared.open(url) } }
            }
            return true
        }
    }

    private var title: String { server.repo?.lastPathComponent ?? "Setups Works Office" }
    private var subtitle: String {
        switch server.state {
        case .running: return office.needsYou > 0 ? "\(office.needsYou) need you" : (office.connected ? "Connected" : "Connecting…")
        case .starting: return "Starting…"
        case .failed: return "Stopped"
        case .idle: return ""
        }
    }
}

struct MainToolbar: ToolbarContent {
    @ObservedObject private var app = AppState.shared
    @ObservedObject private var server = AppState.shared.server

    var body: some ToolbarContent {
        ToolbarItem(placement: .navigation) {
            Menu {
                ForEach(app.recents, id: \.self) { url in
                    Button(url.lastPathComponent) { app.open(url) }
                }
                if !app.recents.isEmpty { Divider() }
                Button("Open Project…") { app.chooseProject() }
            } label: {
                Label(server.repo?.lastPathComponent ?? "Choose project", systemImage: "folder")
            }
            .help("Switch project")
        }
        ToolbarItemGroup(placement: .primaryAction) {
            Button { app.web.reload() } label: { Label("Reload", systemImage: "arrow.clockwise") }
                .help("Reload the office (⌘R)")
                .disabled(!isRunning)
            Button { app.server.restart() } label: { Label("Restart Server", systemImage: "power") }
                .help("Restart the server (⇧⌘R)")
                .disabled(server.repo == nil)
            Button { app.openInBrowser() } label: { Label("Open in Browser", systemImage: "safari") }
                .help("Open in your browser")
                .disabled(!isRunning)
        }
    }

    private var isRunning: Bool { if case .running = server.state { return true } else { return false } }
}

// MARK: Detail

struct DetailView: View {
    @ObservedObject private var app = AppState.shared
    @ObservedObject private var server = AppState.shared.server

    var body: some View {
        switch server.state {
        case .idle:
            WelcomeView()
        case .starting(let path):
            VStack(spacing: 14) {
                ProgressView().controlSize(.large)
                Text("Starting your office…").font(.title2.weight(.semibold))
                Text(path).font(.callout).foregroundStyle(.secondary).textSelection(.enabled)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(red: 0.29, green: 0.56, blue: 0.24).opacity(0.12))
        case .running(let url):
            GeometryReader { geo in
                OfficeWebView(url: url, controller: app.web)
                    .onChange(of: geo.size.width, initial: true) { _, w in app.web.fit(width: w) }
            }
        case .failed(let message):
            VStack(spacing: 14) {
                Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 40)).foregroundStyle(.orange)
                Text("Couldn't start the office").font(.title2.weight(.semibold))
                ScrollView {
                    Text(message).font(.system(.callout, design: .monospaced)).textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading).padding(10)
                }
                .frame(maxWidth: 560, maxHeight: 180)
                .background(.quaternary, in: RoundedRectangle(cornerRadius: 8))
                HStack {
                    Button("Retry") { server.restart() }.keyboardShortcut(.defaultAction)
                    Button("Choose Another Project…") { app.chooseProject() }
                    Button("Show Log") { app.revealLog() }
                }
            }
            .padding(30)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct WelcomeView: View {
    @ObservedObject private var app = AppState.shared

    var body: some View {
        VStack(spacing: 18) {
            Image(nsImage: NSApp.applicationIconImage).resizable().frame(width: 96, height: 96)
            Text("Welcome to Setups Works Office").font(.largeTitle.weight(.semibold))
            Text("Choose the git repo your AI team will work on. You can also drop a folder onto this window.")
                .foregroundStyle(.secondary).multilineTextAlignment(.center).frame(maxWidth: 420)
            Button { app.chooseProject() } label: { Label("Choose a git repo…", systemImage: "folder.badge.plus") }
                .buttonStyle(.borderedProminent).controlSize(.large).keyboardShortcut(.defaultAction)
            if !app.recents.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Recent").font(.headline)
                    ForEach(app.recents, id: \.self) { url in
                        Button { app.open(url) } label: {
                            HStack { Image(systemName: "clock"); VStack(alignment: .leading) { Text(url.lastPathComponent); Text(url.path).font(.caption).foregroundStyle(.secondary) }; Spacer() }
                        }.buttonStyle(.plain)
                    }
                }
                .padding(14).frame(maxWidth: 420, alignment: .leading)
                .background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: Sidebar

struct SidebarView: View {
    @ObservedObject private var app = AppState.shared
    @ObservedObject private var office = AppState.shared.office
    @ObservedObject private var server = AppState.shared.server

    var body: some View {
        List {
            if case .running = server.state {
                Section("Team") {
                    if office.members.isEmpty { Text("Loading…").foregroundStyle(.secondary) }
                    ForEach(Array(office.members.enumerated()), id: \.element.id) { i, m in
                        Button { app.web.openAgent(at: i) } label: { AgentRow(member: m, agent: office.agents[m.id]) }
                            .buttonStyle(.plain)
                    }
                }
                if !office.actions.isEmpty {
                    Section("Needs you") {
                        ForEach(office.actions) { a in
                            Button { app.web.openActionItems() } label: {
                                Label { VStack(alignment: .leading) { Text(a.title).lineLimit(2); Text(a.from).font(.caption).foregroundStyle(.secondary) } }
                                    icon: { Image(systemName: a.waiting ? "exclamationmark.circle.fill" : "checklist").foregroundStyle(a.waiting ? .red : .secondary) }
                            }.buttonStyle(.plain)
                        }
                    }
                }
                Section("Board") {
                    LabeledContent("To do", value: "\(office.counts.todo)")
                    LabeledContent("In progress", value: "\(office.counts.doing)")
                    LabeledContent("In review", value: "\(office.counts.review)")
                    LabeledContent("Done", value: "\(office.counts.done)")
                    if office.counts.blocked > 0 { LabeledContent("Blocked", value: "\(office.counts.blocked)") }
                    LabeledContent("Open PRs", value: "\(office.counts.openPRs)")
                }
                if !office.activity.isEmpty {
                    Section("Activity") {
                        ForEach(office.activity) { a in Text(a.text).font(.callout).lineLimit(2) }
                    }
                }
            } else {
                Section { Text("Open a project to see your team here.").foregroundStyle(.secondary) }
            }
        }
        .listStyle(.sidebar)
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: 6) {
                Circle().fill(statusColor).frame(width: 8, height: 8)
                Text(statusText).font(.caption).foregroundStyle(.secondary)
                Spacer()
            }
            .padding(.horizontal, 14).padding(.vertical, 8)
        }
    }

    private var statusText: String {
        switch server.state {
        case .idle: return "No project"
        case .starting: return "Starting server…"
        case .running: return office.connected ? "Server running" : "Connecting…"
        case .failed: return "Server stopped"
        }
    }
    private var statusColor: Color {
        switch server.state {
        case .running: return office.connected ? .green : .orange
        case .starting: return .orange
        case .failed: return .red
        case .idle: return .gray
        }
    }
}

struct AgentRow: View {
    let member: OfficeModel.Member
    let agent: OfficeModel.Agent?

    var body: some View {
        let state = agent?.state ?? "idle"
        HStack(alignment: .top, spacing: 10) {
            RoundedRectangle(cornerRadius: 4).fill(Color(hex: member.color))
                .frame(width: 22, height: 22)
                .overlay(RoundedRectangle(cornerRadius: 4).stroke(Color.primary.opacity(0.25), lineWidth: 1))
                .overlay(member.isLead ? Image(systemName: "crown.fill").font(.system(size: 9)).foregroundStyle(.black.opacity(0.6)) : nil)
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(member.name).fontWeight(.semibold)
                    Text(member.role).font(.caption).foregroundStyle(.secondary)
                }
                Text(AgentLook.label(state))
                    .font(.caption2.weight(.semibold))
                    .padding(.horizontal, 6).padding(.vertical, 1)
                    .background(AgentLook.color(state).opacity(0.22), in: Capsule())
                    .foregroundStyle(AgentLook.color(state))
                if let note = agent?.note, !note.isEmpty {
                    Text(note).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                }
            }
            Spacer(minLength: 0)
        }
        .contentShape(Rectangle())
    }
}
