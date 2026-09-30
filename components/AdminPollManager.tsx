'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PollItem } from '@/lib/types';
import { Vote, PlusCircle, Trash2, CheckCircle2, Play, Square, RefreshCw, X } from 'lucide-react';

export function AdminPollManager() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPolls = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/polls', {
        headers: { 'x-admin-email': user.email },
      });
      if (res.ok) {
        const data = await res.json();
        setPolls(data.polls || []);
      }
    } catch (e) {
      console.warn('Poll admin fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    const filteredOptions = options.filter((o) => o.trim().length > 0);
    if (filteredOptions.length < 2) {
      alert('Please add at least 2 poll options');
      return;
    }

    try {
      const res = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          question: question.trim(),
          description: description.trim(),
          options: filteredOptions,
          adminEmail: user.email,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast('Community poll created & broadcasted successfully!');
        setTimeout(() => setToast(null), 3500);
        setShowModal(false);
        setQuestion('');
        setDescription('');
        setOptions(['', '']);
        fetchPolls();
      }
    } catch (e) {
      console.warn('Create poll error:', e);
    }
  };

  const handleAction = async (action: string, pollId: string) => {
    if (!user?.email) return;
    try {
      const res = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, pollId, adminEmail: user.email }),
      });
      if (res.ok) {
        fetchPolls();
      }
    } catch (e) {
      console.warn('Poll action error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[#242436] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Vote className="w-5 h-5 text-amber-400" />
            Community Polls &amp; Voting Hub
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Let the cultivators vote on upcoming Hindi dubbed donghua releases and arc priorities.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Poll</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="p-5 rounded-2xl bg-[#12121a] border border-[#242436] space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  poll.status === 'active'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {poll.status}
              </span>

              <div className="flex items-center gap-1.5">
                {poll.status === 'active' ? (
                  <button
                    onClick={() => handleAction('CLOSE', poll.id)}
                    className="p-1 rounded text-amber-400 hover:bg-amber-950/40"
                    title="Close Poll"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction('ACTIVATE', poll.id)}
                    className="p-1 rounded text-emerald-400 hover:bg-emerald-950/40"
                    title="Re-activate"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleAction('DELETE', poll.id)}
                  className="p-1 rounded text-red-400 hover:bg-red-950/40"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white">{poll.question}</h4>

            <div className="space-y-1.5 pt-1">
              {poll.options.map((opt) => (
                <div
                  key={opt.id}
                  className="p-2 rounded-xl bg-[#161622] text-xs flex items-center justify-between text-gray-300"
                >
                  <span>{opt.text}</span>
                  <span className="font-mono text-amber-400 font-bold">{opt.votes} votes</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-500 font-mono pt-1">
              Total votes: {poll.totalVotes || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreatePoll}
            className="w-full max-w-lg rounded-2xl bg-[#14141e] border border-[#2c2c3e] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">Create Community Poll</h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Poll Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which Donghua series should be dubbed next in Hindi?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Description / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional release notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 block">
                  Voting Options (Minimum 2):
                </label>
                {options.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    required={i < 2}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[i] = e.target.value;
                      setOptions(updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                  />
                ))}

                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setOptions([...options, ''])}
                    className="text-xs text-amber-400 font-semibold hover:underline block pt-1"
                  >
                    + Add Another Option
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
              >
                Publish Poll
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
