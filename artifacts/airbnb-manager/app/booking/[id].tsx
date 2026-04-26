import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { Avatar } from "@/components/Avatar";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { PlatformBadge } from "@/components/PlatformBadge";
import type { BookingStatus } from "@/types";
import * as Haptics from "expo-haptics";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookings, conversations, updateBookingStatus } = useApp();

  const booking = bookings.find((b) => b.id === id);
  const conv = booking
    ? conversations.find((c) => c.bookingId === booking.id)
    : undefined;

  if (!booking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Booking not found</Text>
      </View>
    );
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  function changeStatus(status: BookingStatus) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateBookingStatus(booking!.id, status);
  }

  const nights = booking.nights;
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPadding + 8,
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Booking Details</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.guestRow}>
            <Avatar name={booking.guest.name} size={54} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.guestName, { color: colors.foreground }]}>{booking.guest.name}</Text>
              <Text style={[styles.guestEmail, { color: colors.mutedForeground }]}>{booking.guest.email}</Text>
              {booking.guest.phone && (
                <Text style={[styles.guestEmail, { color: colors.mutedForeground }]}>{booking.guest.phone}</Text>
              )}
            </View>
            <View style={{ gap: 6 }}>
              <BookingStatusBadge status={booking.status} />
              <PlatformBadge platform={booking.platform} />
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{booking.property.name}</Text>
          <Text style={[styles.address, { color: colors.mutedForeground }]}>{booking.property.address}</Text>

          <View style={[styles.datesRow, { borderColor: colors.border }]}>
            <View style={styles.dateBlock}>
              <Text style={[styles.dateLabel2, { color: colors.mutedForeground }]}>Check-in</Text>
              <Text style={[styles.dateValue, { color: colors.foreground }]}>
                {checkInDate.toLocaleDateString([], { month: "short", day: "numeric" })}
              </Text>
              <Text style={[styles.dateDay, { color: colors.mutedForeground }]}>
                {checkInDate.toLocaleDateString([], { weekday: "long" })}
              </Text>
            </View>
            <View style={[styles.nightsPill, { backgroundColor: colors.muted }]}>
              <Feather name="moon" size={13} color={colors.mutedForeground} />
              <Text style={[styles.nightsNum, { color: colors.foreground }]}>{nights}</Text>
            </View>
            <View style={[styles.dateBlock, { alignItems: "flex-end" }]}>
              <Text style={[styles.dateLabel2, { color: colors.mutedForeground }]}>Check-out</Text>
              <Text style={[styles.dateValue, { color: colors.foreground }]}>
                {checkOutDate.toLocaleDateString([], { month: "short", day: "numeric" })}
              </Text>
              <Text style={[styles.dateDay, { color: colors.mutedForeground }]}>
                {checkOutDate.toLocaleDateString([], { weekday: "long" })}
              </Text>
            </View>
          </View>

          <View style={styles.guestCountRow}>
            <Feather name="users" size={14} color={colors.mutedForeground} />
            <Text style={[styles.guestCount, { color: colors.mutedForeground }]}>
              {booking.adults} adult{booking.adults > 1 ? "s" : ""}{booking.children > 0 ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Revenue</Text>
          {[
            { label: `${nights} nights × $${booking.property.pricePerNight}`, amount: booking.totalAmount - booking.cleaningFee },
            { label: "Cleaning fee", amount: booking.cleaningFee },
            { label: "Platform fee", amount: -booking.platformFee },
          ].map(({ label, amount }) => (
            <View key={label} style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>{label}</Text>
              <Text style={[styles.feeAmount, { color: amount < 0 ? colors.destructive : colors.foreground }]}>
                {amount < 0 ? "-" : ""}${Math.abs(amount).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Net Revenue</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              ${booking.netRevenue.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Actions</Text>
          <View style={styles.actionsGrid}>
            {booking.status === "confirmed" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#e8f5e9", borderColor: "#4caf50" + "44" }]}
                onPress={() => changeStatus("checked_in")}
              >
                <Feather name="log-in" size={18} color="#4caf50" />
                <Text style={[styles.actionText, { color: "#4caf50" }]}>Check In</Text>
              </TouchableOpacity>
            )}
            {booking.status === "checked_in" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#e3f2fd", borderColor: "#2196f3" + "44" }]}
                onPress={() => changeStatus("completed")}
              >
                <Feather name="log-out" size={18} color="#2196f3" />
                <Text style={[styles.actionText, { color: "#2196f3" }]}>Check Out</Text>
              </TouchableOpacity>
            )}
            {conv && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "44" }]}
                onPress={() => router.push(`/conversation/${conv.id}`)}
              >
                <Feather name="message-circle" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Message Guest</Text>
              </TouchableOpacity>
            )}
            {(booking.status === "confirmed" || booking.status === "pending") && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#fdecea", borderColor: colors.destructive + "44" }]}
                onPress={() => changeStatus("cancelled")}
              >
                <Feather name="x-circle" size={18} color={colors.destructive} />
                <Text style={[styles.actionText, { color: colors.destructive }]}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => router.push(`/guest/${booking.guestId}`)}
            >
              <Feather name="user" size={18} color={colors.foreground} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>View Guest</Text>
            </TouchableOpacity>
          </View>
        </View>

        {booking.notes && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
            <Text style={[styles.notes, { color: colors.mutedForeground }]}>{booking.notes}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  guestRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  guestName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  guestEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  address: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -6 },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    marginVertical: 4,
  },
  dateBlock: { gap: 2 },
  dateLabel2: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  dateValue: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  dateDay: { fontSize: 12, fontFamily: "Inter_400Regular" },
  nightsPill: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  nightsNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  guestCountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  guestCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  feeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feeLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  feeAmount: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  totalAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  notes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
