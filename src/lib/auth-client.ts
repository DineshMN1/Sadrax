"use client";

import { createAuthClient } from "better-auth/react";
import { phoneNumberClient, emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [phoneNumberClient(), emailOTPClient()],
});

export const { useSession, signIn, signOut, signUp } = authClient;
