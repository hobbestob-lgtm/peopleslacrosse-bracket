'use client';

import { useState, useEffect } from 'react';
import { getAllTournaments, getTournament } from '@/tournaments';
import { TournamentConfig } from '@/types/bracket';
import BracketPredictor from '@/components/BracketPredictor';
import ConfidencePool from '@/components/ConfidencePool';

type ViewMode = 'bracket' | 'confidence';

const TOURNAMENT_META: Record<string, { emoji: string; color: string; description: string; modes: ViewMode[] }> = {
  'olympic-sixes-2028': {
    emoji: '🏅',
    color: 'from-[#ffd700] to-[#ff8c00]',
    description: '8 nations, 2 groups, knockout rounds. Pick group rankings and predict the medal winners for LA 2028 Olympic Sixes lacrosse.',
    modes: ['bracket'],
  },
  'pll-2026': {
    emoji: '🥍',
    color: 'from-[#4ade80] to-[#22c55e]',
    description: '8 teams, 2 divisions — predict the playoff bracket or pick weekly game winners.',
    modes: ['bracket', 'confidence'],
  },
  'wll-2026': {
    emoji: '⚡',
    color: 'from-[#a78bfa] to-[#7c3aed]',
    description: '4 teams in the inaugural WLL season — predict the bracket or pick weekly game winners.',
    modes: ['bracket', 'confidence'],
  },
};

const MODE_CONFIG: Record<ViewMode, { label: string; emoji: string; desc: string; icon: string; color: string; hoverColor: string }> = {
  bracket: {
    label: 'Tournament Bracket',
    emoji: '🏆',
    desc: 'Predict group rankings, knockout winners & medals',
    icon: '🏆',
    color: 'from-[#ffd700] to-[#ff8c00]',
    hoverColor: 'hover:border-[#ffd700]',
  },
  confidence: {
    label: 'Weekly Picks',
    emoji: '🎯',
    desc: 'Pick game winners each week & rank your confidence',
    icon: '🎯',
    color: 'from-[#4ade80] to-[#22c55e]',
    hoverColor: 'hover:border-[#4ade80]',
  },
};

