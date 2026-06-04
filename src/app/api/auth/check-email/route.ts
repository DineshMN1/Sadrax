import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ exists: false });

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.trim().toLowerCase()),
    columns: { id: true },
  });

  return NextResponse.json({ exists: !!user });
}
