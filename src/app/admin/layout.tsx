import { Toaster } from "sonner";

// Minimal root wrapper for /admin — login page lives here unprotected.
// Auth protection lives in /admin/(protected)/layout.tsx.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
