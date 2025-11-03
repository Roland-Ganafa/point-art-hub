import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface AdminOnlyProps {
  children: React.ReactNode;
  showMessage?: boolean;
  message?: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

const AdminOnly = ({ 
  children, 
  showMessage = true,
  message = "This content is only available to administrators.",
  fallback,
  loadingComponent
}: AdminOnlyProps) => {
  const { isAdmin, loading } = useUser();

  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-muted-foreground">Checking permissions...</div>
      </div>
    );
  }

  // Handle non-admin access
  if (!isAdmin) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Hide completely if showMessage is false
    if (!showMessage) {
      return null;
    }
    
    // Show access denied alert
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <Shield className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          {message}
        </AlertDescription>
      </Alert>
    );
  }

  // User is admin, render children
  return <>{children}</>;
};

export default React.memo(AdminOnly);