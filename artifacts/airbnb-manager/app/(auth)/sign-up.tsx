import React, { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSignUp } from "@clerk/expo";
import { AuthButton, AuthError, AuthForm, AuthInput } from "@/components/AuthForm";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const colors = useColors();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const busy = fetchStatus === "fetching";
  const verifying = signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  const submit = async () => {
    setMessage(null);
    try {
      const { error } = await signUp.password({ emailAddress: emailAddress.trim(), password });
      if (error) {
        setMessage("Could not create the account. Please check your details.");
        return;
      }
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) setMessage("Could not send a verification code. Please try again.");
    } catch {
      setMessage("Could not create the account. Please try again.");
    }
  };

  const verify = async () => {
    setMessage(null);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) return;
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              setMessage("An additional account step is required to finish signing up.");
              return;
            }
            router.replace(decorateUrl("/") as "/");
          },
        });
      } else {
        setMessage("Verification is not complete yet. Please try again.");
      }
    } catch {
      setMessage("The code could not be verified.");
    }
  };

  if (verifying) {
    return (
      <AuthForm title="Check your inbox" subtitle={`We sent a verification code to ${emailAddress}.`}>
        <AuthInput label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" />
        <AuthError message={errors.fields.code?.message || message} />
        <AuthButton title="Verify email" onPress={verify} disabled={busy || !code.trim()} />
        <AuthButton title="Send another code" secondary onPress={() => { void signUp.verifications.sendEmailCode(); }} disabled={busy} />
      </AuthForm>
    );
  }

  return (
    <AuthForm title="Start hosting better" subtitle="Create your StayFlow account to get started.">
      <AuthInput label="Email address" value={emailAddress} onChangeText={setEmailAddress} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <AuthError message={errors.fields.emailAddress?.message} />
      <AuthInput label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <AuthError message={errors.fields.password?.message || message} />
      <AuthButton title={busy ? "Creating account…" : "Create account"} onPress={submit} disabled={busy || !emailAddress.trim() || !password} />
      <View style={styles.divider}><Text style={{ color: colors.mutedForeground }}>or</Text></View>
      <GoogleSignIn />
      <View style={styles.footer}>
        <Text style={{ color: colors.mutedForeground }}>Already have an account? </Text>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable accessibilityRole="link"><Text style={[styles.link, { color: colors.primary }]}>Sign in</Text></Pressable>
        </Link>
      </View>
      <View nativeID="clerk-captcha" />
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  divider: { alignItems: "center", marginVertical: 2 },
  footer: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginTop: 6 },
  link: { fontFamily: "Inter_600SemiBold" },
});