import { useSignUp } from "@clerk/clerk-expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";

import { FormInput } from "@/components/form-input";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { clerkErrorMessage } from "@/lib/clerk-error";
import { codeSchema, signUpSchema, type CodeForm, type SignUpForm } from "@/lib/schemas/auth";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  // Step 2 lives on this same screen so the sign-up attempt is never lost between screens.
  const [pendingCode, setPendingCode] = useState(false);
  const [email, setEmail] = useState("");
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });

  const { control, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async ({ name, email, password }: SignUpForm) => {
    if (!isLoaded) return;
    setApiError("");
    setLoading(true);
    try {
      const [firstName, ...rest] = name.split(" ");
      // 1. Create the user in Clerk
      await signUp.create({ emailAddress: email, password, firstName, lastName: rest.join(" ") || undefined });
      // 2. Ask Clerk to email a 6-digit code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      // 3. Show the code step on this screen
      setEmail(email);
      setPendingCode(true);
    } catch (err) {
      setApiError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async ({ code }: CodeForm) => {
    if (!isLoaded) return;
    setApiError("");
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        const missing = [...(result.missingFields ?? []), ...(result.unverifiedFields ?? [])];
        setApiError(`Sign-up not complete (${result.status}). Missing: ${missing.join(", ") || "unknown"}`);
      }
    } catch (err) {
      setApiError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
      setApiError("A new code has been sent.");
    } catch (err) {
      setApiError(clerkErrorMessage(err));
    }
  };

  if (pendingCode) {
    return (
      <Screen>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-center">
          <Text className="text-3xl font-bold text-ink">Check your email</Text>
          <Text className="mb-8 mt-1 text-base text-muted">We sent a 6-digit code to {email}.</Text>
          <Controller control={codeForm.control} name="code" render={({ field: { onChange, onBlur, value } }) => (
            <FormInput testID="verify-code" label="Code" placeholder="6-digit code" keyboardType="number-pad" maxLength={6} value={value} onChangeText={onChange} onBlur={onBlur} error={codeForm.formState.errors.code?.message} />
          )} />
          {apiError ? <Text testID="verify-error" className="mb-2 text-sm text-red-500">{apiError}</Text> : null}
          <PrimaryButton testID="verify-submit" title="Verify" loading={loading} onPress={codeForm.handleSubmit(onVerify)} />
          <PrimaryButton testID="verify-resend" title="Resend code" variant="outline" onPress={resend} />
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="flex-grow justify-center py-10">
          <Text className="text-3xl font-bold text-ink">Create account</Text>
          <Text className="mb-8 mt-1 text-base text-muted">Start your gratitude journal.</Text>

          <Controller control={control} name="name" render={({ field: { onChange, onBlur, value } }) => (
            <FormInput testID="signup-name" label="Name" placeholder="Your name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
          )} />
          <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
            <FormInput testID="signup-email" label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} />
          )} />
          <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
            <FormInput testID="signup-password" label="Password" placeholder="At least 8 characters" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} />
          )} />

          {apiError ? <Text testID="signup-error" className="mb-2 text-sm text-red-500">{apiError}</Text> : null}

          <PrimaryButton testID="signup-submit" title="Sign up" loading={loading} onPress={handleSubmit(onSubmit)} />

          <Text className="mt-6 text-center text-muted">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-accent">Sign in</Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
