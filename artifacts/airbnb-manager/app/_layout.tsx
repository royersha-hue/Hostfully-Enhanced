import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function RootLayoutNav() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(isSignedIn ? () => getToken() : null);
    if (!isSignedIn) queryClient.clear();
    return () => setAuthTokenGetter(null);
  }, [getToken, isSignedIn]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="guest/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="conversation/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="subscription" options={{ presentation: "card" }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

function AuthenticatedApp() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  ) : (
    <RootLayoutNav />
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (!publishableKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
            <ClerkLoaded>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <AuthenticatedApp />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </ClerkLoaded>
          </ClerkProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
