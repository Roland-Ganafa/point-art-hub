import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import CustomLoader from "@/components/ui/CustomLoader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Package, TrendingUp, BarChart3, Shield } from "lucide-react";

// Animated counter hook
function useCounter(target: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

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
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();

  const sales = useCounter(4820000, 2000, statsVisible);
  const items = useCounter(348, 1800, statsVisible);
  const users = useCounter(12, 1200, statsVisible);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setStatsVisible(true), 800);
    // Cycle active step for process animation
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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

  const getSignInErrorMessage = (message: string): string => {
    if (message.toLowerCase().includes('invalid login credentials')) return 'Invalid email or password.';
    if (message.toLowerCase().includes('email not confirmed')) return 'Please verify your email before signing in.';
    return 'Sign in failed. Please try again.';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        console.error('Sign up error');
        toast({ title: "Error", description: "Sign up failed. Please try again.", variant: "destructive" });
      } else {
        setSignupEmail(email);
        setShowEmailConfirmation(true);
        toast({ title: "Success!", description: "Check your email to confirm.", duration: 7000 });
        setEmail(""); setPassword(""); setFullName("");
      }
    } catch (error: any) {
      console.error('Sign up error');
      toast({ title: "Error", description: "Sign up failed. Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error');
        toast({ title: "Error", description: getSignInErrorMessage(error.message), variant: "destructive" });
      } else if (data?.session) {
        toast({ title: "Welcome back!", description: "Signed in successfully." });
        setTimeout(() => navigate("/", { replace: true }), 300);
      }
    } catch (error: any) {
      console.error('Sign in error');
      toast({ title: "Error", description: "Sign in failed. Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const steps = [
    { icon: Package, label: "Add Inventory", color: "#f472b6" },
    { icon: TrendingUp, label: "Record Sales", color: "#a78bfa" },
    { icon: BarChart3, label: "View Reports", color: "#60a5fa" },
    { icon: Shield, label: "Stay in Control", color: "#34d399" },
  ];

  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-40px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-40px,30px) scale(1.08); }
          66% { transform: translate(25px,-25px) scale(0.92); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px,30px) scale(1.12); }
        }
        @keyframes slide-left {
          from { opacity:0; transform:translateX(-50px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slide-right {
          from { opacity:0; transform:translateX(60px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulse-dot {
          0%,100% { transform:scale(1); opacity:1; }
          50% { transform:scale(1.6); opacity:0.6; }
        }
        @keyframes dash {
          from { stroke-dashoffset: 200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes step-pop {
          0% { transform:scale(1); }
          40% { transform:scale(1.18); }
          100% { transform:scale(1); }
        }
        @keyframes glow-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(244,114,182,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(244,114,182,0); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes grid-fade {
          0%,100% { opacity:0.04; }
          50% { opacity:0.07; }
        }
        .orb1 { animation: orb1 8s ease-in-out infinite; }
        .orb2 { animation: orb2 10s ease-in-out infinite; }
        .orb3 { animation: orb3 6s ease-in-out infinite; }
        .anim-left  { animation: slide-left 0.7s cubic-bezier(.22,1,.36,1) both; }
        .anim-right { animation: slide-right 0.7s cubic-bezier(.22,1,.36,1) both; }
        .anim-up    { animation: fade-up 0.5s ease both; }
        .pulse-dot  { animation: pulse-dot 1.4s ease-in-out infinite; }
        .step-pop   { animation: step-pop 0.4s cubic-bezier(.22,1,.36,1); }
        .glow-ring  { animation: glow-ring 2s ease-in-out infinite; }
        .grid-fade  { animation: grid-fade 4s ease-in-out infinite; }
        .ticker-wrap { overflow: hidden; white-space: nowrap; }
        .ticker { display: inline-block; animation: ticker 18s linear infinite; }
        .btn-grad {
          background: linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);
          transition: all .25s ease;
          position: relative; overflow: hidden;
        }
        .btn-grad::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(135deg,#be185d,#7c3aed);
          opacity:0; transition: opacity .25s;
        }
        .btn-grad:hover::after { opacity:1; }
        .btn-grad:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(236,72,153,.45); }
        .btn-grad span, .btn-grad svg { position:relative; z-index:1; }
        .google-btn { transition:all .2s ease; border:1.5px solid #e5e7eb; }
        .google-btn:hover { border-color:#d1d5db; background:#f9fafb; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.08); }
        .form-input { transition: border-color .2s, box-shadow .2s; }
        .form-input:focus { border-color:#ec4899!important; box-shadow:0 0 0 3px rgba(236,72,153,.15)!important; outline:none!important; }
        .step-card { transition: all .3s ease; }
        .step-card.active { background:rgba(255,255,255,.13)!important; border-color:rgba(244,114,182,.5)!important; }
        .grad-text { background:linear-gradient(135deg,#f472b6,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .toggle-grad { background:linear-gradient(135deg,#ec4899,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
      `}</style>

      {/* Email confirmation modal */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl anim-up text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 glow-ring"
              style={{ background: 'linear-gradient(135deg,#fce7f3,#ede9fe)' }}>
              <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h3>
            <p className="text-gray-500 text-sm mb-6">Confirmation link sent to<br /><strong className="text-gray-800">{signupEmail}</strong></p>
            <button onClick={() => setShowEmailConfirmation(false)}
              className="btn-grad w-full h-11 rounded-xl text-white font-semibold">
              <span>Got it!</span>
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen flex bg-white">

        {/* ── LEFT PANEL ── */}
        <div className={`flex flex-col w-full lg:w-[44%] px-8 py-10 lg:px-14 lg:py-12 ${mounted ? 'anim-left' : 'opacity-0'}`}>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img src="/point-art-logo.svg" alt="Point Art" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="leading-none">
              <div className="font-extrabold text-xl tracking-tight">
                <span className="text-gray-900">POINT</span>
                <span className="grad-text ml-1.5">ART</span>
              </div>
              <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mt-0.5">Solutions</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto lg:mx-0">
            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-[2.4rem] font-extrabold text-gray-900 leading-tight tracking-tight mb-1.5">
                {isSignUp ? "Create account" : "Welcome back"}
              </h1>
              <p className="text-gray-400 text-sm">{isSignUp ? "Start managing your business today" : "Sign in to your workspace"}</p>
            </div>

            {/* Google */}
            {!isSignUp && (
              <button type="button" disabled={loading}
                className="google-btn w-full h-12 rounded-xl flex items-center justify-center gap-3 text-gray-700 font-medium text-sm mb-5 bg-white">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            )}

            {/* Divider */}
            {!isSignUp && (
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"/></div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-3 bg-white text-gray-400 font-semibold tracking-widest uppercase">or email</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 tracking-widest uppercase">Full Name</label>
                  <Input type="text" placeholder="John Doe" value={fullName}
                    onChange={e => setFullName(e.target.value)} required disabled={loading}
                    className="form-input h-12 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-300" />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 tracking-widest uppercase">Email</label>
                <Input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required disabled={loading}
                  className="form-input h-12 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 tracking-widest uppercase">Password</label>
                <Input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={6} disabled={loading}
                  className="form-input h-12 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-300" />
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={c => setRememberMe(c as boolean)} />
                    <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer select-none">Remember me</label>
                  </div>
                  <button type="button" onClick={() => navigate('/direct-login')}
                    className="text-sm font-bold toggle-grad hover:opacity-80 transition-opacity">
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-grad w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 mt-1">
                {loading ? (
                  <><CustomLoader size="sm" /><span>{isSignUp ? "Creating..." : "Signing in..."}</span></>
                ) : (
                  <><span>{isSignUp ? "Create account" : "Sign in"}</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-400">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button onClick={() => { setIsSignUp(!isSignUp); setEmail(""); setPassword(""); setFullName(""); }}
                disabled={loading} className="toggle-grad font-bold ml-1">
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <p className="text-[11px] text-gray-300 text-center mt-8">
            © 2025 Point Art Solutions •{" "}
            <a href="#" className="hover:text-gray-500 transition-colors">Terms</a> •{" "}
            <a href="#" className="hover:text-gray-500 transition-colors">Privacy</a>
          </p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={`hidden lg:flex flex-col justify-between relative overflow-hidden flex-1 ${mounted ? 'anim-right' : 'opacity-0'}`}
          style={{ background: 'linear-gradient(145deg,#0c0c1d 0%,#150d2b 45%,#0b1828 100%)' }}>

          {/* Orbs */}
          <div className="orb1 absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full pointer-events-none"
            style={{ filter:'blur(70px)', background:'radial-gradient(circle,rgba(236,72,153,.4) 0%,transparent 70%)' }} />
          <div className="orb2 absolute bottom-[-80px] left-[-60px] w-80 h-80 rounded-full pointer-events-none"
            style={{ filter:'blur(65px)', background:'radial-gradient(circle,rgba(139,92,246,.4) 0%,transparent 70%)' }} />
          <div className="orb3 absolute top-[45%] left-[20%] w-56 h-56 rounded-full pointer-events-none"
            style={{ filter:'blur(50px)', background:'radial-gradient(circle,rgba(59,130,246,.25) 0%,transparent 70%)' }} />

          {/* Animated grid */}
          <div className="grid-fade absolute inset-0 pointer-events-none"
            style={{ backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize:'44px 44px' }} />

          <div className="relative z-10 flex flex-col justify-between h-full px-12 py-12">

            {/* Top section */}
            <div>
              {/* Logo hero */}
              <div className="flex items-center gap-4 mb-7">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-2xl" style={{ background:'radial-gradient(circle,rgba(236,72,153,.5) 0%,transparent 70%)', filter:'blur(14px)', transform:'scale(1.3)' }} />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background:'rgba(255,255,255,.07)', border:'1.5px solid rgba(236,72,153,.3)' }}>
                    <img src="/point-art-logo.svg" alt="Point Art" className="w-10 h-10 object-contain" />
                  </div>
                </div>
                <div>
                  <div className="font-extrabold text-2xl tracking-tight leading-none">
                    <span className="text-white">POINT</span>
                    <span className="grad-text ml-1.5">ART</span>
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500 mt-1">Solutions</div>
                  <div className="text-[10px] italic text-gray-600 mt-0.5">"Expertise You Can Trust"</div>
                </div>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 text-xs font-bold tracking-wide"
                style={{ background:'rgba(236,72,153,.15)', border:'1px solid rgba(236,72,153,.35)', color:'#f9a8d4' }}>
                <span className="w-2 h-2 rounded-full bg-pink-400 pulse-dot" />
                Business Management Platform
              </div>

              {/* Headline */}
              <h2 className="text-[2.2rem] font-extrabold text-white leading-tight tracking-tight mb-3">
                Built for the<br />
                <span className="grad-text">frontlines of business</span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
                The all-in-one platform for Point Art Solutions — manage inventory, track daily sales, and generate reports across every department.
              </p>

              {/* Live stats */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { label: 'Revenue Today', value: `${(sales/1000000).toFixed(2)}M`, unit:'UGX' },
                  { label: 'Items Tracked', value: items, unit:'items' },
                  { label: 'Active Users', value: users, unit:'staff' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl px-4 py-3 text-center"
                    style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)' }}>
                    <div className="text-xl font-extrabold text-white leading-none">{s.value}</div>
                    <div className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Process flow — lively animated steps */}
              <div className="mb-6">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">How it works</p>
                <div className="flex items-center gap-0">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = activeStep === i;
                    const isPast = i < activeStep;
                    return (
                      <div key={i} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`step-card w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 relative ${isActive ? 'step-pop active' : ''}`}
                            style={{
                              background: isActive
                                ? `linear-gradient(135deg,${step.color}40,${step.color}20)`
                                : isPast ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.05)',
                              border: `1.5px solid ${isActive ? step.color + '80' : 'rgba(255,255,255,.08)'}`,
                              transition: 'all .3s ease',
                            }}>
                            <Icon className="w-4 h-4" style={{ color: isActive ? step.color : isPast ? '#6b7280' : '#374151' }} />
                            {isActive && (
                              <div className="absolute inset-0 rounded-xl"
                                style={{ boxShadow:`0 0 18px ${step.color}60`, animation:'glow-ring 1.5s ease-in-out infinite' }} />
                            )}
                          </div>
                          <span className="text-[9px] font-semibold text-center leading-tight"
                            style={{ color: isActive ? step.color : '#4b5563', maxWidth: '56px' }}>
                            {step.label}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="h-[2px] w-6 flex-shrink-0 rounded-full mb-4 transition-all duration-500"
                            style={{ background: isPast ? 'linear-gradient(90deg,#f472b6,#a78bfa)' : 'rgba(255,255,255,.1)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div>
              <div className="rounded-2xl p-5 mb-5"
                style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)' }}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm italic leading-relaxed mb-4">
                  "Point Art Hub has been a game changer. The platform is intuitive and has helped streamline our workflow significantly."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background:'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>ND</div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none">Nyakoojo DeoPaul</p>
                    <p className="text-gray-500 text-xs mt-0.5">Kireka, Wakiso</p>
                  </div>
                </div>
              </div>

              {/* Scrolling ticker */}
              <div className="ticker-wrap rounded-xl py-2 px-3" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.06)' }}>
                <div className="ticker text-[11px] text-gray-500 font-medium">
                  {["Inventory Management", "Daily Sales Tracking", "PDF Export Reports", "Low Stock Alerts", "Real-time Sync", "Role-Based Access", "Gift Store", "Embroidery", "Art Services", "Machines", "Stationery"].map(t => (
                    <span key={t} className="inline-flex items-center gap-2 mr-8">
                      <span className="w-1 h-1 rounded-full bg-pink-500 flex-shrink-0" />
                      {t}
                    </span>
                  ))}
                  {["Inventory Management", "Daily Sales Tracking", "PDF Export Reports", "Low Stock Alerts", "Real-time Sync", "Role-Based Access", "Gift Store", "Embroidery", "Art Services", "Machines", "Stationery"].map(t => (
                    <span key={t + '2'} className="inline-flex items-center gap-2 mr-8">
                      <span className="w-1 h-1 rounded-full bg-pink-500 flex-shrink-0" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Design credit */}
              <div className="flex items-center gap-2 mt-4">
                <img src="/magamutu-logo.png" alt="Magamutu" className="w-5 h-5 rounded-full opacity-60" />
                <p className="text-gray-600 text-xs">Designed by{' '}
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
