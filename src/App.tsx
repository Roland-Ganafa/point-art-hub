import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import OfflineIndicator from "@/components/OfflineIndicator";

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const AdminProfile = lazy(() => import("@/pages/AdminProfile"));
const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));
const CustomerManagement = lazy(() => import("@/pages/CustomerManagement"));
const Reports = lazy(() => import("@/pages/Reports"));
const InvoiceManagement = lazy(() => import("@/pages/InvoiceManagement"));
const SalesAnalyticsDashboard = lazy(() => import("@/pages/SalesAnalyticsDashboard"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Loading component for Suspense
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <BrowserRouter>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin" element={<AdminProfile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/customers" element={<CustomerManagement />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/analytics" element={<SalesAnalyticsDashboard />} />
                  <Route path="/invoices" element={<InvoiceManagement />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </SettingsProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;