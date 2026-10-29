import { api } from './api-client';

export interface QueuedGuardAction {
  id: string;
  type: 'VERIFY_ENTRY' | 'MARK_EXIT' | 'WALKIN_ENTRY' | 'DELIVERY_LOG';
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT';
  conflictNote?: string;
}

class GuardOfflineSyncManager {
  private queueKey = 'grievease_guard_offline_queue';
  private wakeLock: any = null;
  private heartbeatInterval: any = null;

  public getQueue(): QueuedGuardAction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.queueKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public enqueue(type: QueuedGuardAction['type'], payload: any): QueuedGuardAction {
    const item: QueuedGuardAction = {
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
    };
    const queue = this.getQueue();
    queue.push(item);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.queueKey, JSON.stringify(queue));
    }
    return item;
  }

  public async syncPending(): Promise<{ synced: number; conflicts: number }> {
    const queue = this.getQueue();
    const pending = queue.filter((item) => item.status === 'PENDING');
    let synced = 0;
    let conflicts = 0;

    for (const item of pending) {
      try {
        if (item.type === 'VERIFY_ENTRY') {
          await api.admitPass(item.payload.passId);
          item.status = 'SYNCED';
          synced++;
        } else if (item.type === 'MARK_EXIT') {
          await api.markVisitExit(item.payload.visitId);
          item.status = 'SYNCED';
          synced++;
        } else if (item.type === 'DELIVERY_LOG') {
          await api.logDeliveryArrival(item.payload);
          item.status = 'SYNCED';
          synced++;
        }
      } catch (err: any) {
        item.status = 'CONFLICT';
        item.conflictNote = err.message || 'Server rejected offline entry';
        conflicts++;
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.queueKey, JSON.stringify(queue));
    }
    return { synced, conflicts };
  }

  /**
   * Request screen Wake Lock API to prevent guard console tablet from sleeping.
   */
  public async requestWakeLock(): Promise<void> {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch {}
    }
  }

  public releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  /**
   * Start 15s heartbeats
   */
  public startHeartbeat(deviceId?: string): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    const send = () => {
      api.sendGuardHeartbeat(deviceId).catch(() => {});
    };
    send();
    this.heartbeatInterval = setInterval(send, 15000);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const guardSyncManager = new GuardOfflineSyncManager();
