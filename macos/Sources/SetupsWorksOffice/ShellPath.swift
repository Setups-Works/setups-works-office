import Foundation

/// An app started from the Dock doesn't get your shell's PATH, so git, gh, tmux, sbx and claude
/// wouldn't be found. Ask a login shell for its PATH and add the usual install folders.
enum ShellPath {
    static func resolve() -> String {
        let mark = "__SWO_PATH__"
        var parts: [String] = []

        let shell = ProcessInfo.processInfo.environment["SHELL"] ?? "/bin/zsh"
        let p = Process()
        p.executableURL = URL(fileURLWithPath: shell)
        p.arguments = ["-ilc", "printf '%s' \"\(mark)$PATH\(mark)\""]
        let pipe = Pipe()
        p.standardOutput = pipe
        p.standardError = FileHandle.nullDevice
        if (try? p.run()) != nil {
            let deadline = Date().addingTimeInterval(6)
            while p.isRunning && Date() < deadline { Thread.sleep(forTimeInterval: 0.05) }
            if p.isRunning { p.terminate() }
            let out = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
            if let a = out.range(of: mark), let b = out.range(of: mark, options: .backwards), a.upperBound <= b.lowerBound {
                parts += out[a.upperBound..<b.lowerBound].split(separator: ":").map(String.init)
            }
        }

        let home = NSHomeDirectory()
        parts += (ProcessInfo.processInfo.environment["PATH"] ?? "").split(separator: ":").map(String.init)
        parts += ["/opt/homebrew/bin", "/opt/homebrew/sbin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin",
                  "\(home)/.local/bin", "\(home)/.claude/local"]
        var seen = Set<String>()
        return parts.filter { !$0.isEmpty && seen.insert($0).inserted }.joined(separator: ":")
    }
}
