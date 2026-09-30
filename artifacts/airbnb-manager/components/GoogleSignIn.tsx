import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { AuthButton, AuthError } from "@/components/AuthForm";

WebBrowser.maybeCompleteAuthSession();

export function GoogleSignIn() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  const startGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({ scheme: "airbnb-manager", path: "sso-callback" }),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              setError("Your account needs an additional step before sign-in can finish.");
              return;
            }
            router.replace(decorateUrl("/") as "/");
          },
        });
      } else {
        setError("Google sign-in could not finish. Please try email and password.");
      }
    } catch {
      setError("Google sign-in was cancelled or could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AuthButton title={busy ? "Connecting…" : "Continue with Google"} onPress={startGoogle} disabled={busy} secondary />
      <AuthError message={error} />
    </>
  );
}