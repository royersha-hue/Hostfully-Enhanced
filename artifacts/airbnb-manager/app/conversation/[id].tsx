import React, { useRef, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { Avatar } from "@/components/Avatar";
import { PlatformBadge } from "@/components/PlatformBadge";
import type { Message } from "@/types";
import * as Haptics from "expo-haptics";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversations, messages, sendMessage, markConversationRead, quickReplies } = useApp();

  const conv = conversations.find((c) => c.id === id);
  const msgList = (messages[id ?? ""] ?? []).slice().sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const [text, setText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const flatRef = useRef<FlatList>(null);

  React.useEffect(() => {
    if (id) markConversationRead(id);
  }, [id]);

  function handleSend() {
    if (!text.trim() || !id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(id, text.trim());
    setText("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleQuickReply(reply: string) {
    setText(reply);
    setShowQuickReplies(false);
  }

  if (!conv) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Conversation not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.chatHeader,
          { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Avatar name={conv.guestName} size={38} />
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{conv.guestName}</Text>
          <Text style={[styles.headerProp, { color: colors.mutedForeground }]}>{conv.propertyName}</Text>
        </View>
        <PlatformBadge platform={conv.platform} />
      </View>

      <FlatList
        ref={flatRef}
        data={msgList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item, index }) => {
          const isMe = item.direction === "outbound";
          const showDate =
            index === 0 ||
            formatDate(msgList[index - 1]!.timestamp) !== formatDate(item.timestamp);
          return (
            <View>
              {showDate && (
                <View style={styles.dateLabel}>
                  <Text style={[styles.dateLabelText, { color: colors.mutedForeground }]}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
              )}
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && (
                  <Avatar name={conv.guestName} size={30} />
                )}
                <View style={styles.bubbleWrapper}>
                  <View
                    style={[
                      styles.bubble,
                      isMe
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.foreground }]}>
                      {item.text}
                    </Text>
                  </View>
                  <Text style={[styles.msgTime, { color: colors.mutedForeground }, isMe && styles.msgTimeMe]}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyChat}>
            <Feather name="message-circle" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
              Start the conversation
            </Text>
          </View>
        )}
      />

      {showQuickReplies && (
        <View style={[styles.quickRepliesPanel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesScroll}>
            {quickReplies.map((reply, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.quickReplyChip, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={[styles.quickReplyText, { color: colors.foreground }]} numberOfLines={2}>
                  {reply}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.muted }]}
          onPress={() => setShowQuickReplies((v) => !v)}
        >
          <Feather name="zap" size={18} color={showQuickReplies ? colors.primary : colors.mutedForeground} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Message..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Feather name="send" size={18} color={text.trim() ? "#fff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  headerProp: { fontSize: 12, fontFamily: "Inter_400Regular" },
  messages: { padding: 16, gap: 4 },
  dateLabel: { alignItems: "center", marginVertical: 8 },
  dateLabelText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  msgRow: { flexDirection: "row", gap: 8, marginVertical: 3 },
  msgRowMe: { flexDirection: "row-reverse" },
  bubbleWrapper: { maxWidth: "75%" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  msgTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3, marginLeft: 4 },
  msgTimeMe: { textAlign: "right", marginRight: 4, marginLeft: 0 },
  emptyChat: { paddingTop: 60, alignItems: "center", gap: 8 },
  emptyChatText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  quickRepliesPanel: { borderTopWidth: 1, paddingVertical: 10 },
  quickRepliesScroll: { paddingHorizontal: 16, gap: 8 },
  quickReplyChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 220,
  },
  quickReplyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  quickBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
