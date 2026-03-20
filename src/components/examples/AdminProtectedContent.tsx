import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/UserContext';
import AdminOnly from '@/components/admin/AdminOnly';
import { Shield, Lock, Unlock } from 'lucide-react';

const AdminProtectedContent = () => {
  const { isAdmin } = useUser();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Protected Content Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This is an example of content that is only visible to administrators.
          </p>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="font-medium">Current Status:</span>
            {isAdmin ? (
              <span className="flex items-center gap-1 text-green-600">
                <Unlock className="h-4 w-4" />
                Admin Access Granted
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <Lock className="h-4 w-4" />
                Admin Access Denied
              </span>
            )}
          </div>

          {/* Protected Content */}
          <AdminOnly 
            message="You need administrator privileges to view this sensitive content."
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <h3 className="font-medium text-green-800 mb-2">Sensitive Admin Content</h3>
                <p className="text-green-700 mb-4">
                  This content is only visible to administrators and contains sensitive information 
                  that should not be accessible to regular users.
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>System Configuration</Label>
                    <Input placeholder="Enter configuration value" />
                  </div>
                  <div className="space-y-2">
                    <Label>Security Settings</Label>
                    <Input placeholder="Enter security parameter" />
                  </div>
                </div>
                
                <Button className="mt-4">Update System Settings</Button>
              </CardContent>
            </Card>
          </AdminOnly>

        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProtectedContent;