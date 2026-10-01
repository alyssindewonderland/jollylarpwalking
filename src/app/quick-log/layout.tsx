import Link from "next/link";

export default function QuickLogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen safe-top safe-bottom safe-x">
      <div className="px-4 pt-2">
        <Link href="/home" className="text-muted text-xs inline-block py-0.5">
          ← Home
        </Link>
      </div>
      <main className="flex-1 px-4 pb-3 max-w-md mx-auto w-full flex flex-col min-h-0">{children}</main>
    </div>
  );
}
