import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useUser } from "@/contexts/UserContext";

const Index = () => {
  const { user, profile, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
};

export default Index;