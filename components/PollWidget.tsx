'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PollItem } from '@/lib/types';
import { Vote, CheckCircle2, AlertCircle, BarChart2, Sparkles } from 'lucide-react';

export function PollWidget() {
  const { user } = useAuth();
  const [activePoll, setActivePoll] = useState<PollItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [voting, setVoting] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch('/api/polls/vote');
      if (res.ok) {
        const data = await res.json();
        const polls: PollItem[] = data.polls || [];
        const found = polls.find((p) => p.status === 'active');
        if (found) {
          setActivePoll(found);
          if (user && found.votedUserIds?.includes(user.uid)) {
            setHasVoted(true);
          }
        }
      }
    } catch (e) {
      console.warn('Poll fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      setError('Please log in to vote in community polls.');
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionId, userId: user.uid }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      setActivePoll(data.poll);
      setHasVoted(true);
    } catch (err: any) {
      setError(err.message || 'Voting failed');
    } finally {
      setVoting(false);
    }
  };

  if (loading || !activePoll) return null;

  const totalVotes = activePoll.totalVotes || 0;

  return (
    <div className="rounded-3xl bg-[#12121c] border border-amber-500/20 p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400">
          <Vote className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest font-mono">
            Cultivator Poll
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">
          {totalVotes} total votes
        </span>
      </div>

      {/* Question */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-white font-serif">{activePoll.question}</h3>
        {activePoll.description && (
          <p className="text-xs text-gray-400 leading-relaxed">{activePoll.description}</p>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Options */}
      <div className="space-y-2.5">
        {activePoll.options.map((option) => {
          const voteCount = option.votes || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = selectedOption === option.id;

          return (
            <div key={option.id} className="relative">
              {hasVoted ? (
                /* Results View */
                <div className="relative p-3 rounded-2xl bg-[#181826] border border-[#2b2b3d] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-red-950/60 to-amber-950/60 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-200 font-medium">{option.text}</span>
                    <span className="text-amber-300 font-mono font-bold">
                      {percentage}% ({voteCount})
                    </span>
                  </div>
                </div>
              ) : (
                /* Vote Button View */
                <button
                  type="button"
                  disabled={voting}
                  onClick={() => {
                    setSelectedOption(option.id);
                    handleVote(activePoll.id, option.id);
                  }}
                  className={`w-full p-3.5 rounded-2xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                      : 'bg-[#181826] border-[#2c2c3e] text-gray-200 hover:border-amber-500/60 hover:bg-[#1f1f2e]'
                  }`}
                >
                  <span>{option.text}</span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Vote →</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {hasVoted && (
        <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Thank you for voting! Your voice shapes our Hindi Dub releases.</span>
        </div>
      )}
    </div>
  );
}
