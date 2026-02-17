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
    <>
      {/* NOTE: Ensure your layout.tsx has:
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap');

        :root {
          --bark-dark: #1a1208;
          --bark-mid: #2c1f0e;
          --bark-accent: #3d2b14;
          --wood-warm: #8b5e2a;
          --wood-light: #c4884a;
          --grain-gold: #d4a55a;
          --grain-bright: #f0c070;
          --moss-green: #3a5c2a;
          --moss-light: #4e7a3a;
          --leaf-green: #6aab50;
          --cream: #f5ead8;
          --cream-dim: #b8a488;
          --ring-1: rgba(212, 165, 90, 0.08);
          --ring-2: rgba(212, 165, 90, 0.04);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html {
          -webkit-text-size-adjust: 100%;
          touch-action: manipulation;
        }

        body {
          background-color: var(--bark-dark);
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          min-height: 100dvh;
          overflow-x: hidden;
        }

        /* Wood grain texture via SVG filter */
        .wood-bg {
          background-color: var(--bark-dark);
          background-image:
            repeating-linear-gradient(
              92deg,
              transparent,
              transparent 2px,
              rgba(139,94,42,0.03) 2px,
              rgba(139,94,42,0.03) 4px
            ),
            repeating-linear-gradient(
              180deg,
              transparent,
              transparent 60px,
              rgba(60,43,20,0.15) 60px,
              rgba(60,43,20,0.15) 62px
            );
        }

        /* Tree rings glow behind header */
        .ring-bg {
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: transparent;
          box-shadow:
            0 0 0 1px rgba(212,165,90,0.06),
            0 0 0 40px rgba(212,165,90,0.04),
            0 0 0 80px rgba(212,165,90,0.03),
            0 0 0 130px rgba(212,165,90,0.025),
            0 0 0 190px rgba(212,165,90,0.02),
            0 0 0 260px rgba(212,165,90,0.015),
            0 0 0 340px rgba(212,165,90,0.01);
          pointer-events: none;
          z-index: 0;
        }

        .green-glow {
          position: fixed;
          bottom: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74,122,58,0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .container {
          position: relative;
          max-width: 640px;
          margin: 0 auto;
          padding: 20px 12px calc(48px + env(safe-area-inset-bottom));
          padding-left: max(12px, env(safe-area-inset-left));
          padding-right: max(12px, env(safe-area-inset-right));
          z-index: 1;
          width: 100%;
        }

        /* HEADER */
        header {
          text-align: center;
          margin-bottom: 32px;
          padding-top: 16px;
        }

        .event-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(58,92,42,0.3);
          border: 1px solid rgba(106,171,80,0.25);
          border-radius: 999px;
          padding: 4px 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--leaf-green);
          margin-bottom: 16px;
        }

        .event-tag::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--leaf-green);
          box-shadow: 0 0 8px var(--leaf-green);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        h1 {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: clamp(2.4rem, 8vw, 3.5rem);
          line-height: 1.2;
          letter-spacing: -0.02em;
          background: linear-gradient(160deg, var(--grain-bright) 0%, var(--grain-gold) 40%, var(--wood-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
          padding-bottom: 0.1em;
        }

        .subtitle {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--cream-dim);
          margin-top: 8px;
          padding: 0 8px;
          line-height: 1.5;
        }

        /* DIVIDER */
        .wood-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 auto 28px;
          max-width: 320px;
        }
        .wood-divider::before,
        .wood-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,165,90,0.35), transparent);
        }
        .wood-divider span {
          font-size: 16px;
        }

        /* TABS */
        .tabs {
          display: flex;
          flex-direction: row;
          gap: 3px;
          background: rgba(44,31,14,0.7);
          border: 1px solid rgba(139,94,42,0.25);
          border-radius: 16px;
          padding: 4px;
          margin-bottom: 16px;
          backdrop-filter: blur(8px);
          width: 100%;
        }

        .tab-btn {
          flex: 1;
          min-width: 0;
          padding: 11px 4px;
          border: none;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: var(--cream-dim);
          text-align: center;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-btn:hover {
          color: var(--cream);
          background: rgba(139,94,42,0.15);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, var(--wood-warm), var(--wood-light));
          color: var(--bark-dark);
          box-shadow: 0 2px 12px rgba(139,94,42,0.4);
        }

        /* RANGE PILLS */
        .range-pills {
          display: flex;
          flex-direction: row;
          justify-content: stretch;
          gap: 6px;
          margin-bottom: 24px;
          width: 100%;
        }

        .pill-btn {
          flex: 1;
          min-width: 0;
          padding: 9px 4px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(139,94,42,0.3);
          background: rgba(44,31,14,0.5);
          color: var(--cream-dim);
          letter-spacing: 0.03em;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pill-btn:hover {
          border-color: rgba(212,165,90,0.5);
          color: var(--cream);
        }

        .pill-btn.active {
          background: rgba(139,94,42,0.35);
          border-color: var(--grain-gold);
          color: var(--grain-bright);
          box-shadow: 0 0 12px rgba(212,165,90,0.15);
        }

        /* LEADERBOARD CARD */
        .board-card {
          background: rgba(28,18,8,0.65);
          border: 1px solid rgba(139,94,42,0.22);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(12px);
          box-shadow:
            0 1px 0 rgba(212,165,90,0.08) inset,
            0 20px 60px rgba(0,0,0,0.4);
        }

        .board-inner {
          divide-y: divide(rgba(139,94,42,0.12));
        }

        .entry-row {
          display: flex;
          align-items: center;
          padding: 14px 14px;
          border-bottom: 1px solid rgba(139,94,42,0.1);
          transition: background 0.15s ease;
          position: relative;
          gap: 0;
        }

        .entry-row:last-child {
          border-bottom: none;
        }

        .entry-row:hover {
          background: rgba(139,94,42,0.07);
        }

        .entry-row.top1 {
          background: linear-gradient(90deg, rgba(212,165,90,0.08) 0%, transparent 60%);
        }
        .entry-row.top1::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, var(--grain-bright), var(--grain-gold));
          border-radius: 0 2px 2px 0;
        }
        .entry-row.top2::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: rgba(180,180,180,0.5);
          border-radius: 0 2px 2px 0;
        }
        .entry-row.top3::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: rgba(180,120,80,0.5);
          border-radius: 0 2px 2px 0;
        }

        /* Rank */
        .rank-col {
          flex-shrink: 0;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rank-emoji { font-size: 22px; line-height: 1; }
        .rank-num {
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          font-weight: 500;
          color: rgba(184,164,136,0.3);
        }

        /* Name block */
        .name-col {
          flex: 1;
          padding: 0 10px;
          min-width: 0;
          overflow: hidden;
        }
        .entry-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--cream);
          word-break: break-word;
          line-height: 1.2;
          margin-bottom: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .entry-name.dimmed { color: var(--cream-dim); }
        .entry-meta {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: rgba(184,164,136,0.45);
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        /* Weight block */
        .weight-col {
          text-align: right;
          flex-shrink: 0;
          max-width: 110px;
        }
        .weight-main {
          font-family: 'DM Mono', monospace;
          font-size: 16px;
          font-weight: 500;
          color: var(--cream-dim);
          line-height: 1;
          white-space: nowrap;
        }
        .weight-main.gold { color: var(--grain-gold); }
        .weight-sub {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: rgba(184,164,136,0.4);
          margin-top: 4px;
          white-space: nowrap;
        }
        .weight-unit { font-size: 11px; color: rgba(184,164,136,0.5); }

        /* Loading */
        .loading {
          padding: 60px 20px;
          text-align: center;
          color: var(--cream-dim);
          font-size: 13px;
          letter-spacing: 0.1em;
          animation: pulse 1.5s ease infinite;
        }

        /* Empty */
        .empty {
          padding: 60px 20px;
          text-align: center;
          color: rgba(184,164,136,0.3);
          font-size: 13px;
        }

        /* Footer */
        footer {
          margin-top: 24px;
          text-align: center;
        }
        .footer-text {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(184,164,136,0.3);
        }

        /* Wood ring decoration */
        .log-section-label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: rgba(44,31,14,0.5);
          border-bottom: 1px solid rgba(139,94,42,0.15);
        }
        .log-ring {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid rgba(212,165,90,0.3);
          box-shadow:
            inset 0 0 0 3px rgba(44,31,14,0.9),
            inset 0 0 0 5px rgba(212,165,90,0.2),
            inset 0 0 0 8px rgba(44,31,14,0.9);
          flex-shrink: 0;
        }
        .section-label-text {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(212,165,90,0.5);
        }

        /* Responsive scale-up for larger screens */
        @media (min-width: 480px) {
          .entry-name { font-size: 15px; }
          .weight-main { font-size: 18px; }
          .weight-sub { font-size: 10px; }
          .rank-emoji { font-size: 24px; }
          .rank-num { font-size: 17px; }
          .entry-row { padding: 16px 18px; }
          .rank-col { width: 44px; }
          .name-col { padding: 0 14px; }
        }

        @media (min-width: 600px) {
          .weight-main { font-size: 20px; }
          .entry-row { padding: 16px 20px; }
          .rank-col { width: 48px; }
          .rank-emoji { font-size: 26px; }
        }
      `}</style>

      <div className="wood-bg" style={{ minHeight: '100vh' }}>
        <div className="ring-bg" />
        <div className="green-glow" />

        <div className="container">
          {/* Header */}
          <header>
            <div className="event-tag">Live</div>
            <h1>Prigl Ranking</h1>
            <p className="subtitle">Mehealer Bauernjugend</p>
          </header>

          <div className="wood-divider">
            <span>🪵</span>
          </div>

          {/* Category Tabs */}
          <div className="tabs">
            <button
              className={`tab-btn ${category === 'total' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('total')}
            >
              🪵 Schwerster <br />Prigl
            </button>
            <button
              className={`tab-btn ${category === 'per_person' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('per_person')}
            >
              👥 Gruppenwertung
            </button>
            <button
              className={`tab-btn ${category === 'solo' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('solo')}
            >
              💪 Einzelwertung
            </button>
          </div>

          {/* Range Filter */}
          <div className="range-pills">
            {rangeOptions.map((r) => (
              <button
                key={r.label}
                className={`pill-btn ${range.start === r.start ? 'active' : ''}`}
                onClick={() => {
                  setLoading(true);
                  setRange({ start: r.start, end: r.end });
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="board-card">
            <div className="log-section-label">
              <div className="log-ring" />
              <span className="section-label-text">
                Live · {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
              </span>
            </div>

            {loading ? (
              <div className="loading">Lade Daten …</div>
            ) : (
              <>
                {entries.map((entry, index) => {
                  const rank = range.start + index + 1;
                  const isTop3 = rank <= 3;
                  const weightPerPerson = entry.weight / entry.group_size;
                  const rowClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';

                  return (
                    <div key={entry.id} className={`entry-row ${rowClass}`}>
                      {/* Rank */}
                      <div className="rank-col">
                        {rank === 1 && <span className="rank-emoji">🥇</span>}
                        {rank === 2 && <span className="rank-emoji">🥈</span>}
                        {rank === 3 && <span className="rank-emoji">🥉</span>}
                        {rank > 3 && <span className="rank-num">{rank}</span>}
                      </div>

                      {/* Name & meta */}
                      <div className="name-col">
                        <div className={`entry-name ${isTop3 ? '' : 'dimmed'}`}>
                          {entry.name || 'Anonymer Stamm'}
                        </div>
                        <div className="entry-meta">
                          <span>
                            {new Date(entry.created_at).toLocaleTimeString('de-DE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>·</span>
                          <span>{entry.group_size === 1 ? 'Solo' : `${entry.group_size} Pers.`}</span>
                        </div>
                      </div>

                      {/* Weight */}
                      <div className="weight-col">
                        {category === 'total' && (
                          <>
                            <div className={`weight-main ${isTop3 ? 'gold' : ''}`}>
                              {formatWeight(entry.weight)}
                            </div>
                            {entry.group_size > 1 && (
                              <div className="weight-sub">
                                {entry.group_size} P · {formatWeight(weightPerPerson)}/P
                              </div>
                            )}
                          </>
                        )}

                        {category === 'per_person' && (
                          <>
                            <div className={`weight-main ${isTop3 ? 'gold' : ''}`}>
                              {formatWeight(weightPerPerson)}<span className="weight-unit"> /P</span>
                            </div>
                            <div className="weight-sub">
                              {entry.group_size} P · {formatWeight(entry.weight)} ges.
                            </div>
                          </>
                        )}

                        {category === 'solo' && (
                          <>
                            <div className={`weight-main ${isTop3 ? 'gold' : ''}`}>
                              {formatWeight(entry.weight)}
                            </div>
                            <div className="weight-sub">Solo</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {entries.length === 0 && (
                  <div className="empty">Keine Einträge in diesem Bereich</div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <footer>
            <p className="footer-text">Mindestgewicht 20 kg · Aktualisiert alle 30 Sek</p>
          </footer>
        </div>
      </div>
    </>
  );
}