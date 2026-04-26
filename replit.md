# StayFlow – Airbnb Property Manager

## Overview

A full-featured mobile app for Airbnb / short-term rental hosts. Built with Expo + React Native. Uses AsyncStorage for persistence (no backend required on first build).

## App Name

**StayFlow**

## Features

- **Dashboard** — revenue overview, upcoming stays, unread message alerts, 6-month bar chart
- **Messages** — searchable conversation list with unread badges, quick-reply templates, real-time send
- **Calendar** — monthly calendar view with booking dots, tap to see who's staying, full upcoming list
- **Guests** — searchable guest CRM, add new guests, view stay history & spending
- **Analytics** — revenue by period, platform breakdown, per-property performance bars

## Stack

- **Framework**: Expo (React Native) with Expo Router file-based routing
- **State**: React Context + AsyncStorage
- **Fonts**: Inter (400/500/600/700) via @expo-google-fonts/inter
- **Icons**: @expo/vector-icons (Feather)
- **Styling**: StyleSheet with semantic design tokens in constants/colors.ts
- **Color palette**: warm cream (#f7f6f3), coral primary (#e8735a), navy accent (#2d4a6e)

## Key Files

- `app/_layout.tsx` — root layout, providers
- `app/(tabs)/_layout.tsx` — 5-tab nav (Dashboard, Messages, Calendar, Guests, Analytics)
- `context/AppContext.tsx` — global state, AsyncStorage persistence
- `data/mockData.ts` — seed data (properties, guests, bookings, conversations, messages)
- `types/index.ts` — shared TypeScript types
- `constants/colors.ts` — design tokens

## Screens

- `app/(tabs)/index.tsx` — Dashboard
- `app/(tabs)/messages.tsx` — Message inbox
- `app/(tabs)/calendar.tsx` — Booking calendar
- `app/(tabs)/guests.tsx` — Guest CRM
- `app/(tabs)/analytics.tsx` — Analytics
- `app/conversation/[id].tsx` — Chat thread with quick-reply support
- `app/booking/[id].tsx` — Booking detail + actions (check-in, check-out, cancel)
- `app/guest/[id].tsx` — Guest profile + history

## Monorepo

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server artifact, not used by mobile app)
- **Database**: PostgreSQL + Drizzle ORM (not used by mobile app)
