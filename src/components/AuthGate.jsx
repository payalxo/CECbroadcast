import React, { useEffect, useRef, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '../lib/api';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim();
    if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('Password must be 8 to 128 characters.');
      return;
    }
    if (SITE_KEY && !captchaToken) {
      setError('Please wait for the security check to finish, then try again.');
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setBusy(false);
    // a token works only once, so get a fresh one for the next try
    setCaptchaToken('');
    if (captchaRef.current) captchaRef.current.reset();
    if (err) setError('Sign-in failed. Check your details and try again.');
    else setPassword('');
  };

  const page = 'aurora relative overflow-hidden min-h-screen flex items-center justify-center bg-gradient-to-b from-[#040810] via-[#070e1c] to-[#040810] p-4';

  if (checking) {
    return <div className={page}><p className="relative z-10 text-slate-400 text-sm">Loading…</p></div>;
  }
  if (session) return children;

  const input = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:bg-white/10';

  return (
    <div className={page}>
      <div className="rise relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="gradient-text text-2xl font-bold">Campus Twin</h1>
        <p className="mb-6 mt-1 text-sm text-slate-400">Sign in</p>
        <form onSubmit={signIn} className="space-y-4">
          <input type="email" autoComplete="username" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={input} />
          <input type="password" autoComplete="current-password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={input} />

          {SITE_KEY && (
            <Turnstile
              ref={captchaRef}
              siteKey={SITE_KEY}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
              onError={() => setCaptchaToken('')}
              options={{ theme: 'dark' }}
            />
          )}

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy}
            className="lift w-full rounded-xl bg-cyan-500/90 py-3 text-sm font-medium text-[#040810] hover:bg-cyan-400 disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}