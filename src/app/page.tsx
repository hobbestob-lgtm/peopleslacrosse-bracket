'use client';

import React, { useState, useEffect } from 'react';
import { getAllTournaments, getTournament } from '@/tournaments';
import { TournamentConfig } from '@/types/bracket';
import BracketPredictor from '@/components/BracketPredictor';
import ConfidencePool from '@/components/ConfidencePool';
import { Trophy, Target, Award, Users, AlertCircle } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useSEO } from '@/lib/use-seo';

type ViewMode = 'bracket' | 'confidence';

import { TEAM_LOGO_DATA_URIS } from '@/lib/team-logos';

// Render a tournament icon -- either a React component or a data URI string
function renderTournamentIcon(icon: any, className: string = 'w-10 h-10') {
  if (typeof icon === 'string') {
    // Resolve league- prefixed keys from data URIs
    const src = icon.startsWith('league-') ? TEAM_LOGO_DATA_URIS[icon] : icon;
    return <img src={src} alt="League logo" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', height: '2.5rem', width: 'auto' }} />;
  }
  return React.createElement(icon, { className });
}

interface GroupInviteInfo {
  id: string;
  name: string;
  inviteCode: string;
  tournamentId: string;
  memberCount: number;
}

const TOURNAMENT_META: Record<string, { icon: any; color: string; description: string; modes: ViewMode[] }> = {
  'olympic-sixes-2028': {
    icon: Award,
    color: 'from-[#ffd700] to-[#ff8c00]',
    description: '8 nations, 2 groups, knockout rounds. Pick group rankings and predict the medal winners for LA 2028 Olympic Sixes lacrosse.',
    modes: ['bracket'],
  },
  'pll-2026': {
    icon: 'league-pll',
    color: 'from-[#4ade80] to-[#22c55e]',
    description: '8 teams, 2 divisions -- predict the playoff bracket or pick weekly game winners.',
    modes: ['bracket', 'confidence'],
  },
  'wll-2026': {
    icon: 'league-wll',
    color: 'from-[#a78bfa] to-[#7c3aed]',
    description: '4 teams in the inaugural WLL season -- predict the bracket or pick weekly game winners.',
    modes: ['bracket', 'confidence'],
  },
};

const MODE_CONFIG: Record<ViewMode, { label: string; desc: string; icon: any; color: string; hoverColor: string }> = {
  bracket: {
    label: 'Tournament Bracket',
    desc: 'Predict group rankings, knockout winners & medals',
    icon: Trophy,
    color: 'from-[#ffd700] to-[#ff8c00]',
    hoverColor: 'hover:border-[#ffd700]',
  },
  confidence: {
    label: 'Weekly Picks',
    desc: 'Pick game winners each week & rank your confidence',
    icon: Target,
    color: 'from-[#4ade80] to-[#22c55e]',
    hoverColor: 'hover:border-[#4ade80]',
  },
};

