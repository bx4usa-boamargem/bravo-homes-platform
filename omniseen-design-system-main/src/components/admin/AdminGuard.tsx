import { useAdminGuard } from "@/hooks/admin/useAdminGuard";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminGuard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0e1a" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#00d4ff" }} />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
