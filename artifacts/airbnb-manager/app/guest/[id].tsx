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
import { PlatformBadge } from "@/components/PlatformBadge";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";

export default function GuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { guests, bookings, conversations } = useApp();

  const guest = guests.find((g) => g.id === id);
  const guestBookings = bookings.filter((b) => b.guestId === id).sort(
    (a, b) => b.checkIn.localeCompare(a.checkIn)
  );
  const guestConv = conversations.filter((c) => c.guestId === id);

  if (!guest) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Guest not found</Text>
      </View>
    );
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

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
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Guest Profile</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileRow}>
            <Avatar name={guest.name} size={68} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{guest.name}</Text>
              {guest.nationality && (
                <Text style={[styles.nationality, { color: colors.mutedForeground }]}>
                  {guest.nationality}
                </Text>
              )}
              <PlatformBadge platform={guest.platform} size="md" />
            </View>
          </View>

          <View style={styles.contactList}>
            <View style={styles.contactRow}>
              <Feather name="mail" size={14} color={colors.mutedForeground} />
              <Text style={[styles.contactText, { color: colors.foreground }]}>{guest.email}</Text>
            </View>
            {guest.phone && (
              <View style={styles.contactRow}>
                <Feather name="phone" size={14} color={colors.mutedForeground} />
                <Text style={[styles.contactText, { color: colors.foreground }]}>{guest.phone}</Text>
              </View>
            )}
            <View style={styles.contactRow}>
              <Feather name="calendar" size={14} color={colors.mutedForeground} />
              <Text style={[styles.contactText, { color: colors.mutedForeground }]}>
                Guest since {new Date(guest.joinedDate).toLocaleDateString([], { month: "long", year: "numeric" })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Stays", value: `${guest.totalStays}`, icon: "home" as const },
            { label: "Spent", value: `$${guest.totalSpent.toLocaleString()}`, icon: "dollar-sign" as const },
            { label: "Rating", value: guest.rating !== undefined ? `${guest.rating}` : "—", icon: "star" as const },
          ].map(({ label, value, icon }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={icon} size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>

        {guest.notes && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionRow}>
              <Feather name="file-text" size={16} color={colors.mutedForeground} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
            </View>
            <Text style={[styles.notes, { color: colors.mutedForeground }]}>{guest.notes}</Text>
          </View>
        )}

        {guestConv.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Messages</Text>
            {guestConv.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={[styles.convRow, { borderColor: colors.border }]}
                onPress={() => router.push(`/conversation/${conv.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.convProp, { color: colors.foreground }]}>{conv.propertyName}</Text>
                  <Text style={[styles.convLast, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                </View>
                {conv.unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{conv.unreadCount}</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {guestBookings.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stay History</Text>
            {guestBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={[styles.bookingRow, { borderColor: colors.border }]}
                onPress={() => router.push(`/booking/${booking.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bookingProp, { color: colors.foreground }]}>{booking.property.name}</Text>
                  <Text style={[styles.bookingDates, { color: colors.mutedForeground }]}>
                    {booking.checkIn} → {booking.checkOut} · {booking.nights} nights
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <BookingStatusBadge status={booking.status} />
                  <Text style={[styles.bookingAmt, { color: colors.foreground }]}>
                    ${booking.netRevenue.toLocaleString()}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
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
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  profileRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  nationality: { fontSize: 14, fontFamily: "Inter_400Regular" },
  contactList: { gap: 8 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  notes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  convRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingTop: 10 },
  convProp: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  convLast: { fontSize: 13, fontFamily: "Inter_400Regular" },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  bookingRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingTop: 10 },
  bookingProp: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bookingDates: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  bookingAmt: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
