import SessionProvider from "@/components/ui/SessionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
