import React, { useState } from "react";
import {
  FlatList,
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
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { Avatar } from "@/components/Avatar";
import type { Booking } from "@/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface CalendarDay {
  day: number | null;
  bookings: Booking[];
  isToday: boolean;
  isPast: boolean;
}

export default function CalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookings } = useApp();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const todayStr = now.toISOString().split("T")[0]!;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function pad2(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  const calDays: CalendarDay[] = [];
  for (let i = 0; i < firstDay; i++) {
    calDays.push({ day: null, bookings: [], isToday: false, isPast: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;
    const dayBookings = bookings.filter(
      (b) =>
        b.checkIn <= dateStr && b.checkOut > dateStr &&
        b.status !== "cancelled"
    );
    calDays.push({
      day: d,
      bookings: dayBookings,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
    });
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const selectedDateBookings = selected
    ? bookings.filter((b) =>
        b.checkIn <= selected && b.checkOut > selected && b.status !== "cancelled"
      )
    : [];

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const STATUS_ORDER = { checked_in: 0, confirmed: 1, pending: 2, completed: 3, cancelled: 4 };

  const upcomingList = bookings
    .filter((b) => b.status !== "cancelled" && b.checkOut >= todayStr)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPadding + 12,
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100,
        paddingHorizontal: 16,
        gap: 12,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Calendar</Text>

      <View style={[styles.calCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {MONTHS[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Feather name="chevron-right" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.dayLabels}>
          {DAYS.map((d) => (
            <Text key={d} style={[styles.dayLabel, { color: colors.mutedForeground }]}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {calDays.map((cell, i) => {
            if (!cell.day) {
              return <View key={`empty-${i}`} style={styles.cell} />;
            }
            const dateStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(cell.day)}`;
            const isSelected = selected === dateStr;
            const hasBookings = cell.bookings.length > 0;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.cell,
                  cell.isToday && { backgroundColor: colors.primary + "20", borderRadius: 8 },
                  isSelected && { backgroundColor: colors.primary, borderRadius: 8 },
                ]}
                onPress={() => setSelected(isSelected ? null : dateStr)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayNum,
                    { color: cell.isPast ? colors.mutedForeground : colors.foreground },
                    cell.isToday && { color: colors.primary, fontFamily: "Inter_700Bold" },
                    isSelected && { color: "#fff", fontFamily: "Inter_700Bold" },
                  ]}
                >
                  {cell.day}
                </Text>
                {hasBookings && (
                  <View style={[styles.dotRow]}>
                    {cell.bookings.slice(0, 3).map((b) => (
                      <View
                        key={b.id}
                        style={[
                          styles.dot,
                          { backgroundColor: isSelected ? "#fff" : colors.primary },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected && selectedDateBookings.length > 0 && (
          <View style={[styles.selectedInfo, { borderColor: colors.border }]}>
            <Text style={[styles.selectedTitle, { color: colors.mutedForeground }]}>
              {selected} — {selectedDateBookings.length} booking{selectedDateBookings.length > 1 ? "s" : ""}
            </Text>
            {selectedDateBookings.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.miniBooking}
                onPress={() => router.push(`/booking/${b.id}`)}
              >
                <Avatar name={b.guest.name} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.miniGuest, { color: colors.foreground }]}>{b.guest.name}</Text>
                  <Text style={[styles.miniProp, { color: colors.mutedForeground }]}>{b.property.name}</Text>
                </View>
                <BookingStatusBadge status={b.status} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Bookings</Text>

      {upcomingList.map((booking) => (
        <TouchableOpacity
          key={booking.id}
          style={[styles.bookingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.85}
          onPress={() => router.push(`/booking/${booking.id}`)}
        >
          <Avatar name={booking.guest.name} size={42} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.guestName, { color: colors.foreground }]}>{booking.guest.name}</Text>
            <Text style={[styles.propName, { color: colors.mutedForeground }]}>{booking.property.name}</Text>
            <Text style={[styles.dates, { color: colors.mutedForeground }]}>
              {booking.checkIn} → {booking.checkOut} · {booking.nights} nights
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <BookingStatusBadge status={booking.status} />
            <Text style={[styles.amount, { color: colors.foreground }]}>
              ${booking.netRevenue.toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {upcomingList.length === 0 && (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No upcoming bookings</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  calCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dayLabels: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  dayNum: { fontSize: 14, fontFamily: "Inter_400Regular" },
  dotRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  selectedInfo: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    gap: 8,
  },
  selectedTitle: { fontSize: 12, fontFamily: "Inter_500Medium" },
  miniBooking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniGuest: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  miniProp: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  guestName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  propName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dates: { fontSize: 12, fontFamily: "Inter_400Regular" },
  amount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  empty: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
