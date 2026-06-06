import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import * as WebBrowser from "expo-web-browser";
import { useColors } from "@/hooks/useColors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

type Price = {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
  active: boolean;
};

type Product = {
  id: string;
  name: string;
  description: string;
  prices: Price[];
};

const PRO_FEATURES = [
  "Unlimited properties",
  "Advanced analytics & reports",
  "Priority customer support",
  "Automated guest messages",
  "Revenue optimization tips",
  "Export data to CSV",
];

function formatPrice(amount: number, currency: string, interval: string) {
  const dollars = amount / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(dollars);
  return `${formatted} / ${interval}`;
}

export default function SubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/stripe/products-with-prices`);
      if (!res.ok) throw new Error("Failed to load plans");
      const json = await res.json();
      const prods: Product[] = json.data ?? [];
      setProducts(prods);
      if (prods.length > 0 && prods[0]!.prices.length > 0) {
        const monthly = prods[0]!.prices.find(
          (p) => p.recurring?.interval === "month"
        );
        setSelectedPriceId(monthly?.id ?? prods[0]!.prices[0]!.id);
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    if (!selectedPriceId) return;
    try {
      setSubscribing(true);
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: selectedPriceId }),
      });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const json = await res.json();
      if (json.url) {
        await WebBrowser.openBrowserAsync(json.url);
      }
    } catch (e: any) {
      setError(e.message ?? "Checkout failed");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Upgrade to Pro
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: colors.accent }]}>
        <Feather name="star" size={32} color="#fff" style={styles.heroIcon} />
        <Text style={styles.heroTitle}>StayFlow Pro</Text>
        <Text style={styles.heroSubtitle}>
          Everything you need to manage your properties like a pro
        </Text>
      </View>

      <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          WHAT'S INCLUDED
        </Text>
        {PRO_FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={[styles.checkCircle, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="check" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.featureText, { color: colors.foreground }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading plans…
          </Text>
        </View>
      ) : error ? (
        <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="alert-circle" size={20} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          <TouchableOpacity onPress={fetchProducts} style={[styles.retryBtn, { borderColor: colors.border }]}>
            <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="package" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No plans available yet
          </Text>
        </View>
      ) : (
        products.map((product) => (
          <View key={product.id}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>
              CHOOSE YOUR PLAN
            </Text>
            {product.prices.map((price) => {
              const selected = selectedPriceId === price.id;
              const isYearly = price.recurring?.interval === "year";
              return (
                <TouchableOpacity
                  key={price.id}
                  style={[
                    styles.priceCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPriceId(price.id)}
                >
                  <View style={styles.priceCardLeft}>
                    <View style={[
                      styles.radioOuter,
                      { borderColor: selected ? colors.primary : colors.border }
                    ]}>
                      {selected && (
                        <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <View>
                      <Text style={[styles.priceInterval, { color: colors.foreground }]}>
                        {isYearly ? "Annual" : "Monthly"}
                      </Text>
                      {isYearly && (
                        <View style={[styles.saveBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.saveBadgeText}>Save ~17%</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.priceAmount, { color: colors.foreground }]}>
                    {formatPrice(price.unit_amount, price.currency, price.recurring?.interval ?? "one-time")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <TouchableOpacity
            style={[
              styles.subscribeBtn,
              {
                backgroundColor: selectedPriceId ? colors.primary : colors.muted,
                opacity: subscribing ? 0.7 : 1,
              },
            ]}
            onPress={handleSubscribe}
            disabled={!selectedPriceId || subscribing}
          >
            {subscribing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="zap" size={18} color="#fff" />
                <Text style={styles.subscribeBtnText}>Start Pro Subscription</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Secured by Stripe · Cancel anytime · No hidden fees
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  heroCard: {
    borderRadius: 16, padding: 24,
    alignItems: "center", gap: 8,
  },
  heroIcon: { marginBottom: 4 },
  heroTitle: {
    color: "#fff", fontSize: 24,
    fontFamily: "Inter_700Bold", textAlign: "center",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)", fontSize: 14,
    fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20,
  },
  featuresCard: {
    borderRadius: 16, padding: 16,
    borderWidth: 1, gap: 12,
  },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  featureText: { fontSize: 15, fontFamily: "Inter_400Regular", flex: 1 },
  loadingContainer: { alignItems: "center", gap: 8, paddingVertical: 24 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorCard: {
    borderRadius: 16, borderWidth: 1,
    padding: 20, alignItems: "center", gap: 12,
  },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyCard: {
    borderRadius: 16, borderWidth: 1,
    padding: 32, alignItems: "center", gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  priceCard: {
    borderRadius: 16, padding: 16, marginBottom: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  priceCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  priceInterval: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  saveBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  priceAmount: { fontSize: 15, fontFamily: "Inter_500Medium" },
  subscribeBtn: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, marginTop: 8,
  },
  subscribeBtnText: {
    color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold",
  },
  disclaimer: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    textAlign: "center", marginTop: -4,
  },
});
