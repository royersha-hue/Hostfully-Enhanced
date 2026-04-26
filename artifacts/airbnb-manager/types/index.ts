export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | "checked_in";
export type MessageDirection = "inbound" | "outbound";
export type Platform = "airbnb" | "vrbo" | "booking" | "direct";

export interface Property {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  pricePerNight: number;
  cleaningFee: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  rating: number;
  totalReviews: number;
  isActive: boolean;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  nationality?: string;
  totalStays: number;
  totalSpent: number;
  rating?: number;
  notes?: string;
  platform: Platform;
  joinedDate: string;
}

export interface Booking {
  id: string;
  guestId: string;
  guest: Guest;
  propertyId: string;
  property: Property;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  platform: Platform;
  totalAmount: number;
  cleaningFee: number;
  platformFee: number;
  netRevenue: number;
  nights: number;
  adults: number;
  children: number;
  notes?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  propertyId: string;
  direction: MessageDirection;
  text: string;
  timestamp: string;
  isRead: boolean;
  platform: Platform;
}

export interface Conversation {
  id: string;
  guestId: string;
  guestName: string;
  guestAvatarUrl?: string;
  propertyId: string;
  propertyName: string;
  platform: Platform;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  bookingId?: string;
}

export interface AnalyticsPeriod {
  label: string;
  revenue: number;
  bookings: number;
  avgNightlyRate: number;
  occupancyRate: number;
}

export interface MonthlyStats {
  month: string;
  revenue: number;
  bookings: number;
}
