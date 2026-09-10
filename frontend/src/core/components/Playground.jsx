import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card } from './Card';
import { Button } from './Button';
import { TransparencyBadge } from './TransparencyBadge';
import { BidDial } from './BidDial';
import { ReverseBidSlider } from './ReverseBidSlider';
import { OfflineBanner } from './OfflineBanner';
import { Palette, Sun, Moon, Layers, Sliders } from 'lucide-react-native';

export const ComponentPlayground = () => {
  const { theme, typography, isDark, toggleTheme } = useTheme();

  const [dialSeconds, setDialSeconds] = useState(54);
  const [dialBidPct, setDialBidPct] = useState(22.5);
  const [sliderBidPct, setSliderBidPct] = useState(24.0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface.base }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: theme.text.primary }]}>
            Design System Playground
          </Text>
          <Text style={[typography.bodyMedium, { color: theme.text.secondary }]}>
            ChitTech Token Specs, UI Primitives & Bid Dial Component
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeBtn, { backgroundColor: theme.surface.cardSubtle, borderColor: theme.surface.border }]}
        >
          {isDark ? <Sun size={18} color={theme.gold.accent} /> : <Moon size={18} color={theme.maroon.primary} />}
          <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700', marginLeft: 6 }]}>
            {isDark ? 'Dark' : 'Light'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. Color Palette Tokens */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Palette size={18} color={theme.maroon.primary} />
          <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
            Theme Palette Tokens
          </Text>
        </View>

        <View style={styles.paletteGrid}>
          <View style={styles.swatchItem}>
            <View style={[styles.swatch, { backgroundColor: theme.maroon.primary }]} />
            <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>maroon.primary</Text>
            <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>{theme.maroon.primary}</Text>
          </View>

          <View style={styles.swatchItem}>
            <View style={[styles.swatch, { backgroundColor: theme.maroon.deep }]} />
            <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>maroon.deep</Text>
            <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>{theme.maroon.deep}</Text>
          </View>

          <View style={styles.swatchItem}>
            <View style={[styles.swatch, { backgroundColor: theme.gold.accent }]} />
            <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>gold.accent</Text>
            <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>{theme.gold.accent}</Text>
          </View>

          <View style={styles.swatchItem}>
            <View style={[styles.swatch, { backgroundColor: theme.surface.card, borderColor: theme.surface.border, borderWidth: 1 }]} />
            <Text style={[typography.caption, { color: theme.text.primary, fontWeight: '700' }]}>surface.card</Text>
            <Text style={[typography.caption, { color: theme.text.muted, fontSize: 10 }]}>{theme.surface.card}</Text>
          </View>
        </View>
      </Card>

      {/* 2. Signature Auction Bid Dial */}
      <Card variant="goldAccent" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Sliders size={18} color={theme.gold.accent} />
          <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
            Signature Live Bid Dial
          </Text>
        </View>

        <View style={{ alignItems: 'center', marginVertical: 14 }}>
          <BidDial
            size={260}
            totalDurationSeconds={120}
            remainingSeconds={dialSeconds}
            currentLowestBidPct={dialBidPct}
            chitAmount={500000}
          />
        </View>

        <View style={styles.dialControlsRow}>
          <Button
            title="Reset Timer (120s)"
            size="sm"
            variant="outline"
            onPress={() => setDialSeconds(120)}
          />
          <Button
            title="Step -15s"
            size="sm"
            variant="outline"
            onPress={() => setDialSeconds((s) => Math.max(0, s - 15))}
          />
          <Button
            title="Step Bid (+1%)"
            size="sm"
            variant="primary"
            onPress={() => setDialBidPct((b) => Number((b + 1).toFixed(1)))}
          />
        </View>
      </Card>

      {/* 3. Reverse-Bid Stepper / Slider */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Layers size={18} color={theme.maroon.primary} />
          <Text style={[typography.h2, { color: theme.text.primary, marginLeft: 8 }]}>
            Reverse-Bid Stepper & Legal Bounds
          </Text>
        </View>

        <ReverseBidSlider
          currentLowestBidPct={dialBidPct}
          selectedBidPct={sliderBidPct}
          onBidChange={setSliderBidPct}
          chitAmount={500000}
        />
      </Card>

      {/* 4. Transparency Badges Pattern */}
      <Card style={styles.sectionCard}>
        <Text style={[typography.h2, { color: theme.text.primary, marginBottom: 12 }]}>
          Transparency Badges (ChitKart Pattern)
        </Text>

        <View style={{ gap: 10 }}>
          <TransparencyBadge
            status="NPS"
            ticketNumber={7}
            registrarState="Registered — Telangana T-Chits"
            onPressDocs={() => {}}
          />
          <TransparencyBadge
            status="SB"
            ticketNumber={14}
            registrarState="Registered — Andhra Pradesh"
            onPressDocs={() => {}}
          />
          <TransparencyBadge
            status="PS"
            ticketNumber={3}
            registrarState="Registered — Tamil Nadu"
            onPressDocs={() => {}}
          />
        </View>
      </Card>

      {/* 5. Button Variants */}
      <Card style={styles.sectionCard}>
        <Text style={[typography.h2, { color: theme.text.primary, marginBottom: 12 }]}>
          Buttons & Interactive States
        </Text>

        <View style={{ gap: 10 }}>
          <Button title="Primary Maroon Button" variant="primary" onPress={() => {}} />
          <Button title="Secondary Deep Maroon Button" variant="secondary" onPress={() => {}} />
          <Button title="Gold Accent Action Button" variant="gold" onPress={() => {}} />
          <Button title="Outline Bordered Button" variant="outline" onPress={() => {}} />
          <Button title="Ghost Clean Button" variant="ghost" onPress={() => {}} />
          <Button title="Loading State Button" variant="primary" loading={true} onPress={() => {}} />
        </View>
      </Card>

      {/* 6. Offline Banner */}
      <Card style={styles.sectionCard}>
        <Text style={[typography.h2, { color: theme.text.primary, marginBottom: 12 }]}>
          Offline Tolerance Banner
        </Text>
        <OfflineBanner isOffline={true} lastUpdated="10:45 AM" onRetry={() => {}} />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatchItem: {
    alignItems: 'center',
    width: 80,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginBottom: 6,
  },
  dialControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});
