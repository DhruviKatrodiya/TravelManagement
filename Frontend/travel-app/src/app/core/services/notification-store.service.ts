import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Notification } from '../models/api.models';
import { ToastVariant } from './toast.service';

export interface StoredNotification {
  uid: string;
  serverId?: number;
  title: string;
  message: string;
  variant: ToastVariant;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const LOCAL_KEY = 'travel.notifications.local';
const LOCAL_MAX = 100;

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private api = inject(ApiService);

  private readonly itemsSignal = signal<StoredNotification[]>(this.readLocal());
  readonly items = this.itemsSignal.asReadonly();
  readonly unreadCount = computed(() => this.itemsSignal().filter(n => !n.isRead).length);

  private localCounter = this.computeLocalCounter(this.itemsSignal());

  loadFromServer(): void {
    this.api.listNotifications().subscribe({
      next: list => this.mergeServer(list || []),
      error: () => { /* ignore — user may be unauthenticated */ }
    });
  }

  addLocal(message: string, variant: ToastVariant = 'info', title?: string): void {
    const item: StoredNotification = {
      uid: `local-${++this.localCounter}`,
      title: title ?? this.titleForVariant(variant),
      message,
      variant,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.itemsSignal.update(arr => [item, ...arr]);
    this.persistLocal();
  }

  private mergeServer(serverList: Notification[]): void {
    const fromServer: StoredNotification[] = serverList.map(n => ({
      uid: `server-${n.id}`,
      serverId: n.id,
      title: n.title,
      message: n.message,
      variant: this.variantForType(n.type),
      isRead: n.isRead,
      createdAt: n.createdAt,
      link: n.link
    }));

    this.itemsSignal.update(arr => {
      const locals = arr.filter(x => !x.serverId);
      const merged = [...fromServer, ...locals];
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return merged;
    });
  }

  markRead(uid: string): void {
    const item = this.itemsSignal().find(n => n.uid === uid);
    if (!item || item.isRead) return;
    this.itemsSignal.update(arr => arr.map(n => n.uid === uid ? { ...n, isRead: true } : n));
    this.persistLocal();
    if (item.serverId) {
      this.api.markNotificationRead(item.serverId).subscribe({ error: () => { /* swallow */ } });
    }
  }

  markAllRead(): void {
    const hasServer = this.itemsSignal().some(n => n.serverId && !n.isRead);
    this.itemsSignal.update(arr => arr.map(n => ({ ...n, isRead: true })));
    this.persistLocal();
    if (hasServer) {
      this.api.markAllNotificationsRead().subscribe({ error: () => { /* swallow */ } });
    }
  }

  remove(uid: string): void {
    const item = this.itemsSignal().find(n => n.uid === uid);
    if (!item) return;
    this.itemsSignal.update(arr => arr.filter(n => n.uid !== uid));
    this.persistLocal();
    if (item.serverId) {
      this.api.deleteNotification(item.serverId).subscribe({ error: () => { /* swallow */ } });
    }
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.persistLocal();
  }

  private readLocal(): StoredNotification[] {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoredNotification[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistLocal(): void {
    const locals = this.itemsSignal().filter(n => !n.serverId).slice(0, LOCAL_MAX);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(locals)); }
    catch { /* quota or disabled */ }
  }

  private computeLocalCounter(items: StoredNotification[]): number {
    let max = 0;
    for (const n of items) {
      if (n.uid.startsWith('local-')) {
        const n2 = parseInt(n.uid.slice('local-'.length), 10);
        if (!isNaN(n2) && n2 > max) max = n2;
      }
    }
    return max;
  }

  private titleForVariant(v: ToastVariant): string {
    switch (v) {
      case 'success': return 'Success';
      case 'danger':  return 'Error';
      case 'warning': return 'Warning';
      default:        return 'Notice';
    }
  }

  private variantForType(type: string): ToastVariant {
    const t = (type || '').toLowerCase();
    if (t.includes('error') || t.includes('fail')) return 'danger';
    if (t.includes('warn')) return 'warning';
    if (t.includes('success') || t.includes('confirm')) return 'success';
    return 'info';
  }
}
