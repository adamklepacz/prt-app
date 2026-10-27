import SwiftUI
import WidgetKit

/// Deep link obsługiwany przez Expo Router: app/quick-reset.tsx
private let quickResetURL = URL(string: "somatic://quick-reset")!

private enum Palette {
  static let paper = Color(red: 250 / 255, green: 248 / 255, blue: 245 / 255)
  static let card = Color.white
  static let border = Color(red: 239 / 255, green: 236 / 255, blue: 230 / 255)
  static let sage = Color(red: 94 / 255, green: 113 / 255, blue: 93 / 255)
  static let brown = Color(red: 140 / 255, green: 122 / 255, blue: 107 / 255)
  static let graphite = Color(red: 35 / 255, green: 35 / 255, blue: 35 / 255)
  static let muted = Color(red: 115 / 255, green: 115 / 255, blue: 115 / 255)
}

// MARK: - Timeline (widget statyczny – jeden wpis, bez odświeżania)

struct QuickResetEntry: TimelineEntry {
  let date: Date
}

struct QuickResetProvider: TimelineProvider {
  func placeholder(in context: Context) -> QuickResetEntry {
    QuickResetEntry(date: Date())
  }

  func getSnapshot(in context: Context, completion: @escaping (QuickResetEntry) -> Void) {
    completion(QuickResetEntry(date: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<QuickResetEntry>) -> Void) {
    completion(Timeline(entries: [QuickResetEntry(date: Date())], policy: .never))
  }
}

// MARK: - Widoki

struct QuickResetWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: QuickResetEntry

  var body: some View {
    content
      .widgetURL(quickResetURL)
      .modifier(SomaticBackground(family: family))
  }

  @ViewBuilder
  private var content: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        VStack(spacing: 1) {
          Image(systemName: "leaf")
            .font(.system(size: 15, weight: .regular))
          Text("60s")
            .font(.system(size: 12, weight: .semibold, design: .serif))
        }
      }
      .accessibilityLabel("Reset 60 sekund")

    case .accessoryRectangular:
      HStack(spacing: 8) {
        Image(systemName: "leaf")
          .font(.system(size: 20))
        VStack(alignment: .leading, spacing: 1) {
          Text("Reset 60s")
            .font(.system(.headline, design: .serif))
          Text("Opuść barki")
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        Spacer(minLength: 0)
      }

    case .accessoryInline:
      Label("Reset 60s", systemImage: "leaf")

    case .systemMedium:
      HStack(spacing: 16) {
        VStack(alignment: .leading, spacing: 6) {
          caption
          Text("Reset\nprzy biurku")
            .font(.system(size: 24, weight: .regular, design: .serif))
            .foregroundStyle(Palette.graphite)
            .lineSpacing(1)
          Text("Opuść barki. Rozluźnij żuchwę.")
            .font(.system(size: 12))
            .foregroundStyle(Palette.muted)
            .lineLimit(2)
        }
        Spacer(minLength: 0)
        playButton(size: 76)
      }

    default:
      VStack(alignment: .leading, spacing: 0) {
        caption
        Spacer(minLength: 4)
        Text("Reset 60s")
          .font(.system(size: 22, weight: .regular, design: .serif))
          .foregroundStyle(Palette.graphite)
          .minimumScaleFactor(0.8)
        Text("Opuść barki")
          .font(.system(size: 12))
          .foregroundStyle(Palette.muted)
        Spacer(minLength: 6)
        HStack {
          Spacer()
          playButton(size: 44)
        }
      }
    }
  }

  private var caption: some View {
    Text("SOMATIC")
      .font(.system(size: 10, weight: .medium))
      .tracking(1.4)
      .foregroundStyle(Palette.muted)
  }

  private func playButton(size: CGFloat) -> some View {
    ZStack {
      Circle().fill(Palette.sage.opacity(0.14)).frame(width: size * 1.25, height: size * 1.25)
      Circle().fill(Palette.sage).frame(width: size, height: size)
      Image(systemName: "play.fill")
        .font(.system(size: size * 0.34, weight: .regular))
        .foregroundStyle(Color.white)
        .offset(x: size * 0.03)
    }
    .accessibilityHidden(true)
  }
}

/// iOS 17+: ciepły papier na ekranie początkowym, przezroczyste tło na ekranie blokady.
private struct SomaticBackground: ViewModifier {
  let family: WidgetFamily

  func body(content: Content) -> some View {
    switch family {
    case .accessoryCircular, .accessoryRectangular, .accessoryInline:
      content.containerBackground(for: .widget) { Color.clear }
    default:
      content.containerBackground(for: .widget) { Palette.paper }
    }
  }
}

// MARK: - Konfiguracja

struct QuickResetWidget: Widget {
  let kind = "QuickResetWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: QuickResetProvider()) { entry in
      QuickResetWidgetView(entry: entry)
    }
    .configurationDisplayName("Somatic – Reset 60 s")
    .description("Jedno dotknięcie otwiera tryb deeskalacji przy biurku.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryCircular,
      .accessoryRectangular,
      .accessoryInline,
    ])
  }
}

#Preview(as: .systemSmall) {
  QuickResetWidget()
} timeline: {
  QuickResetEntry(date: .now)
}
