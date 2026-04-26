import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { MonthlyStats } from "@/types";

interface Props {
  data: MonthlyStats[];
  highlightColor?: string;
}

export function MiniBarChart({ data, highlightColor }: Props) {
  const colors = useColors();
  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const accent = highlightColor ?? colors.primary;

  return (
    <View style={styles.container}>
      {data.map((item, i) => {
        const height = maxRevenue > 0 ? Math.max(6, (item.revenue / maxRevenue) * 70) : 6;
        const isLast = i === data.length - 1;
        return (
          <View key={item.month} style={styles.barGroup}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isLast ? accent : accent + "50",
                    borderRadius: 4,
                  },
                ]}
              />
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>{item.month}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 90,
    paddingTop: 16,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    alignItems: "center",
  },
  bar: {
    width: "100%",
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
});
