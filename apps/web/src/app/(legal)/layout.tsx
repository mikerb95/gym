import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-16 md:pt-14">
      <Link href="/" className="heading text-2xl">
        {BRAND.name}
      </Link>
      <article className="legal mt-10">{children}</article>
    </div>
  );
}
