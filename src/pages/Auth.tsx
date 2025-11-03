import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/Logo";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug env variables
  useEffect(() => {
    console.log("Checking Supabase environment variables:");
    console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL ? "SET" : "NOT SET");
    console.log("VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "NOT SET");
  }, []);

  useEffect(() => {
    // Prevent infinite loops by checking if we're already on the auth page
    const currentPath = window.location.pathname;
    
    // Skip auth check if we're already on auth-related pages
    if (currentPath === '/auth' || currentPath === '/direct-login' || currentPath === '/bypass-auth') {
      setInitialLoad(false);
      return;
    }

    const checkUser = async () => {
      setAuthError(null);
      
      try {
        console.log("Checking authentication status...");
        
        // Add an AbortController for better timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const { data, error } = await supabase.auth.getSession();
          clearTimeout(timeoutId);
          
          if (error) {
            console.error("Auth error:", error);
            if (!error.message.includes('timeout')) {
              setAuthError(`Authentication error: ${error.message}`);
            }
          } else if (data?.session) {
            console.log("User is authenticated, redirecting to home");
            // Only navigate if we're not already heading there
            if (currentPath !== '/') {
              navigate("/", { replace: true });
            }
          } else {
            console.log("No active session found - displaying login form");
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            console.log("Session check timed out, showing login form");
          } else {
            console.warn('Session check failed:', error);
            if (!error.message?.includes('timeout')) {
              setAuthError(`Unable to connect to authentication service. Please try again.`);
            }
          }
        }
      } catch (error: any) {
        console.error("Unexpected error during auth check:", error);
      } finally {
        setInitialLoad(false);
      }
    };
    
    checkUser();
  }, [navigate]);

  // Loading state
  if (initialLoad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-lg mb-4">Checking authentication status...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Display auth errors if any
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-500 mb-4">Authentication Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {authError.includes("timeout") 
            ? "Connection to authentication service timed out. This could be due to network issues or service unavailability." 
            : authError}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/bypass-auth')} 
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              Enter Development Mode
            </Button>
            <Button 
              onClick={() => navigate('/direct-login')} 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            >
              Use Fast Login Method
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setAuthError(null);
                setInitialLoad(false);
              }} 
              className="w-full"
            >
              Try Standard Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            If you continue experiencing issues, try:
            <ul className="list-disc list-inside mt-2 text-left">
              <li>Using a different browser</li>
              <li>Clearing your browser cache</li>
              <li>Disabling browser extensions</li>
              <li>Checking your internet connection</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      console.log("Attempting to sign up with email:", email);
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/` 
        : 'https://point-art-hub.vercel.app/';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("Sign-up error:", error);
          setAuthError(`Sign-up failed: ${error.message}`);
          toast({
            title: "Error signing up",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log("Sign-up successful:", data);
          toast({
            title: "Success!",
            description: `Thank you ${fullName}! Please check your email to confirm your account.`,
          });
          // Clear form after successful signup
          setEmail("");
          setPassword("");
          setFullName("");
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          setAuthError('Sign-up timeout - please try again');
          toast({
            title: "Sign-up timeout",
            description: "The request took too long. Please try again.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Sign-up exception:", error);
      setAuthError(`Sign-up exception: ${error.message}`);
      toast({
        title: "Sign-up failed",
        description: error.message || "Connection timeout. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      console.log("Attempting to sign in with email:", email);
      
      // Store login attempt info
      localStorage.setItem('auth_attempt_timestamp', Date.now().toString());
      localStorage.setItem('auth_method', 'standard_login');
      
      // Clear any existing session data that might be causing conflicts
      try {
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession?.session) {
          console.log("Clearing existing session before login");
          await supabase.auth.signOut();
        }
      } catch (signOutError) {
        console.log("Error clearing existing session:", signOutError);
      }
      
      // Add a small delay to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      try {
        // Log the exact request being made for debugging
        console.log("Making authentication request with:", {
          email: email,
          passwordLength: password.length,
          timestamp: new Date().toISOString()
        });
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("Sign-in error:", error);
          console.error("Error status:", error.status);
          console.error("Error message:", error.message);
          
          // More specific error handling
          let errorMessage = error.message;
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (error.status === 400) {
            errorMessage = 'Authentication request failed. This might be due to a temporary network issue or browser cache. Please try clearing your browser cache and cookies, then try again.';
          }
          setAuthError(`Sign-in failed: ${errorMessage}`);
          toast({
            title: "Error signing in",
            description: errorMessage,
            variant: "destructive",
          });
        } else if (data?.session) {
          console.log("Sign-in successful:", data);
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          
          // Use replace to prevent back button issues
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 300);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          setAuthError('Sign-in timeout - please try the Fast Login method instead');
          toast({
            title: "Sign-in timeout",
            description: "Connection timed out. Please try the Fast Login method instead.",
            variant: "destructive",
          });
        } else {
          // More detailed error message
          const errorMessage = error.message || "Connection timeout. Please check your internet connection and try again.";
          setAuthError(`Sign-in failed: ${errorMessage}`);
          toast({
            title: "Sign-in failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Sign-in exception:", error);
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      setAuthError(`Sign-in failed: ${errorMessage}`);
      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md mb-4">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to Point Art Solutions</CardTitle>
            <CardDescription className="mt-2">
              Inventory & Service Management System
            </CardDescription>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Having Login Issues?</h3>
            <Button 
              onClick={() => navigate('/direct-login')} 
              className="w-full mt-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            >
              Try Fast Login Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : "Sign In"}
                </Button>
                
                <div className="pt-3 text-center">
                  <p className="text-sm text-gray-500 mb-2">Having connection issues?</p>
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => navigate('/direct-login')} 
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    disabled={loading}
                  >
                    Try Fast Login Method
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Diagnostics Section */}
      <div className="w-full max-w-md">
        <details className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <summary className="px-4 py-2 cursor-pointer text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Having trouble logging in? Click here for diagnostics
          </summary>
          <div className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div className="mb-2">If you're having trouble with login/signup:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check that cookies and local storage are enabled in your browser</li>
                <li>Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Try clearing your browser cache and cookies</li>
                <li>Disable any ad blockers or privacy extensions</li>
                <li>Try using the Fast Login method above</li>
              </ol>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  const diagnostics = {
                    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Missing',
                    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
                    localStorage: typeof Storage !== 'undefined' ? 'Available' : 'Not Available',
                    cookies: navigator.cookieEnabled ? 'Enabled' : 'Disabled',
                    browser: navigator.userAgent,
                    timestamp: new Date().toISOString()
                  };
                  
                  console.log('Diagnostics:', diagnostics);
                  alert(`Diagnostics Results:\n\n${JSON.stringify(diagnostics, null, 2)}`);
                }}
              >
                Run Diagnostics
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  alert('Cache cleared! Please refresh the page.');
                }}
              >
                Clear Local Cache
              </Button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default Auth;