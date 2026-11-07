import Foundation
import Darwin

/// Runs the HQ server (bundled Node + the same server the CLI uses) for one repo, on a free localhost port.
@MainActor
final class ServerManager: ObservableObject {
    enum State: Equatable {
        case idle
        case starting(String)
        case running(URL)
        case failed(String)
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var repo: URL?

    private var process: Process?
    private var generation = 0

    static var logURL: URL {
        FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Logs/Setups Works Office/server.log")
    }

    // MARK: Locations (bundled in the .app; overridable for development)

    static var serverRoot: URL? {
        if let p = ProcessInfo.processInfo.environment["SWO_SERVER_ROOT"] { return URL(fileURLWithPath: p) }
        return Bundle.main.resourceURL?.appendingPathComponent("server")
    }

    static var nodeURL: URL? {
        if let p = ProcessInfo.processInfo.environment["SWO_NODE"] { return URL(fileURLWithPath: p) }
        return Bundle.main.resourceURL?.appendingPathComponent("node")
    }

    // MARK: Lifecycle

    func start(repo: URL) {
        generation += 1
        let gen = generation
        stopProcess()
        self.repo = repo
        state = .starting(repo.path)
        Task { await launch(repo: repo, generation: gen) }
    }

    func restart() {
        if let repo { start(repo: repo) }
    }

    func stop() {
        generation += 1
        stopProcess()
        state = .idle
    }

    /// Called on quit: stop the child and wait briefly so no server is left behind.
    func stopForQuit() {
        generation += 1
        guard let p = process else { return }
        process = nil
        p.terminationHandler = nil
        if p.isRunning {
            p.terminate()
            let deadline = Date().addingTimeInterval(3)
            while p.isRunning && Date() < deadline { Thread.sleep(forTimeInterval: 0.05) }
            if p.isRunning { kill(p.processIdentifier, SIGKILL) }
        }
    }

    private func stopProcess() {
        guard let p = process else { return }
        process = nil
        p.terminationHandler = nil
        if p.isRunning { p.terminate() }
    }

    // MARK: Launch

    private func launch(repo: URL, generation gen: Int) async {
        guard let root = Self.serverRoot, let node = Self.nodeURL,
              FileManager.default.fileExists(atPath: root.appendingPathComponent("dist-server/main.mjs").path),
              FileManager.default.isExecutableFile(atPath: node.path) else {
            fail("The bundled server is missing. Reinstall the app, or run it from a build made with macos/build-app.sh.", gen)
            return
        }

        let path = await Task.detached { ShellPath.resolve() }.value
        guard gen == generation else { return }
        let port = Self.freePort(preferred: 7420)

        try? FileManager.default.createDirectory(at: Self.logURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        FileManager.default.createFile(atPath: Self.logURL.path, contents: nil)
        let log = try? FileHandle(forWritingTo: Self.logURL)

        let p = Process()
        p.executableURL = node
        p.arguments = [root.appendingPathComponent("dist-server/main.mjs").path, "--repo", repo.path, "--port", String(port), "--no-open"]
        p.currentDirectoryURL = repo
        var env = ProcessInfo.processInfo.environment
        env["PATH"] = path
        env["NO_COLOR"] = "1"
        env["FORCE_COLOR"] = "0"
        p.environment = env
        let out = Pipe()
        p.standardOutput = out
        p.standardError = out
        p.standardInput = FileHandle.nullDevice

        let box = OutputBox()
        out.fileHandleForReading.readabilityHandler = { [weak self] h in
            let data = h.availableData
            if data.isEmpty { return }
            try? log?.write(contentsOf: data)
            guard let url = box.append(data) else { return }
            DispatchQueue.main.async {
                guard let self, self.generation == gen, case .starting = self.state else { return }
                self.state = .running(url)
            }
        }
        p.terminationHandler = { [weak self] proc in
            out.fileHandleForReading.readabilityHandler = nil
            let tail = box.tail()
            DispatchQueue.main.async {
                guard let self, self.generation == gen else { return }
                self.process = nil
                self.fail("The server stopped (exit code \(proc.terminationStatus)).\n\n\(tail)", gen)
            }
        }

        do {
            try p.run()
            process = p
        } catch {
            fail("Couldn't launch the server: \(error.localizedDescription)", gen)
            return
        }

        // Safety net: no URL within 40 seconds.
        try? await Task.sleep(nanoseconds: 40_000_000_000)
        if gen == generation, case .starting = state {
            let tail = box.tail()
            stopProcess()
            fail("The server didn't start within 40 seconds.\n\n\(tail)", gen)
        }
    }

    private func fail(_ message: String, _ gen: Int) {
        guard gen == generation else { return }
        state = .failed(message.trimmingCharacters(in: .whitespacesAndNewlines))
    }

    // MARK: Ports

    nonisolated static func freePort(preferred: UInt16) -> UInt16 {
        func bindPort(_ p: UInt16) -> UInt16? {
            let fd = socket(AF_INET, SOCK_STREAM, 0)
            guard fd >= 0 else { return nil }
            defer { close(fd) }
            var addr = sockaddr_in()
            addr.sin_family = sa_family_t(AF_INET)
            addr.sin_port = p.bigEndian
            addr.sin_addr.s_addr = inet_addr("127.0.0.1")
            let ok = withUnsafePointer(to: &addr) {
                $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size)) }
            }
            guard ok == 0 else { return nil }
            var bound = sockaddr_in()
            var len = socklen_t(MemoryLayout<sockaddr_in>.size)
            _ = withUnsafeMutablePointer(to: &bound) {
                $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { getsockname(fd, $0, &len) }
            }
            return UInt16(bigEndian: bound.sin_port)
        }
        return bindPort(preferred) ?? bindPort(0) ?? preferred
    }
}

/// Collects server output off the main thread and finds the "running → URL" line.
private final class OutputBox: @unchecked Sendable {
    private var buffer = ""
    private var found = false
    private let lock = NSLock()
    private static let pattern = try! NSRegularExpression(pattern: #"http://127\.0\.0\.1:\d+/\?token=[A-Za-z0-9]+"#)

    func append(_ data: Data) -> URL? {
        lock.lock(); defer { lock.unlock() }
        buffer += String(decoding: data, as: UTF8.self)
        if buffer.count > 6000 { buffer = String(buffer.suffix(6000)) }
        guard !found else { return nil }
        let ns = buffer as NSString
        guard let m = Self.pattern.firstMatch(in: buffer, range: NSRange(location: 0, length: ns.length)),
              let url = URL(string: ns.substring(with: m.range)) else { return nil }
        found = true
        return url
    }

    func tail() -> String {
        lock.lock(); defer { lock.unlock() }
        return buffer.split(separator: "\n").suffix(12).joined(separator: "\n")
    }
}
