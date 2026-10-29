import { AppNav } from "@/components/app-nav";
import { OfflineBanner } from "@/components/offline-banner";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="md:pl-60">
      <AppNav />
      <OfflineBanner />
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-12">{children}</main>
    </div>
  );
}
