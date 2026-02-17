// app/page.tsx
'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface BaumstammEntry {
  id: string;
  name: string;
  weight: number;
  group_size: number;
  created_at: string;
}

type Category = 'total' | 'per_person' | 'solo';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<BaumstammEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('total');
  const [range, setRange] = useState({ start: 0, end: 9 });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [category, range]);

  async function fetchLeaderboard() {
    try {
      const fetchLimit = range.end + 50;

      let query = supabase
        .from('baumstamm_entries')
        .select('*')
        .gte('weight', 20)
        .limit(fetchLimit);

      if (category === 'solo') {
        query = query.eq('group_size', 1).order('weight', { ascending: false });
      } else if (category === 'per_person') {
        query = query.gt('group_size', 1).order('weight', { ascending: false });
      } else {
        query = query.order('weight', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let sorted = data || [];

      if (category === 'per_person') {
        sorted = sorted.sort((a, b) => (b.weight / b.group_size) - (a.weight / a.group_size));
      }

      setEntries(sorted.slice(range.start, range.end + 1));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} t`;
    }
    return `${kg.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`;
  };

  const rangeOptions = [
    { label: 'Top 10', start: 0, end: 9 },
    { label: '11 - 50', start: 10, end: 49 },
    { label: '51 - 100', start: 50, end: 99 },
    { label: '101 - 200', start: 100, end: 199 }
  ];

  const handleCategoryChange = (cat: Category) => {
    setLoading(true);
    setCategory(cat);
    setRange({ start: 0, end: 9 });
  };

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-stone-100 font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-900/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
            PRIGL RANKING
          </h1>
          <div className="flex items-center justify-center gap-3 text-stone-500 text-sm font-medium uppercase tracking-widest">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live • {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </header>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 bg-stone-900/40 p-1 rounded-2xl border border-stone-800/60">
          <button
            onClick={() => handleCategoryChange('total')}
            className={`flex-1 px-3 py-3 rounded-xl text-xs font-bold transition-all ${
              category === 'total'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            🪵 Schwerster Prigl
          </button>
          <button
            onClick={() => handleCategoryChange('per_person')}
            className={`flex-1 px-3 py-3 rounded-xl text-xs font-bold transition-all ${
              category === 'per_person'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            👥 Gruppenwertung
          </button>
          <button
            onClick={() => handleCategoryChange('solo')}
            className={`flex-1 px-3 py-3 rounded-xl text-xs font-bold transition-all ${
              category === 'solo'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            💪 Einzelwertung
          </button>
        </div>

        {/* Range Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {rangeOptions.map((r) => (
            <button
              key={r.label}
              onClick={() => {
                setLoading(true);
                setRange({ start: r.start, end: r.end });
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                range.start === r.start
                  ? 'bg-stone-700 border-stone-600 text-white shadow-lg'
                  : 'bg-stone-900/60 border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="bg-stone-900/40 border border-stone-800/60 rounded-3xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-stone-500">Lade Daten...</div>
          ) : (
            <div className="divide-y divide-stone-800/50">
              {entries.map((entry, index) => {
                const rank = range.start + index + 1;
                const isTop3 = rank <= 3;
                const weightPerPerson = entry.weight / entry.group_size;

                return (
                  <div
                    key={entry.id}
                    className="group flex items-center p-4 md:p-5 hover:bg-stone-800/30 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {rank === 1 && <span className="text-3xl">🥇</span>}
                      {rank === 2 && <span className="text-3xl">🥈</span>}
                      {rank === 3 && <span className="text-3xl">🥉</span>}
                      {rank > 3 && (
                        <span className="text-xl font-black text-stone-600">{rank}</span>
                      )}
                    </div>

                    {/* Name & Info */}
                    <div className="flex-1 px-4 min-w-0">
                      <div className={`text-base md:text-lg font-bold leading-tight break-words mb-1 ${isTop3 ? 'text-white' : 'text-stone-300'}`}>
                        {entry.name || 'Anonymer Stamm'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                        <span>
                          {new Date(entry.created_at).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-stone-700">•</span>
                        <span className="text-stone-500">
                          {entry.group_size === 1 ? 'Solo' : `${entry.group_size} Personen`}
                        </span>
                      </div>
                    </div>

                    {/* Weight Display */}
                    <div className="text-right flex-shrink-0">

                      {/* Schwerster Prigl: Primär Gesamtgewicht, dann Info */}
                      {category === 'total' && (
                        <>
                          <div className={`text-xl md:text-2xl font-black tabular-nums ${isTop3 ? 'text-amber-500' : 'text-stone-400'}`}>
                            {formatWeight(entry.weight)}
                          </div>
                          {entry.group_size > 1 && (
                            <div className="text-xs text-stone-600 mt-0.5">
                              {entry.group_size} P • {formatWeight(weightPerPerson)}/P
                            </div>
                          )}
                        </>
                      )}

                      {/* Gruppenwertung: Primär Gewicht/Person, dann Gesamtgewicht + Anzahl */}
                      {category === 'per_person' && (
                        <>
                          <div className={`text-xl md:text-2xl font-black tabular-nums ${isTop3 ? 'text-amber-500' : 'text-stone-400'}`}>
                            {formatWeight(weightPerPerson)}
                            <span className="text-sm font-medium text-stone-500"> /P</span>
                          </div>
                          <div className="text-xs text-stone-600 mt-0.5">
                            {entry.group_size} P • {formatWeight(entry.weight)} gesamt
                          </div>
                        </>
                      )}

                      {/* Einzelwertung: nur Gewicht */}
                      {category === 'solo' && (
                        <>
                          <div className={`text-xl md:text-2xl font-black tabular-nums ${isTop3 ? 'text-amber-500' : 'text-stone-400'}`}>
                            {formatWeight(entry.weight)}
                          </div>
                          <div className="text-xs text-stone-600 mt-0.5">
                            Solo
                          </div>
                        </>
                      )}

                    </div>
                  </div>
                );
              })}

              {entries.length === 0 && (
                <div className="py-20 text-center text-stone-600">
                  Keine Einträge in diesem Bereich
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center">
          <p className="text-stone-600 text-[10px] uppercase tracking-[0.2em]">
            Mindestgewicht 20kg • Aktualisiert alle 30 Sek
          </p>
        </footer>
      </div>
    </div>
  );
}