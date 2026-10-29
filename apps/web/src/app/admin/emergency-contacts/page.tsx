'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { fallbackEmergencyContacts } from '@/lib/fallback-community';
import { EmergencyContactDto } from '@grievease/contracts';
import {
  PhoneCall,
  Plus,
  Trash2,
  ArrowLeft,
  ShieldAlert,
  WifiOff,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export default function AdminEmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContactDto[]>(fallbackEmergencyContacts);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'security' | 'ambulance' | 'fire' | 'police' | 'water_board' | 'electricity_board' | 'lift_service' | 'other'>('security');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await api.getEmergencyContacts();
        if (Array.isArray(res) && res.length > 0) {
          setContacts(res);
        }
      } catch {}
    }
    loadContacts();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    try {
      const payload = {
        name,
        category,
        phone,
        notes: notes || undefined,
        sort: contacts.length + 1,
      };
      const res = await api.createEmergencyContact(payload);
      if (res && res.id) {
        setContacts([...contacts, res]);
      } else {
        const dummy: EmergencyContactDto = {
          id: `ec-${Date.now()}`,
          name,
          category,
          phone,
          notes,
          sortOrder: contacts.length + 1,
        };
        setContacts([...contacts, dummy]);
      }
      setShowAdd(false);
      setName('');
      setPhone('');
      setNotes('');
    } catch {
      setShowAdd(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) return;
    try {
      await api.deleteEmergencyContact(id);
      setContacts(contacts.filter((c) => c.id !== id));
    } catch {
      setContacts(contacts.filter((c) => c.id !== id));
    }
  };

  return (
    <ShellLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href="/admin/directory"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory Management
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                Critical Contacts Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Emergency Contacts Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Main gate security, local fire station, ambulance services, lift technicians, and municipal utility helplines.
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Emergency Number</span>
          </button>
        </div>

        {/* Offline Cache Note */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-xs text-slate-600 flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Offline PWA Resilience: </span>
            This contact directory is aggressively cached by the service worker. In the event of a broadband outage or lift power failure, residents can still tap-to-call all emergency contacts from their mobile phones offline.
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Configured Emergency Numbers</h2>
            <span className="text-xs text-slate-400">{contacts.length} helplines active</span>
          </div>

          <div className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{contact.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {contact.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-700">{contact.phone}</span>
                      {contact.notes && (
                        <>
                          <span>•</span>
                          <span>{contact.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`tel:${contact.phone}`}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                  >
                    Test Call
                  </a>

                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add Emergency Helpline</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact / Desk Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Gate Security Control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="security">Security Gate</option>
                    <option value="ambulance">Ambulance</option>
                    <option value="fire">Fire Brigade</option>
                    <option value="police">Police Station</option>
                    <option value="water_board">Water Supply Board</option>
                    <option value="electricity_board">Electricity Helpline</option>
                    <option value="lift_service">Lift Service / Emergency Braking</option>
                    <option value="other">Other Helpline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (with tel link) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 022-26543210 or +91-98200-11223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes / Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gate 1 Security cabin, 24/7 manned"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
                  >
                    Save Helpline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
