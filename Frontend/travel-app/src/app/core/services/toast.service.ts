import { Injectable, inject, signal } from '@angular/core';
import { NotificationStore } from './notification-store.service';

export type ToastVariant = 'success' | 'danger' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private store = inject(NotificationStore);
  readonly toasts = signal<ToastItem[]>([]);

  show(message: string, variant: ToastVariant = 'info', _duration = 4000, opts?: { title?: string; persist?: boolean }): void {
    if (opts?.persist !== false) {
      this.store.addLocal(message, variant, opts?.title);
    }
  }

  dismiss(_id: number): void {
    // no-op — toasts are no longer rendered; messages live in the notification bell
  }
}
