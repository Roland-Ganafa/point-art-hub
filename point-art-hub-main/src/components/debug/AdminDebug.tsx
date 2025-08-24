import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, User, AlertTriangle } from 'lucide-react';

const AdminDebug = () => {
  const { user, profile, isAdmin, loading } = useUser();

  if (loading) {
    return (
      <Card className="max-w-md mx-auto mt-4">
        <CardContent className="pt-6">
          <p>Loading admin status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-4 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Admin Status Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p><strong>User Email:</strong> {user?.email || 'Not logged in'}</p>
          <p><strong>Profile Name:</strong> {profile?.full_name || 'No profile'}</p>
          <p><strong>User Role:</strong> 
            <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'} className="ml-2">
              {profile?.role || 'No role'}
            </Badge>
          </p>
          <p><strong>Is Admin:</strong> 
            <Badge variant={isAdmin ? 'default' : 'destructive'} className="ml-2">
              {isAdmin ? 'YES' : 'NO'}
            </Badge>
          </p>
        </div>

        <div className={`p-4 rounded-lg ${isAdmin ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isAdmin ? (
              <Shield className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <strong className={isAdmin ? 'text-green-800' : 'text-red-800'}>
              {isAdmin ? 'Admin Access Granted' : 'Admin Access Denied'}
            </strong>
          </div>
          <p className={`text-sm ${isAdmin ? 'text-green-700' : 'text-red-700'}`}>
            {isAdmin 
              ? 'You should be able to edit and delete items in all modules.'
              : 'You can only add items. Edit/delete buttons will show lock icons.'
            }
          </p>
        </div>

        {!isAdmin && profile?.role !== 'admin' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-yellow-600" />
              <strong className="text-yellow-800">Need Admin Access?</strong>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Your role is currently "{profile?.role || 'unassigned'}". To get admin access:
            </p>
            <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Contact an existing admin to change your role</li>
              <li>Or use the browser console diagnostic script</li>
              <li>Refresh the page after role changes</li>
            </ol>
          </div>
        )}

        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="w-full"
        >
          Refresh Page
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminDebug;