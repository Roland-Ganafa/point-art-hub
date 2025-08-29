import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = () => {
  return (
    <Layout>
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </Layout>
  );
};

export default Index;
