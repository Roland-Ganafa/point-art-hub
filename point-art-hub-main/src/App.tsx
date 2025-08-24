import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminProfile from "./pages/AdminProfile";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import CustomerManagement from "./pages/CustomerManagement";
import Reports from "./pages/Reports";
import InvoiceManagement from "./pages/InvoiceManagement";
import SalesAnalyticsDashboard from "./pages/SalesAnalyticsDashboard";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
            </BrowserRouter>
          </TooltipProvider>
        </SettingsProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
