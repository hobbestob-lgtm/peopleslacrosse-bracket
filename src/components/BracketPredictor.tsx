'use client';

import { useState, useCallback } from 'react';
import { BracketPick, TournamentConfig, Team, GroupPick, KnockoutPick } from '@/types/bracket';
import { resolveKnockoutMatchTeams } from '@/lib/bracket-engine';
import { Award, Trophy, ClipboardList, ClipboardCopy, CheckCircle, Link, Users, Share2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { LacrosseStick } from '@/components/CustomIcons';
import TeamIcon from '@/components/TeamIcon';
import { createBracket, collectEmail } from '@/lib/storage';
import { downloadShareImage, copyShareImageToClipboard, generateShareImage } from '@/lib/share-image';
import CommunityStats from '@/components/CommunityStats';

// Helper to render team record badge (on its own line below team name)
function recordBadge(record?: string) {
  if (!record) return null;
  const [w, l] = record.split('-').map(Number);
  const color = w > l ? 'bg-[#4ade80]/20 text-[#4ade80]' : w < l ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400';
  return <span className={`block text-xs px-1.5 py-0.5 rounded w-fit ${color}`}>{record}</span>;
}

// Helper to render team name with record on next line
function teamNameWithRecord(name: string, record?: string, shortName?: string) {
  const displayName = shortName || name;
  if (!record) return <span className="font-medium">{displayName}</span>;
  const [w, l] = record.split('-').map(Number);
  const color = w > l ? 'bg-[#4ade80]/20 text-[#4ade80]' : w < l ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400';
  return (
    <span className="flex flex-col leading-tight">
      <span className="font-medium">{displayName}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded w-fit ${color}`}>{record}</span>
    </span>
  );
}

interface BracketPredictorProps {
  tournament: TournamentConfig;
  onBack?: () => void;
  groupInvite?: { id: string; name: string; inviteCode: string; tournamentId: string; memberCount: number } | null;
}

type Step = 'groups' | 'quarterfinals' | 'semifinals' | 'medals' | 'review';

export default function BracketPredictor({ tournament, onBack, groupInvite }: BracketPredictorProps) {
  const [step, setStep] = useState<Step>('groups');
  const [groupPicks, setGroupPicks] = useState<GroupPick[]>(
    tournament.groups.map(g => ({ groupId: g.id, positions: g.teams.map(t => t.id) }))
  );
  const [knockoutPicks, setKnockoutPicks] = useState<KnockoutPick[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const [saved, setSaved] = useState(false);
  const [bracketId, setBracketId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [groupCopied, setGroupCopied] = useState(false);

  // Clipboard helper with fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Ensure window is focused (iOS Safari sometimes loses focus)
      window.focus();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback for insecure contexts or older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  };
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [joinedGroup, setJoinedGroup] = useState<{id: string; name: string; inviteCode: string} | null>(null);
  const [joinError, setJoinError] = useState('');
  const [createGroupName, setCreateGroupName] = useState('');
  const [createdGroup, setCreatedGroup] = useState<{id: string; name: string; inviteCode: string} | null>(null);
  const [showGroupSection, setShowGroupSection] = useState(false);
  const [imageDownloading, setImageDownloading] = useState(false);

  // Move team up in group position
  const moveTeamUp = (groupId: string, index: number) => {
    if (index === 0) return;
    setGroupPicks(prev => prev.map(gp => {
      if (gp.groupId !== groupId) return gp;
      const newPositions = [...gp.positions];
      [newPositions[index - 1], newPositions[index]] = [newPositions[index], newPositions[index - 1]];
      return { ...gp, positions: newPositions };
    }));
  };

  // Move team down in group position
  const moveTeamDown = (groupId: string, index: number) => {
    const group = tournament.groups.find(g => g.id === groupId)!;
    if (index >= group.teams.length - 1) return;
    setGroupPicks(prev => prev.map(gp => {
      if (gp.groupId !== groupId) return gp;
      const newPositions = [...gp.positions];
      [newPositions[index], newPositions[index + 1]] = [newPositions[index + 1], newPositions[index]];
      return { ...gp, positions: newPositions };
    }));
  };

  // Set knockout match winner
  const setKnockoutWinner = (matchId: string, winnerId: string) => {
    setKnockoutPicks(prev => {
      const existing = prev.findIndex(kp => kp.matchId === matchId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { matchId, winnerId };
        return updated;
      }
      return [...prev, { matchId, winnerId }];
    });
  };

  // Get team by ID
  const getTeam = (teamId: string): Team | undefined => {
    return tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId);
  };

  // Resolve knockout matchups from current picks
  const resolvedMatches = resolveKnockoutMatchTeams(groupPicks, knockoutPicks, tournament);

  // Steps definition
  const steps: { key: Step; label: string }[] = [
    { key: 'groups', label: 'Group Stage' },
    { key: 'quarterfinals', label: 'Quarterfinals' },
    { key: 'semifinals', label: 'Semifinals' },
    { key: 'medals', label: 'Medals' },
    { key: 'review', label: 'Review & Save' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  // Save bracket
  const saveBracket = useCallback(async () => {
    if (!email || !isValidEmail(email)) return;
    setSaving(true);
    try {
      // Save to D1 via API
      const res = await fetch('/api/brackets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          email,
          displayName: displayName || email.split('@')[0],
          groupPicks,
          knockoutPicks,
          thirdPlacePicks: [],
        }),
      });
      const data: any = await res.json();

      if (data.success) {
        setBracketId(data.bracketId);
        setSaved(true);
        // Also save locally as backup
        createBracket(tournament.id, email, displayName || email.split('@')[0], groupPicks, knockoutPicks, []);
        // Collect email
        await fetch('/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            tournamentId: tournament.id,
            displayName: displayName || email.split('@')[0],
            bracketId: data.bracketId,
          }),
        });
        // Auto-join group if invite code available
        const inviteCode = groupInvite?.inviteCode || new URLSearchParams(window.location.search).get('group');
        if (inviteCode) {
          try {
            const joinRes = await fetch('/api/groups/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inviteCode,
                bracketId: data.bracketId,
                email,
                displayName: displayName || email.split('@')[0],
              }),
            });
            const joinData: any = await joinRes.json();
            if (joinData.success) {
              setJoinedGroup(joinData.group);
            }
          } catch (e) {
            console.error('Auto-join group error:', e);
          }
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      // Fallback: save locally
      const bracket = createBracket(tournament.id, email, displayName || email.split('@')[0], groupPicks, knockoutPicks, []);
      setBracketId(bracket.id);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [email, displayName, groupPicks, knockoutPicks, tournament.id]);

  // Create a new group
  const createGroup = useCallback(async () => {
    if (!createGroupName || !bracketId || !email) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createGroupName,
          tournamentId: tournament.id,
          createdByEmail: email,
          createdByName: displayName || email.split('@')[0],
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setCreatedGroup(data.group);
        // Also join the group we just created
        await fetch('/api/groups/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: data.group.inviteCode,
            bracketId,
            email,
            displayName: displayName || email.split('@')[0],
          }),
        });
        setCreateGroupName('');
      }
    } catch (err) {
      console.error('Create group error:', err);
    }
  }, [createGroupName, bracketId, email, displayName, tournament.id]);

  // Join an existing group
  const joinGroup = useCallback(async () => {
    if (!joinGroupCode || !bracketId || !email) return;
    setJoinError('');
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: joinGroupCode,
          bracketId,
          email,
          displayName: displayName || email.split('@')[0],
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setJoinedGroup(data.group);
        setJoinGroupCode('');
      } else {
        setJoinError(data.error || 'Failed to join group');
      }
    } catch (err) {
      setJoinError('Failed to join group');
    }
  }, [joinGroupCode, bracketId, email, displayName]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center mb-2">
          <a href="https://peopleslacrosse.com" target="_blank" rel="noopener noreferrer">
            <img
              src="/pl-logo-gold.png"
              alt="People's Lacrosse"
              className="h-14 mx-auto mb-2 hover:opacity-80 transition-opacity cursor-pointer"
            />
          </a>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ffd700] to-[#ff8c00] bg-clip-text text-transparent">
            {tournament.shortName}
          </h1>
          <p className="text-gray-400 mt-1">Bracket Predictor</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between gap-1">
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => {
                if (i <= currentStepIndex + 1) setStep(s.key);
              }}
              className={`flex-1 py-2 px-2 text-xs md:text-sm rounded-lg transition-all ${
                i === currentStepIndex
                  ? 'bg-[#ffd700] text-black font-bold'
                  : i < currentStepIndex
                  ? 'bg-[#1a3a5c] text-[#ffd700]'
                  : 'bg-[#0f2035] text-gray-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4">
        {step === 'groups' && (
          <GroupStage
            tournament={tournament}
            groupPicks={groupPicks}
            moveTeamUp={moveTeamUp}
            moveTeamDown={moveTeamDown}
            onNext={() => setStep('quarterfinals')}
          />
        )}

        {step === 'quarterfinals' && (
          <KnockoutRound
            tournament={tournament}
            round="quarterfinal"
            resolvedMatches={resolvedMatches}
            knockoutPicks={knockoutPicks}
            setKnockoutWinner={setKnockoutWinner}
            getTeam={getTeam}
            onBack={() => setStep('groups')}
            onNext={() => setStep('semifinals')}
            nextLabel="Semifinals"
          />
        )}

        {step === 'semifinals' && (
          <KnockoutRound
            tournament={tournament}
            round="semifinal"
            resolvedMatches={resolvedMatches}
            knockoutPicks={knockoutPicks}
            setKnockoutWinner={setKnockoutWinner}
            getTeam={getTeam}
            onBack={() => setStep('quarterfinals')}
            onNext={() => setStep('medals')}
            nextLabel="Medals"
          />
        )}

        {step === 'medals' && (
          <MedalRound
            tournament={tournament}
            resolvedMatches={resolvedMatches}
            knockoutPicks={knockoutPicks}
            setKnockoutWinner={setKnockoutWinner}
            getTeam={getTeam}
            onBack={() => setStep('semifinals')}
            onNext={() => setStep('review')}
          />
        )}

        {step === 'review' && (
          <ReviewSave
            tournament={tournament}
            groupPicks={groupPicks}
            knockoutPicks={knockoutPicks}
            resolvedMatches={resolvedMatches}
            getTeam={getTeam}
            email={email}
            setEmail={setEmail}
            displayName={displayName}
            setDisplayName={setDisplayName}
            saving={saving}
            saved={saved}
            bracketId={bracketId}
            onSave={saveBracket}
            onBack={() => setStep('medals')}
            copied={copied}
            setCopied={setCopied}
            linkCopied={linkCopied}
            setLinkCopied={setLinkCopied}
            groupCopied={groupCopied}
            setGroupCopied={setGroupCopied}
            joinGroupCode={joinGroupCode}
            setJoinGroupCode={setJoinGroupCode}
            joinedGroup={joinedGroup}
            joinError={joinError}
            joinGroup={joinGroup}
            createGroupName={createGroupName}
            setCreateGroupName={setCreateGroupName}
            createdGroup={createdGroup}
            createGroup={createGroup}
            showGroupSection={showGroupSection}
            setShowGroupSection={setShowGroupSection}
            imageDownloading={imageDownloading}
            setImageDownloading={setImageDownloading}
            shareUrl={bracketId ? `${window.location.origin}/bracket?id=${bracketId}` : ''}
            groupInvite={groupInvite}
            copyToClipboard={copyToClipboard}
            isValidEmail={isValidEmail}
          />
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function GroupStage({
  tournament,
  groupPicks,
  moveTeamUp,
  moveTeamDown,
  onNext,
}: {
  tournament: TournamentConfig;
  groupPicks: GroupPick[];
  moveTeamUp: (groupId: string, index: number) => void;
  moveTeamDown: (groupId: string, index: number) => void;
  onNext: () => void;
}) {
  const getTeam = (teamId: string) =>
    tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId)!;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-[#ffd700] flex items-center gap-2"><LacrosseStick className="w-5 h-5" /> Rank teams in each group</h2>
      <p className="text-gray-400 mb-6 text-sm">
        Drag or use arrows to rank teams 1st through 4th. 1st and 2nd advance to knockouts.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {tournament.groups.map(group => {
          const gp = groupPicks.find(p => p.groupId === group.id)!;
          return (
            <div key={group.id} className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54]">
              <h3 className="text-lg font-bold mb-3 text-center">{group.name}</h3>
              <div className="space-y-2">
                {gp.positions.map((teamId, index) => {
                  const team = getTeam(teamId);
                  const isAdvancing = index < 2; // Top 2 advance
                  return (
                    <div
                      key={teamId}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isAdvancing
                          ? 'bg-[#1a3a2a] border border-[#2a5a3a]'
                          : 'bg-[#1a1a2a] border border-[#2a2a3a]'
                      }`}
                    >
                      <span className={`text-lg font-bold w-8 text-center ${
                        isAdvancing ? 'text-[#4ade80]' : 'text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <TeamIcon team={team} size={24} />
                      <span className="flex-1">{team.name}{recordBadge(team.record)}</span>
                      {isAdvancing && (
                        <span className="text-xs bg-[#4ade80]/20 text-[#4ade80] px-2 py-0.5 rounded-full">
                          Advances
                        </span>
                      )}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveTeamUp(group.id, index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-white disabled:text-gray-700 text-lg leading-none"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveTeamDown(group.id, index)}
                          disabled={index === group.teams.length - 1}
                          className="text-gray-400 hover:text-white disabled:text-gray-700 text-lg leading-none"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onNext}
          className="bg-[#ffd700] hover:bg-[#ffcc00] text-black font-bold py-3 px-8 rounded-xl text-lg transition-all hover:scale-105"
        >
          Continue to Knockouts →
        </button>
      </div>
    </div>
  );
}

function KnockoutRound({
  tournament,
  round,
  resolvedMatches,
  knockoutPicks,
  setKnockoutWinner,
  getTeam,
  onBack,
  onNext,
  nextLabel,
}: {
  tournament: TournamentConfig;
  round: 'quarterfinal' | 'semifinal';
  resolvedMatches: Record<string, { team1: Team | null; team2: Team | null }>;
  knockoutPicks: KnockoutPick[];
  setKnockoutWinner: (matchId: string, winnerId: string) => void;
  getTeam: (id: string) => Team | undefined;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const matches = tournament.knockoutMatches.filter(m => m.round === round);
  const roundName = round === 'quarterfinal' ? 'Quarterfinals' : 'Semifinals';

  const allPicked = matches.every(m =>
    knockoutPicks.some(kp => kp.matchId === m.id)
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-[#ffd700]">
        {round === 'quarterfinal' ? <Award className="w-5 h-5 inline" /> : <Trophy className="w-5 h-5 inline" />} Pick {roundName} Winners
      </h2>

      <div className="space-y-4">
        {matches.map(match => {
          const teams = resolvedMatches[match.id];
          const pick = knockoutPicks.find(kp => kp.matchId === match.id);
          const team1 = teams?.team1;
          const team2 = teams?.team2;
          const bothTeams = team1 && team2;

          return (
            <div key={match.id} className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54]">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{match.id.toUpperCase()}</p>
              {bothTeams ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setKnockoutWinner(match.id, team1.id)}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                      pick?.winnerId === team1.id
                        ? 'border-[#ffd700] bg-[#ffd700]/10'
                        : 'border-[#2a3a54] hover:border-[#ffd700]/50'
                    }`}
                  >
                    <TeamIcon team={team1} size={24} className="mr-2" />
                    <span>{teamNameWithRecord(team1.name, team1.record, team1.shortName)}</span>
                  </button>
                  <span className="text-gray-500 font-bold">VS</span>
                  <button
                    onClick={() => setKnockoutWinner(match.id, team2.id)}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                      pick?.winnerId === team2.id
                        ? 'border-[#ffd700] bg-[#ffd700]/10'
                        : 'border-[#2a3a54] hover:border-[#ffd700]/50'
                    }`}
                  >
                    <TeamIcon team={team2} size={24} className="mr-2" />
                    <span>{teamNameWithRecord(team2.name, team2.record, team2.shortName)}</span>
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  ⏳ Complete previous rounds to reveal matchups
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="bg-[#1a2a44] hover:bg-[#2a3a54] text-gray-300 font-bold py-3 px-6 rounded-xl transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!allPicked}
          className="bg-[#ffd700] hover:bg-[#ffcc00] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-8 rounded-xl text-lg transition-all hover:scale-105 disabled:hover:scale-100"
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  );
}

function MedalRound({
  tournament,
  resolvedMatches,
  knockoutPicks,
  setKnockoutWinner,
  getTeam,
  onBack,
  onNext,
}: {
  tournament: TournamentConfig;
  resolvedMatches: Record<string, { team1: Team | null; team2: Team | null }>;
  knockoutPicks: KnockoutPick[];
  setKnockoutWinner: (matchId: string, winnerId: string) => void;
  getTeam: (id: string) => Team | undefined;
  onBack: () => void;
  onNext: () => void;
}) {
  const bronzeMatch = tournament.knockoutMatches.find(m => m.round === 'bronze')!;
  const goldMatch = tournament.knockoutMatches.find(m => m.round === 'gold')!;
  const bronzeTeams = resolvedMatches[bronzeMatch.id];
  const goldTeams = resolvedMatches[goldMatch.id];
  const bronzePick = knockoutPicks.find(kp => kp.matchId === bronzeMatch.id);
  const goldPick = knockoutPicks.find(kp => kp.matchId === goldMatch.id);
  const allPicked = bronzePick && goldPick;

  const championTeam = goldPick ? getTeam(goldPick.winnerId) : null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-[#ffd700] flex items-center gap-2"><Award className="w-5 h-5" /> Pick Medal Winners</h2>

      {/* Gold medal match */}
      <div className="bg-[#1a2a44] rounded-xl p-5 border-2 border-[#ffd700]/30 mb-6">
        <p className="text-center text-sm text-[#ffd700] font-bold uppercase tracking-wider mb-3">
          🥇 Gold Medal Match
        </p>
        {goldTeams?.team1 && goldTeams?.team2 ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setKnockoutWinner(goldMatch.id, goldTeams.team1!.id)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all text-center ${
                goldPick?.winnerId === goldTeams.team1!.id
                  ? 'border-[#ffd700] bg-[#ffd700]/10'
                  : 'border-[#2a3a54] hover:border-[#ffd700]/50'
              }`}
            >
              <span className="text-3xl block mb-1"><TeamIcon team={goldTeams.team1!} size={32} /></span>
              <span>{teamNameWithRecord(goldTeams.team1!.name, goldTeams.team1!.record, goldTeams.team1!.shortName)}</span>
            </button>
            <span className="text-[#ffd700] font-bold text-xl">VS</span>
            <button
              onClick={() => setKnockoutWinner(goldMatch.id, goldTeams.team2!.id)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all text-center ${
                goldPick?.winnerId === goldTeams.team2!.id
                  ? 'border-[#ffd700] bg-[#ffd700]/10'
                  : 'border-[#2a3a54] hover:border-[#ffd700]/50'
              }`}
            >
              <span className="text-3xl block mb-1"><TeamIcon team={goldTeams.team2!} size={32} /></span>
              <span>{teamNameWithRecord(goldTeams.team2!.name, goldTeams.team2!.record, goldTeams.team2!.shortName)}</span>
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            ⏳ Complete semifinals to reveal gold medal matchup
          </div>
        )}
      </div>

      {/* Bronze medal match */}
      <div className="bg-[#1a2a44] rounded-xl p-5 border border-[#cd7f32]/30 mb-6">
        <p className="text-center text-sm text-[#cd7f32] font-bold uppercase tracking-wider mb-3">
          🥉 Bronze Medal Match
        </p>
        {bronzeTeams?.team1 && bronzeTeams?.team2 ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setKnockoutWinner(bronzeMatch.id, bronzeTeams.team1!.id)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all text-center ${
                bronzePick?.winnerId === bronzeTeams.team1!.id
                  ? 'border-[#cd7f32] bg-[#cd7f32]/10'
                  : 'border-[#2a3a54] hover:border-[#cd7f32]/50'
              }`}
            >
              <span className="text-2xl block mb-1"><TeamIcon team={bronzeTeams.team1!} size={24} /></span>
              <span>{teamNameWithRecord(bronzeTeams.team1!.name, bronzeTeams.team1!.record, bronzeTeams.team1!.shortName)}</span>
            </button>
            <span className="text-[#cd7f32] font-bold text-xl">VS</span>
            <button
              onClick={() => setKnockoutWinner(bronzeMatch.id, bronzeTeams.team2!.id)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all text-center ${
                bronzePick?.winnerId === bronzeTeams.team2!.id
                  ? 'border-[#cd7f32] bg-[#cd7f32]/10'
                  : 'border-[#2a3a54] hover:border-[#cd7f32]/50'
              }`}
            >
              <span className="text-2xl block mb-1"><TeamIcon team={bronzeTeams.team2!} size={24} /></span>
              <span>{teamNameWithRecord(bronzeTeams.team2!.name, bronzeTeams.team2!.record, bronzeTeams.team2!.shortName)}</span>
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            ⏳ Complete semifinals to reveal bronze medal matchup
          </div>
        )}
      </div>

      {/* Champion preview */}
      {championTeam && (
        <div className="text-center mb-6 p-4 bg-gradient-to-r from-[#ffd700]/10 to-[#ff8c00]/10 rounded-xl border border-[#ffd700]/30">
          <p className="text-sm text-gray-400">Your predicted champion:</p>
          <p className="text-3xl mt-1"><TeamIcon team={championTeam} size={32} /></p>
          <p className="text-xl font-bold text-[#ffd700] flex flex-col items-center"><span>{championTeam.name}</span>{championTeam.record && <span className="text-sm text-gray-400">({championTeam.record})</span>}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-[#1a2a44] hover:bg-[#2a3a54] text-gray-300 font-bold py-3 px-6 rounded-xl transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!allPicked}
          className="bg-[#ffd700] hover:bg-[#ffcc00] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-8 rounded-xl text-lg transition-all hover:scale-105 disabled:hover:scale-100"
        >
          Review Bracket →
        </button>
      </div>
    </div>
  );
}

function ReviewSave({
  tournament,
  groupPicks,
  knockoutPicks,
  resolvedMatches,
  getTeam,
  email,
  setEmail,
  displayName,
  setDisplayName,
  saving,
  saved,
  bracketId,
  onSave,
  onBack,
  copied,
  setCopied,
  linkCopied,
  setLinkCopied,
  groupCopied,
  setGroupCopied,
  joinGroupCode,
  setJoinGroupCode,
  joinedGroup,
  joinError,
  joinGroup,
  createGroupName,
  setCreateGroupName,
  createdGroup,
  createGroup,
  showGroupSection,
  setShowGroupSection,
  imageDownloading,
  setImageDownloading,
  shareUrl,
  groupInvite,
  copyToClipboard,
  isValidEmail,
}: {
  tournament: TournamentConfig;
  groupPicks: GroupPick[];
  knockoutPicks: KnockoutPick[];
  resolvedMatches: Record<string, { team1: Team | null; team2: Team | null }>;
  getTeam: (id: string) => Team | undefined;
  email: string;
  setEmail: (e: string) => void;
  displayName: string;
  setDisplayName: (n: string) => void;
  saving: boolean;
  saved: boolean;
  bracketId: string | null;
  onSave: () => void;
  onBack: () => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
  linkCopied: boolean;
  setLinkCopied: (v: boolean) => void;
  groupCopied: boolean;
  setGroupCopied: (v: boolean) => void;
  joinGroupCode: string;
  setJoinGroupCode: (v: string) => void;
  joinedGroup: { id: string; name: string; inviteCode: string } | null;
  joinError: string;
  joinGroup: () => void;
  createGroupName: string;
  setCreateGroupName: (v: string) => void;
  createdGroup: { id: string; name: string; inviteCode: string } | null;
  createGroup: () => void;
  showGroupSection: boolean;
  setShowGroupSection: (v: boolean) => void;
  imageDownloading: boolean;
  setImageDownloading: (v: boolean) => void;
  shareUrl: string;
  groupInvite?: { id: string; name: string; inviteCode: string; tournamentId: string; memberCount: number } | null;
  copyToClipboard: (text: string) => Promise<boolean>;
  isValidEmail: (email: string) => boolean;
}) {
  // Build a summary of all picks
  const champion = knockoutPicks.find(kp => kp.matchId === 'gold')
    ? getTeam(knockoutPicks.find(kp => kp.matchId === 'gold')!.winnerId)
    : null;

  const bronze = knockoutPicks.find(kp => kp.matchId === 'bronze')
    ? getTeam(knockoutPicks.find(kp => kp.matchId === 'bronze')!.winnerId)
    : null;

  // Generate share image
  const handleDownloadImage = async () => {
    setImageDownloading(true);
    try {
      await downloadShareImage({
        tournament,
        groupPicks,
        knockoutPicks,
        championTeam: champion ?? null,
        bronzeTeam: bronze ?? null,
        displayName: displayName || email.split('@')[0],
      });
    } catch (e) {
      console.error('Image download error:', e);
    } finally {
      setImageDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    try {
      // Ensure window is focused (iOS Safari sometimes loses focus)
      window.focus();

      // Generate the image first, THEN try clipboard copy
      const blob = await generateShareImage({
        tournament,
        groupPicks,
        knockoutPicks,
        championTeam: champion ?? null,
        bronzeTeam: bronze ?? null,
        displayName: displayName || email.split('@')[0],
      });

      // Try ClipboardItem (modern browsers, needs user gesture)
      // Must check for ClipboardItem API availability first
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch {
          // ClipboardItem failed (e.g., user gesture expired) — fall through to download
        }
      }

      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lacrosse-bracket-${tournament.slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Copy image error:', e);
      await handleDownloadImage();
    }
  };

  const handleViewImage = async () => {
    try {
      setImageDownloading(true);
      const blob = await generateShareImage({
        tournament,
        groupPicks,
        knockoutPicks,
        championTeam: champion ?? null,
        bronzeTeam: bronze ?? null,
        displayName: displayName || email.split('@')[0],
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke after a delay so the new tab can load it
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      console.error('View image error:', e);
    } finally {
      setImageDownloading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-5 text-[#ffd700] flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Review Your Bracket</h2>

      {/* ── Group Stage Section ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-[#2a3a54]" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Group Stage</h3>
          <div className="h-px flex-1 bg-[#2a3a54]" />
        </div>
        {tournament.groups.map(group => {
          const gp = groupPicks.find(p => p.groupId === group.id)!;
          return (
            <div key={group.id} className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54] mb-2">
              <h4 className="font-bold text-[#ffd700] mb-2 text-sm">{group.name}</h4>
              <div className="space-y-1.5">
                {gp.positions.map((teamId, i) => {
                  const team = getTeam(teamId)!;
                  return (
                    <div key={teamId} className={`flex items-center gap-2.5 text-sm py-1 px-2 rounded-lg ${i < 2 ? 'bg-[#4ade80]/5' : ''}`}>
                      <span className={`font-bold w-5 ${i < 2 ? 'text-[#4ade80]' : 'text-gray-600'}`}>
                        {i + 1}.
                      </span>
                      <TeamIcon team={team} size={18} />
                      <span className={`flex-1 flex flex-col leading-tight ${i < 2 ? 'text-white' : 'text-gray-400'}`}>
                        <span>{team.name}</span>
                        {recordBadge(team.record)}
                      </span>
                      {i < 2 && <span className="text-[#4ade80] text-xs ml-auto font-medium">✓ Advances</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Knockout Rounds Section ── */}
      {['quarterfinal', 'semifinal'].map(round => {
        const matches = tournament.knockoutMatches.filter(m => m.round === round);
        const roundName = round === 'quarterfinal' ? 'Quarterfinals' : 'Semifinals';
        return (
          <div key={round} className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-[#2a3a54]" />
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{roundName}</h3>
              <div className="h-px flex-1 bg-[#2a3a54]" />
            </div>
            <div className="space-y-2">
              {matches.map(match => {
                const pick = knockoutPicks.find(kp => kp.matchId === match.id);
                const teams = resolvedMatches[match.id];
                return (
                  <div key={match.id} className="bg-[#1a2a44] rounded-lg px-4 py-2.5 border border-[#2a3a54] flex items-center gap-2 text-sm">
                    <span className="text-gray-600 text-xs w-10 shrink-0">{match.id.toUpperCase()}</span>
                    {teams?.team1 && <TeamIcon team={teams.team1} size={16} />}
                    <span className="text-gray-500">vs</span>
                    {teams?.team2 && <TeamIcon team={teams.team2} size={16} />}
                    {pick && (
                      <span className="text-[#ffd700] font-bold ml-auto flex items-center gap-1.5">
                        → <TeamIcon team={getTeam(pick.winnerId)!} size={16} /> {teamNameWithRecord(getTeam(pick.winnerId)?.name || '', getTeam(pick.winnerId)?.record, getTeam(pick.winnerId)?.shortName)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Medal Picks Section ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-[#2a3a54]" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Medal Picks</h3>
          <div className="h-px flex-1 bg-[#2a3a54]" />
        </div>
        <div className="bg-gradient-to-b from-[#ffd700]/8 to-transparent rounded-xl p-4 border border-[#ffd700]/20">
          {champion && (
            <div className="text-center mb-3">
              <span className="text-3xl"><TeamIcon team={champion} size={28} /></span>
              <p className="text-lg font-bold text-[#ffd700]">🥇 <span className="flex flex-col leading-tight"><span>{champion.shortName || champion.name}</span>{champion.record && <span className="text-sm text-gray-400">({champion.record})</span>}</span></p>
            </div>
          )}
          {champion && bronze && <div className="h-px bg-[#cd7f32]/20 my-2" />}
          {bronze && (
            <div className="text-center">
              <span className="text-2xl"><TeamIcon team={bronze} size={22} /></span>
              <p className="text-sm font-bold text-[#cd7f32]">🥉 <span className="flex flex-col leading-tight"><span>{bronze.shortName || bronze.name}</span>{bronze.record && <span className="text-xs text-gray-400">({bronze.record})</span>}</span></p>
            </div>
          )}
        </div>
      </div>

      {/* ── Share Image (always available — no email needed) ── */}
      <div className="flex items-center gap-2 my-2">
        <div className="h-px flex-1 bg-[#2a3a54]" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Share</span>
        <div className="h-px flex-1 bg-[#2a3a54]" />
      </div>

      <div className="bg-[#1a2a44] rounded-xl p-5 border border-[#2a3a54]">
        <h3 className="font-bold text-lg mb-3">📱 Save & Share Your Bracket</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleViewImage}
            disabled={imageDownloading}
            className="bg-[#ffd700] hover:bg-[#ffcc00] disabled:bg-gray-600 text-black font-bold py-3 px-5 rounded-xl transition-all flex items-center gap-2"
          >
            {imageDownloading ? '⏳ Generating...' : '🔍 View Image'}
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={imageDownloading}
            className="bg-[#1a2a44] hover:bg-[#2a3a54] text-white font-bold py-3 px-5 rounded-xl border border-[#2a3a54] transition-all flex items-center gap-2"
          >
            📥 Download
          </button>
          <button
            onClick={handleCopyImage}
            className="bg-[#1a2a44] hover:bg-[#2a3a54] text-white font-bold py-3 px-5 rounded-xl border border-[#2a3a54] transition-all flex items-center gap-2"
          >
            {copied ? <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Copied!</span> : <span className="flex items-center gap-1"><ClipboardCopy className="w-4 h-4" /> Copy Image</span>}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">💡 <strong>Best on mobile:</strong> Tap "View Image" → long-press the image → Save to Photos or Download.</p>

        {/* Social share — image-based platforms (no link needed) */}
        <div className="mt-4 pt-4 border-t border-[#2a3a54]">
          <p className="text-sm text-gray-400 mb-3">Share your bracket image on social</p>
          <div className="flex gap-3 flex-wrap">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="white" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="white"/></svg>
              Instagram Story
            </a>
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#010101] hover:bg-gray-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 border border-gray-700"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.17V11.7a4.83 4.83 0 01-3.77-1.64z"/></svg>
              TikTok
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 Tip: Save your bracket image first, then share it on Instagram or TikTok!</p>
        </div>
      </div>

      {/* Save form */}
      {!saved ? (
        <div className="bg-[#1a2a44] rounded-xl p-6 border border-[#2a3a54]">
          <h3 className="font-bold text-lg mb-2">💾 Save Your Bracket</h3>
          <p className="text-sm text-gray-400 mb-4">Save to get a shareable link, edit later, and create or join groups.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full bg-[#0a1628] border rounded-lg px-4 py-2 text-white focus:outline-none ${email && !isValidEmail(email) ? 'border-red-500/60 focus:border-red-400' : 'border-[#2a3a54] focus:border-[#ffd700]'}`}
              />
              {email && !isValidEmail(email) ? (
                <p className="text-xs text-red-400 mt-1">Please enter a valid email address</p>
              ) : groupInvite ? (
                <p className="text-xs text-[#4ade80] mt-1">Required to join "{groupInvite.name}"</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">We'll send you a link to edit your bracket</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="LaxFan42"
                className="w-full bg-[#0a1628] border border-[#2a3a54] rounded-lg px-4 py-2 text-white focus:border-[#ffd700] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={onBack}
              className="bg-[#1a2a44] hover:bg-[#2a3a54] text-gray-300 font-bold py-3 px-6 rounded-xl transition-all"
            >
              ← Back
            </button>
            <button
              onClick={onSave}
              disabled={saving || !email || !isValidEmail(email)}
              className="bg-[#ffd700] hover:bg-[#ffcc00] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-8 rounded-xl text-lg transition-all hover:scale-105 disabled:hover:scale-100"
            >
              {saving ? 'Saving...' : '💾 Save Bracket'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Success banner */}
          <div className="bg-[#1a3a2a] rounded-xl p-6 border border-[#4ade80]/30 text-center">
            <p className="text-2xl mb-2 flex items-center justify-center gap-2"><CheckCircle className="w-6 h-6" /> Bracket Saved Successfully!</p>
            <p className="text-gray-400">Your {tournament.shortName} picks are locked in.</p>
            {displayName && (
              <p className="text-[#ffd700] mt-1 font-bold">- {displayName}'s bracket -</p>
            )}
          </div>

          {/* Auto-joined group notification */}
          {joinedGroup && (
            <div className="bg-[#1a2a44] rounded-xl p-4 border border-[#4ade80]/30">
              <p className="text-[#4ade80] font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> You've joined "{joinedGroup.name}"!</p>
              <p className="text-gray-400 text-sm mt-1">Your bracket has been added to this group.</p>
              <a href={`/group?id=${joinedGroup.id}`} className="text-[#ffd700] hover:underline text-sm mt-2 inline-block">View Leaderboard →</a>
            </div>
          )}

          {/* ── Share Link (only after saving) ── */}
          <div className="bg-[#1a2a44] rounded-xl p-5 border border-[#2a3a54]">
            <h3 className="font-bold text-lg mb-3">🔗 Share Your Bracket Link</h3>
            <div className="flex gap-3 flex-wrap">
              {shareUrl && (
                <button
                  onClick={async () => {
                    const ok = await copyToClipboard(shareUrl);
                    if (ok) { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }
                  }}
                  className="bg-[#ffd700] hover:bg-[#ffcc00] text-black font-bold py-3 px-5 rounded-xl transition-all flex items-center gap-2"
                >
                  <Link className="w-4 h-4" /> {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
              )}
            </div>
            {shareUrl && (
              <div className="mt-3 bg-[#0a1628] rounded-lg p-2">
                <code className="text-sm text-[#ffd700] break-all">{shareUrl}</code>
              </div>
            )}

            {/* Post on X — needs share link */}
            {shareUrl && (
              <div className="mt-4 pt-4 border-t border-[#2a3a54]">
                <div className="flex gap-3 flex-wrap">
                  <a
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Check out my ${tournament.shortName} bracket predictions! ${shareUrl} ${tournament.id === 'olympic-sixes-2028' ? '#Lacrosse #OlympicSixes #Sixes #BracketPredictor' : tournament.id === 'wll-2026' ? '#Lacrosse #WLL #BracketPredictor' : '#Lacrosse #PLL #BracketPredictor'}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black hover:bg-gray-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 border border-gray-700"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Post on X
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── Groups Section ── */}
          <div className="flex items-center gap-2 my-2">
            <div className="h-px flex-1 bg-[#2a3a54]" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Groups</span>
            <div className="h-px flex-1 bg-[#2a3a54]" />
          </div>

          {/* Group section */}
          <div className="bg-[#1a2a44] rounded-xl p-5 border border-[#2a3a54]">
            <button
              onClick={() => setShowGroupSection(!showGroupSection)}
              className="w-full text-left flex items-center justify-between"
            >
              <h3 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5" /> Create or Join a Group</h3>
              <span className="text-gray-500">{showGroupSection ? '▲' : '▼'}</span>
            </button>

            {showGroupSection && (
              <div className="mt-4 space-y-4">
                {/* Join group */}
                {!joinedGroup && !createdGroup && (
                  <div className="border border-[#2a3a54] rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Have a group invite code?</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={joinGroupCode}
                        onChange={(e) => setJoinGroupCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        maxLength={8}
                        className="flex-1 bg-[#0a1628] border border-[#2a3a54] rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-[#ffd700] focus:outline-none"
                      />
                      <button
                        onClick={joinGroup}
                        disabled={!joinGroupCode}
                        className="bg-[#ffd700] hover:bg-[#ffcc00] disabled:bg-gray-600 text-black font-bold px-4 rounded-lg"
                      >
                        Join
                      </button>
                    </div>
                    {joinError && <p className="text-red-400 text-sm mt-2">{joinError}</p>}
                  </div>
                )}

                {/* Create group */}
                {!createdGroup && (
                  <div className="border border-[#2a3a54] rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Create a new group to compete with friends</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={createGroupName}
                        onChange={(e) => setCreateGroupName(e.target.value)}
                        placeholder="e.g. Friday Lax Crew"
                        className="flex-1 bg-[#0a1628] border border-[#2a3a54] rounded-lg px-3 py-2 text-white focus:border-[#ffd700] focus:outline-none"
                      />
                      <button
                        onClick={createGroup}
                        disabled={!createGroupName}
                        className="bg-[#4ade80] hover:bg-[#22c55e] disabled:bg-gray-600 text-black font-bold px-4 rounded-lg"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                {/* Created group success */}
                {createdGroup && (
                  <div className="bg-[#1a3a2a] rounded-lg p-4 border border-[#4ade80]/30">
                    <p className="text-[#4ade80] font-bold mb-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Group Created!</p>
                    <p className="text-white font-bold">{createdGroup.name}</p>
                    <a href={`/group?id=${createdGroup.id}`} className="text-[#ffd700] hover:underline text-sm mt-1 inline-block">View Leaderboard →</a>
                    <div className="mt-3 bg-[#0a1628] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Share this invite code with friends:</p>
                      <p className="text-[#ffd700] font-mono text-xl font-bold text-center">{createdGroup.inviteCode}</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-1">Or share this link:</p>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-[#0a1628] rounded px-3 py-2 text-sm text-[#ffd700] truncate">
                          {shareUrl}?group={createdGroup.inviteCode}
                        </code>
                        <button
                          onClick={async () => {
                            const ok = await copyToClipboard(`${shareUrl}?group=${createdGroup.inviteCode}`);
                            if (ok) { setGroupCopied(true); setTimeout(() => setGroupCopied(false), 2000); }
                          }}
                          className="bg-[#1a2a44] hover:bg-[#2a3a54] text-white px-3 rounded-lg border border-[#2a3a54]"
                        >
                          <ClipboardCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Joined group success */}
                {joinedGroup && !createdGroup && (
                  <div className="bg-[#1a3a2a] rounded-lg p-4 border border-[#4ade80]/30">
                    <p className="text-[#4ade80] font-bold mb-1">You've joined "{joinedGroup.name}"!</p>
                    <p className="text-gray-400 text-sm">Your bracket has been added to this group.</p>
                  </div>
                )}
              </div>
            )}

            {/* Copy group invite link — always show at bottom if there's a group */}
            {(createdGroup || joinedGroup || groupInvite) && (
              <div className="mt-3 pt-3 border-t border-[#2a3a54]">
                <button
                  onClick={async () => {
                    const inviteCode = createdGroup?.inviteCode || joinedGroup?.inviteCode || groupInvite?.inviteCode;
                    if (inviteCode) {
                      const ok = await copyToClipboard(`${window.location.origin}/?group=${inviteCode}`);
                      if (ok) { setGroupCopied(true); setTimeout(() => setGroupCopied(false), 2000); }
                    }
                  }}
                  className="w-full bg-[#1a2a44] hover:bg-[#2a3a54] text-white font-bold py-3 px-5 rounded-xl border border-[#2a3a54] transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" /> {groupCopied ? 'Copied!' : 'Copy Group Invite Link'}
                </button>
                <p className="text-xs text-gray-500 mt-1.5 text-center">Share this link so friends can join your group</p>
                <a href="/my-groups" className="text-[#ffd700] hover:underline text-sm mt-2 inline-block text-center w-full">View All My Groups →</a>
              </div>
            )}
          </div>

          {/* ── Community Section ── */}
          <div className="flex items-center gap-2 my-2">
            <div className="h-px flex-1 bg-[#2a3a54]" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Community</span>
            <div className="h-px flex-1 bg-[#2a3a54]" />
          </div>

          {/* Community stats */}
          <CommunityStats tournament={tournament} mode="bracket" />

          {/* Donate placeholder */}
          <div className="bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54] border-dashed">
            <div className="flex items-center gap-3">
              <span className="text-2xl">☕</span>
              <div>
                <p className="text-sm text-gray-300">Love the bracket predictor?</p>
                <p className="text-xs text-gray-500">Support coming soon - stay tuned!</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <a
              href="/"
              className="flex-1 bg-[#ffd700] hover:bg-[#ffcc00] text-black font-bold py-3 px-6 rounded-xl text-center transition-all"
            >
              🏠 Go to Dashboard
            </a>
            {shareUrl && (
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#1a2a44] hover:bg-[#2a3a54] text-white font-bold py-3 px-6 rounded-xl border border-[#2a3a54] text-center transition-all"
              >
                <ClipboardList className="w-4 h-4" /> View Full Results
              </a>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center border-t border-[#2a3a54] pt-6">
        <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
          This is an unofficial passion project for the lacrosse community. Not affiliated with or endorsed by PLL, WLL, or World Lacrosse.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Free for non-commercial use, no modifications ·{' '}
          <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 underline">
            CC BY-NC-ND 4.0
          </a>
        </p>
      </div>
    </div>
  );
}