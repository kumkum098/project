import { ReactNode } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
        <header className="sticky top-0 z-20 w-full border-b border-hairline bg-canvas/95 backdrop-blur">
          <TopNavigation />
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
