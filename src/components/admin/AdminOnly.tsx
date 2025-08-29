import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface AdminOnlyProps {
  children: React.ReactNode;
  showMessage?: boolean;
  message?: string;
}

const AdminOnly = ({ 
  children, 
  showMessage = true,
  message = "This content is only available to administrators." 
}: AdminOnlyProps) => {
  const { isAdmin, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-muted-foreground">Checking permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    if (!showMessage) {
      return null;
    }
    
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

  return <>{children}</>;
};

export default AdminOnly;