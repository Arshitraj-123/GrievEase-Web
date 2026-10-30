'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  User,
  ArrowRight,
} from 'lucide-react';

export default function AdminSupportDeskPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'CONVERSATIONS' | 'TICKETS'>('CONVERSATIONS');
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, tList] = await Promise.all([
        api.listSupportConversationsAdmin(),
        api.listSupportTicketsAdmin(),
      ]);
      setConversations(Array.isArray(cList) ? cList : []);
      setTickets(Array.isArray(tList) ? tList : []);
    } catch (err) {
      console.error('Failed to load support desk data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectConv = async (conv: any) => {
    try {
      const full = await api.getSupportConversationAdmin(conv.id);
      setSelectedConv(full);
    } catch (err: any) {
      alert(err.message || 'Failed to load conversation thread');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyText.trim()) return;
    setSending(true);
    try {
      await api.replySupportConversationAdmin(selectedConv.id, {
        body: replyText.trim(),
      });
      setReplyText('');
      const updated = await api.getSupportConversationAdmin(selectedConv.id);
      setSelectedConv(updated);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    const resolution = prompt('Enter resolution notes for this ticket:');
    if (!resolution) return;
    try {
      await api.resolveSupportTicketAdmin(ticketId, resolution);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve ticket');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Administrator">
      <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-teal-600" />
              <span>Office Support Desk &amp; Resident Messaging</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Direct communication channels between residents and the governing office.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('CONVERSATIONS')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'CONVERSATIONS'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct Threads ({conversations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'TICKETS'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Support Tickets ({tickets.length})</span>
          </button>
        </div>

        {/* ─── TAB 1: CONVERSATIONS ────────────────────────────────────────────── */}
        {activeTab === 'CONVERSATIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation list */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Active Resident Threads
              </h3>
              {conversations.length === 0 ? (
                <Card className="py-8 text-center text-xs text-slate-500">
                  No active messaging threads.
                </Card>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConv(c)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors space-y-1 ${
                      selectedConv?.id === c.id
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-100'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate">{c.subject}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Resident: {c.resident_name || 'Anonymous Resident'}
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Conversation Thread */}
            <Card className="lg:col-span-2 p-5 flex flex-col h-[520px]">
              {selectedConv ? (
                <>
                  <div className="border-b pb-3 mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedConv.subject}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Participant: {selectedConv.resident_name || 'Society Resident'} &bull; Started{' '}
                      {new Date(selectedConv.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Messages scroll area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
                    {selectedConv.messages?.map((msg: any) => {
                      const isOffice = msg.sender_role !== 'RESIDENT';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOffice ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`p-3 rounded-2xl max-w-md ${
                              isOffice
                                ? 'bg-teal-600 text-white rounded-br-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                            }`}
                          >
                            <p className="leading-relaxed">{msg.body}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {isOffice ? 'Society Office' : 'Resident'} &bull;{' '}
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Box */}
                  <form onSubmit={handleSendReply} className="pt-3 border-t flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Type official reply to resident..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-xs font-bold"
                      disabled={sending}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Send
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mb-2" />
                  <span>Select a resident conversation to inspect and reply</span>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ─── TAB 2: SUPPORT TICKETS ─────────────────────────────────────────── */}
        {activeTab === 'TICKETS' && (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <Card className="py-12 text-center text-xs text-slate-500">
                No open support tickets.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="p-4 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {ticket.category}
                        </Badge>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {ticket.subject}
                        </h4>
                      </div>
                      <Badge
                        variant={ticket.status === 'RESOLVED' ? 'success' : 'warning'}
                        className="text-[10px]"
                      >
                        {ticket.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="pt-2 border-t flex items-center justify-between text-[11px] text-slate-500">
                      <span>Submitted {new Date(ticket.created_at).toLocaleDateString()}</span>
                      {ticket.status !== 'RESOLVED' && (
                        <Button
                          size="sm"
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 h-7"
                          onClick={() => handleResolveTicket(ticket.id)}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

