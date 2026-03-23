import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import AIControlCenter from "@/components/admin/panel7-ai-control/AIControlCenter";
import SystemStatusPanel from "@/components/admin/panel1-system/SystemStatusPanel";
import UsersTeamsPanel from "@/components/admin/panel2-users/UsersTeamsPanel";
import AIEnginePanel from "@/components/admin/panel3-ai-engine/AIEnginePanel";
import ContentAuditPanel from "@/components/admin/panel4-content/ContentAuditPanel";
import LeadsROIPanel from "@/components/admin/panel5-leads/LeadsROIPanel";
import AlertsLogsPanel from "@/components/admin/panel6-logs/AlertsLogsPanel";

const PANELS: Record<string, React.FC> = {
  p1: SystemStatusPanel,
  p2: UsersTeamsPanel,
  p3: AIEnginePanel,
  p4: ContentAuditPanel,
  p5: LeadsROIPanel,
  p6: AlertsLogsPanel,
  p7: AIControlCenter,
};

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminLayout>
        {({ activeTab }) => {
          const Panel = PANELS[activeTab] || AIControlCenter;
          return <Panel />;
        }}
      </AdminLayout>
    </AdminGuard>
  );
}
