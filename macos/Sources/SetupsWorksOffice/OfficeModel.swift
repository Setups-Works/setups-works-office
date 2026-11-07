import Foundation
import SwiftUI

/// Live state of the office, read from HQ's WebSocket (the same feed the web UI uses),
/// so the native sidebar, menu bar item, notifications and Dock badge stay in sync.
@MainActor
final class OfficeModel: ObservableObject {
    struct Member: Identifiable, Equatable {
        let id: String
        let name: String
        let role: String
        let isLead: Bool
        let color: String
        let cli: String
    }
    struct Agent: Equatable {
        var state: String
        var note: String?
    }
    struct Action: Identifiable, Equatable {
        let id: String
        let from: String
        let title: String
        let waiting: Bool
    }
    struct Activity: Identifiable, Equatable {
        let id: String
        let text: String
    }
    struct Counts: Equatable {
        var todo = 0, doing = 0, review = 0, done = 0, blocked = 0, openPRs = 0
    }

    @Published private(set) var projectName = ""
    @Published private(set) var members: [Member] = []
    @Published private(set) var agents: [String: Agent] = [:]
    @Published private(set) var actions: [Action] = []
    @Published private(set) var activity: [Activity] = []
    @Published private(set) var counts = Counts()
    @Published private(set) var connected = false

    /// Things that need the user (agents asking + waiting action items), for the Dock badge and menu bar.
    var needsYou: Int {
        let asking = members.filter { agents[$0.id]?.state == "needs-input" }.count
        return asking + actions.filter { $0.waiting }.count
    }

    var onNeedsInput: ((Member, String?) -> Void)?
    var onActionOpened: ((Action) -> Void)?
    var onReviewPassed: ((Member) -> Void)?

    private var tasks: [String: String] = [:]
    private var prs: [Int: Bool] = [:]
    private var task: Task<Void, Never>?
    private var socket: URLSessionWebSocketTask?
    private var seenActions = Set<String>()
    private var primed = false

