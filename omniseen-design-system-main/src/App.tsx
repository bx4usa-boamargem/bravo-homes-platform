import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ClientLayout from "@/components/ClientLayout";
import Dashboard from "@/pages/Dashboard";
import ArticlesList from "@/pages/ArticlesList";
import ArticleGenerator from "@/pages/ArticleGenerator";
import BulkGenerationPage from "@/pages/BulkGenerationPage";
import ArticleEditor from "@/pages/ArticleEditor";
import ArticlePreview from "@/pages/ArticlePreview";
import RadarPage from "@/pages/RadarPage";
import AutomationPage from "@/pages/AutomationPage";
import DomainsPage from "@/pages/DomainsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import LeadsPage from "@/pages/LeadsPage";
import SettingsPage from "@/pages/SettingsPage";
import ConsumptionPage from "@/pages/ConsumptionPage";
import BrandSettingsPage from "@/pages/BrandSettingsPage";
import LandingPagesPage from "@/pages/LandingPagesPage";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PublicBlog from "@/pages/PublicBlog";
import PublicArticle from "@/pages/PublicArticle";
import PublicLandingPage from "@/pages/PublicLandingPage";
import SuperPagePublicView from "@/pages/SuperPagePublicView";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";
import { getSubdomain } from "@/utils/subdomain";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const BlogRoutes = () => {
  const subdomain = getSubdomain();

  if (subdomain) {
    return (
      <Routes>
        <Route path="/" element={<PublicBlog />} />
        <Route path="/:articleSlug" element={<PublicArticle />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/:blogSlug" element={<PublicBlog />} />
      <Route path="/:blogSlug/:articleSlug" element={<PublicArticle />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/client/*" element={
              <ProtectedRoute>
                <ClientLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="articles" element={<ArticlesList />} />
                    <Route path="articles/new" element={<ArticleGenerator />} />
                    <Route path="articles/bulk" element={<BulkGenerationPage />} />
                    <Route path="articles/:id" element={<ArticleEditor />} />
                    <Route path="articles/:id/preview" element={<ArticlePreview />} />
                    <Route path="radar" element={<RadarPage />} />
                    <Route path="automation" element={<AutomationPage />} />
                    <Route path="landing-pages" element={<LandingPagesPage />} />
                    <Route path="domains" element={<DomainsPage />} />
                    <Route path="integrations" element={<IntegrationsPage />} />
                    <Route path="leads" element={<LeadsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="consumption" element={<ConsumptionPage />} />
                    <Route path="brand" element={<BrandSettingsPage />} />
                  </Routes>
                </ClientLayout>
              </ProtectedRoute>
            } />
            <Route path="/blog/*" element={<BlogRoutes />} />
            <Route path="/p/:pageSlug" element={<PublicLandingPage />} />
            <Route path="/sp/:slug" element={<SuperPagePublicView />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
