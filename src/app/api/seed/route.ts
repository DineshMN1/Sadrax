import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();

  // Verify secret
  if (secret !== process.env.ADMIN_SETUP_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    const results = [];

    // ─── Create Admin Account ─────────────────────────────────────────
    const adminEmail = "admin@sadrax.in";
    const adminPassword = "Admin@123456";

    // Check if admin exists
    let adminId: string;
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (existingAdmin) {
      adminId = existingAdmin.id;
      // Update password for existing admin
      const adminHashedPassword = await bcrypt.hash(adminPassword, 12);
      await db
        .update(accounts)
        .set({ password: adminHashedPassword, updatedAt: new Date() })
        .where(eq(accounts.userId, adminId));
    } else {
      // Create new admin
      adminId = crypto.randomUUID();
      await db.insert(users).values({
        id: adminId,
        email: adminEmail,
        name: "Admin",
        emailVerified: true,
        role: "admin",
        createdAt: new Date(),
      });

      // Create admin account with password
      const adminHashedPassword = await bcrypt.hash(adminPassword, 12);
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: adminId,
        providerId: "credential",
        userId: adminId,
        password: adminHashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    results.push({
      type: "admin",
      email: adminEmail,
      password: adminPassword,
      status: "✓ Created",
    });

    // ─── Create Cord (Staff) Account ──────────────────────────────────
    const staffEmail = "staff@sadrax.in";
    const staffPassword = "Staff@123456";

    // Check if staff exists
    let staffId: string;
    const existingStaff = await db.query.users.findFirst({
      where: eq(users.email, staffEmail),
    });

    if (existingStaff) {
      staffId = existingStaff.id;
      // Update password for existing staff
      const staffHashedPassword = await bcrypt.hash(staffPassword, 12);
      await db
        .update(accounts)
        .set({ password: staffHashedPassword, updatedAt: new Date() })
        .where(eq(accounts.userId, staffId));
    } else {
      // Create new staff
      staffId = crypto.randomUUID();
      await db.insert(users).values({
        id: staffId,
        email: staffEmail,
        name: "Delivery Staff",
        emailVerified: true,
        role: "staff",
        createdAt: new Date(),
      });

      // Create staff account with password
      const staffHashedPassword = await bcrypt.hash(staffPassword, 12);
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: staffId,
        providerId: "credential",
        userId: staffId,
        password: staffHashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    results.push({
      type: "staff",
      email: staffEmail,
      password: staffPassword,
      status: "✓ Created",
    });

    return NextResponse.json({
      message: "Accounts seeded successfully",
      accounts: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
