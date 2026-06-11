'use client';

import { useState, useEffect } from 'react';
import { getAllTournaments, getTournament } from '@/tournaments';
import { TournamentConfig } from '@/types/bracket';
import BracketPredictor from '@/components/BracketPredictor';

const TOURNAMENT_META: Record<string, { emoji: string; color: string; description: string }> = {
  'olympic-sixes-2028': {
    emoji: '🏅',
    color: 'from-[#ffd700] to-[#ff8c00]',
    description: '8 nations, 2 groups, knockout rounds. Pick group rankings and predict the medal winners for LA 2028 Olympic Sixes lacrosse.',
  },
  'pll-2026': {
    emoji: '🥍',
    color: 'from-[#4ade80] to-[#22c55e]',
    description: '8 teams, 2 divisions. Predict the PLL playoff bracket — rank the divisions, pick quarterfinal through championship winners.',
  },
  'wll-2026': {
    emoji: '⚡',
    color: 'from-[#a78bfa] to-[#7c3aed]',
    description: '4 teams in the inaugural WLL season. Rank the teams and predict the semifinal and championship winners.',
  },
};

export default function Home() {
  const [selectedTournament, setSelectedTournament] = useState<TournamentConfig | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('tournament');
    const groupCode = params.get('group');
    if (slug) {
      const t = getTournament(slug);
      if (t) {
        setSelectedTournament(t);
        return;
      }
    }
    // If there's a group code but no tournament, default to Olympic Sixes
    if (groupCode) {
      const t = getTournament('olympic-sixes-2028');
      if (t) setSelectedTournament(t);
    }
  }, []);

  if (selectedTournament) {
    return <BracketPredictor tournament={selectedTournament} onBack={() => setSelectedTournament(null)} />;
  }

  const tournamentList = getAllTournaments();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white">
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
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
          {tournamentList.map((t) => {
            const meta = TOURNAMENT_META[t.id] || { emoji: '🏆', color: 'from-[#ffd700] to-[#ff8c00]', description: t.name };
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTournament(t)}
                className="w-full text-left bg-[#1a2a44] rounded-2xl p-6 border border-[#2a3a54] hover:border-[#ffd700]/50 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-[#ffd700]/10"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{meta.emoji}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">{t.shortName}</h2>
                    <p className="text-sm text-gray-400 mb-3">{meta.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${meta.color} text-black font-bold`}>
                        {t.status === 'active' ? '🔴 LIVE' : t.status === 'upcoming' ? '📅 UPCOMING' : '✅ COMPLETED'}
                      </span>
                      <span>{t.groups.reduce((sum, g) => sum + g.teams.length, 0)} teams</span>
                      <span>{t.year}</span>
                    </div>
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
      </div>
    </div>
  );
}