import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import CustomLoader from "@/components/ui/CustomLoader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Package, TrendingUp, BarChart3, Shield } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const currentPath = window.location.pathname;
    if (currentPath === '/auth' || currentPath === '/direct-login' || currentPath === '/bypass-auth') {
      setIsLoading(false);
      return;
    }
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session && currentPath !== '/') navigate("/", { replace: true });
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CustomLoader size="lg" />
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setSignupEmail(email);
        setShowEmailConfirmation(true);
        toast({ title: "Success!", description: "Check your email to confirm.", duration: 7000 });
        setEmail(""); setPassword(""); setFullName("");
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

  const features = [
    { icon: Package, label: "Inventory Management", desc: "Track stock across all departments" },
    { icon: TrendingUp, label: "Sales Analytics", desc: "Real-time revenue & profit insights" },
    { icon: BarChart3, label: "Daily Reports", desc: "Export detailed business reports" },
    { icon: Shield, label: "Role-Based Access", desc: "Admin & worker permission control" },
  ];

  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
        .animate-gradient { animation: gradient-shift 6s ease infinite; background-size: 200% 200%; }
        .animate-slide-up { animation: slide-up 0.6s ease forwards; }
        .animate-slide-in-left { animation: slide-in-left 0.7s ease forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.7s ease forwards; }
        .form-input:focus { box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15); border-color: #ec4899; outline: none; }
        .btn-primary {
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #be185d, #7c3aed);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .btn-primary:hover::before { opacity: 1; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4); }
        .btn-primary:active { transform: translateY(0px); }
        .feature-card {
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.12) !important;
          transform: translateX(4px);
          border-color: rgba(236,72,153,0.3);
        }
        .input-group { position: relative; }
        .input-group label {
          transition: all 0.2s ease;
        }
        .toggle-link {
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }
        .panel-orb {
          filter: blur(60px);
          mix-blend-mode: screen;
        }
        .google-btn {
          transition: all 0.2s ease;
          border: 1.5px solid #e5e7eb;
        }
        .google-btn:hover {
          border-color: #d1d5db;
          background: #f9fafb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Email Confirmation Modal */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full" style={{ animation: 'pulse-ring 1.5s ease-out infinite', background: 'rgba(236,72,153,0.2)' }} />
              <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h3>
            <p className="text-gray-500 mb-6 text-sm">We sent a confirmation link to<br /><strong className="text-gray-800">{signupEmail}</strong></p>
            <button
              onClick={() => setShowEmailConfirmation(false)}
              className="btn-primary w-full h-11 rounded-xl text-white font-semibold relative z-10"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen flex bg-white">
        <div className="w-full flex">

          {/* ─── LEFT PANEL ─── */}
          <div
            className="flex flex-col justify-between w-full lg:w-[45%] px-8 py-10 lg:px-16 lg:py-14"
            style={{ opacity: mounted ? 1 : 0, animation: mounted ? 'slide-in-left 0.7s ease forwards' : 'none' }}
          >
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3 mb-12">
                <img src="/point-art-logo.svg" alt="Point Art" className="w-9 h-9 object-contain" />
                <div className="leading-none">
                  <div className="font-bold text-lg tracking-tight">
                    <span className="text-gray-900">Point</span>
                    <span className="ml-1" style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Art</span>
                  </div>
                  <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mt-0.5">Hub</div>
                </div>
              </div>

              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight">
                  {isSignUp ? "Create account" : "Welcome back"}
                </h1>
                <p className="text-gray-500 text-base">
                  {isSignUp ? "Start managing your business today" : "Sign in to your workspace"}
                </p>
              </div>

              {/* Google Button */}
              {!isSignUp && (
                <button
                  type="button"
                  className="google-btn w-full h-12 rounded-xl flex items-center justify-center gap-3 text-gray-700 font-medium text-sm mb-6 bg-white"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              )}

              {/* Divider */}
              {!isSignUp && (
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-white text-gray-400 font-medium tracking-wide uppercase">or continue with email</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {isSignUp && (
                  <div className="input-group">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                      className="form-input h-12 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                    />
                  </div>
                )}

                <div className="input-group">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="form-input h-12 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                  />
                </div>

                <div className="input-group">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="form-input h-12 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                  />
                </div>

                {!isSignUp && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">Remember me</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/direct-login')}
                      className="text-sm font-semibold hover:opacity-80 transition-opacity"
                      style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2 relative z-10"
                >
                  {loading ? (
                    <>
                      <CustomLoader size="sm" />
                      <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignUp ? "Create account" : "Sign in"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle */}
              <p className="mt-6 text-center text-sm text-gray-500">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setEmail(""); setPassword(""); setFullName(""); }}
                  disabled={loading}
                  className="toggle-link ml-1"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-400 text-center mt-10">
              © 2025 Point Art Solutions •{" "}
              <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
              {" "}•{" "}
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            </p>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div
            className="hidden lg:flex flex-col justify-center relative overflow-hidden flex-1"
            style={{
              background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 40%, #0d1a2e 100%)',
              animation: mounted ? 'slide-in-right 0.7s ease forwards' : 'none',
              opacity: mounted ? 1 : 0,
            }}
          >
            {/* Animated orbs */}
            <div className="panel-orb absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full animate-float-slow"
              style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 70%)' }} />
            <div className="panel-orb absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full animate-float-medium"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)', animationDelay: '1s' }} />
            <div className="panel-orb absolute top-[40%] left-[10%] w-48 h-48 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', animation: 'float-slow 8s ease-in-out infinite', animationDelay: '2s' }} />

            {/* Subtle grid overlay */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 px-14 py-14 max-w-lg mx-auto w-full">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-wide"
                style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                Business Management Platform
              </div>

              {/* Headline */}
              <h2 className="text-4xl font-extrabold leading-tight mb-4 text-white tracking-tight">
                Built for the
                <span className="block" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  frontlines of business
                </span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-10">
                The all-in-one platform for Point Art Solutions — manage inventory, track daily sales, and generate reports across every department.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-10">
                {features.map(({ icon: Icon, label, desc }, i) => (
                  <div
                    key={label}
                    className="feature-card flex items-center gap-4 px-4 py-3.5 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      animationDelay: `${i * 100}ms`,
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(139,92,246,0.25))', border: '1px solid rgba(236,72,153,0.2)' }}>
                      <Icon className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-none mb-0.5">{label}</p>
                      <p className="text-gray-500 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm italic leading-relaxed mb-4">
                  "Point Art Hub has been a game changer. The platform is intuitive and has helped streamline our workflow significantly."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
                    ND
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none">Nyakoojo DeoPaul</p>
                    <p className="text-gray-500 text-xs mt-0.5">Kireka, Wakiso</p>
                  </div>
                </div>
              </div>

              {/* Design credit */}
              <div className="flex items-center gap-2 mt-6">
                <img src="/magamutu-logo.png" alt="Magamutu" className="w-6 h-6 rounded-full opacity-70" />
                <p className="text-gray-600 text-xs">
                  Designed by{' '}
                  <a href="https://magamutu.com/" target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-300 transition-colors font-medium">
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
