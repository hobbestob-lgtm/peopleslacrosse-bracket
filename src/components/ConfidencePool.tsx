'use client';

import { useState, useEffect, useCallback } from 'react';
import { TournamentConfig, Team } from '@/types/bracket';
import { WeeklySchedule, ConfidencePick } from '@/types/confidence-pool';
import { pll2026Schedule, wll2026Schedule, getCurrentWeek } from '@/tournaments/schedules';
import { validateConfidencePicks, maxPossibleScore } from '@/types/confidence-pool';
import {
  openConfidenceShareImageInNewTab,
  openConfidenceStoryImageInNewTab,
  downloadConfidenceShareImage,
  copyConfidenceShareImageToClipboard,
} from '@/lib/confidence-share-image';
import CommunityStats from '@/components/CommunityStats';

interface ConfidencePoolProps {
  tournament: TournamentConfig;
  onBack?: () => void;
}

type Step = 'picks' | 'review' | 'saved';

export default function ConfidencePool({ tournament, onBack }: ConfidencePoolProps) {
  const schedule = tournament.id === 'pll-2026' ? pll2026Schedule : wll2026Schedule;
  const currentWeek = getCurrentWeek(schedule);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [step, setStep] = useState<Step>('picks');
  const [picks, setPicks] = useState<ConfidencePick[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const weekSchedule = schedule.find(w => w.weekNumber === selectedWeek);
  const matchupCount = weekSchedule?.matchups.length || 0;

  const getTeam = useCallback((teamId: string): Team | undefined => {
    return tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId);
  }, [tournament]);

  // Check if week is locked (games started)
  const isLocked = weekSchedule ? new Date(weekSchedule.startDate) <= new Date() && weekSchedule.matchups.every(m => m.status === 'completed') : false;
  const isPast = weekSchedule ? new Date(weekSchedule.startDate) < new Date() && weekSchedule.matchups.every(m => m.status === 'completed') : false;

  // Initialize picks when week changes
  useEffect(() => {
    if (weekSchedule) {
      const newPicks: ConfidencePick[] = weekSchedule.matchups.map(m => ({
        matchupId: m.id,
        winnerId: '',  // no pick yet
        confidence: 0,  // unassigned
      }));
      setPicks(newPicks);
      setErrors([]);
      setStep('picks');
    }
  }, [selectedWeek, weekSchedule]);

  const handleWinnerPick = (matchupId: string, winnerId: string) => {
    setPicks(prev => prev.map(p => 
      p.matchupId === matchupId ? { ...p, winnerId } : p
    ));
  };

  const handleConfidencePick = (matchupId: string, confidence: number) => {
    setPicks(prev => {
      // Remove confidence from any other pick that had it
      const updated = prev.map(p => 
        p.confidence === confidence ? { ...p, confidence: 0 } : p
      );
      // Assign to this matchup
      return updated.map(p => 
        p.matchupId === matchupId ? { ...p, confidence } : p
      );
    });
  };

  const allWinnersPicked = picks.every(p => p.winnerId !== '');
  const allConfidenceAssigned = picks.every(p => p.confidence > 0) && 
    [...new Set(picks.map(p => p.confidence))].length === matchupCount;

  const handleSave = async () => {
    const validation = validateConfidencePicks(picks, matchupCount);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/confidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          weekNumber: selectedWeek,
          picks,
          displayName: displayName || 'Anonymous',
          email,
        }),
      });

      const data = await response.json() as { success: boolean; entryId?: string; error?: string };
      if (data.success) {
        setSavedId(data.entryId || null);
        setStep('saved');
      } else {
        setErrors([data.error || 'Failed to save picks']);
      }
    } catch {
      // Fallback to localStorage
      const entryId = `local_${Date.now()}`;
      localStorage.setItem(`pl_confidence_${tournament.id}_w${selectedWeek}`, JSON.stringify({
        id: entryId,
        tournamentId: tournament.id,
        weekNumber: selectedWeek,
        picks,
        displayName: displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
      }));
      setSavedId(entryId);
      setStep('saved');
    }
    setSaving(false);
  };

  const totalMaxPoints = (matchupCount * (matchupCount + 1)) / 2;

  if (!weekSchedule) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-2">No schedule available for this week</p>
          <button onClick={onBack} className="text-[#ffd700] hover:underline">← Back to tournaments</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        {/* Back button + header */}
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors mb-4 flex items-center gap-1 text-sm">
            ← All Tournaments
          </button>
        )}

        <div className="text-center mb-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ffd700] to-[#ff8c00] bg-clip-text text-transparent">
            🥍 {tournament.shortName}
          </h1>
          <p className="text-gray-400 mt-1">Confidence Pool — Pick winners, rank your confidence</p>
        </div>

        {/* Week selector */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {schedule.filter(w => w.matchups.some(m => m.status === 'upcoming') || new Date(w.startDate) >= new Date(Date.now() - 7 * 86400000)).map(w => (
            <button
              key={w.weekNumber}
              onClick={() => setSelectedWeek(w.weekNumber)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedWeek === w.weekNumber
                  ? 'bg-[#ffd700] text-black'
                  : w.matchups.every(m => m.status === 'completed')
                    ? 'bg-[#1a2a44] text-gray-500 border border-[#2a3a54]'
                    : 'bg-[#1a2a44] text-gray-300 border border-[#2a3a54] hover:border-[#ffd700]/50'
              }`}
            >
              Wk {w.weekNumber}
              {w.matchups.every(m => m.status === 'completed') && ' ✓'}
            </button>
          ))}
        </div>

        {/* Week info */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">
            {weekSchedule.venue} · {new Date(weekSchedule.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {weekSchedule.startDate !== weekSchedule.endDate && (
              <> – {new Date(weekSchedule.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
            )}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {matchupCount} game{matchupCount !== 1 ? 's' : ''} · Assign confidence 1-{matchupCount} (higher = more confident)
          </p>
        </div>

        {step === 'picks' && (
          <>
            {/* Matchup cards */}
            <div className="space-y-4">
              {weekSchedule.matchups.map((matchup) => {
                const pick = picks.find(p => p.matchupId === matchup.id);
                const homeTeam = getTeam(matchup.homeTeam);
                const awayTeam = getTeam(matchup.awayTeam);

                if (matchup.status === 'completed') {
                  return (
                    <div key={matchup.id} className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54] opacity-60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(matchup.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs bg-gray-600/30 text-gray-400 px-2 py-0.5 rounded-full">Final</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 ${matchup.homeScore! > matchup.awayScore! ? 'font-bold' : 'text-gray-400'}`}>
                          <span className="text-lg">{homeTeam?.flag}</span>
                          <span>{homeTeam?.shortName}</span>
                          <span className="text-lg font-bold">{matchup.homeScore}</span>
                        </div>
                        <span className="text-gray-600 text-sm">vs</span>
                        <div className={`flex items-center gap-2 ${matchup.awayScore! > matchup.homeScore! ? 'font-bold' : 'text-gray-400'}`}>
                          <span className="text-lg font-bold">{matchup.awayScore}</span>
                          <span>{awayTeam?.shortName}</span>
                          <span className="text-lg">{awayTeam?.flag}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={matchup.id} className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54] hover:border-[#ffd700]/30 transition-all">
                    {/* Game info */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">
                        {new Date(matchup.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {matchup.time && ` · ${matchup.time}`}
                      </span>
                      <span className="text-xs bg-[#4ade80]/20 text-[#4ade80] px-2 py-0.5 rounded-full">Open</span>
                    </div>

                    {/* Team selection */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        onClick={() => handleWinnerPick(matchup.id, matchup.homeTeam)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          pick?.winnerId === matchup.homeTeam
                            ? 'border-[#ffd700] bg-[#ffd700]/10'
                            : 'border-[#2a3a54] hover:border-[#ffd700]/50'
                        }`}
                      >
                        <span className="text-2xl block">{homeTeam?.flag}</span>
                        <span className="text-sm font-medium block mt-1">{homeTeam?.shortName}</span>
                      </button>
                      <button
                        onClick={() => handleWinnerPick(matchup.id, matchup.awayTeam)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          pick?.winnerId === matchup.awayTeam
                            ? 'border-[#ffd700] bg-[#ffd700]/10'
                            : 'border-[#2a3a54] hover:border-[#ffd700]/50'
                        }`}
                      >
                        <span className="text-2xl block">{awayTeam?.flag}</span>
                        <span className="text-sm font-medium block mt-1">{awayTeam?.shortName}</span>
                      </button>
                    </div>

                    {/* Confidence selector */}
                    {pick?.winnerId && (
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs text-gray-500 mr-2">Confidence:</span>
                        {Array.from({ length: matchupCount }, (_, i) => i + 1).map(n => (
                          <button
                            key={n}
                            onClick={() => handleConfidencePick(matchup.id, n)}
                            className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                              pick.confidence === n
                                ? 'bg-[#ffd700] text-black scale-110'
                                : picks.some(p => p.confidence === n && p.matchupId !== matchup.id)
                                  ? 'bg-[#1a1a2a] text-gray-600 cursor-not-allowed'
                                  : 'bg-[#1a1a2a] text-gray-400 hover:bg-[#2a2a3a] hover:text-white'
                            }`}
                            disabled={picks.some(p => p.confidence === n && p.matchupId !== matchup.id)}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="text-xs text-gray-500 ml-2">
                          {pick.confidence > 0 
                            ? `${pick.confidence} pt${pick.confidence > 1 ? 's' : ''} if correct` 
                            : 'Assign pts'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress indicator */}
            <div className="mt-6 p-4 bg-[#1a2a44] rounded-xl border border-[#2a3a54]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm text-[#ffd700]">
                  {picks.filter(p => p.winnerId && p.confidence > 0).length} / {matchupCount} picks
                </span>
              </div>
              <div className="w-full bg-[#0a1628] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#ffd700] to-[#ff8c00] rounded-full h-2 transition-all"
                  style={{ width: `${(picks.filter(p => p.winnerId && p.confidence > 0).length / matchupCount) * 100}%` }}
                />
              </div>
              {allWinnersPicked && allConfidenceAssigned && (
                <p className="text-center text-[#4ade80] text-sm mt-2">✓ All picks complete! Max possible: {totalMaxPoints} pts</p>
              )}
            </div>

            {/* Submit button */}
            {allWinnersPicked && allConfidenceAssigned && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setStep('review')}
                  className="bg-gradient-to-r from-[#ffd700] to-[#ff8c00] text-black font-bold py-3 px-8 rounded-xl text-lg hover:scale-105 transition-all"
                >
                  Review Picks →
                </button>
              </div>
            )}

            {errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                {errors.map((e, i) => <p key={i} className="text-red-400 text-sm">{e}</p>)}
              </div>
            )}
          </>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-4">Review Your Picks</h2>
            <p className="text-center text-gray-400 text-sm mb-6">
              Week {selectedWeek} · {weekSchedule.venue} · Max {totalMaxPoints} pts
            </p>

            {picks
              .sort((a, b) => b.confidence - a.confidence)
              .map(pick => {
                const matchup = weekSchedule.matchups.find(m => m.id === pick.matchupId);
                const team = getTeam(pick.winnerId);
                if (!matchup || !team) return null;
                return (
                  <div key={pick.matchupId} className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{team.flag}</span>
                      <div>
                        <span className="font-medium">{team.shortName}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          vs {getTeam(matchup.homeTeam === pick.winnerId ? matchup.awayTeam : matchup.homeTeam)?.shortName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#ffd700]/20 text-[#ffd700] px-2 py-1 rounded-full text-sm font-bold">
                        {pick.confidence} pt{pick.confidence > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* Name + email */}
            <div className="space-y-3 mt-6">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[#1a2a44] border border-[#2a3a54] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#ffd700] focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email (optional, for group invites)"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#1a2a44] border border-[#2a3a54] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#ffd700] focus:outline-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('picks')}
                className="flex-1 bg-[#1a2a44] text-gray-300 font-bold py-3 px-6 rounded-xl border border-[#2a3a54] hover:border-[#ffd700]/50 transition-all"
              >
                ← Edit Picks
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#ffd700] to-[#ff8c00] text-black font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Picks ✓'}
              </button>
            </div>
          </div>
        )}

        {step === 'saved' && (
          <div className="text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-[#ffd700]">Picks Saved!</h2>
            <p className="text-gray-400">
              Week {selectedWeek} confidence picks locked in.
            </p>

            {savedId && (
              <div className="bg-[#1a3a2a] rounded-xl p-4 border border-[#4ade80]/30">
                <p className="text-[#4ade80] font-bold mb-1">Your picks are saved</p>
                <p className="text-gray-400 text-sm">Share your picks with friends!</p>
              </div>
            )}

            {/* Share image section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-300">📸 Share Your Picks</h3>
              <p className="text-sm text-gray-400">Generate a branded image for Instagram & TikTok</p>

              {/* Image buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const upcomingPicks = picks.filter(p => p.winnerId && p.confidence > 0);
                    if (upcomingPicks.length > 0) {
                      openConfidenceShareImageInNewTab({
                        tournament,
                        weekSchedule: weekSchedule!,
                        picks: upcomingPicks,
                        displayName: displayName || 'Anonymous',
                        totalPoints: upcomingPicks.reduce((sum, p) => sum + p.confidence, 0),
                        maxPoints: maxPossibleScore(matchupCount),
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-[#ffd700] to-[#ff8c00] text-black font-bold py-3 px-4 rounded-xl hover:scale-105 transition-all"
                >
                  📱 Open Image
                </button>
                <button
                  onClick={() => {
                    const upcomingPicks = picks.filter(p => p.winnerId && p.confidence > 0);
                    if (upcomingPicks.length > 0) {
                      openConfidenceStoryImageInNewTab({
                        tournament,
                        weekSchedule: weekSchedule!,
                        picks: upcomingPicks,
                        displayName: displayName || 'Anonymous',
                        totalPoints: upcomingPicks.reduce((sum, p) => sum + p.confidence, 0),
                        maxPoints: maxPossibleScore(matchupCount),
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-xl hover:scale-105 transition-all"
                >
                  🎬 Story Image
                </button>
              </div>

              {/* Download + Copy */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const upcomingPicks = picks.filter(p => p.winnerId && p.confidence > 0);
                    if (upcomingPicks.length > 0) {
                      downloadConfidenceShareImage({
                        tournament,
                        weekSchedule: weekSchedule!,
                        picks: upcomingPicks,
                        displayName: displayName || 'Anonymous',
                        totalPoints: upcomingPicks.reduce((sum, p) => sum + p.confidence, 0),
                        maxPoints: maxPossibleScore(matchupCount),
                      });
                    }
                  }}
                  className="bg-[#1a2a44] text-gray-300 font-medium py-2.5 px-4 rounded-xl border border-[#2a3a54] hover:border-[#ffd700]/50 transition-all text-sm"
                >
                  💾 Download PNG
                </button>
                <button
                  onClick={async () => {
                    const upcomingPicks = picks.filter(p => p.winnerId && p.confidence > 0);
                    if (upcomingPicks.length > 0) {
                      const success = await copyConfidenceShareImageToClipboard({
                        tournament,
                        weekSchedule: weekSchedule!,
                        picks: upcomingPicks,
                        displayName: displayName || 'Anonymous',
                        totalPoints: upcomingPicks.reduce((sum, p) => sum + p.confidence, 0),
                        maxPoints: maxPossibleScore(matchupCount),
                      });
                      if (!success) alert('Copy failed — try downloading instead');
                    }
                  }}
                  className="bg-[#1a2a44] text-gray-300 font-medium py-2.5 px-4 rounded-xl border border-[#2a3a54] hover:border-[#ffd700]/50 transition-all text-sm"
                >
                  📋 Copy Image
                </button>
              </div>

              {/* Social share */}
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => {
                    const text = `🥍 My ${tournament.shortName} Week ${selectedWeek} confidence pool picks! ${totalMaxPoints} pts max. Make yours at bracket.peopleslacrosse.com/?tournament=${tournament.slug}&mode=confidence`;
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  𝕏 Share on X
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-2">
                💡 Open the image in a new tab, save it, then share on Instagram Story or TikTok!
              </p>
            </div>

            {/* Community stats */}
            <CommunityStats tournament={tournament} weekSchedule={weekSchedule!} mode="confidence" />

            <div className="pt-4">
              <button
                onClick={() => { setStep('picks'); setSelectedWeek(selectedWeek); }}
                className="text-[#ffd700] hover:underline"
              >
                ← Make picks for another week
              </button>
            </div>

            {/* Donate placeholder */}
            <div className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54]">
              <p className="text-gray-400 text-sm">☕ Support People&apos;s Lacrosse — coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}