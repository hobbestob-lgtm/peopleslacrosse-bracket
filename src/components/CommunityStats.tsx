'use client';

import { useState, useEffect } from 'react';
import { TournamentConfig, Team } from '@/types/bracket';
import { WeeklySchedule, ConfidencePick } from '@/types/confidence-pool';
import TeamIcon from '@/components/TeamIcon';

interface CommunityStatsProps {
  tournament: TournamentConfig;
  weekSchedule?: WeeklySchedule;
  mode: 'bracket' | 'confidence';
}

interface BracketStats {
  totalBrackets: number;
  groupPickCounts: Record<string, Record<string, Record<number, number>>>;
  knockoutPickCounts: Record<string, Record<string, number>>;
  championCounts: Record<string, number>;
}

interface ConfidenceStats {
  totalEntries: number;
  matchupStats: Record<string, {
    weekNumber: number;
    teams: Record<string, { pickCount: number; totalConfidence: number; avgConfidence: number }>;
    totalPicks: number;
  }>;
}

export default function CommunityStats({ tournament, weekSchedule, mode }: CommunityStatsProps) {
  const [bracketStats, setBracketStats] = useState<BracketStats | null>(null);
  const [confidenceStats, setConfidenceStats] = useState<ConfidenceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const getTeam = (teamId: string): Team | undefined =>
    tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId);

  useEffect(() => {
    async function fetchStats() {
      try {
        const weekParam = weekSchedule ? `&week=${weekSchedule.weekNumber}` : '';
        const res = await fetch(`/api/stats?tournamentId=${tournament.id}&type=${mode}${weekParam}`);
        const data = await res.json() as { success: boolean; bracket?: BracketStats; confidence?: ConfidenceStats };
        if (data.success) {
          if (mode === 'bracket' && data.bracket) setBracketStats(data.bracket);
          if (mode === 'confidence' && data.confidence) setConfidenceStats(data.confidence);
        }
      } catch {
        // Stats are optional — fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [tournament.id, mode, weekSchedule?.weekNumber]);

  if (loading) {
    return (
      <div className="bg-[#1a2a44] rounded-xl p-6 border border-[#2a3a54]">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-[#2a3a54] rounded w-1/3" />
          <div className="h-4 bg-[#2a3a54] rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (mode === 'confidence' && confidenceStats) {
    const total = confidenceStats.totalEntries;
    if (total === 0) {
      return (
        <div className="bg-[#1a2a44] rounded-xl p-6 border border-[#2a3a54] text-center">
          <p className="text-gray-500 text-sm">No picks yet — be the first!</p>
        </div>
      );
    }

    return (
      <div className="bg-[#1a2a44] rounded-xl p-6 border border-[#2a3a54]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#ffd700]">📊 Community Picks</h3>
          <span className="text-sm text-gray-400">{total} pick{total !== 1 ? 's' : ''}</span>
        </div>

        {weekSchedule && Object.entries(confidenceStats.matchupStats)
          .sort(([, a], [, b]) => (b.totalPicks) - (a.totalPicks))
          .map(([matchupId, stats]) => {
            const matchup = weekSchedule.matchups.find(m => m.id === matchupId);
            if (!matchup) return null;

            const teams = Object.entries(stats.teams).sort(([, a], [, b]) => b.pickCount - a.pickCount);
            const totalPicksForMatchup = stats.totalPicks;

            return (
              <div key={matchupId} className="mb-4 last:mb-0">
                {teams.map(([teamId, teamStats]) => {
                  const team = getTeam(teamId);
                  const pct = totalPicksForMatchup > 0 ? Math.round((teamStats.pickCount / totalPicksForMatchup) * 100) : 0;
                  return (
                    <div key={teamId} className="flex items-center gap-2 mb-1.5">
                      <TeamIcon team={team!} size={20} className="mr-1" />
                      <span className="text-sm font-medium text-white w-24 truncate">{team?.shortName}</span>
                      <div className="flex-1 bg-[#0a1628] rounded-full h-5 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#ffd700] to-[#ff8c00] h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {pct}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 w-16 text-right">
                        avg {teamStats.avgConfidence.toFixed(1)} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    );
  }

  if (mode === 'bracket' && bracketStats) {
    const total = bracketStats.totalBrackets;
    if (total === 0) {
      return (
        <div className="bg-[#1a2a44] rounded-xl p-6 border border-[#2a3a54] text-center">
          <p className="text-gray-500 text-sm">No brackets yet — be the first!</p>
        </div>
      );
    }

    return (
      <div className="bg-[#1a2a44] rounded-xl p-6 border border-[#2a3a54]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#ffd700]">📊 Community Picks</h3>
          <span className="text-sm text-gray-400">{total} bracket{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Champion picks */}
        {Object.keys(bracketStats.championCounts).length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-300 mb-3">🏆 Picked to Win Gold</h4>
            {Object.entries(bracketStats.championCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([teamId, count]) => {
                const team = getTeam(teamId);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={teamId} className="flex items-center gap-2 mb-2">
                    <TeamIcon team={team!} size={20} className="mr-1" />
                    <span className="text-sm font-medium text-white w-28 truncate">{team?.name}</span>
                    <div className="flex-1 bg-[#0a1628] rounded-full h-5 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#ffd700] to-[#ff8c00] h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Group position picks */}
        {Object.entries(bracketStats.groupPickCounts).map(([groupId, teamPositions]) => {
          const group = tournament.groups.find(g => g.id === groupId);
          if (!group) return null;
          return (
            <div key={groupId} className="mb-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2">{group.name} Positions</h4>
              {group.teams.map(team => {
                const positions = teamPositions[team.id];
                if (!positions) return null;
                const topPosition = Object.entries(positions).sort(([, a], [, b]) => b - a)[0];
                if (!topPosition) return null;
                const posNum = parseInt(topPosition[0]);
                const count = topPosition[1];
                const pct = Math.round((count / total) * 100);
                const posLabel = posNum === 1 ? '1st' : posNum === 2 ? '2nd' : posNum === 3 ? '3rd' : `${posNum}th`;
                return (
                  <div key={team.id} className="flex items-center gap-2 mb-1.5">
                    <TeamIcon team={team} size={20} className="mr-1" />
                    <span className="text-sm font-medium text-white w-24 truncate">{team.shortName}</span>
                    <div className="flex-1 bg-[#0a1628] rounded-full h-4 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] h-full rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {pct}% {posLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}