export default function Home() {
  const [selectedTournament, setSelectedTournament] = useState<TournamentConfig | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('confidence');
  const [groupInvite, setGroupInvite] = useState<GroupInviteInfo | null>(null);
  const [groupError, setGroupError] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('tournament');
    const groupCode = params.get('group');
    const mode = params.get('mode');

    // If group invite code, fetch group info
    if (groupCode) {
      fetch(`/api/groups?inviteCode=${groupCode}`)
        .then(r => r.json())
        .then((data: any) => {
          if (data.success) {
            setGroupInvite(data.group);
            // Auto-select the group's tournament
            const t = getTournament(data.group.tournamentId);
            if (t) {
              setSelectedTournament(t);
              if (mode === 'bracket' || mode === 'confidence') setViewMode(mode);
              else {
                const m = TOURNAMENT_META[data.group.tournamentId];
                setViewMode(m?.modes.includes('confidence') ? 'confidence' : 'bracket');
              }
            }
          } else {
            setGroupError(data.error || 'Group not found');
          }
        })
        .catch(() => setGroupError('Failed to load group info'));
      return;
    }

    if (slug) {
      const t = getTournament(slug);
      if (t) {
        setSelectedTournament(t);
        if (mode === 'bracket' || mode === 'confidence') setViewMode(mode);
        return;
      }
    }
  }, []);

  const meta = selectedTournament ? TOURNAMENT_META[selectedTournament.id] : null;

  // Dynamic SEO metadata
  useSEO({
    title: selectedTournament
      ? `${selectedTournament.shortName} ${viewMode === 'bracket' ? 'Bracket + Picks' : 'Weekly Confidence Picks'}`
      : 'Lacrosse Bracket + Picks',
    description: selectedTournament
      ? meta?.description || `Predict the ${selectedTournament.shortName} bracket and compete with friends.`
      : 'Predict lacrosse brackets for PLL, WLL, and Olympic Sixes. Compete with friends, share your picks, and track your scores.',
    canonical: selectedTournament ? `/${viewMode}` : '/',
  });
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
        <Breadcrumbs items={[{ name: "People's Lacrosse", href: "https://peopleslacrosse.com" }, { name: 'Bracket + Picks' }]} />
        {selectedTournament ? (
          <>
            {/* Group invite banner */}
            {groupInvite && (
              <div className="bg-[#1a3a2a] border border-[#4ade80]/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-[#4ade80] shrink-0" />
                <div>
                  <p className="text-[#4ade80] font-bold">You've been invited to join "{groupInvite.name}"!</p>
                  <p className="text-gray-400 text-sm">Save your bracket to automatically join this group. {groupInvite.memberCount} member{groupInvite.memberCount !== 1 ? 's' : ''} so far.</p>
                </div>
              </div>
            )}
            {groupError && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                <p className="text-red-400">{groupError}</p>
              </div>
            )}

            <button onClick={() => setSelectedTournament(null)} className="text-gray-400 hover:text-white transition-colors mb-4 flex items-center gap-1 text-sm">
              ← Return to League Selection
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
                      {React.createElement(MODE_CONFIG[mode].icon, { className: 'w-4 h-4 inline' })} {MODE_CONFIG[mode].label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'confidence' ? (
              <ConfidencePool tournament={selectedTournament} onBack={() => setSelectedTournament(null)} groupInvite={groupInvite} />
            ) : (
              <BracketPredictor tournament={selectedTournament} onBack={() => setSelectedTournament(null)} groupInvite={groupInvite} />
            )}
          </>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <a href="https://peopleslacrosse.com" target="_blank" rel="noopener noreferrer">
                <img
                  src="/pl-logo-gold.png"
                  alt="People's Lacrosse"
                  className="h-20 mx-auto mb-4 hover:opacity-80 transition-opacity cursor-pointer"
                />
              </a>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#ffd700] to-[#ff8c00] bg-clip-text text-transparent mb-4">
                Bracket + Picks
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Pick your winners, compete with friends, share your bracket
              </p>
            </div>

            {/* Tournament cards */}
            <div className="grid gap-6">
              {getAllTournaments().map((t) => {
                const m = TOURNAMENT_META[t.id] || { icon: Trophy, color: 'from-[#ffd700] to-[#ff8c00]', description: t.name, modes: ['bracket'] as ViewMode[] };
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
                        <div className="text-[#ffd700]">{renderTournamentIcon(m.icon, 'w-10 h-10')}</div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-white mb-1">{t.shortName}</h2>
                          <p className="text-sm text-gray-400 mb-3">{m.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${m.color} text-black font-bold`}>
                              {t.status === 'active' ? '🔴 LIVE' : t.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}
                            </span>
                            <span className="bg-[#ffd700]/10 text-[#ffd700] px-2 py-0.5 rounded-full font-medium">
                              <Trophy className="w-3 h-3 inline" /> Bracket
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

                // Multi-mode tournament (PLL, WLL) -- prominent mode choice embedded in card
                return (
                  <div
                    key={t.id}
                    className="bg-[#1a2a44] rounded-2xl border border-[#2a3a54] overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="p-6 pb-3">
                      <div className="flex items-start gap-4">
                        <div className="text-[#ffd700]">{renderTournamentIcon(m.icon, 'w-10 h-10')}</div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-white mb-1">{t.shortName}</h2>
                          <p className="text-sm text-gray-400 mb-2">{m.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${m.color} text-black font-bold`}>
                              {t.status === 'active' ? '🔴 LIVE' : 'UPCOMING'}
                            </span>
                            <span>{t.groups.reduce((sum, g) => sum + g.teams.length, 0)} teams · {t.year}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mode choice -- framed subsection */}
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
                              <div className="text-[#ffd700] mb-2">{React.createElement(cfg.icon, { className: 'w-8 h-8' })}</div>
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
            <div className="mt-12 text-center">
              <a href="https://peopleslacrosse.com" target="_blank" rel="noopener noreferrer">
                <img
                  src="/pl-logo-gold.png"
                  alt="People's Lacrosse"
                  className="h-12 mx-auto mb-3 hover:opacity-80 transition-opacity cursor-pointer"
                />
              </a>
              <p className="text-sm text-gray-600">More tournaments coming soon -- NCAA, World Championship, and more</p>
              <p className="mt-2">
                <a href="https://peopleslacrosse.com" className="text-[#ffd700] hover:underline text-sm">
                  peopleslacrosse.com
                </a>
              </p>
              <p className="mt-4 text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                This is an unofficial passion project for the lacrosse community. Not affiliated with or endorsed by PLL, WLL, or World Lacrosse.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Free for non-commercial use, no modifications ·{' '}
                <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 underline">
                  CC BY-NC-ND 4.0
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}