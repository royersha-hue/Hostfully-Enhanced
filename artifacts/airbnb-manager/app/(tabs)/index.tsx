import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { StatCard } from "@/components/StatCard";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { Avatar } from "@/components/Avatar";
import { MiniBarChart } from "@/components/MiniBarChart";

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookings, conversations, monthlyStats, totalUnread, properties } = useApp();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]!;

  const upcomingBookings = bookings
    .filter((b) => b.status === "confirmed" || b.status === "checked_in")
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 3);

  const thisMonthRevenue = monthlyStats[monthlyStats.length - 1]?.revenue ?? 0;
  const lastMonthRevenue = monthlyStats[monthlyStats.length - 2]?.revenue ?? 0;
  const revenueChange =
    lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(0)
      : "0";

  const checkedIn = bookings.filter((b) => b.status === "checked_in").length;
  const upcoming = bookings.filter((b) => b.status === "confirmed").length;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Dashboard</Text>
        </View>
        {totalUnread > 0 && (
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/messages")}
          >
            <Feather name="mail" size={16} color="#fff" />
            <Text style={styles.notifCount}>{totalUnread}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="This Month"
          value={`$${thisMonthRevenue.toLocaleString()}`}
          change={`${revenueChange}%`}
          changePositive={Number(revenueChange) >= 0}
          icon="trending-up"
          accent={colors.primary}
        />
        <StatCard
          label="Active Properties"
          value={`${properties.filter((p) => p.isActive).length}`}
          icon="home"
          accent={colors.accent}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Checked In"
          value={`${checkedIn}`}
          icon="log-in"
          accent="#4caf50"
        />
        <StatCard
          label="Upcoming"
          value={`${upcoming}`}
          icon="calendar"
          accent="#f59e0b"
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Revenue (6 months)</Text>
        <MiniBarChart data={monthlyStats} highlightColor={colors.primary} />
      </View>

      <TouchableOpacity
        style={[styles.upgradeBanner, { backgroundColor: colors.accent }]}
        activeOpacity={0.88}
        onPress={() => router.push("/subscription")}
      >
        <View style={styles.upgradeLeft}>
          <Feather name="star" size={18} color="#fff" />
          <View>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeSubtitle}>Unlock unlimited properties & analytics</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Stays</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {upcomingBookings.map((booking) => (
        <TouchableOpacity
          key={booking.id}
          style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.85}
          onPress={() => router.push(`/booking/${booking.id}`)}
        >
          <Avatar name={booking.guest.name} size={44} />
          <View style={styles.bookingInfo}>
            <Text style={[styles.guestName, { color: colors.foreground }]}>
              {booking.guest.name}
            </Text>
            <Text style={[styles.propertyName, { color: colors.mutedForeground }]}>
              {booking.property.name}
            </Text>
            <Text style={[styles.dates, { color: colors.mutedForeground }]}>
              {booking.checkIn} → {booking.checkOut} · {booking.nights}n
            </Text>
          </View>
          <View style={styles.bookingRight}>
            <BookingStatusBadge status={booking.status} />
            <Text style={[styles.amount, { color: colors.foreground }]}>
              ${booking.netRevenue.toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {upcomingBookings.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No upcoming bookings
          </Text>
        </View>
      )}

      {totalUnread > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Unread Messages</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/messages")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {conversations
            .filter((c) => c.unreadCount > 0)
            .slice(0, 2)
            .map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.85}
                onPress={() => router.push(`/conversation/${conv.id}`)}
              >
                <Avatar name={conv.guestName} size={44} />
                <View style={styles.bookingInfo}>
                  <Text style={[styles.guestName, { color: colors.foreground }]}>
                    {conv.guestName}
                  </Text>
                  <Text style={[styles.propertyName, { color: colors.mutedForeground }]}>
                    {conv.propertyName}
                  </Text>
                  <Text style={[styles.messagePreview, { color: colors.foreground }]} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                </View>
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadCount}>{conv.unreadCount}</Text>
                </View>
              </TouchableOpacity>
            ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  notifBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  notifCount: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  statsRow: { flexDirection: "row", gap: 10 },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bookingInfo: { flex: 1, gap: 2 },
  guestName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  propertyName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dates: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  bookingRight: { alignItems: "flex-end", gap: 6 },
  amount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  messagePreview: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  upgradeBanner: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upgradeLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  upgradeTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  upgradeSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});
