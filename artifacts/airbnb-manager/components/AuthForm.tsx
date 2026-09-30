import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type FormProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthForm({ title, subtitle, children }: FormProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.page,
        {
          paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 40,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <View style={[styles.brand, { backgroundColor: colors.primary }]}>
          <Text style={styles.brandText}>S</Text>
        </View>
        <Text style={[styles.brandName, { color: colors.accent }]}>StayFlow</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        <View style={styles.fields}>{children}</View>
      </View>
    </ScrollView>
  );
}

export function AuthInput(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const colors = useColors();
  const { label, ...inputProps } = props;
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function AuthButton({ title, onPress, disabled = false, secondary = false }: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      testID={title.toLowerCase().replace(/\s+/g, "-")}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: secondary ? colors.card : colors.primary, borderColor: secondary ? colors.border : colors.primary },
        (disabled || pressed) && { opacity: 0.65 },
      ]}
    >
      <Text style={[styles.buttonText, { color: secondary ? colors.foreground : colors.primaryForeground }]}>{title}</Text>
    </Pressable>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  const colors = useColors();
  return message ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 },
  content: { width: "100%", maxWidth: 440, alignSelf: "center" },
  brand: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  brandText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 28 },
  brandName: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 36 },
  title: { fontFamily: "Inter_700Bold", fontSize: 30, marginBottom: 8 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, marginBottom: 28 },
  fields: { gap: 16 },
  field: { gap: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 16 },
  button: { height: 52, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  buttonText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  error: { fontFamily: "Inter_400Regular", fontSize: 14 },
});