    func connect(to url: URL) {
        disconnect()
        guard var c = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return }
        let token = c.queryItems?.first(where: { $0.name == "token" })?.value ?? ""
        c.scheme = "ws"
        c.path = "/ws"
        c.queryItems = [URLQueryItem(name: "token", value: token)]
        guard let wsURL = c.url else { return }
        task = Task { [weak self] in
            var delay: UInt64 = 500_000_000
            while !Task.isCancelled {
                guard let self else { return }
                let s = URLSession.shared.webSocketTask(with: wsURL)
                self.socket = s
                s.resume()
                do {
                    while !Task.isCancelled {
                        let msg = try await s.receive()
                        self.connected = true
                        delay = 500_000_000
                        switch msg {
                        case .string(let t): self.handle(Data(t.utf8))
                        case .data(let d): self.handle(d)
                        @unknown default: break
                        }
                    }
                } catch {
                    self.connected = false
                }
                if Task.isCancelled { return }
                try? await Task.sleep(nanoseconds: delay)
                delay = min(delay * 2, 5_000_000_000)
            }
        }
    }

    func disconnect() {
        task?.cancel()
        task = nil
        socket?.cancel(with: .goingAway, reason: nil)
        socket = nil
        connected = false
        members = []; agents = [:]; actions = []; activity = []; tasks = [:]; prs = [:]; counts = Counts()
        seenActions = []; primed = false
    }

    // MARK: Events

    private func handle(_ data: Data) {
        guard let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any], let type = obj["type"] as? String else { return }
        switch type {
        case "snapshot":
            guard let s = obj["snapshot"] as? [String: Any] else { return }
            applyConfig(s["config"] as? [String: Any])
            agents = [:]
            for a in (s["agents"] as? [[String: Any]]) ?? [] { setAgent(a, notify: false) }
            tasks = [:]
            for t in (s["tasks"] as? [[String: Any]]) ?? [] { if let id = t["id"] as? String { tasks[id] = t["status"] as? String ?? "" } }
            prs = [:]
            for p in (s["pullRequests"] as? [[String: Any]]) ?? [] { setPR(p) }
            actions = []
            for a in (s["actionItems"] as? [[String: Any]]) ?? [] { setAction(a, notify: false) }
            activity = ((s["activity"] as? [[String: Any]]) ?? []).prefix(8).compactMap(parseActivity)
            recount()
            primed = true
        case "config.updated": applyConfig(obj["config"] as? [String: Any])
        case "agent.updated": if let a = obj["agent"] as? [String: Any] { setAgent(a, notify: primed) }
        case "action.updated": if let a = obj["item"] as? [String: Any] { setAction(a, notify: primed) }
        case "task.updated":
            if let t = obj["task"] as? [String: Any], let id = t["id"] as? String { tasks[id] = t["status"] as? String ?? ""; recount() }
        case "task.removed": if let id = obj["taskId"] as? String { tasks[id] = nil; recount() }
        case "pr.updated": if let p = obj["pr"] as? [String: Any] { setPR(p); recount() }
        case "activity":
            if let e = obj["event"] as? [String: Any], let a = parseActivity(e) {
                activity.insert(a, at: 0)
                if activity.count > 8 { activity.removeLast() }
            }
        default: break
        }
    }

    private func applyConfig(_ c: [String: Any]?) {
        guard let c else { return }
        projectName = ((c["project"] as? [String: Any])?["name"] as? String) ?? projectName
        members = ((c["team"] as? [[String: Any]]) ?? []).compactMap { m in
            guard let id = m["id"] as? String, let name = m["name"] as? String else { return nil }
            return Member(id: id, name: name, role: m["role"] as? String ?? "", isLead: m["isLead"] as? Bool ?? false,
                          color: m["color"] as? String ?? "#29adff", cli: (m["cli"] as? String) ?? "")
        }
    }

    private func setAgent(_ a: [String: Any], notify: Bool) {
        guard let id = a["agentId"] as? String else { return }
        let state = a["state"] as? String ?? "idle"
        let note = a["note"] as? String
        let old = agents[id]?.state
        agents[id] = Agent(state: state, note: note)
        guard notify, old != state, let m = members.first(where: { $0.id == id }) else { return }
        if state == "needs-input" { onNeedsInput?(m, note) }
        if state == "review-passed" { onReviewPassed?(m) }
    }

    private func setAction(_ a: [String: Any], notify: Bool) {
        guard let id = a["id"] as? String else { return }
        let open = (a["status"] as? String) == "open"
        actions.removeAll { $0.id == id }
        guard open else { return }
        let from = members.first(where: { $0.id == (a["fromId"] as? String) })?.name ?? "An agent"
        let item = Action(id: id, from: from, title: a["title"] as? String ?? "Needs your attention", waiting: a["waiting"] as? Bool ?? false)
        actions.append(item)
        if notify, item.waiting, seenActions.insert(id).inserted { onActionOpened?(item) }
        else { seenActions.insert(id) }
    }

    private func setPR(_ p: [String: Any]) {
        guard let n = p["number"] as? Int else { return }
        let merged = p["merged"] as? Bool ?? false
        let closed = p["closed"] as? Bool ?? false
        prs[n] = !(merged || closed)
    }

    private func parseActivity(_ e: [String: Any]) -> Activity? {
        guard let id = e["id"] as? String, let text = e["text"] as? String else { return nil }
        return Activity(id: id, text: text)
    }

    private func recount() {
        var c = Counts()
        for s in tasks.values {
            switch s {
            case "todo": c.todo += 1
            case "in-progress": c.doing += 1
            case "in-review": c.review += 1
            case "done": c.done += 1
            case "blocked": c.blocked += 1
            default: break
            }
        }
        c.openPRs = prs.values.filter { $0 }.count
        counts = c
    }
}

// MARK: Presentation helpers

extension Color {
    /// "#rrggbb" → Color (falls back to the app's blue).
    init(hex: String) {
        let s = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        guard s.count == 6, let v = UInt32(s, radix: 16) else { self = Color(red: 0.16, green: 0.68, blue: 1); return }
        self.init(red: Double((v >> 16) & 255) / 255, green: Double((v >> 8) & 255) / 255, blue: Double(v & 255) / 255)
    }
}

enum AgentLook {
    static func label(_ state: String) -> String {
        switch state {
        case "working": return "Working"
        case "needs-input": return "Needs input"
        case "in-review": return "In review"
        case "review-passed": return "Review passed"
        default: return "Idle"
        }
    }
    /// The same palette the web UI uses for agent states.
    static func color(_ state: String) -> Color {
        switch state {
        case "working": return Color(hex: "#29adff")
        case "needs-input": return Color(hex: "#ff004d")
        case "in-review": return Color(hex: "#ffa300")
        case "review-passed": return Color(hex: "#00c92f")
        default: return .secondary
        }
    }
}
