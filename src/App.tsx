import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import DirectLogin from './components/DirectLogin';
import NotFound from './pages/NotFound';
import './App.css';

// Import pages
import Index from './pages/Index';
import Profile from './pages/Profile';
import AdminProfile from './pages/AdminProfile';
import CustomerManagement from './pages/CustomerManagement';
import Reports from './pages/Reports';
import SalesAnalyticsDashboard from './pages/SalesAnalyticsDashboard';
import NotificationsPage from './pages/NotificationsPage';
import HelpCenter from './pages/HelpCenter';
import InvoiceManagement from './pages/InvoiceManagement';
import Settings from './pages/Settings';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <UserProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/direct-login" element={<DirectLogin />} />
                <Route
                  path="/"
                  element={
                    <Layout>
                      <Index />
                    </Layout>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <Layout>
                      <Profile />
                    </Layout>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <Layout>
                      <AdminProfile />
                    </Layout>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <Layout>
                      <CustomerManagement />
                    </Layout>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <Layout>
                      <Reports />
                    </Layout>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <Layout>
                      <SalesAnalyticsDashboard />
                    </Layout>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <Layout>
                      <NotificationsPage />
                    </Layout>
                  }
                />
                <Route
                  path="/help"
                  element={
                    <Layout>
                      <HelpCenter />
                    </Layout>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <Layout>
                      <InvoiceManagement />
                    </Layout>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Layout>
                      <Settings />
                    </Layout>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </UserProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;