import SwiftUI
import WebKit

/// Holds the web view so native controls (sidebar, menus) can drive it.
@MainActor
final class WebController: ObservableObject {
    fileprivate weak var view: WKWebView?
    @Published var userZoom: Double = 1
    private var fit: Double = 1

    func reload() { view?.reload() }

    func zoom(by delta: Double) { userZoom = min(2, max(0.5, (userZoom + delta).rounded(toPlaces: 2))); apply() }
    func resetZoom() { userZoom = 1; apply() }

    /// The web UI lays out best at 1400px and up; in a narrower window shrink it instead of cutting it off.
    func fit(width: CGFloat) {
        fit = min(1, max(0.55, Double(width) / 1400))
        apply()
    }

    private func apply() {
        guard let view else { return }
        view.pageZoom = fit * userZoom
        // Zoom doesn't fire a resize, so tell the page (the pixel-office canvas) to re-measure itself.
        view.evaluateJavaScript("requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))")
    }

    /// The web UI opens agent N with the number key.
    func openAgent(at index: Int) {
        guard (0..<9).contains(index) else { return }
        view?.evaluateJavaScript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'\(index + 1)',bubbles:true}))")
    }

    func openActionItems() {
        view?.evaluateJavaScript("[...document.querySelectorAll('button')].find(b=>/Action items/.test(b.textContent))?.click()")
    }
}

private extension Double {
    func rounded(toPlaces p: Int) -> Double { let m = pow(10, Double(p)); return (self * m).rounded() / m }
}

struct OfficeWebView: NSViewRepresentable {
    let url: URL
    let controller: WebController

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.underPageBackgroundColor = NSColor(red: 0.29, green: 0.56, blue: 0.24, alpha: 1)
        web.allowsBackForwardNavigationGestures = false
        #if DEBUG
        web.isInspectable = true
        #endif
        controller.view = web
        context.coordinator.loaded = url
        web.load(URLRequest(url: url))
        return web
    }

    func updateNSView(_ web: WKWebView, context: Context) {
        controller.view = web
        if context.coordinator.loaded != url {
            context.coordinator.loaded = url
            web.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var loaded: URL?

        private func isLocal(_ url: URL?) -> Bool { url?.host == "127.0.0.1" || url?.host == "localhost" }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction) async -> WKNavigationActionPolicy {
            guard let url = action.request.url else { return .cancel }
            if isLocal(url) || url.scheme == "about" || url.scheme == "blob" || url.scheme == "data" { return .allow }
            // Everything outside the office opens in your browser.
            if url.scheme == "http" || url.scheme == "https" || url.scheme == "mailto" { NSWorkspace.shared.open(url) }
            return .cancel
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url { NSWorkspace.shared.open(url) }
            return nil
        }
    }
}
