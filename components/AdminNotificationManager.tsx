'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Mail,
  Send,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Loader2,
  Calendar,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { NotificationLog } from '@/lib/types';

export function AdminNotificationManager() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);
  const [jobResult, setJobResult] = useState<any>(null);

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState<'USER_CREATED' | 'SUBSCRIPTION_PURCHASED' | 'PASSWORD_RESET_CONFIRMATION' | 'SUBSCRIPTION_EXPIRY_7DAYS'>('SUBSCRIPTION_PURCHASED');
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/logs?limit=30');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.warn('Error fetching notification logs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch('/api/notifications/logs?limit=30')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.logs) {
          setLogs(data.logs);
        }
      })
      .catch((e) => console.warn('Error fetching notification logs:', e))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRunExpiryJob = async () => {
    setRunningJob(true);
    setJobResult(null);
    try {
      const res = await fetch('/api/cron/subscription-reminders', { method: 'POST' });
      const data = await res.json();
      setJobResult(data);
      await fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger cron job');
    } finally {
      setRunningJob(false);
    }
  };

  const handleSendTestNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setSendingTest(true);
    setTestStatus(null);

    try {
      let event = testType;
      let payload: any = { userEmail: testEmail, userName: 'Test Cultivator' };

      if (testType === 'SUBSCRIPTION_PURCHASED') {
        payload = {
          userId: 'test_user_id',
          userEmail: testEmail,
          userName: 'Grand Cultivator',
          planId: 'premium_yearly',
          planName: 'Premium Yearly VIP',
          amount: 599,
          startDate: new Date().toLocaleDateString('en-IN'),
          expiryDate: new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-IN'),
        };
      }

      const res = await fetch('/api/notifications/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, payload }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestStatus(`Dispatched successfully to ${testEmail}! (Check inbox & logs below)`);
        fetchLogs();
      } else {
        throw new Error(data.error || 'Failed to dispatch test notification');
      }
    } catch (err: any) {
      setTestStatus(`Error: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Expiry Trigger */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Notification &amp; Email Hub
              </h2>
              <p className="text-xs text-zinc-400">
                Transactional Resend/SendGrid dispatch, duplicate-prevention logs, and automated subscription expiry cron
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunExpiryJob}
              disabled={runningJob}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-red-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {runningJob ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Expiry Reminders Job
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cron Job Feedback Result */}
        {jobResult && (
          <div className="mt-5 p-4 rounded-xl bg-zinc-900/80 border border-amber-500/30 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Expiry Reminder Job Executed Successfully</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-[11px] text-zinc-500">Subscriptions Checked</div>
                <div className="text-base font-bold text-white">{jobResult.stats?.checked || 0}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-[11px] text-amber-400">7-Day Warnings</div>
                <div className="text-base font-bold text-white">{jobResult.stats?.sent7Day || 0}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-[11px] text-amber-400">3-Day Warnings</div>
                <div className="text-base font-bold text-white">{jobResult.stats?.sent3Day || 0}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-[11px] text-red-400">1-Day Warnings</div>
                <div className="text-base font-bold text-white">{jobResult.stats?.sent1Day || 0}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-[11px] text-zinc-400">Expired Notices</div>
                <div className="text-base font-bold text-white">{jobResult.stats?.sentExpired || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Test Dispatcher */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-amber-400" />
          Send Transactional Test Email
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Test and preview your branded HTML Donghua templates directly with any recipient email.
        </p>

        <form onSubmit={handleSendTestNotification} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Recipient email (e.g. videocinema80@gmail.com)"
            required
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />

          <select
            value={testType}
            onChange={(e: any) => setTestType(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="SUBSCRIPTION_PURCHASED">Subscription Purchase VIP</option>
            <option value="USER_CREATED">Admin New User Alert</option>
            <option value="SUBSCRIPTION_EXPIRY_7DAYS">7-Day Expiry Warning</option>
            <option value="PASSWORD_RESET_CONFIRMATION">Password Reset Confirmation</option>
          </select>

          <button
            type="submit"
            disabled={sendingTest}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Test
          </button>
        </form>

        {testStatus && (
          <div className="mt-3 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            {testStatus}
          </div>
        )}
      </div>

      {/* Realtime Delivery Logs Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            Recent Notification Logs (Audit Trail)
          </h3>
          <span className="text-xs text-zinc-500">{logs.length} logged events</span>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            <span className="text-xs">Fetching audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs">
            No notification logs recorded yet. Send a test email above or run the expiry job to generate logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{log.recipient || log.userEmail}</td>
                    <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{log.subject || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-[11px] text-zinc-400 font-mono">{log.channel}</span>
                    </td>
                    <td className="py-3 px-4">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                        </span>
                      ) : log.status === 'skipped' ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                          Skipped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-[11px]">
                          <AlertCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[10px]">
                      {new Date(log.sentAt || log.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminNotificationManager;
