import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";

/**
 * BypassAuth component provides a way to enter the application
 * without authentication for development purposes
 */
const BypassAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleBypass = () => {
    setLoading(true);
    
    try {
      // Set the bypass flag in local storage
      localStorage.setItem('mock_auth_active', 'true');
      // Set a mock admin user
      localStorage.setItem('mock_user', JSON.stringify({
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'admin',
        name: 'Development User',
        initials: 'DEV'
      }));
      
      toast({
        title: "Development mode activated",
        description: "You are now using the application with a mock admin user",
      });
      
      // Redirect to home page
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error activating development mode",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-purple-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Point Art Hub</CardTitle>
            <CardDescription className="mt-2">
              Development Mode Access
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-300 bg-amber-50 text-amber-800">
            <AlertTitle>Development Mode Only</AlertTitle>
            <AlertDescription>
              This option bypasses authentication and should only be used for development 
              and testing purposes. All data operations will be performed using mock data.
            </AlertDescription>
          </Alert>
          
          <p className="text-sm text-gray-600">
            Use this option when you need to work on the application UI and 
            functionality but are experiencing issues with the backend connection.
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleBypass} 
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 transition-all"
              disabled={loading}
            >
              {loading ? 'Activating...' : 'Enter Development Mode'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="text-sm"
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BypassAuth;