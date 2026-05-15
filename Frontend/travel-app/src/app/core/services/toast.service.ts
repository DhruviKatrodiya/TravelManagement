import { Injectable, inject, signal } from '@angular/core';
import { NotificationStore } from './notification-store.service';

export type ToastVariant = 'success' | 'danger' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private store = inject(NotificationStore);
  readonly toasts = signal<ToastItem[]>([]);
  private nextId = 1;
  /** Tracks recent ephemeral messages to dedupe rapid-fire spam (key → expiry epoch ms). */
  private recent = new Map<string, number>();

  show(message: string, variant: ToastVariant = 'info', duration = 4000, opts?: { title?: string; persist?: boolean }): void {
    if (opts?.persist === false) {
      // Ephemeral: render briefly on screen, do NOT persist to the notification bell.
      const key = `${variant}|${opts?.title ?? ''}|${message}`;
      const now = Date.now();
      const seenUntil = this.recent.get(key);
      if (seenUntil && seenUntil > now) return; // dedupe identical toasts within a window
      this.recent.set(key, now + Math.max(duration, 2000));
      const id = this.nextId++;
      this.toasts.update(arr => [...arr, { id, message, variant, title: opts?.title }]);
      setTimeout(() => this.dismiss(id), duration);
      return;
    }
    // Persistent: lives in the notification bell.
    this.store.addLocal(message, variant, opts?.title);
  }

  dismiss(id: number): void {
    this.toasts.update(arr => arr.filter(t => t.id !== id));
  }
}