export default function Home() {
  const [selectedTournament, setSelectedTournament] = useState<TournamentConfig | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('confidence');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('tournament');
    const groupCode = params.get('group');
    const mode = params.get('mode');
    if (slug) {
      const t = getTournament(slug);
      if (t) {
        setSelectedTournament(t);
        if (mode === 'bracket' || mode === 'confidence') setViewMode(mode);
        return;
      }
    }
    if (groupCode) {
      const t = getTournament('olympic-sixes-2028');
      if (t) setSelectedTournament(t);
    }
  }, []);

  const meta = selectedTournament ? TOURNAMENT_META[selectedTournament.id] : null;
  const availableModes = meta?.modes || ['bracket'];

  useEffect(() => {
    if (selectedTournament && !availableModes.includes(viewMode)) {
      setViewMode(availableModes[0]);
    }
  }, [selectedTournament, availableModes, viewMode]);

  const handleSelectTournament = (t: TournamentConfig, mode?: ViewMode) => {
    setSelectedTournament(t);
    const m = TOURNAMENT_META[t.id];
    if (mode && m?.modes.includes(mode)) {
      setViewMode(mode);
    } else if (m?.modes.includes('confidence')) {
      setViewMode('confidence');
    } else {
      setViewMode(m?.modes[0] || 'bracket');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        {selectedTournament ? (
          <>
            <button onClick={() => setSelectedTournament(null)} className="text-gray-400 hover:text-white transition-colors mb-4 flex items-center gap-1 text-sm">
              ← All Tournaments
            </button>

            {availableModes.length > 1 && (
              <div className="flex items-center justify-center mb-6">
                <div className="inline-flex bg-[#1a2a44] rounded-xl border border-[#2a3a54] p-1">
                  {availableModes.map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === mode
                          ? 'bg-gradient-to-r from-[#ffd700] to-[#ff8c00] text-black shadow-lg shadow-[#ffd700]/20'
                          : 'text-gray-400 hover:text-white hover:bg-[#2a3a54]'
                      }`}
                    >
                      {MODE_CONFIG[mode].emoji} {MODE_CONFIG[mode].label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'confidence' ? (
              <ConfidencePool tournament={selectedTournament} onBack={() => setSelectedTournament(null)} />
            ) : (
              <BracketPredictor tournament={selectedTournament} onBack={() => setSelectedTournament(null)} />
            )}
          </>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#ffd700] to-[#ff8c00] bg-clip-text text-transparent mb-4">
                🥍 Bracket Predictor
              </h1>
              <p className="text-lg text-gray-400">
                by <span className="text-[#ffd700] font-semibold">People&apos;s Lacrosse</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Pick your winners, compete with friends, share your bracket
              </p>
            </div>

            {/* Tournament cards */}
            <div className="grid gap-6">
              {getAllTournaments().map((t) => {
                const m = TOURNAMENT_META[t.id] || { emoji: '🏆', color: 'from-[#ffd700] to-[#ff8c00]', description: t.name, modes: ['bracket'] as ViewMode[] };
                const hasMultipleModes = m.modes.length > 1;

                // Single-mode tournament (Olympic Sixes)
                if (!hasMultipleModes) {
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTournament(t)}
                      className="w-full text-left bg-[#1a2a44] rounded-2xl p-6 border border-[#2a3a54] hover:border-[#ffd700]/50 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-[#ffd700]/10"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{m.emoji}</div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-white mb-1">{t.shortName}</h2>
                          <p className="text-sm text-gray-400 mb-3">{m.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${m.color} text-black font-bold`}>
                              {t.status === 'active' ? '🔴 LIVE' : t.status === 'upcoming' ? '📅 UPCOMING' : '✅ COMPLETED'}
                            </span>
                            <span className="bg-[#ffd700]/10 text-[#ffd700] px-2 py-0.5 rounded-full font-medium">
                              🏆 Bracket
                            </span>
                            <span>{t.groups.reduce((sum, g) => sum + g.teams.length, 0)} teams</span>
                            <span>{t.year}</span>
                          </div>
                        </div>
                        <div className="text-gray-500 text-2xl">→</div>
                      </div>
                    </button>
                  );
                }

                // Multi-mode tournament (PLL, WLL) — prominent mode choice embedded in card
                return (
                  <div
                    key={t.id}
                    className="bg-[#1a2a44] rounded-2xl border border-[#2a3a54] overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="p-6 pb-3">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{m.emoji}</div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-white mb-1">{t.shortName}</h2>
                          <p className="text-sm text-gray-400 mb-2">{m.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${m.color} text-black font-bold`}>
                              {t.status === 'active' ? '🔴 LIVE' : '📅 UPCOMING'}
                            </span>
                            <span>{t.groups.reduce((sum, g) => sum + g.teams.length, 0)} teams · {t.year}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mode choice — framed subsection */}
                    <div className="px-6 pb-6">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Choose your game type</p>
                      <div className="grid grid-cols-2 gap-3">
                        {m.modes.map(mode => {
                          const cfg = MODE_CONFIG[mode];
                          return (
                            <button
                              key={mode}
                              onClick={() => handleSelectTournament(t, mode)}
                              className={`group relative bg-[#0a1628] rounded-xl p-4 border-2 transition-all text-left ${cfg.hoverColor} hover:scale-[1.02] hover:shadow-lg`}
                            >
                              {/* Accent line at top */}
                              <div className={`absolute top-0 left-3 right-3 h-0.5 bg-gradient-to-r ${cfg.color} rounded-full`} />
                              <div className="text-3xl mb-2">{cfg.emoji}</div>
                              <h3 className="font-bold text-white text-sm mb-1">{cfg.label}</h3>
                              <p className="text-xs text-gray-400 leading-relaxed">{cfg.desc}</p>
                              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#ffd700] group-hover:translate-x-1 transition-transform">
                                Start now <span>→</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-sm text-gray-600">
              <p>More tournaments coming soon — NCAA, World Championship, and more</p>
              <p className="mt-2">
                <a href="https://peopleslacrosse.com" className="text-[#ffd700] hover:underline">
                  peopleslacrosse.com
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}