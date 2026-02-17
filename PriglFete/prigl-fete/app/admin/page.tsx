'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [groupSize, setGroupSize] = useState('1');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    const { error } = await supabase.from('baumstamm_entries').insert({
      name,
      weight: parseFloat(weight),
      group_size: parseInt(groupSize),
      phone,
    });

    if (error) {
      setError('Fehler beim Speichern: ' + error.message);
    } else {
      setSuccess(true);
      setName('');
      setWeight('');
      setGroupSize('1');
      setPhone('');
    }

    setSubmitting(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center text-stone-500 animate-pulse">
        Laden...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-stone-100 px-4 py-8">
      <div className="w-full max-w-sm mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
            Neuer Eintrag
          </h1>
          <button
            onClick={handleLogout}
            className="text-xs text-stone-500 hover:text-stone-300 transition-colors py-2 px-3"
          >
            Ausloggen
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-900/40 border border-stone-800/60 rounded-3xl p-6 flex flex-col gap-5">

          {/* Name */}
          <div>
            <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Name</label>
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="z.B. Familie Müller"
              className="w-full bg-stone-800/60 border border-stone-700 rounded-xl px-4 py-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600 text-base"
            />
          </div>

          {/* Gewicht */}
          <div>
            <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Gewicht (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              required
              min="20"
              step="0.1"
              placeholder="z.B. 85.5"
              className="w-full bg-stone-800/60 border border-stone-700 rounded-xl px-4 py-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600 text-base"
            />
          </div>

          {/* Gruppengröße */}
          <div>
            <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Gruppengröße</label>
            <input
              type="number"
              inputMode="numeric"
              value={groupSize}
              onChange={e => setGroupSize(e.target.value)}
              required
              min="1"
              placeholder="1"
              className="w-full bg-stone-800/60 border border-stone-700 rounded-xl px-4 py-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600 text-base"
            />
          </div>

          {/* Telefonnummer */}
          <div>
            <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Telefonnummer</label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+43 123 456 789"
              className="w-full bg-stone-800/60 border border-stone-700 rounded-xl px-4 py-4 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600 text-base"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {success && (
            <p className="text-green-400 text-sm text-center font-bold">
              Eintrag gespeichert!
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all text-base"
          >
            {submitting ? 'Wird gespeichert...' : '🪵 Eintragen'}
          </button>

        </form>
      </div>
    </div>
  );
}