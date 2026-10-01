import { isAdminSession } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const loggedIn = await isAdminSession();
  return (
    <div className="min-h-screen safe-top safe-bottom safe-x px-4 py-8 max-w-2xl mx-auto w-full">
      {loggedIn ? <AdminDashboard /> : <AdminLogin />}
    </div>
  );
}
