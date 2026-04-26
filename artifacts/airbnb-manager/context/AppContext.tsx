import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Booking, Conversation, Guest, Message, Property } from "@/types";
import {
  BOOKINGS,
  CONVERSATIONS,
  GUESTS,
  MESSAGES,
  MONTHLY_STATS,
  PROPERTIES,
  QUICK_REPLIES,
} from "@/data/mockData";
import type { MonthlyStats } from "@/types";

interface AppContextValue {
  properties: Property[];
  guests: Guest[];
  bookings: Booking[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  monthlyStats: MonthlyStats[];
  quickReplies: string[];
  totalUnread: number;
  sendMessage: (conversationId: string, text: string) => void;
  markConversationRead: (conversationId: string) => void;
  addGuest: (guest: Guest) => void;
  updateBookingStatus: (bookingId: string, status: Booking["status"]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [properties] = useState<Property[]>(PROPERTIES);
  const [guests, setGuests] = useState<Guest[]>(GUESTS);
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MESSAGES);
  const [quickReplies] = useState<string[]>(QUICK_REPLIES);

  useEffect(() => {
    loadPersistedMessages();
  }, []);

  const loadPersistedMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem("messages");
      if (stored) {
        setMessages(JSON.parse(stored));
      }
      const storedConvs = await AsyncStorage.getItem("conversations");
      if (storedConvs) {
        setConversations(JSON.parse(storedConvs));
      }
    } catch {
      // use defaults
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        bookingId: "",
        guestId: "",
        guestName: "",
        propertyId: "",
        direction: "outbound",
        text,
        timestamp: new Date().toISOString(),
        isRead: true,
        platform: "airbnb",
      };

      const updatedMessages = {
        ...messages,
        [conversationId]: [...(messages[conversationId] ?? []), newMsg],
      };
      setMessages(updatedMessages);
      await AsyncStorage.setItem("messages", JSON.stringify(updatedMessages));

      const updatedConvs = conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: text, lastMessageTime: newMsg.timestamp, unreadCount: 0 }
          : c
      );
      setConversations(updatedConvs);
      await AsyncStorage.setItem("conversations", JSON.stringify(updatedConvs));
    },
    [messages, conversations]
  );

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      const updatedConvs = conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      setConversations(updatedConvs);
      await AsyncStorage.setItem("conversations", JSON.stringify(updatedConvs));

      const updatedMessages = {
        ...messages,
        [conversationId]: (messages[conversationId] ?? []).map((m) => ({ ...m, isRead: true })),
      };
      setMessages(updatedMessages);
      await AsyncStorage.setItem("messages", JSON.stringify(updatedMessages));
    },
    [conversations, messages]
  );

  const addGuest = useCallback((guest: Guest) => {
    setGuests((prev) => [guest, ...prev]);
  }, []);

  const updateBookingStatus = useCallback(
    (bookingId: string, status: Booking["status"]) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        properties,
        guests,
        bookings,
        conversations,
        messages,
        monthlyStats: MONTHLY_STATS,
        quickReplies,
        totalUnread,
        sendMessage,
        markConversationRead,
        addGuest,
        updateBookingStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
