import { useSignIn } from "@clerk/clerk-expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";

import { FormInput } from "@/components/form-input";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { clerkErrorMessage } from "@/lib/clerk-error";
import { codeSchema, signInSchema, type CodeForm, type SignInForm } from "@/lib/schemas/auth";

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  // Clerk may ask for an extra email code (new device / 2FA). Then we show a code step.
  const [needsCode, setNeedsCode] = useState(false);

  const form = useForm<SignInForm>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });

  const finish = async (sessionId: string | null) => {
    await setActive!({ session: sessionId });
    router.replace("/");
  };

  const onSignIn = async ({ email, password }: SignInForm) => {
    if (!isLoaded) return;
    setApiError("");
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await finish(result.createdSessionId);
      } else if (result.status === "needs_second_factor" || (result.status as string) === "needs_client_trust") {
        await signIn.prepareSecondFactor({ strategy: "email_code" });
        setNeedsCode(true);
      } else {
        setApiError(`Sign-in needs another step (${result.status}).`);
      }
    } catch (err) {
      setApiError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onCode = async ({ code }: CodeForm) => {
    if (!isLoaded) return;
    setApiError("");
    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({ strategy: "email_code", code });
      if (result.status === "complete") await finish(result.createdSessionId);
      else setApiError("Code not accepted. Please try again.");
    } catch (err) {
      setApiError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="flex-grow justify-center py-10">
          <Text className="text-3xl font-bold text-ink">{needsCode ? "Check your email" : "Welcome back"}</Text>
          <Text className="mb-8 mt-1 text-base text-muted">
            {needsCode ? "Enter the 6-digit code we emailed you." : "Sign in to your journal."}
          </Text>

          {needsCode ? (
            <>
              <Controller control={codeForm.control} name="code" render={({ field: { onChange, onBlur, value } }) => (
                <FormInput testID="signin-code" label="Code" placeholder="123456" keyboardType="number-pad" maxLength={6} value={value} onChangeText={onChange} onBlur={onBlur} error={codeForm.formState.errors.code?.message} />
              )} />
              {apiError ? <Text testID="signin-error" className="mb-2 text-sm text-red-500">{apiError}</Text> : null}
              <PrimaryButton testID="signin-code-submit" title="Verify" loading={loading} onPress={codeForm.handleSubmit(onCode)} />
            </>
          ) : (
            <>
              <Controller control={form.control} name="email" render={({ field: { onChange, onBlur, value } }) => (
                <FormInput testID="signin-email" label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.email?.message} />
              )} />
              <Controller control={form.control} name="password" render={({ field: { onChange, onBlur, value } }) => (
                <FormInput testID="signin-password" label="Password" placeholder="Your password" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={form.formState.errors.password?.message} />
              )} />
              {apiError ? <Text testID="signin-error" className="mb-2 text-sm text-red-500">{apiError}</Text> : null}
              <PrimaryButton testID="signin-submit" title="Sign in" loading={loading} onPress={form.handleSubmit(onSignIn)} />
              <Text className="mt-6 text-center text-muted">
                New here?{" "}
                <Link href="/sign-up" className="font-semibold text-accent">Create an account</Link>
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
