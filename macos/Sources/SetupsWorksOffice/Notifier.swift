import Foundation
import AppKit
import UserNotifications

/// System notifications when an agent needs you or a review passes. Skipped when the app runs
/// outside an .app bundle (for example `swift run`), where macOS has no notification center for it.
final class Notifier: NSObject, UNUserNotificationCenterDelegate {
    static let shared = Notifier()
    private var available: Bool { Bundle.main.bundleIdentifier != nil && Bundle.main.bundlePath.hasSuffix(".app") }

    func setup() {
        guard available else { return }
        let c = UNUserNotificationCenter.current()
        c.delegate = self
        c.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    func post(title: String, body: String, id: String = UUID().uuidString) {
        guard available, UserDefaults.standard.object(forKey: "notificationsEnabled") as? Bool ?? true else { return }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: id, content: content, trigger: nil))
    }

    // Show banners only when you're not already looking at the app.
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        await MainActor.run { NSApp.isActive } ? [] : [.banner, .sound]
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        await MainActor.run {
            NSApp.activate(ignoringOtherApps: true)
            NSApp.windows.first(where: { $0.canBecomeMain })?.makeKeyAndOrderFront(nil)
        }
    }
}
