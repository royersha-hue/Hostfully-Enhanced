import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Property } from "@/types";

interface Props {
  property: Property;
  onPress?: () => void;
}

export function PropertyCard({ property, onPress }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
        <Feather name="home" size={32} color={colors.mutedForeground} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: colors.foreground }]}>{property.name}</Text>
          <View style={styles.rating}>
            <Feather name="star" size={12} color="#f59e0b" />
            <Text style={[styles.ratingText, { color: colors.foreground }]}>
              {property.rating}
            </Text>
          </View>
        </View>
        <Text style={[styles.address, { color: colors.mutedForeground }]} numberOfLines={1}>
          {property.address}
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Feather name="moon" size={12} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              ${property.pricePerNight}/night
            </Text>
          </View>
          <View style={styles.stat}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {property.maxGuests} guests
            </Text>
          </View>
          <View style={styles.stat}>
            <Feather name="message-square" size={12} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {property.totalReviews} reviews
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  imagePlaceholder: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 14,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  address: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  stats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
