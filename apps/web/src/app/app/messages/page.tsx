'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import {
  MessageSquare,
  AlertTriangle,
  Siren,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  Paperclip,
  Building,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function ResidentMessagesPage() {
  const { t } = useAccessibility();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  // New Thread Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [creating, setCreating] = useState(false);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await api.listConversationsResident();
      setConversations(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedConv) {
        handleSelectConversation(data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (c: any) => {
    try {
      const full = await api.getConversationResident(c.id);
      setSelectedConv(full);
    } catch (err: any) {
      alert(err.message || 'Failed to load thread');
    }
  };

  useEffect(() => {
    loadConversations();

    // Setup socket for live notifications
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:4000';

    let socket: Socket | null = null;
    try {
      socket = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
      socket.on('message.received', () => {
        loadConversations();
        if (selectedConv) {
          handleSelectConversation(selectedConv);
        }
      });
    } catch {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !messageText.trim()) return;
    setSending(true);
    try {
      await api.sendMessageResident(selectedConv.id, {
        body: messageText.trim(),
      });
      setMessageText('');
      const updated = await api.getConversationResident(selectedConv.id);
      setSelectedConv(updated);
      await loadConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMsg.trim()) return;
    setCreating(true);
    try {
      const res = await api.createConversationResident({
        subject: newSubject.trim(),
        initialMessage: newInitialMsg.trim(),
      });
      setShowNewModal(false);
      setNewSubject('');
      setNewInitialMsg('');
      await loadConversations();
      if (res?.id) {
        handleSelectConversation(res);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-4 max-w-5xl mx-auto px-2 sm:px-4">
        {/* MANDATORY PERSISTENT SOS ADVISORY NOTE */}
        <div className="p-3 bg-red-600 text-white rounded-2xl flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Siren className="w-5 h-5 shrink-0 text-amber-300 animate-pulse" />
            <span>
              <strong>EMERGENCY ADVISORY:</strong> For medical, fire, or immediate life-threatening emergencies, do NOT use messaging — trigger the red SOS button immediately.
            </span>
          </div>
          <Link href="/app/sos">
            <Button
              size="sm"
              className="bg-white text-red-700 hover:bg-red-50 text-xs font-black shadow-xs shrink-0"
            >
              Emergency SOS
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-teal-600" />
              <span>Office Messages &amp; Direct Enquiries</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure in-app communication with the managing committee and society office.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-xs flex items-center gap-1.5"
            onClick={() => setShowNewModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Message to Office</span>
          </Button>
        </div>

        {/* Chat / Threads Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[550px]">
          {/* Thread list */}
          <Card className="p-3 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
              My Conversations
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading threads...</div>
              ) : conversations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No message threads yet. Click &quot;New Message&quot; above to contact office.
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConversation(c)}
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
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {c.last_message_preview || 'Tap to view discussion'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Messages view */}
          <Card className="md:col-span-2 p-4 flex flex-col overflow-hidden">
            {selectedConv ? (
              <>
                <div className="border-b pb-3 mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedConv.subject}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-teal-600" />
                      <span>Direct channel to Society Secretary &amp; Committee</span>
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedConv.status || 'ACTIVE'}
                  </Badge>
                </div>

                {/* Messages scroll */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
                  {selectedConv.messages?.map((msg: any) => {
                    const isMe = msg.sender_id === selectedConv.user_id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl max-w-md ${
                            isMe
                              ? 'bg-teal-600 text-white rounded-br-none'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                          }`}
                        >
                          <p className="leading-relaxed">{msg.body}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {isMe ? 'You' : 'Society Office'} &bull;{' '}
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Composer */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type your message to the office..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
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
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <span>Select a thread or create a new message</span>
              </div>
            )}
          </Card>
        </div>

        {/* New Thread Modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white dark:bg-slate-900 border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>Send Message to Society Office</span>
                </h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateThread} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Subject / Topic *</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Question regarding AGM schedule"
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Initial Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={newInitialMsg}
                    onChange={(e) => setNewInitialMsg(e.target.value)}
                    placeholder="Describe your question or message for the secretary..."
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-xs"
                    disabled={creating}
                  >
                    Send to Office
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

