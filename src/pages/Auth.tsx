import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import CustomLoader from "@/components/ui/CustomLoader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Package, TrendingUp, BarChart3, Shield, Zap, Users, Star } from "lucide-react";

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
  const [activeFeature, setActiveFeature] = useState(0);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const sales   = useCounter(4820000, 2200, statsVisible);
  const items   = useCounter(348,     1800, statsVisible);
  const users   = useCounter(12,      1400, statsVisible);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setStatsVisible(true), 600);
    const stepTimer = setInterval(() => setActiveStep(p => (p + 1) % 4), 1800);
    const featTimer = setInterval(() => setActiveFeature(p => (p + 1) % 3), 3000);
    return () => { clearInterval(stepTimer); clearInterval(featTimer); };
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/auth' || path === '/direct-login') { setIsLoading(false); return; }
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) navigate("/", { replace: true });
      } catch { /* silent */ } finally { setIsLoading(false); }
    })();
  }, [navigate]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
      <CustomLoader size="lg" />
    </div>
  );

  const getSignInErrorMessage = (msg: string) => {
    if (msg.toLowerCase().includes('invalid login credentials')) return 'Invalid email or password.';
    if (msg.toLowerCase().includes('email not confirmed')) return 'Please verify your email before signing in.';
    return 'Sign in failed. Please try again.';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) { toast({ title: "Error", description: "Sign up failed. Please try again.", variant: "destructive" }); }
      else { setSignupEmail(email); setShowEmailConfirmation(true); toast({ title: "Success!", description: "Check your email to confirm.", duration: 7000 }); setEmail(""); setPassword(""); setFullName(""); }
    } catch { toast({ title: "Error", description: "Sign up failed. Please try again.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    setEmailNotConfirmed(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const isUnconfirmed = error.message.toLowerCase().includes('email not confirmed');
        if (isUnconfirmed) setEmailNotConfirmed(true);
        toast({ title: "Error", description: getSignInErrorMessage(error.message), variant: "destructive" });
      }
      else if (data?.session) { toast({ title: "Welcome back!", description: "Signed in successfully." }); setTimeout(() => navigate("/", { replace: true }), 300); }
    } catch { toast({ title: "Error", description: "Sign in failed. Please try again.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { setResetSent(true); toast({ title: "Reset email sent!", description: "Check your inbox for the password reset link.", duration: 7000 }); }
    } catch { toast({ title: "Error", description: "Failed to send reset email. Please try again.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleResendConfirmation = async () => {
    if (!email) { toast({ title: "Enter your email", description: "Please enter your email address above first.", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Confirmation email resent!", description: `A new confirmation link has been sent to ${email}.`, duration: 7000 }); setEmailNotConfirmed(false); }
    } catch { toast({ title: "Error", description: "Failed to resend confirmation email.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const steps = [
    { icon: Package, label: "Add Inventory", color: "#f472b6" },
    { icon: TrendingUp, label: "Record Sales", color: "#a78bfa" },
    { icon: BarChart3, label: "View Reports", color: "#60a5fa" },
    { icon: Shield, label: "Stay in Control", color: "#34d399" },
  ];

  const features = [
    { icon: Zap, title: "Real-time Sync", desc: "Every sale and stock change reflected instantly across all devices.", color: "#f472b6" },
    { icon: BarChart3, title: "Smart Analytics", desc: "Daily, monthly and all-time reports with profit breakdowns.", color: "#a78bfa" },
    { icon: Users, title: "Role-based Access", desc: "Admins control what each employee can see and do.", color: "#60a5fa" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { font-family: 'Inter', sans-serif; }

        /* ── Keyframes ── */
        @keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(40px,-60px) scale(1.15);} 66%{transform:translate(-30px,30px) scale(0.9);} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(-50px,40px) scale(1.1);} 66%{transform:translate(35px,-35px) scale(0.93);} }
        @keyframes orb-c { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(25px,40px) scale(1.18);} }
        @keyframes slide-left  { from{opacity:0;transform:translateX(-60px);} to{opacity:1;transform:translateX(0);} }
        @keyframes slide-right { from{opacity:0;transform:translateX(70px);} to{opacity:1;transform:translateX(0);} }
        @keyframes fade-up     { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes pulse-dot   { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.7);opacity:.5;} }
        @keyframes step-pop    { 0%{transform:scale(1);} 40%{transform:scale(1.22);} 100%{transform:scale(1);} }
        @keyframes ticker      { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        @keyframes shimmer     { from{background-position:-200% center;} to{background-position:200% center;} }
        @keyframes float       { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        @keyframes spin-slow   { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes card-in     { from{opacity:0;transform:translateY(12px) scale(.96);} to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes dash-draw   { from{stroke-dashoffset:300;} to{stroke-dashoffset:0;} }
        @keyframes glow-pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(236,72,153,.5);} 50%{box-shadow:0 0 0 12px rgba(236,72,153,0);} }

        /* ── Utility classes ── */
        .orb-a { animation: orb-a 9s ease-in-out infinite; }
        .orb-b { animation: orb-b 11s ease-in-out infinite; }
        .orb-c { animation: orb-c 7s ease-in-out infinite; }
        .anim-left  { animation: slide-left  .75s cubic-bezier(.22,1,.36,1) both; }
        .anim-right { animation: slide-right .75s cubic-bezier(.22,1,.36,1) .1s both; }
        .anim-up    { animation: fade-up .5s ease both; }
        .pulse-dot  { animation: pulse-dot 1.5s ease-in-out infinite; }
        .step-pop   { animation: step-pop .45s cubic-bezier(.22,1,.36,1); }
        .ticker-track { animation: ticker 22s linear infinite; display:inline-block; }
        .ticker-wrap  { overflow:hidden; white-space:nowrap; }
        .float        { animation: float 3.5s ease-in-out infinite; }
        .card-in      { animation: card-in .5s cubic-bezier(.22,1,.36,1) both; }

        /* ── Gradient text ── */
        .grad-text {
          background: linear-gradient(135deg,#f472b6 0%,#c084fc 50%,#818cf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .grad-text-2 {
          background: linear-gradient(135deg,#60a5fa 0%,#a78bfa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .toggle-grad {
          background: linear-gradient(135deg,#ec4899,#8b5cf6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        /* ── Sign-in button ── */
        .btn-primary {
          background: linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);
          position: relative; overflow: hidden;
          transition: all .25s ease;
        }
        .btn-primary::before {
          content:''; position:absolute; inset:0;
          background: linear-gradient(135deg,#be185d 0%,#7c3aed 100%);
          opacity:0; transition: opacity .25s;
        }
        .btn-primary:hover::before { opacity:1; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 35px rgba(236,72,153,.5); }
        .btn-primary span, .btn-primary svg { position:relative; z-index:1; }

        /* ── Google button ── */
        .btn-google {
          transition: all .2s ease;
          border: 1.5px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(8px);
        }
        .btn-google:hover { border-color:rgba(255,255,255,.2); background:rgba(255,255,255,.08); transform:translateY(-1px); }

        /* ── Form input ── */
        .form-input {
          background: rgba(255,255,255,.06) !important;
          border: 1.5px solid rgba(255,255,255,.1) !important;
          color: #fff !important;
          transition: border-color .2s, box-shadow .2s;
        }
        .form-input::placeholder { color: rgba(255,255,255,.25) !important; }
        .form-input:focus { border-color:#ec4899!important; box-shadow:0 0 0 3px rgba(236,72,153,.18)!important; outline:none!important; }

        /* ── Step card ── */
        .step-card { transition: all .3s ease; }
        .step-card.active { background:rgba(255,255,255,.13)!important; border-color:rgba(244,114,182,.5)!important; }

        /* ── Floating badge ── */
        .badge-live {
          background: rgba(236,72,153,.15);
          border: 1px solid rgba(236,72,153,.35);
          color: #f9a8d4;
        }

        /* ── Feature card ── */
        .feat-card {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          transition: all .35s ease;
        }
        .feat-card:hover, .feat-card.active {
          background: rgba(255,255,255,.08);
          border-color: rgba(244,114,182,.3);
          transform: translateY(-2px);
          box-shadow: 0 20px 50px rgba(0,0,0,.3);
        }

        /* ── Stat card ── */
        .stat-card {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
          backdrop-filter: blur(12px);
          transition: all .3s ease;
        }
        .stat-card:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.14); }

        /* ── Shimmer text ── */
        .shimmer-text {
          background: linear-gradient(90deg, #f472b6 0%, #c084fc 25%, #818cf8 50%, #c084fc 75%, #f472b6 100%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Grid bg ── */
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* ── Label ── */
        .form-label { color: rgba(255,255,255,.5); font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:6px; display:block; }

        /* ── Divider ── */
        .divider-line { border-color: rgba(255,255,255,.08); }
        .divider-text { background: transparent; color: rgba(255,255,255,.25); }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width:0; }

        /* ── Right panel dashboard mock ── */
        .dash-mock {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 16px;
          backdrop-filter: blur(16px);
        }
      `}</style>

      {/* ── Email confirmation modal ── */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl p-8 max-w-sm w-full shadow-2xl anim-up text-center"
            style={{ background:'rgba(20,10,40,.95)', border:'1px solid rgba(236,72,153,.3)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background:'linear-gradient(135deg,rgba(236,72,153,.25),rgba(139,92,246,.25))', border:'1.5px solid rgba(236,72,153,.4)' }}>
              <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Check Your Email</h3>
            <p className="text-sm mb-6" style={{ color:'rgba(255,255,255,.45)' }}>
              Confirmation link sent to<br /><strong className="text-pink-300">{signupEmail}</strong>
            </p>
            <button onClick={() => setShowEmailConfirmation(false)}
              className="btn-primary w-full h-11 rounded-xl text-white font-semibold">
              <span>Got it!</span>
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen flex overflow-hidden" style={{ background:'#08080f' }}>

        {/* ══════════════════════════════════════════
            LEFT  –  Login form
        ══════════════════════════════════════════ */}
        <div className={`flex flex-col w-full lg:w-[42%] relative ${mounted ? 'anim-left' : 'opacity-0'}`}
          style={{ background:'linear-gradient(160deg,#0e0720 0%,#080813 100%)', borderRight:'1px solid rgba(255,255,255,.06)' }}>

          {/* Subtle top-left glow */}
          <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none"
            style={{ background:'radial-gradient(circle at 20% 10%, rgba(236,72,153,.12) 0%, transparent 70%)', filter:'blur(40px)' }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
            style={{ background:'radial-gradient(circle at 80% 90%, rgba(139,92,246,.1) 0%, transparent 70%)', filter:'blur(40px)' }} />

          <div className="relative z-10 flex flex-col h-full px-8 py-10 lg:px-12 lg:py-12">

            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl" style={{ background:'radial-gradient(circle,rgba(236,72,153,.4),transparent 70%)', filter:'blur(12px)', transform:'scale(1.4)' }} />
                <div className="relative w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background:'rgba(255,255,255,.07)', border:'1.5px solid rgba(236,72,153,.3)' }}>
                  <img src="/point-art-logo.svg" alt="Point Art" className="w-7 h-7 object-contain" />
                </div>
              </div>
              <div className="leading-none">
                <div className="font-extrabold text-xl tracking-tight">
                  <span className="text-white">POINT</span>
                  <span className="grad-text ml-1.5">ART</span>
                </div>
                <div className="text-[9px] font-bold tracking-[.28em] uppercase mt-0.5" style={{ color:'rgba(255,255,255,.3)' }}>Solutions</div>
              </div>
            </div>

            {/* Form card */}
            <div className="flex-1 flex flex-col justify-center max-w-[360px] w-full mx-auto">

              {/* Heading */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5 badge-live">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 pulse-dot" />
                  {isForgotPassword ? "Reset Password" : isSignUp ? "Join Point Art Hub" : "Welcome back"}
                </div>
                <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-2">
                  {isForgotPassword ? (
                    <>Reset your<br /><span className="shimmer-text">password</span></>
                  ) : isSignUp ? (
                    <><span className="shimmer-text">Create</span><br />your account</>
                  ) : (
                    <>Sign in to your<br /><span className="shimmer-text">workspace</span></>
                  )}
                </h1>
                <p className="text-sm" style={{ color:'rgba(255,255,255,.35)' }}>
                  {isForgotPassword ? "Enter your email and we'll send a reset link" : isSignUp ? "Start managing your business today" : "Point Art Hub — everything in one place"}
                </p>
              </div>

              {/* Reset sent success state */}
              {isForgotPassword && resetSent && (
                <div className="rounded-2xl p-5 mb-4 text-center"
                  style={{ background:'rgba(52,211,153,.1)', border:'1px solid rgba(52,211,153,.3)' }}>
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-white font-semibold mb-1">Reset link sent!</p>
                  <p className="text-sm" style={{ color:'rgba(255,255,255,.5)' }}>
                    Check your inbox at <strong className="text-pink-300">{email}</strong> and click the link to reset your password.
                  </p>
                </div>
              )}

              {/* Google */}
              {!isSignUp && (
                <button type="button" disabled={loading}
                  className="btn-google w-full h-12 rounded-2xl flex items-center justify-center gap-3 text-white font-medium text-sm mb-5">
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
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t divider-line" /></div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="px-3 bg-transparent divider-text font-bold tracking-widest uppercase"
                      style={{ background:'transparent', color:'rgba(255,255,255,.2)' }}>or email</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={isForgotPassword ? handleForgotPassword : isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {isSignUp && !isForgotPassword && (
                  <div>
                    <label className="form-label">Full Name</label>
                    <Input type="text" placeholder="John Doe" value={fullName}
                      onChange={e => setFullName(e.target.value)} required disabled={loading}
                      className="form-input h-12 rounded-xl border-0 text-white" />
                  </div>
                )}
                <div>
                  <label className="form-label">Email</label>
                  <Input type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} required disabled={loading}
                    className="form-input h-12 rounded-xl border-0 text-white" />
                </div>
                {!isForgotPassword && (
                <div>
                  <label className="form-label">Password</label>
                  <Input type="password" placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6} disabled={loading}
                    className="form-input h-12 rounded-xl border-0 text-white" />
                </div>
                )}

                {!isSignUp && !isForgotPassword && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id="rem" checked={rememberMe} onCheckedChange={c => setRememberMe(c as boolean)}
                        className="border-white/20 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500" />
                      <label htmlFor="rem" className="text-sm cursor-pointer select-none" style={{ color:'rgba(255,255,255,.4)' }}>Remember me</label>
                    </div>
                    <button type="button" onClick={() => { setIsForgotPassword(true); setResetSent(false); setEmailNotConfirmed(false); }}
                      className="text-sm font-bold toggle-grad hover:opacity-80 transition-opacity">
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Email not confirmed banner */}
                {emailNotConfirmed && !isForgotPassword && (
                  <div className="rounded-xl p-3 text-sm flex flex-col gap-2"
                    style={{ background:'rgba(236,72,153,.1)', border:'1px solid rgba(236,72,153,.3)' }}>
                    <p style={{ color:'rgba(255,255,255,.7)' }}>Your email hasn't been confirmed yet.</p>
                    <button type="button" onClick={handleResendConfirmation} disabled={loading}
                      className="text-left text-sm font-bold toggle-grad hover:opacity-80 transition-opacity">
                      Resend confirmation email →
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn-primary w-full h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-2">
                  {loading ? (
                    <><CustomLoader size="sm" /><span>{isForgotPassword ? "Sending..." : isSignUp ? "Creating..." : "Signing in..."}</span></>
                  ) : (
                    <><span>{isForgotPassword ? "Send reset link" : isSignUp ? "Create account" : "Sign in"}</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              {/* Forgot password back link */}
              {isForgotPassword && (
                <p className="mt-4 text-center text-sm" style={{ color:'rgba(255,255,255,.3)' }}>
                  <button onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
                    className="toggle-grad font-bold hover:opacity-80 transition-opacity">
                    ← Back to Sign in
                  </button>
                </p>
              )}

              {!isForgotPassword && (
              <p className="mt-6 text-center text-sm" style={{ color:'rgba(255,255,255,.3)' }}>
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button onClick={() => { setIsSignUp(!isSignUp); setEmail(""); setPassword(""); setFullName(""); setEmailNotConfirmed(false); }}
                  disabled={loading} className="toggle-grad font-bold ml-1 hover:opacity-80 transition-opacity">
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
              )}

              {/* Trust row */}
              <div className="flex items-center justify-center gap-4 mt-8">
                {[
                  { icon: Shield, text: "Secure" },
                  { icon: Zap, text: "Fast" },
                  { icon: Star, text: "Reliable" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,.25)' }}>
                    <Icon className="w-3 h-3" style={{ color:'rgba(236,72,153,.6)' }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p className="text-center mt-8 text-[10px]" style={{ color:'rgba(255,255,255,.15)' }}>
              © 2026 Point Art Solutions •{" "}
              <a href="#" className="hover:text-white/40 transition-colors">Terms</a> •{" "}
              <a href="#" className="hover:text-white/40 transition-colors">Privacy</a>
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT  –  Marketing / showcase panel
        ══════════════════════════════════════════ */}
        <div className={`hidden lg:flex flex-col relative overflow-hidden flex-1 ${mounted ? 'anim-right' : 'opacity-0'}`}
          style={{ background:'linear-gradient(145deg,#0c0c1e 0%,#130b27 45%,#0b1525 100%)' }}>

          {/* Animated orbs */}
          <div className="orb-a absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
            style={{ filter:'blur(90px)', background:'radial-gradient(circle,rgba(236,72,153,.35) 0%,transparent 70%)' }} />
          <div className="orb-b absolute -bottom-32 -left-20 w-[380px] h-[380px] rounded-full pointer-events-none"
            style={{ filter:'blur(80px)', background:'radial-gradient(circle,rgba(139,92,246,.35) 0%,transparent 70%)' }} />
          <div className="orb-c absolute top-1/2 left-1/3 w-[260px] h-[260px] rounded-full pointer-events-none"
            style={{ filter:'blur(60px)', background:'radial-gradient(circle,rgba(59,130,246,.2) 0%,transparent 70%)' }} />

          {/* Grid */}
          <div className="grid-bg absolute inset-0 pointer-events-none" />

          {/* Decorative ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{ border:'1px solid rgba(255,255,255,.025)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ border:'1px solid rgba(236,72,153,.05)' }} />

          <div className="relative z-10 flex flex-col h-full px-12 py-12 overflow-y-auto">

            {/* ── Top: logo + badge + headline ── */}
            <div className="mb-8">
              {/* Logo */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl" style={{ background:'radial-gradient(circle,rgba(236,72,153,.5),transparent 70%)', filter:'blur(16px)', transform:'scale(1.4)' }} />
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background:'rgba(255,255,255,.07)', border:'1.5px solid rgba(236,72,153,.3)' }}>
                    <img src="/point-art-logo.svg" alt="Point Art" className="w-9 h-9 object-contain" />
                  </div>
                </div>
                <div>
                  <div className="font-black text-2xl tracking-tight leading-none">
                    <span className="text-white">POINT </span><span className="grad-text">ART</span>
                  </div>
                  <div className="text-[9px] font-bold tracking-[.3em] uppercase mt-1" style={{ color:'rgba(255,255,255,.3)' }}>Solutions • Expertise You Can Trust</div>
                </div>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide badge-live mb-6">
                <span className="w-2 h-2 rounded-full bg-pink-400 pulse-dot" />
                Business Management Platform
              </div>

              {/* Headline */}
              <h2 className="text-5xl font-black text-white leading-[1.08] tracking-tight mb-4">
                Built for the<br />
                <span className="grad-text">frontlines</span><br />
                of business
              </h2>
              <p className="text-base leading-relaxed max-w-md" style={{ color:'rgba(255,255,255,.4)' }}>
                The all-in-one platform for Point Art Solutions — manage inventory, track daily sales, and generate reports across every department.
              </p>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: 'Revenue Today', value: `${(sales/1000000).toFixed(2)}M`, unit:'UGX', color:'#f472b6' },
                { label: 'Items Tracked', value: items,  unit:'items', color:'#a78bfa' },
                { label: 'Active Users',  value: users,  unit:'staff', color:'#60a5fa' },
              ].map((s, i) => (
                <div key={i} className="stat-card rounded-2xl px-4 py-4 text-center">
                  <div className="text-2xl font-black text-white leading-none mb-1"
                    style={{ textShadow:`0 0 20px ${s.color}60` }}>{s.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'rgba(255,255,255,.3)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Feature cards ── */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {features.map((f, i) => {
                const Icon = f.icon;
                const isActive = activeFeature === i;
                return (
                  <div key={i} className={`feat-card rounded-2xl p-4 ${isActive ? 'active' : ''}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                      style={{ background:`${f.color}18`, border:`1.5px solid ${f.color}30` }}>
                      <Icon className="w-4 h-4" style={{ color: f.color }} />
                    </div>
                    <div className="font-bold text-white text-sm mb-1">{f.title}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color:'rgba(255,255,255,.35)' }}>{f.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* ── How it works ── */}
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[.2em] mb-4" style={{ color:'rgba(255,255,255,.3)' }}>How it works</p>
              <div className="flex items-center gap-0">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = activeStep === i;
                  const isPast = i < activeStep;
                  return (
                    <div key={i} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`step-card w-11 h-11 rounded-2xl flex items-center justify-center mb-2 relative ${isActive ? 'step-pop active' : ''}`}
                          style={{
                            background: isActive ? `linear-gradient(135deg,${step.color}35,${step.color}18)` : isPast ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)',
                            border: `1.5px solid ${isActive ? step.color + '70' : 'rgba(255,255,255,.07)'}`,
                          }}>
                          <Icon className="w-4 h-4" style={{ color: isActive ? step.color : isPast ? '#4b5563' : '#1f2937' }} />
                          {isActive && (
                            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow:`0 0 22px ${step.color}50`, animation:'glow-pulse 1.5s ease-in-out infinite' }} />
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-center leading-tight uppercase tracking-wide"
                          style={{ color: isActive ? step.color : '#2d3748', maxWidth: '60px' }}>{step.label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="h-[2px] w-8 flex-shrink-0 rounded-full mb-5 transition-all duration-500"
                          style={{ background: isPast ? `linear-gradient(90deg,${steps[i].color},${steps[i+1].color})` : 'rgba(255,255,255,.07)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Testimonial + ticker ── */}
            <div className="mt-auto">
              <div className="rounded-2xl p-5 mb-4"
                style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)' }}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                  ))}
                </div>
                <p className="text-sm italic leading-relaxed mb-4" style={{ color:'rgba(255,255,255,.55)' }}>
                  "Point Art Hub has been a game changer. The platform is intuitive and has helped streamline our workflow significantly."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background:'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>ND</div>
                  <div>
                    <p className="text-white text-sm font-bold leading-none">Nyakoojo DeoPaul</p>
                    <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,.3)' }}>Kireka, Wakiso</p>
                  </div>
                </div>
              </div>

              {/* Scrolling ticker */}
              <div className="ticker-wrap rounded-xl py-2 px-3 mb-4"
                style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.05)' }}>
                <div className="ticker-track text-[11px] font-medium" style={{ color:'rgba(255,255,255,.3)' }}>
                  {["Inventory Management","Daily Sales Tracking","PDF Export Reports","Low Stock Alerts","Real-time Sync","Role-Based Access","Gift Store","Embroidery","Art Services","Machines","Stationery","PDF Export Reports","Low Stock Alerts"].map(t => (
                    <span key={t} className="inline-flex items-center gap-2 mr-10">
                      <span className="w-1 h-1 rounded-full bg-pink-500 flex-shrink-0" />{t}
                    </span>
                  ))}
                  {["Inventory Management","Daily Sales Tracking","PDF Export Reports","Low Stock Alerts","Real-time Sync","Role-Based Access","Gift Store","Embroidery","Art Services","Machines","Stationery","PDF Export Reports","Low Stock Alerts"].map(t => (
                    <span key={t+'2'} className="inline-flex items-center gap-2 mr-10">
                      <span className="w-1 h-1 rounded-full bg-pink-500 flex-shrink-0" />{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Design credit */}
              <div className="flex items-center gap-2">
                <img src="/magamutu-logo.png" alt="Magamutu" className="w-5 h-5 rounded-full opacity-50" />
                <p className="text-xs" style={{ color:'rgba(255,255,255,.2)' }}>
                  Designed by{' '}
                  <a href="https://magamutu.com/" target="_blank" rel="noopener noreferrer"
                    className="hover:text-white/40 transition-colors font-semibold" style={{ color:'rgba(255,255,255,.3)' }}>
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
