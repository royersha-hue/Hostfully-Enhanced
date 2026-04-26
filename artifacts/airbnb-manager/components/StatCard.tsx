import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: keyof typeof Feather.glyphMap;
  accent?: string;
}

export function StatCard({ label, value, change, changePositive, icon, accent }: Props) {
  const colors = useColors();
  const accentColor = accent ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrapper, { backgroundColor: accentColor + "18" }]}>
        <Feather name={icon} size={18} color={accentColor} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {change !== undefined && (
        <Text style={[styles.change, { color: changePositive ? colors.success : colors.destructive }]}>
          {changePositive ? "+" : ""}{change}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  change: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
});
