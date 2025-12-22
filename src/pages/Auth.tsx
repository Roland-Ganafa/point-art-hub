import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/Logo";
import { ArrowRight } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const currentPath = window.location.pathname;

    if (currentPath === '/auth' || currentPath === '/direct-login' || currentPath === '/bypass-auth') {
      setInitialLoad(false);
      return;
    }

    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session && currentPath !== '/') {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setInitialLoad(false);
      }
    };

    checkUser();
  }, [navigate]);

  if (initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setSignupEmail(email);
        setShowEmailConfirmation(true);
        toast({ title: "Success!", description: "Check your email to confirm.", duration: 7000 });
        setEmail("");
        setPassword("");
        setFullName("");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (data?.session) {
        toast({ title: "Welcome back!", description: "Signed in successfully." });
        setTimeout(() => navigate("/", { replace: true }), 300);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Email Confirmation Modal */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h3>
              <p className="text-gray-600 mb-6">
                We sent a confirmation link to <strong>{signupEmail}</strong>
              </p>
              <Button onClick={() => setShowEmailConfirmation(false)} className="w-full">
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="min-h-screen flex bg-gray-50">
        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 bg-white shadow-sm">

          {/* Left Panel - Login Form */}
          <div className="flex flex-col justify-between p-8 lg:p-12">
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
              {/* Logo */}
              <div className="mb-8">
                <Logo size="md" />
              </div>

              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isSignUp ? "Create account" : "Welcome back"}
                </h1>
                <p className="text-gray-600">
                  {isSignUp ? "Start managing your business" : "Sign in to continue to platform"}
                </p>
              </div>

              {/* Social Login Buttons (Sign In Only) */}
              {!isSignUp && (
                <div className="mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-gray-300 hover:bg-gray-50"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              )}

              {/* Divider */}
              {!isSignUp && (
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                  </div>
                </div>
              )}

              {/* Email & Password Form */}
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                {!isSignUp && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/direct-login')}
                      className="text-sm text-gray-700 hover:text-gray-900 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>{isSignUp ? "Creating..." : "Signing in..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{isSignUp ? "Create account" : "Sign in"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Toggle Sign In/Up */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setEmail("");
                      setPassword("");
                      setFullName("");
                    }}
                    disabled={loading}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                © 2025 Point Art Solutions • <a href="#" className="hover:underline">Terms of Service</a> • <a href="#" className="hover:underline">Privacy</a>
              </p>
            </div>
          </div>

          {/* Right Panel - Marketing Content */}
          <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-gray-50 to-purple-50 p-12">
            <div className="max-w-lg mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Designed for the Frontlines of Business Management
              </h2>

              <p className="text-lg text-gray-700 mb-12 leading-relaxed">
                Point Art Solutions is the comprehensive business management platform designed specifically for entrepreneurs, small businesses, and service providers.
              </p>

              {/* Testimonial */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
                <p className="text-gray-700 mb-4 italic">
                  "Using Point Art Hub has been a game changer for me! The platform is intuitive and has helped streamline my workflow significantly. I love connecting with other professionals who share their insights and tips!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-gray-900">Nyakoojo DeoPaul.</p>
                    <p className="text-sm text-gray-500">Kireka, Wakiso</p>
                  </div>
                </div>
              </div>

              {/* Design Credit */}
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/magamutu-logo.png"
                  alt="Magamutu Company"
                  className="w-8 h-8 rounded-full"
                />
                <p className="text-sm text-gray-500">
                  Designed by{' '}
                  <a
                    href="https://magamutu.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-700 hover:text-gray-900 hover:underline transition-colors"
                  >
                    Magamutu Company
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;