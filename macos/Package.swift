// swift-tools-version:5.9
import PackageDescription

// The native macOS app: a Swift/SwiftUI shell around the same HQ server the CLI and Windows app run.
// Build the .app with ./build-app.sh (it also bundles Node and the server).
let package = Package(
    name: "SetupsWorksOffice",
    platforms: [.macOS(.v14)],
    dependencies: [
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.6.0"),
    ],
    targets: [
        .executableTarget(
            name: "SetupsWorksOffice",
            dependencies: [.product(name: "Sparkle", package: "Sparkle")],
            path: "Sources/SetupsWorksOffice"
        ),
    ]
)
