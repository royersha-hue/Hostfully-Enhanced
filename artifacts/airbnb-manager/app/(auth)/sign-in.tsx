import React, { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSignIn } from "@clerk/expo";
import { AuthButton, AuthError, AuthForm, AuthInput } from "@/components/AuthForm";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const colors = useColors();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const busy = fetchStatus === "fetching";
  const needsCode = signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor";

  const finish = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setMessage("An additional account step is required to finish signing in.");
          return;
        }
        router.replace(decorateUrl("/") as "/");
      },
    });
  };

  const submit = async () => {
    setMessage(null);
    try {
      const { error } = await signIn.password({ emailAddress: emailAddress.trim(), password });
      if (error) {
        setMessage("Could not sign in. Check your details and try again.");
        return;
      }
      if (signIn.status === "complete") {
        await finish();
      } else if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
        if (signIn.supportedSecondFactors.some((factor) => factor.strategy === "email_code")) {
          await signIn.mfa.sendEmailCode();
        } else {
          setMessage("This account requires another verification method that is not available in the app.");
        }
      } else {
        setMessage("Sign-in needs an additional step. Please try again.");
      }
    } catch {
      setMessage("Sign-in could not be completed. Please try again.");
    }
  };

  const verify = async () => {
    setMessage(null);
    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code });
      if (error) return;
      if (signIn.status === "complete") await finish();
      else setMessage("Verification is not complete. Please try again.");
    } catch {
      setMessage("The code could not be verified.");
    }
  };

  if (needsCode) {
    return (
      <AuthForm title="Verify your account" subtitle="Enter the code sent to your email to continue.">
        <AuthInput label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" />
        <AuthError message={errors.fields.code?.message || message} />
        <AuthButton title="Verify and sign in" onPress={verify} disabled={busy || !code.trim()} />
        <AuthButton title="Send another code" secondary onPress={() => { void signIn.mfa.sendEmailCode(); }} disabled={busy} />
        <AuthButton title="Start over" secondary onPress={() => { void signIn.reset(); setCode(""); }} disabled={busy} />
      </AuthForm>
    );
  }

  return (
    <AuthForm title="Welcome back" subtitle="Sign in to manage your stays, guests, and messages.">
      <AuthInput label="Email address" value={emailAddress} onChangeText={setEmailAddress} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <AuthError message={errors.fields.identifier?.message} />
      <AuthInput label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
      <AuthError message={errors.fields.password?.message || message} />
      <AuthButton title={busy ? "Signing in…" : "Sign in"} onPress={submit} disabled={busy || !emailAddress.trim() || !password} />
      <View style={styles.divider}><Text style={{ color: colors.mutedForeground }}>or</Text></View>
      <GoogleSignIn />
      <View style={styles.footer}>
        <Text style={{ color: colors.mutedForeground }}>New to StayFlow? </Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable accessibilityRole="link"><Text style={[styles.link, { color: colors.primary }]}>Create an account</Text></Pressable>
        </Link>
      </View>
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  divider: { alignItems: "center", marginVertical: 2 },
  footer: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginTop: 6 },
  link: { fontFamily: "Inter_600SemiBold" },
});