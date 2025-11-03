import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from "@/integrations/supabase/client";
import Logo from "./ui/Logo";
import { useToast } from "@/hooks/use-toast";

/**
 * DirectLogin component for bypassing session timeout issues
 * This component provides a streamlined login experience without session checks
 */
const DirectLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Fast Login: Attempting direct sign in with email:", email);
      
      // Use localStorage flag to track login attempts
      localStorage.setItem('auth_attempt_timestamp', Date.now().toString());
      
      // Clear any existing session data that might be causing conflicts
      try {
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession?.session) {
          console.log("Clearing existing session before fast login");
          await supabase.auth.signOut();
        }
      } catch (signOutError) {
        console.log("Error clearing existing session:", signOutError);
      }
      
      // Add a small delay to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Implement custom timeout handling for the login request
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), 12000)
      );
      
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      
      // Handle timeout
      if (result && result.error && result.error.message === 'LOGIN_TIMEOUT') {
        console.error("Fast Login timeout");
        setError("Login request timed out. Please check your connection and try again.");
        toast({
          title: "Fast Login timeout",
          description: "The login request took too long. Please check your internet connection and try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (result && result.error) {
        console.error("Fast Login error:", result.error);
        console.error("Error status:", result.error.status);
        console.error("Error message:", result.error.message);
        
        let errorMessage = result.error.message;
        if (result.error.status === 400) {
          errorMessage = 'Authentication failed. Please try clearing your browser cache and cookies, then try again.';
        }
        
        setError(errorMessage);
        toast({
          title: "Fast Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log("Fast Login successful");
        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
        });
        
        // Set auth method flag for future reference
        localStorage.setItem('auth_method', 'direct_login');
        
        // Force direct navigation to home page with hard reload
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      }
    } catch (error: any) {
      console.error("Fast Login exception:", error);
      
      // Handle timeout errors specifically
      if (error.message === 'LOGIN_TIMEOUT') {
        setError("Login request timed out. Please check your connection and try again.");
        toast({
          title: "Login timeout",
          description: "The login request took too long. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        const errorMessage = error.message || "An unexpected error occurred";
        setError(errorMessage);
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md border-2 border-blue-200 shadow-xl">
        <CardHeader className="text-center space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-blue-700">Fast Login</CardTitle>
            <CardDescription className="mt-2 text-blue-600">
              Streamlined authentication - bypasses session checks
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </div>
              ) : "Fast Secure Login"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 mb-2">How This Works:</h3>
            <p className="text-sm text-gray-600">
              This fast login method bypasses session timeout checks that can cause authentication errors.
              It establishes a direct connection to authenticate your credentials more reliably.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
          <Button variant="outline" onClick={handleCancel} className="border-blue-200 text-blue-700 hover:bg-blue-50">
            Back to Login
          </Button>
          <Button variant="ghost" onClick={() => window.location.reload()} className="text-blue-600 hover:bg-blue-50">
            Refresh Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DirectLogin;