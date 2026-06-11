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
    description: '8 teams, 2 divisions. Bracket picks or weekly confidence pools.',
    modes: ['bracket', 'confidence'],
  },
  'wll-2026': {
    emoji: '⚡',
    color: 'from-[#a78bfa] to-[#7c3aed]',
    description: '4 teams in the inaugural WLL season. Bracket picks or weekly confidence pools.',
    modes: ['bracket', 'confidence'],
  },
};

const MODE_LABELS: Record<ViewMode, { label: string; shortLabel: string; emoji: string; desc: string }> = {
  bracket: { label: 'Tournament Bracket', shortLabel: 'Bracket', emoji: '🏆', desc: 'Pick group rankings, predict knockout winners' },
  confidence: { label: 'Weekly Confidence Pool', shortLabel: 'Picks', emoji: '🎯', desc: 'Pick game winners, rank your confidence each week' },
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

  // Auto-select mode based on tournament
  useEffect(() => {
    if (selectedTournament && !availableModes.includes(viewMode)) {
      setViewMode(availableModes[0]);
    }
  }, [selectedTournament, availableModes, viewMode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        {selectedTournament ? (
          <>
            {/* Back button */}
            <button onClick={() => setSelectedTournament(null)} className="text-gray-400 hover:text-white transition-colors mb-4 flex items-center gap-1 text-sm">
              ← All Tournaments
            </button>

            {/* Mode toggle (only for PLL and WLL) */}
            {availableModes.length > 1 && (
              <div className="flex items-center justify-center mb-6">
                <div className="inline-flex bg-[#1a2a44] rounded-xl border border-[#2a3a54] p-1">
                  {availableModes.map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === mode
                          ? 'bg-gradient-to-r from-[#ffd700] to-[#ff8c00] text-black'
                          : 'text-gray-400 hover:text-white hover:bg-[#2a3a54]'
                      }`}
                    >
                      {MODE_LABELS[mode].emoji} {MODE_LABELS[mode].shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render selected mode */}
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
                return (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTournament(t); if (hasMultipleModes) setViewMode('confidence'); }}
                    className="w-full text-left bg-[#1a2a44] rounded-2xl p-6 border border-[#2a3a54] hover:border-[#ffd700]/50 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-[#ffd700]/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{m.emoji}</div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-1">{t.shortName}</h2>
                        <p className="text-sm text-gray-400 mb-3">{m.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${m.color} text-black font-bold text-xs`}>
                            {t.status === 'active' ? '🔴 LIVE' : t.status === 'upcoming' ? '📅 UPCOMING' : '✅ COMPLETED'}
                          </span>
                          {m.modes.map(mode => (
                            <span key={mode} className="bg-[#ffd700]/10 text-[#ffd700] px-2 py-0.5 rounded-full font-medium text-xs">
                              {MODE_LABELS[mode].emoji} {MODE_LABELS[mode].shortLabel}
                            </span>
                          ))}
                          <span className="text-gray-500 text-xs">{t.groups.reduce((sum, g) => sum + g.teams.length, 0)} teams</span>
                          <span className="text-gray-500 text-xs">{t.year}</span>
                        </div>
                        {hasMultipleModes && (
                          <p className="text-xs text-gray-500 mt-2">Tap to switch between 🏆 Bracket and 🎯 Weekly Picks</p>
                        )}
                      </div>
                      <div className="text-gray-500 text-2xl">→</div>
                    </div>
                  </button>
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