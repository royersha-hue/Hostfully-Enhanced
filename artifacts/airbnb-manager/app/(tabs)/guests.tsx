import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { Avatar } from "@/components/Avatar";
import { PlatformBadge } from "@/components/PlatformBadge";
import type { Guest, Platform as PlatformType } from "@/types";
import * as Haptics from "expo-haptics";

export default function GuestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { guests, addGuest } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      (g.nationality ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Guests</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
        >
          <Feather name="user-plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrapper, { paddingHorizontal: 16 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search guests..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 },
        ]}
        scrollEnabled={!!filtered.length}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        renderItem={({ item }) => <GuestRow guest={item} onPress={() => router.push(`/guest/${item.id}`)} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="users" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No guests found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {search ? "Try a different search" : "Add your first guest"}
            </Text>
          </View>
        )}
      />

      <AddGuestModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(g) => { addGuest(g); setShowAdd(false); }}
      />
    </View>
  );
}

function GuestRow({ guest, onPress }: { guest: Guest; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.row}>
      <Avatar name={guest.name} size={48} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.guestName, { color: colors.foreground }]}>{guest.name}</Text>
          <PlatformBadge platform={guest.platform} />
        </View>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{guest.email}</Text>
        <View style={styles.rowStats}>
          <View style={styles.stat}>
            <Feather name="calendar" size={11} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {guest.totalStays} stays
            </Text>
          </View>
          <View style={styles.stat}>
            <Feather name="dollar-sign" size={11} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              ${guest.totalSpent.toLocaleString()} spent
            </Text>
          </View>
          {guest.rating !== undefined && (
            <View style={styles.stat}>
              <Feather name="star" size={11} color="#f59e0b" />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                {guest.rating}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function AddGuestModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (g: Guest) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  function handleAdd() {
    if (!name.trim() || !email.trim()) return;
    const newGuest: Guest = {
      id: `g_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      totalStays: 0,
      totalSpent: 0,
      platform: "direct",
      joinedDate: new Date().toISOString().split("T")[0]!,
    };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(newGuest);
    setName(""); setEmail(""); setPhone(""); setNotes("");
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <ScrollView
        style={[styles.modal, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 24, paddingTop: 24, gap: 16 }}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Guest</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {[
          { label: "Name *", value: name, onChange: setName, placeholder: "Full name" },
          { label: "Email *", value: email, onChange: setEmail, placeholder: "email@example.com" },
          { label: "Phone", value: phone, onChange: setPhone, placeholder: "+1 (555) 000-0000" },
        ].map((field) => (
          <View key={field.label} style={{ gap: 6 }}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{field.label}</Text>
            <TextInput
              style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder={field.placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={field.value}
              onChangeText={field.onChange}
            />
          </View>
        ))}

        <View style={{ gap: 6 }}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Notes</Text>
          <TextInput
            style={[styles.field, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Any notes about this guest..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: !name.trim() || !email.trim() ? 0.5 : 1 }]}
          onPress={handleAdd}
          disabled={!name.trim() || !email.trim()}
        >
          <Text style={styles.saveBtnText}>Add Guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  searchWrapper: { marginBottom: 8 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  list: { paddingTop: 4 },
  separator: { height: 1, marginLeft: 76 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  guestName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  email: { fontSize: 13, fontFamily: "Inter_400Regular" },
  rowStats: { flexDirection: "row", gap: 10, marginTop: 2 },
  stat: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { paddingTop: 80, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  field: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
