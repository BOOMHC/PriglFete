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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [category]);

  async function fetchLeaderboard() {
    try {
      let query = supabase
        .from('baumstamm_entries')
        .select('*')
        .gte('weight', 20)
        .limit(500);

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
        sorted = sorted.sort(
          (a, b) => b.weight / b.group_size - a.weight / a.group_size
        );
      }

      setEntries(sorted.slice(0, 3));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toLocaleString('de-DE', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })} t`;
    }
    return `${kg.toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} kg`;
  };

  const handleCategoryChange = (cat: Category) => {
    setLoading(true);
    setCategory(cat);
  };

  const getDisplayWeight = (entry: BaumstammEntry) => {
    if (category === 'per_person') return formatWeight(entry.weight / entry.group_size);
    return formatWeight(entry.weight);
  };

  const getSubLine = (entry: BaumstammEntry) => {
    if (category === 'per_person') {
      return `${entry.group_size} P · ${formatWeight(entry.weight)} ges.`;
    }
    if (category === 'solo') return 'Solo';
    if (entry.group_size > 1)
      return `${entry.group_size} P · ${formatWeight(entry.weight / entry.group_size)}/P`;
    return 'Solo';
  };

  // Podium order: silver (2nd) · gold (1st) · bronze (3rd)
  const podium = [
    { data: entries[1], rank: 2 },
    { data: entries[0], rank: 1 },
    { data: entries[2], rank: 3 },
  ];

  const medals = ['🥈', '🥇', '🥉'];
  const platformNums = ['2', '1', '3'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap');

        :root {
          --bark-dark: #1a1208;
          --bark-mid: #2c1f0e;
          --wood-warm: #8b5e2a;
          --wood-light: #c4884a;
          --grain-gold: #d4a55a;
          --grain-bright: #f0c070;
          --leaf-green: #6aab50;
          --cream: #f5ead8;
          --cream-dim: #b8a488;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; touch-action: manipulation; }

        body {
          background-color: var(--bark-dark);
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          min-height: 100dvh;
          overflow-x: hidden;
        }

        /* ── BACKGROUNDS ── */
        .wood-bg {
          background-color: var(--bark-dark);
          background-image:
            repeating-linear-gradient(92deg, transparent, transparent 2px, rgba(139,94,42,0.03) 2px, rgba(139,94,42,0.03) 4px),
            repeating-linear-gradient(180deg, transparent, transparent 60px, rgba(60,43,20,0.15) 60px, rgba(60,43,20,0.15) 62px);
        }

        .ring-bg {
          position: fixed;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 700px;
          border-radius: 50%;
          box-shadow:
            0 0 0 1px rgba(212,165,90,0.06),
            0 0 0 40px rgba(212,165,90,0.04),
            0 0 0 80px rgba(212,165,90,0.03),
            0 0 0 130px rgba(212,165,90,0.025),
            0 0 0 190px rgba(212,165,90,0.02),
            0 0 0 260px rgba(212,165,90,0.015),
            0 0 0 340px rgba(212,165,90,0.01);
          pointer-events: none; z-index: 0;
        }

        .green-glow {
          position: fixed;
          bottom: -100px; right: -100px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74,122,58,0.15) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .gold-aura {
          position: fixed;
          top: 38%; left: 50%;
          transform: translate(-50%, -50%);
          width: 440px; height: 440px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,165,90,0.08) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
          animation: auraPulse 5s ease-in-out infinite;
        }
        @keyframes auraPulse {
          0%,100% { opacity:.55; transform: translate(-50%,-50%) scale(1); }
          50%      { opacity:1;  transform: translate(-50%,-50%) scale(1.1); }
        }

        /* ── LAYOUT ── */
        .container {
          position: relative;
          max-width: 640px;
          margin: 0 auto;
          padding: 20px 12px calc(48px + env(safe-area-inset-bottom));
          padding-left: max(12px, env(safe-area-inset-left));
          padding-right: max(12px, env(safe-area-inset-right));
          z-index: 1; width: 100%;
        }

        /* ── HEADER ── */
        header {
          text-align: center;
          margin-bottom: 26px;
          padding-top: 16px;
        }

        .event-tag {
          display: inline-flex;
          align-items: center; gap: 8px;
          background: rgba(58,92,42,0.3);
          border: 1px solid rgba(106,171,80,0.35);
          border-radius: 999px;
          padding: 5px 16px;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #8dce6e;
          margin-bottom: 14px;
        }
        .event-tag::before {
          content: '';
          display: inline-block;
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--leaf-green);
          box-shadow: 0 0 8px var(--leaf-green);
          animation: blink 2s infinite;
        }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.35; } }

        h1 {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: clamp(2.4rem, 8vw, 3.5rem);
          line-height: 1.15; letter-spacing: -0.02em;
          background: linear-gradient(160deg, var(--grain-bright) 0%, var(--grain-gold) 40%, var(--wood-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          padding-bottom: 0.1em;
        }

        .subtitle {
          font-size: 13px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #d4c4a8; margin-top: 8px;
        }

        /* ── DIVIDER ── */
        .wood-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 0 auto 24px; max-width: 320px;
        }
        .wood-divider::before, .wood-divider::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,165,90,0.35), transparent);
        }
        .wood-divider span { font-size: 16px; }

        /* ── TABS ── */
        .tabs {
          display: flex; flex-direction: row; gap: 3px;
          background: rgba(44,31,14,0.7);
          border: 1px solid rgba(139,94,42,0.25);
          border-radius: 16px; padding: 4px;
          margin-bottom: 28px;
          backdrop-filter: blur(8px); width: 100%;
        }
        .tab-btn {
          flex: 1; min-width: 0;
          padding: 10px 6px; border: none; border-radius: 12px;
          font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
          background: transparent; color: #c8b490;
          text-align: center; min-height: 52px;
          -webkit-tap-highlight-color: transparent;
          white-space: normal; word-break: break-word; line-height: 1.3;

        }
        .tab-btn:hover { color: var(--cream); background: rgba(139,94,42,0.15); }
        .tab-btn.active {
          background: linear-gradient(135deg, var(--wood-warm), var(--wood-light));
          color: #1a1208;
          box-shadow: 0 2px 12px rgba(139,94,42,0.4);
        }

        /* ── LIVE LABEL ── */
        .live-label {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-bottom: 20px;
        }
        .log-ring {
          width: 18px; height: 18px; border-radius: 50%;
          border: 1px solid rgba(212,165,90,0.3);
          box-shadow:
            inset 0 0 0 2px rgba(26,18,8,0.9),
            inset 0 0 0 4px rgba(212,165,90,0.18),
            inset 0 0 0 6px rgba(26,18,8,0.9);
          flex-shrink: 0;
        }
        .live-text {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(212,165,90,0.65);
        }

        /* ── PODIUM ── */
        .podium-stage {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 8px;
          margin-bottom: 32px;
          position: relative;
        }
        .podium-stage::after {
          content: '';
          position: absolute;
          bottom: 0; left: 4%; right: 4%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,165,90,0.22), transparent);
        }

        .podium-col {
          flex: 1;
          display: flex; flex-direction: column; align-items: center;
          max-width: 200px;
        }

        /* ── CARD ── */
        .podium-card {
          width: 100%;
          border-radius: 18px;
          padding: 16px 10px 14px;
          display: flex; flex-direction: column; align-items: center;
          gap: 6px;
          position: relative;
          backdrop-filter: blur(12px);
          border: 1px solid;
          animation: cardRise 0.45s ease both;
        }
        @keyframes cardRise {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Gold */
        .rank-1 {
          background: rgba(212,165,90,0.10);
          border-color: rgba(212,165,90,0.44);
          box-shadow:
            0 0 0 1px rgba(212,165,90,0.07) inset,
            0 10px 50px rgba(212,165,90,0.20),
            0 0 90px rgba(212,165,90,0.05);
          padding-top: 26px;
          animation-delay: 0s;
        }
        /* Silver */
        .rank-2 {
          background: rgba(200,210,220,0.07);
          border-color: rgba(185,200,215,0.27);
          box-shadow: 0 6px 28px rgba(0,0,0,0.28);
          animation-delay: 0.1s;
        }
        /* Bronze */
        .rank-3 {
          background: rgba(175,108,55,0.09);
          border-color: rgba(175,108,55,0.29);
          box-shadow: 0 6px 28px rgba(0,0,0,0.28);
          animation-delay: 0.2s;
        }

        /* Crown */
        .crown {
          position: absolute;
          top: -20px; left: 50%;
          transform: translateX(-50%);
          font-size: 26px; line-height: 1;
          filter: drop-shadow(0 0 10px rgba(212,165,90,0.85));
          animation: crownBob 3.5s ease-in-out infinite;
        }
        @keyframes crownBob {
          0%,100% { transform: translateX(-50%) translateY(0) rotate(-3deg); }
          50%      { transform: translateX(-50%) translateY(-5px) rotate(3deg); }
        }

        /* Medal emoji */
        .medal { font-size: 28px; line-height: 1; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5)); }
        .rank-1 .medal {
          font-size: 40px;
          filter: drop-shadow(0 0 14px rgba(212,165,90,0.7));
          animation: medalPulse 2.8s ease-in-out infinite;
        }
        @keyframes medalPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.1); } }

        /* Name */
        .p-name {
          font-family: 'Playfair Display', serif;
          font-weight: 700; font-size: 15px;
          text-align: center; line-height: 1.25;
          color: var(--cream); word-break: break-word;
        }
        .rank-1 .p-name {
          font-size: 18px;
          background: linear-gradient(135deg, var(--grain-bright) 0%, var(--grain-gold) 60%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .rank-2 .p-name { color: #e8f0f8; }
        .rank-3 .p-name { color: #eedcc8; }

        /* Weight */
        .p-weight {
          font-family: 'DM Mono', monospace;
          font-weight: 500; line-height: 1;
          text-align: center; white-space: nowrap;
        }
        .rank-1 .p-weight {
          font-size: clamp(20px, 6vw, 28px);
          color: var(--grain-gold);
          text-shadow: 0 0 24px rgba(212,165,90,0.4);
        }
        .rank-2 .p-weight { font-size: clamp(16px, 4.5vw, 21px); color: #d0dde8; }
        .rank-3 .p-weight { font-size: clamp(16px, 4.5vw, 21px); color: #ddb888; }

        .p-unit { font-size: 0.65em; opacity: 0.8; }

        .p-sub {
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: rgba(220,200,170,0.65);
          text-align: center;
        }
        .p-time {
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: rgba(200,180,150,0.50);
          text-align: center;
        }

        /* ── PLATFORM ── */
        .podium-platform {
          width: 100%; border-radius: 8px 8px 4px 4px;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; flex-shrink: 0;
        }
        .podium-platform::before {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(
            90deg, transparent, transparent 10px,
            rgba(0,0,0,0.06) 10px, rgba(0,0,0,0.06) 11px
          );
        }
        .platform-1 {
          height: 88px;
          background: linear-gradient(180deg, rgba(212,165,90,0.36) 0%, rgba(139,94,42,0.20) 100%);
          border: 1px solid rgba(212,165,90,0.26);
          box-shadow: 0 6px 24px rgba(212,165,90,0.16), inset 0 1px 0 rgba(212,165,90,0.32);
        }
        .platform-2 {
          height: 60px;
          background: linear-gradient(180deg, rgba(185,200,215,0.18) 0%, rgba(115,130,145,0.10) 100%);
          border: 1px solid rgba(185,200,215,0.16);
          box-shadow: 0 4px 16px rgba(0,0,0,0.22);
        }
        .platform-3 {
          height: 42px;
          background: linear-gradient(180deg, rgba(175,108,55,0.20) 0%, rgba(95,62,28,0.10) 100%);
          border: 1px solid rgba(175,108,55,0.16);
          box-shadow: 0 4px 16px rgba(0,0,0,0.22);
        }
        .platform-num {
          font-family: 'Playfair Display', serif;
          font-weight: 900; position: relative; z-index: 1; user-select: none;
        }
        .platform-1 .platform-num { font-size: 38px; color: rgba(212,165,90,0.60); }
        .platform-2 .platform-num { font-size: 24px; color: rgba(210,225,240,0.45); }
        .platform-3 .platform-num { font-size: 20px; color: rgba(200,140,90,0.45); }

        /* ── EMPTY SLOT ── */
        .podium-empty-card {
          width: 100%; border-radius: 18px; padding: 26px 10px;
          border: 1px dashed rgba(139,94,42,0.16);
          display: flex; align-items: center; justify-content: center;
        }
        .podium-empty-card span {
          font-size: 9px; color: rgba(184,164,136,0.15);
          letter-spacing: 0.12em; text-transform: uppercase;
        }

        /* ── LOADING / EMPTY STATE ── */
        .loading {
          padding: 80px 20px; text-align: center;
          color: #c8b490; font-size: 14px; letter-spacing: 0.1em;
          animation: blink 1.5s ease infinite;
        }
        .empty-state {
          padding: 80px 20px; text-align: center;
          color: rgba(200,180,150,0.50); font-size: 15px;
        }

        /* ── FOOTER ── */
        footer { margin-top: 20px; text-align: center; }
        .footer-text {
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(200,180,150,0.45);
        }

        /* ── RESPONSIVE ── */
        @media (min-width: 400px) {
          .p-name { font-size: 16px !important; }
          .rank-1 .p-name { font-size: 19px !important; }
          .medal { font-size: 32px; }
          .rank-1 .medal { font-size: 46px; }
        }
        @media (min-width: 540px) {
          .podium-col { max-width: 210px; }
          .p-sub, .p-time { font-size: 12px; }
          .podium-stage { gap: 12px; }
        }
      `}</style>

      <div className="wood-bg" style={{ minHeight: '100vh' }}>
        <div className="ring-bg" />
        <div className="green-glow" />
        <div className="gold-aura" />

        <div className="container">

          {/* ── Header ── */}
          <header>
            <div className="event-tag">Live</div>
            <h1>Prigl Ranking</h1>
            <p className="subtitle">Mehealer Bauernjugend</p>
          </header>

          <div className="wood-divider"><span>🪵</span></div>

          {/* ── Tabs ── */}
          <div className="tabs">
            <button
              className={`tab-btn ${category === 'total' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('total')}
            >
              🪵 Schwerster<br />Prigl
            </button>
            <button
              className={`tab-btn ${category === 'per_person' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('per_person')}
            >
              👥<br />Gruppen
            </button>
            <button
              className={`tab-btn ${category === 'solo' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('solo')}
            >
              💪<br />Einzelwertung
            </button>
          </div>

          {/* ── Live label ── */}
          <div className="live-label">
            <div className="log-ring" />
            <span className="live-text">
              Live · {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            </span>
          </div>

          {/* ── Podium / Loading / Empty ── */}
          {loading ? (
            <div className="loading">Lade Daten …</div>
          ) : entries.length === 0 ? (
            <div className="empty-state">Noch keine Einträge vorhanden</div>
          ) : (
            <div className="podium-stage">
              {podium.map(({ data: entry, rank }, i) => (
                <div key={rank} className="podium-col">
                  {entry ? (
                    <div className={`podium-card rank-${rank}`}>
                      {rank === 1 && <span className="crown">👑</span>}
                      <span className="medal">{medals[i]}</span>
                      <div className="p-name">{entry.name || 'Anonymer Stamm'}</div>
                      <div className="p-weight">
                        {getDisplayWeight(entry)}
                        {category === 'per_person' && <span className="p-unit">/P</span>}
                      </div>
                      <div className="p-sub">{getSubLine(entry)}</div>
                      <div className="p-time">
                        {new Date(entry.created_at).toLocaleTimeString('de-DE', {
                          hour: '2-digit', minute: '2-digit',
                        })} Uhr
                      </div>
                    </div>
                  ) : (
                    <div className="podium-empty-card"><span>–</span></div>
                  )}
                  <div className={`podium-platform platform-${rank}`}>
                    <span className="platform-num">{platformNums[i]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Footer ── */}
          <footer>
            <p className="footer-text">Mindestgewicht 20 kg · Aktualisiert alle 30 Sek</p>
          </footer>

        </div>
      </div>
    </>
  );
}