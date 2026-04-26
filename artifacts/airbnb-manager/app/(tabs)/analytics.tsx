import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { MiniBarChart } from "@/components/MiniBarChart";
import { PlatformBadge } from "@/components/PlatformBadge";
import type { Platform as PlatformType } from "@/types";

const PERIOD_LABELS = ["30 days", "3 months", "6 months"];

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookings, monthlyStats, properties } = useApp();
  const [period, setPeriod] = useState(2);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const chartData = monthlyStats.slice(-(period === 0 ? 1 : period === 1 ? 3 : 6));

  const completedAndActive = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "pending"
  );

  const totalRevenue = completedAndActive.reduce((s, b) => s + b.netRevenue, 0);
  const totalBookings = completedAndActive.length;
  const avgNightly = completedAndActive.length > 0
    ? Math.round(completedAndActive.reduce((s, b) => s + b.property.pricePerNight, 0) / completedAndActive.length)
    : 0;

  const platformCounts: Record<PlatformType, { bookings: number; revenue: number }> = {
    airbnb: { bookings: 0, revenue: 0 },
    vrbo: { bookings: 0, revenue: 0 },
    booking: { bookings: 0, revenue: 0 },
    direct: { bookings: 0, revenue: 0 },
  };
  completedAndActive.forEach((b) => {
    platformCounts[b.platform].bookings++;
    platformCounts[b.platform].revenue += b.netRevenue;
  });

  const platformEntries = Object.entries(platformCounts)
    .filter(([, v]) => v.bookings > 0)
    .sort((a, b) => b[1].bookings - a[1].bookings) as [PlatformType, { bookings: number; revenue: number }][];

  const propertyRevenue = properties.map((p) => ({
    property: p,
    revenue: completedAndActive
      .filter((b) => b.propertyId === p.id)
      .reduce((s, b) => s + b.netRevenue, 0),
    bookings: completedAndActive.filter((b) => b.propertyId === p.id).length,
  })).sort((a, b) => b.revenue - a.revenue);

  const maxPropertyRevenue = Math.max(...propertyRevenue.map((p) => p.revenue), 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPadding + 12,
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100,
        paddingHorizontal: 16,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>

      <View style={[styles.periodPicker, { backgroundColor: colors.muted }]}>
        {PERIOD_LABELS.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.periodBtn,
              period === i && { backgroundColor: colors.card },
            ]}
            onPress={() => setPeriod(i)}
          >
            <Text
              style={[
                styles.periodText,
                { color: period === i ? colors.foreground : colors.mutedForeground },
                period === i && { fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.bigStat, { backgroundColor: colors.primary }]}>
          <Feather name="trending-up" size={20} color="#fff" />
          <Text style={styles.bigStatValue}>${totalRevenue.toLocaleString()}</Text>
          <Text style={styles.bigStatLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statsCol}>
          <View style={[styles.smallStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.smallStatValue, { color: colors.foreground }]}>{totalBookings}</Text>
            <Text style={[styles.smallStatLabel, { color: colors.mutedForeground }]}>Bookings</Text>
          </View>
          <View style={[styles.smallStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.smallStatValue, { color: colors.foreground }]}>${avgNightly}</Text>
            <Text style={[styles.smallStatLabel, { color: colors.mutedForeground }]}>Avg/Night</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Monthly Revenue</Text>
        <MiniBarChart data={chartData} highlightColor={colors.primary} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>By Platform</Text>
        {platformEntries.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data yet</Text>
        )}
        {platformEntries.map(([platform, data]) => {
          const pct = totalBookings > 0 ? (data.bookings / totalBookings) * 100 : 0;
          return (
            <View key={platform} style={styles.platformRow}>
              <PlatformBadge platform={platform} size="md" />
              <View style={styles.platformBar}>
                <View
                  style={[
                    styles.platformBarFill,
                    { width: `${pct}%` as any, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.platformPct, { color: colors.foreground }]}>
                {pct.toFixed(0)}%
              </Text>
              <Text style={[styles.platformRev, { color: colors.mutedForeground }]}>
                ${data.revenue.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>By Property</Text>
        {propertyRevenue.map(({ property, revenue, bookings: bCount }) => (
          <View key={property.id} style={styles.propRow}>
            <View style={styles.propInfo}>
              <Text style={[styles.propName, { color: colors.foreground }]}>{property.name}</Text>
              <Text style={[styles.propSub, { color: colors.mutedForeground }]}>
                {bCount} bookings · ${property.pricePerNight}/night
              </Text>
              <View style={[styles.propBarBg, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.propBarFill,
                    {
                      width: `${Math.round((revenue / maxPropertyRevenue) * 100)}%` as any,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.propRevenue, { color: colors.foreground }]}>
              ${revenue.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  periodPicker: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  periodText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 12 },
  bigStat: {
    flex: 1.2,
    borderRadius: 16,
    padding: 18,
    gap: 6,
    justifyContent: "center",
  },
  bigStatValue: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1 },
  bigStatLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  statsCol: { flex: 0.8, gap: 12 },
  smallStat: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    justifyContent: "center",
  },
  smallStatValue: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  smallStatLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  platformRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  platformBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  platformBarFill: { height: "100%", borderRadius: 3 },
  platformPct: { fontSize: 12, fontFamily: "Inter_600SemiBold", minWidth: 30, textAlign: "right" },
  platformRev: { fontSize: 12, fontFamily: "Inter_400Regular", minWidth: 60, textAlign: "right" },
  propRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  propInfo: { flex: 1, gap: 4 },
  propName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  propSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  propBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  propBarFill: { height: "100%", borderRadius: 3 },
  propRevenue: { fontSize: 15, fontFamily: "Inter_700Bold", paddingTop: 2 },
});
