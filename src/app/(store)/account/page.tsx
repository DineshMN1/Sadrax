"use client";

import dynamic from "next/dynamic";

// `ssr: false` must live in a Client Component in Next.js App Router.
// This prevents Better Auth client hooks from running during SSR.
const AccountClient = dynamic(() => import("./account-client"), { ssr: false });

export default function AccountPage() {
  return <AccountClient />;
}
