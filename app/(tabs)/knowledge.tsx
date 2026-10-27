import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, ColorBand, Screen, ScreenHeader, SegmentedControl } from '../../src/components/ui';
import { KNOWLEDGE, KnowledgeSection } from '../../src/content/knowledge';
import { colors, fonts, spacing, type } from '../../src/theme/tokens';

export default function KnowledgeScreen() {
  const [active, setActive] = useState<KnowledgeSection['id']>('mindset');
  const section = KNOWLEDGE.find((s) => s.id === active) ?? KNOWLEDGE[0];

  return (
    <Screen>
      <ScreenHeader eyebrow="Przewodnik PRT" title="Baza wiedzy" />
      <SegmentedControl
        options={KNOWLEDGE.map((s) => ({ value: s.id, label: s.tab }))}
        value={active}
        onChange={setActive}
      />

      <ColorBand title={section.title} subtitle={section.subtitle} color={section.color} botanical={section.botanical} />

      {section.blocks.map((block) => (
        <Card key={block.heading}>
          <Text style={styles.heading}>{block.heading}</Text>
          {block.paragraphs?.map((p) => (
            <Text key={p.slice(0, 32)} style={[type.body, styles.paragraph]}>
              {p}
            </Text>
          ))}
          {block.bullets ? (
            <View style={styles.bullets}>
              {block.bullets.map((b) => (
                <View key={b} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: section.color }]} />
                  <Text style={[type.body, styles.bulletText]}>{b}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {block.quote ? (
            <View style={[styles.quote, { borderLeftColor: section.color }]}>
              <Text style={styles.quoteText}>{block.quote}</Text>
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.serifMedium, fontSize: 21, lineHeight: 28, color: colors.text, marginBottom: spacing.sm },
  paragraph: { marginTop: spacing.sm, color: '#3A3A3A' },
  bullets: { marginTop: spacing.sm, gap: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: spacing.md },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 10 },
  bulletText: { flex: 1, color: '#3A3A3A' },
  quote: { marginTop: spacing.lg, borderLeftWidth: 2, paddingLeft: spacing.md },
  quoteText: { fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 26, color: colors.text },
});
