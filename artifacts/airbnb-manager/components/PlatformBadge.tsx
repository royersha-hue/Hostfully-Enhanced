import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Platform } from "@/types";
import { useColors } from "@/hooks/useColors";

const PLATFORM_LABELS: Record<Platform, string> = {
  airbnb: "Airbnb",
  vrbo: "VRBO",
  booking: "Booking.com",
  direct: "Direct",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  airbnb: "#FF5A5F",
  vrbo: "#3D67FF",
  booking: "#003580",
  direct: "#4caf50",
};

interface Props {
  platform: Platform;
  size?: "sm" | "md";
}

export function PlatformBadge({ platform, size = "sm" }: Props) {
  const colors = useColors();
  const color = PLATFORM_COLORS[platform];
  const label = PLATFORM_LABELS[platform];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + "18", borderColor: color + "44" },
      ]}
    >
      <Text style={[styles.label, { color }, size === "md" && styles.labelMd]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  labelMd: {
    fontSize: 13,
  },
});
