'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, ArrowLeft, Plus, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useSEO } from '@/lib/use-seo';

interface MyGroup {
  id: string;
  name: string;
  inviteCode: string;
  tournamentId: string;
  tournamentName: string;
  createdBy: string;
  memberCount: number;
  role: string;
  createdAt: string;
}

const TOURNAMENT_EMOJI: Record<string, string> = {
  'olympic-sixes-2028': '🏅',
  'pll-2026': '🥍',
  'wll-2026': '🏟️',
};

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useSEO({
    title: 'My Groups — Bracket + Picks',
    description: "View all your bracket prediction groups. Compete with friends at People's Lacrosse.",
    canonical: '/my-groups',
  });

  // Check localStorage for saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem('pl_bracket_email');
    if (savedEmail) {
      setEmail(savedEmail);
      fetchGroups(savedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchGroups = async (emailToUse: string) => {
    try {
      const res = await fetch(`/api/groups/mine?email=${encodeURIComponent(emailToUse)}`);
      const data: any = await res.json();
      if (data.success) {
        setGroups(data.groups);
      } else {
        setError(data.error || 'Failed to load groups');
      }
    } catch {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    localStorage.setItem('pl_bracket_email', email);
    setSubmitted(true);
    setLoading(true);
    fetchGroups(email);
  };

  const copyInviteLink = async (inviteCode: string, groupId: string) => {
    const url = `${window.location.origin}/?group=${inviteCode}`;
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
      setCopiedId(groupId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] text-white">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <Breadcrumbs items={[
          { name: "People's Lacrosse", href: 'https://peopleslacrosse.com' },
          { name: 'Bracket + Picks', href: '/' },
          { name: 'My Groups' },
        ]} />

        <a href="/" className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Bracket + Picks
        </a>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="w-8 h-8 text-[#ffd700]" />
            <h1 className="text-3xl font-bold text-[#ffd700]">My Groups</h1>
          </div>
          <p className="text-gray-400">All your bracket prediction groups in one place</p>
        </div>

        {/* Email lookup */}
        {!submitted && (
          <div className="bg-[#1a2a44] rounded-xl p-6 border border-[#2a3a54] mb-6">
            <h2 className="font-bold text-lg mb-3">Find Your Groups</h2>
            <p className="text-sm text-gray-400 mb-4">Enter the email you used to save your brackets</p>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-[#0a1628] border border-[#2a3a54] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#ffd700] focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-[#ffd700] hover:bg-[#ffcc00] text-black font-bold px-6 rounded-lg transition-all"
              >
                Find
              </button>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-pulse text-xl text-[#ffd700]">Loading your groups...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Groups list */}
        {!loading && submitted && groups.length === 0 && (
          <div className="bg-[#1a2a44] rounded-xl p-8 border border-[#2a3a54] text-center">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-xl font-bold text-gray-300 mb-2">No groups yet</p>
            <p className="text-gray-500 mb-4">Create a group when you save your bracket, or join one with an invite code.</p>
            <a
              href="/"
              className="bg-[#ffd700] hover:bg-[#ffcc00] text-black font-bold py-3 px-6 rounded-xl transition-all inline-block"
            >
              Make Your Picks →
            </a>
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="bg-[#1a2a44] rounded-xl border border-[#2a3a54] overflow-hidden hover:border-[#ffd700]/30 transition-colors">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{TOURNAMENT_EMOJI[group.tournamentId] || '🥍'}</span>
                        <h3 className="text-lg font-bold text-white truncate">{group.name}</h3>
                      </div>
                      <p className="text-sm text-gray-400">{group.tournamentName}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      group.role === 'creator'
                        ? 'bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30'
                        : 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30'
                    }`}>
                      {group.role === 'creator' ? '👑 Creator' : '✓ Member'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <a href={`/group?id=${group.id}`} className="text-[#ffd700] hover:underline">View Leaderboard</a>
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={`/group?id=${group.id}`}
                      className="bg-[#ffd700] hover:bg-[#ffcc00] text-black font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-2 text-sm"
                    >
                      <Trophy className="w-4 h-4" /> Leaderboard
                    </a>
                    <button
                      onClick={() => copyInviteLink(group.inviteCode, group.id)}
                      className="bg-[#1a2a44] hover:bg-[#2a3a54] text-white font-bold py-2.5 px-5 rounded-lg border border-[#2a3a54] transition-all flex items-center gap-2 text-sm"
                    >
                      {copiedId === group.id ? <CheckCircle className="w-4 h-4 text-[#4ade80]" /> : <Copy className="w-4 h-4" />}
                      {copiedId === group.id ? 'Copied!' : 'Copy Invite Link'}
                    </button>
                    <a
                      href={`/?group=${group.inviteCode}`}
                      className="bg-[#1a2a44] hover:bg-[#2a3a54] text-white font-bold py-2.5 px-5 rounded-lg border border-[#2a3a54] transition-all flex items-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" /> Make Picks
                    </a>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center mt-6">
              <a
                href="/"
                className="text-[#ffd700] hover:underline flex items-center gap-1 justify-center text-sm"
              >
                <Plus className="w-4 h-4" /> Create or Join Another Group
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
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