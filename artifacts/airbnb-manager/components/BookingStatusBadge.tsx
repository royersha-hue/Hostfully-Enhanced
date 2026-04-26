import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { BookingStatus } from "@/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "#2196f3", bg: "#e3f2fd" },
  pending: { label: "Pending", color: "#f59e0b", bg: "#fff8e1" },
  checked_in: { label: "Checked In", color: "#4caf50", bg: "#e8f5e9" },
  completed: { label: "Completed", color: "#888580", bg: "#f0ede8" },
  cancelled: { label: "Cancelled", color: "#e05252", bg: "#fdecea" },
};

interface Props {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: Props) {
  const { label, color, bg } = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
