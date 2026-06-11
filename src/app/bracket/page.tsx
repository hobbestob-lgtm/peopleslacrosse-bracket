'use client';

import { useState, useEffect } from 'react';
import { getTournament } from '@/tournaments';

export default function BracketViewPage() {
  const [bracket, setBracket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState<string | null>(null);
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const groupCode = params.get('group');

    if (groupCode) {
      fetch(`/api/groups?inviteCode=${groupCode}`)
        .then((res: any) => res.json())
        .then((data: any) => {
          if (data.success) {
            setGroupName(data.group.name);
            // Load tournament config from group
            const t = getTournament(data.group.tournamentId);
            if (t) setTournament(t);
          }
        })
        .catch(() => {});
    }

    if (!id) {
      if (groupCode) {
        window.location.href = `/?group=${groupCode}`;
        return;
      }
      setError('No bracket ID provided');
      setLoading(false);
      return;
    }
    fetch(`/api/brackets?bracketId=${id}`)
      .then((res: any) => res.json())
      .then((data: any) => {
        if (data.success) {
          setBracket(data.bracket);
          // Load tournament config
          const t = getTournament(data.bracket.tournamentId);
          if (t) setTournament(t);
        } else {
          setError(data.error || 'Bracket not found');
        }
      })
      .catch(() => setError('Failed to load bracket'))
      .finally(() => setLoading(false));
  }, []);

  const getTeamInfo = (teamId: string) => {
    if (!tournament) return { name: teamId, flag: '🏳️' };
    const team = tournament.groups.flatMap((g: any) => g.teams).find((t: any) => t.id === teamId);
    return team ? { name: team.name, flag: team.flag } : { name: teamId, flag: '🏳️' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-[#ffd700] text-xl">Loading bracket...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌ {error}</div>
          <a href="/" className="text-[#ffd700] hover:underline">← Back to Bracket Predictor</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ffd700] to-[#ff8c00] bg-clip-text text-transparent">
            🥍 {tournament?.shortName || 'Bracket Prediction'}
          </h1>
          <p className="text-gray-400 mt-1">by {bracket?.displayName || 'Anonymous'}</p>
        </div>

        {/* Group banner */}
        {groupName && (
          <div className="bg-[#1a3a2a] rounded-xl p-3 border border-[#4ade80]/30 mb-4 text-center">
            <p className="text-[#4ade80] font-bold">👥 Part of &ldquo;{groupName}&rdquo;</p>
          </div>
        )}

        {/* Group Stage */}
        {tournament?.groups?.map((group: any) => {
          const groupPick = bracket?.groupPicks?.find((gp: any) => gp.groupId === group.id);
          if (!groupPick) return null;
          return (
            <div key={group.id} className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54] mb-4">
              <h3 className="text-lg font-bold mb-3 text-center">{group.name}</h3>
              <div className="space-y-2">
                {groupPick.positions.map((teamId: string, idx: number) => {
                  const team = getTeamInfo(teamId);
                  const advances = idx < (group.teams.length > 4 ? 2 : 1); // top 2 for 4+ teams
                  return (
                    <div key={teamId} className={`flex items-center gap-3 p-3 rounded-lg ${
                      advances ? 'bg-[#1a3a2a] border border-[#2a5a3a]' : 'bg-[#1a1a2a] border border-[#2a2a3a]'
                    }`}>
                      <span className={`text-lg font-bold w-8 text-center ${advances ? 'text-[#4ade80]' : 'text-gray-500'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-2xl">{team.flag}</span>
                      <span className="flex-1 font-medium">{team.name}</span>
                      {advances && <span className="text-xs bg-[#4ade80]/20 text-[#4ade80] px-2 py-0.5 rounded-full">Advances</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Knockout Stage */}
        {bracket?.knockoutPicks?.length > 0 && (
          <div className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54] mb-4">
            <h3 className="text-lg font-bold mb-3 text-center">Knockout Stage</h3>
            <div className="space-y-2">
              {bracket.knockoutPicks.map((pick: any) => {
                const team = getTeamInfo(pick.winnerId);
                return (
                  <div key={pick.matchId} className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2a] border border-[#2a2a3a]">
                    <span className="text-sm text-gray-500 w-20">{formatRound(pick.matchId)}</span>
                    <span className="text-2xl">{team.flag}</span>
                    <span className="flex-1 font-medium">{team.name}</span>
                    <span className="text-xs bg-[#ffd700]/20 text-[#ffd700] px-2 py-0.5 rounded-full">Winner</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <a href="/" className="bg-[#ffd700] hover:bg-[#ffcc00] text-black font-bold py-3 px-8 rounded-xl text-lg transition-all hover:scale-105 inline-block">
            Make Your Own Picks →
          </a>
        </div>
      </div>
    </div>
  );
}

function formatRound(matchId: string): string {
  if (matchId.startsWith('qf') || matchId.startsWith('wll-qf')) return 'Quarterfinal';
  if (matchId.startsWith('sf') || matchId.startsWith('wll-sf')) return 'Semifinal';
  if (matchId === 'bronze' || matchId === 'wll-bronze') return 'Bronze';
  if (matchId === 'gold' || matchId === 'wll-gold') return 'Gold';
  return matchId;
}