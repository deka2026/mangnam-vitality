import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) redirect("/login");
  return (
    <div className="min-h-screen">
      <AdminNav />
      <div className="lg:pl-64">
        <main className="container-page py-8">{children}</main>
      </div>
    </div>
  );
}
