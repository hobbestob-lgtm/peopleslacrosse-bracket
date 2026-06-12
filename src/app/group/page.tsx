'use client';

import { useState, useEffect, useRef } from 'react';
import { Trophy, Users, ArrowLeft, Copy, CheckCircle, Share2, Image as ImageIcon, Download } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useSEO } from '@/lib/use-seo';
import { generateGroupShareImage } from '@/lib/group-share-image';

interface LeaderboardEntry {
  email: string;
  displayName: string;
  joinedAt: string;
  bracketId: string | null;
  bracketScore: number;
  confidenceScore: number;
  totalScore: number;
}

interface GroupInfo {
  id: string;
  name: string;
  inviteCode: string;
  tournamentId: string;
  createdBy: string;
  memberCount: number;
}

const TOURNAMENT_NAMES: Record<string, string> = {
  'olympic-sixes-2028': 'Olympic Sixes LA 2028',
  'pll-2026': 'PLL 2026',
  'wll-2026': 'WLL 2026',
};

const TOURNAMENT_EMOJI: Record<string, string> = {
  'olympic-sixes-2028': '🏅',
  'pll-2026': '🥍',
  'wll-2026': '🏟️',
};

export default function GroupPage() {
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [imageDownloading, setImageDownloading] = useState(false);

  useSEO({
    title: group ? `${group.name} — Group Leaderboard` : 'Group Leaderboard',
    description: group
      ? `View the "${group.name}" group leaderboard for ${group.tournamentId}. Compete with friends at People's Lacrosse Bracket + Picks.`
      : "View your group leaderboard for lacrosse bracket predictions at People's Lacrosse.",
    canonical: '/group',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('id');
    const inviteCode = params.get('code');

    const queryParam = groupId ? `groupId=${groupId}` : inviteCode ? `inviteCode=${inviteCode}` : '';

    if (!queryParam) {
      setError('No group ID provided');
      setLoading(false);
      return;
    }

    fetch(`/api/groups/leaderboard?${queryParam}`)
      .then(r => r.json())
      .then((data: any) => {
        if (data.success) {
          setGroup(data.group);
          setLeaderboard(data.leaderboard);
        } else {
          setError(data.error || 'Group not found');
        }
      })
      .catch(() => setError('Failed to load group'))
      .finally(() => setLoading(false));
  }, []);

  const copyInviteLink = async () => {
    if (!group) return;
    const url = `${window.location.origin}/?group=${group.inviteCode}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  const copyPageLink = async () => {
    if (!group) return;
    const url = `${window.location.origin}/group?id=${group.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  const handleDownloadImage = async () => {
    if (!group) return;
    setImageDownloading(true);
    try {
      const blob = await generateGroupShareImage({
        groupName: group.name,
        tournamentName: TOURNAMENT_NAMES[group.tournamentId] || group.tournamentId,
        tournamentEmoji: TOURNAMENT_EMOJI[group.tournamentId] || '🥍',
        memberCount: group.memberCount,
        leaderboard: leaderboard.map((entry, i) => ({
          rank: i + 1,
          name: entry.displayName || entry.email.split('@')[0],
          score: entry.totalScore,
        })),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${group.name.replace(/\s+/g, '-').toLowerCase()}-leaderboard.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setImageDownloading(false);
    }
  };

  const handleViewImage = async () => {
    if (!group) return;
    setImageDownloading(true);
    try {
      const blob = await generateGroupShareImage({
        groupName: group.name,
        tournamentName: TOURNAMENT_NAMES[group.tournamentId] || group.tournamentId,
        tournamentEmoji: TOURNAMENT_EMOJI[group.tournamentId] || '🥍',
        memberCount: group.memberCount,
        leaderboard: leaderboard.map((entry, i) => ({
          rank: i + 1,
          name: entry.displayName || entry.email.split('@')[0],
          score: entry.totalScore,
        })),
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('View image error:', err);
    } finally {
      setImageDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white flex items-center justify-center">
        <div className="animate-pulse text-xl text-[#ffd700]">Loading group...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-xl font-bold text-red-400 mb-2">Group not found</p>
          <p className="text-gray-400 mb-4">{error || 'This group may have been deleted.'}</p>
          <a href="/" className="text-[#ffd700] hover:underline flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Bracket + Picks
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <Breadcrumbs items={[{ name: "People's Lacrosse", href: 'https://peopleslacrosse.com' }, { name: 'Bracket + Picks', href: '/' }, { name: 'Group Leaderboard' }]} />
        <a href="/" className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Bracket + Picks
        </a>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="w-8 h-8 text-[#ffd700]" />
            <h1 className="text-3xl font-bold text-[#ffd700]">{group.name}</h1>
          </div>
          <p className="text-gray-400">
            {TOURNAMENT_EMOJI[group.tournamentId] || ''} {TOURNAMENT_NAMES[group.tournamentId] || group.tournamentId} · {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Share image buttons */}
        <div className="bg-[#1a2a44] rounded-xl p-5 border border-[#2a3a54] mb-4">
          <h3 className="font-bold text-lg mb-3">📱 Share This Group</h3>
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
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 Share the leaderboard image on social to recruit more players!</p>
        </div>

        {/* Invite + link sharing */}
        <div className="bg-[#1a2a44] rounded-xl p-4 border border-[#ffd700]/20 mb-4">
          <p className="text-sm text-gray-300 mb-2 text-center">Invite friends to this group:</p>
          <div className="flex gap-2 mb-3">
            <code className="flex-1 bg-[#0a1628] rounded-lg px-3 py-2 text-[#ffd700] text-sm truncate">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/?group=${group.inviteCode}`}
            </code>
            <button
              onClick={copyInviteLink}
              className="bg-[#ffd700] text-black font-bold px-4 rounded-lg hover:bg-[#ffcc00] transition-all flex items-center gap-1 shrink-0"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={copyPageLink}
              className="bg-[#1a2a44] hover:bg-[#2a3a54] text-white font-bold py-2 px-4 rounded-lg border border-[#2a3a54] transition-all flex items-center gap-1.5 text-sm"
            >
              <Share2 className="w-3.5 h-3.5" /> {linkCopied ? 'Copied!' : 'Copy Leaderboard Link'}
            </button>
            {group && (
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Join my "${group.name}" bracket group for ${TOURNAMENT_NAMES[group.tournamentId] || group.tournamentId}! 🥍🏆 ${typeof window !== 'undefined' ? window.location.origin : ''}/?group=${group.inviteCode} ${group.tournamentId === 'olympic-sixes-2028' ? '#Lacrosse #OlympicSixes' : group.tournamentId === 'wll-2026' ? '#Lacrosse #WLL' : '#Lacrosse #PLL'} #BracketPredictor`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 text-sm border border-gray-700"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </a>
            )}
            <a
              href={`/my-groups`}
              className="bg-[#1a2a44] hover:bg-[#2a3a54] text-white font-bold py-2 px-4 rounded-lg border border-[#2a3a54] transition-all flex items-center gap-1.5 text-sm"
            >
              <Users className="w-3.5 h-3.5" /> My Groups
            </a>
          </div>
        </div>

        {/* Make your picks CTA */}
        <div className="text-center mb-6">
          <a
            href={`/?group=${group.inviteCode}`}
            className="bg-gradient-to-r from-[#ffd700] to-[#ff8c00] text-black font-bold py-3 px-8 rounded-xl text-lg hover:scale-105 transition-all inline-block"
          >
            Make Your Picks →
          </a>
        </div>

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="bg-[#1a2a44] rounded-xl p-8 border border-[#2a3a54] text-center">
            <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-xl font-bold text-gray-300 mb-2">No brackets yet</p>
            <p className="text-gray-500">Be the first to make your picks!</p>
          </div>
        ) : (
          <div className="bg-[#1a2a44] rounded-xl border border-[#2a3a54] overflow-hidden">
            <div className="p-4 border-b border-[#2a3a54] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#ffd700]" />
              <h2 className="text-lg font-bold text-[#ffd700]">Leaderboard</h2>
              <span className="text-xs text-gray-500 ml-auto">{leaderboard.length} {leaderboard.length === 1 ? 'entry' : 'entries'}</span>
            </div>

            <div className="divide-y divide-[#2a3a54]">
              {leaderboard.map((entry, i) => {
                const rank = i + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                const medalColor = rank === 1 ? 'text-[#ffd700]' : rank === 2 ? 'text-[#c0c0c0]' : rank === 3 ? 'text-[#cd7f32]' : 'text-gray-500';
                return (
                  <div key={entry.email} className={`flex items-center gap-3 p-4 ${rank <= 3 ? 'bg-[#ffd700]/5' : ''}`}>
                    <span className={`text-lg font-bold w-8 text-center ${medalColor}`}>
                      {medal || rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{entry.displayName || entry.email.split('@')[0]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#ffd700]">{entry.totalScore}</p>
                      <p className="text-xs text-gray-500">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scoring explanation */}
        <div className="mt-6 bg-[#1a2a44] rounded-xl p-4 border border-[#2a3a54]">
          <h3 className="text-sm font-bold text-gray-300 mb-2">Scoring</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Bracket: Group position (1pt each), QF (2), SF (4), Bronze (3), Gold (8). +50% upset bonus.<br/>
            Confidence: Correct pick = confidence number as points. Weekly totals accumulate.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a href="https://peopleslacrosse.com" target="_blank" rel="noopener noreferrer">
            <img src="/pl-logo-gold.png" alt="People's Lacrosse" className="h-10 mx-auto mb-2 hover:opacity-80 transition-opacity cursor-pointer" />
          </a>
          <p className="text-xs text-gray-600">
            <a href="https://peopleslacrosse.com" className="text-[#ffd700] hover:underline">peopleslacrosse.com</a>
          </p>
          <p className="mt-3 text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
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
    </div>
  );
}