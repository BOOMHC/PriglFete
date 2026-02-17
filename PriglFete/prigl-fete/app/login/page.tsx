'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Login fehlgeschlagen. Bitte prüfe Email und Passwort.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-black tracking-tighter mb-8 text-center bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
          Admin Login
        </h1>

        <form onSubmit={handleLogin} className="bg-stone-900/40 border border-stone-800/60 rounded-3xl p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs text-stone-500 uppercase tracking-widest mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-stone-800/60 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="text-xs text-stone-500 uppercase tracking-widest mb-1 block">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-stone-800/60 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? 'Wird eingeloggt...' : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}