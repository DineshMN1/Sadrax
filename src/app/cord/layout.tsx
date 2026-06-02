// Minimal wrapper — login page is unprotected here.
// Auth protection lives in cord/(protected)/layout.tsx.
export default function CordRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
