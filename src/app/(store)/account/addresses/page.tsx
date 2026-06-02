"use client";

import dynamic from "next/dynamic";
const AddressesClient = dynamic(() => import("./addresses-client"), { ssr: false });

export default function AddressesPage() {
  return <AddressesClient />;
}
