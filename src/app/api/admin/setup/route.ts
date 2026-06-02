import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// One-time setup endpoint to create the first admin account.
// Protected by ADMIN_SETUP_SECRET env var — set it, use it once, then clear it.
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Setup is disabled (ADMIN_SETUP_SECRET not set)" }, { status: 403 });
  }

  const { setupSecret, name, email, password } = await req.json();

  if (setupSecret !== secret) {
    return NextResponse.json({ error: "Invalid setup secret" }, { status: 403 });
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Check if an admin already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "An admin account already exists. Use the admin panel to add more staff." }, { status: 409 });
  }

  // Create the account via Better Auth
  const result = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!result || result.user === null) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // Promote to admin
  await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.id, result.user.id));

  return NextResponse.json({
    success: true,
    message: `Admin account created for ${email}. You can now sign in at /admin/login.`,
  });
}
