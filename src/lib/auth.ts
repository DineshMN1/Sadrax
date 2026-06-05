import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber, emailOTP } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendOtp } from "@/lib/msg91";
import { sendOtpEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendOtp(phoneNumber, code);
      },
      otpLength: 6,
      expiresIn: 300,
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        // Look up name so the email can say "Hi Dinesh" instead of "Hi there"
        const user = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, email),
          columns: { name: true },
        });
        await sendOtpEmail(email, otp, user?.name ?? undefined);
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh if older than 1 day
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      phoneVerified: { type: "boolean", required: false, defaultValue: false },
      role: { type: "string", required: false, defaultValue: "customer" },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
