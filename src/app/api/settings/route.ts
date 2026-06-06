import { NextResponse } from "next/server";
import { getStoreSettings, publicSettings } from "@/lib/settings";

// Public, customer-safe store settings for the storefront client.
export async function GET() {
  const s = await getStoreSettings();
  return NextResponse.json(publicSettings(s));
}
