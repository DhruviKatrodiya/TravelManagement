import { Component } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: false,
  template: `
    <div class="toast-host">
      <div *ngFor="let t of toast.toasts()"
           class="toast-item alert d-flex align-items-start mb-2 shadow"
           [ngClass]="{
             'alert-success': t.variant === 'success',
             'alert-danger':  t.variant === 'danger',
             'alert-warning': t.variant === 'warning',
             'alert-info':    t.variant === 'info'
           }">
        <i class="bi me-2 mt-1"
           [ngClass]="{
             'bi-check-circle-fill': t.variant === 'success',
             'bi-exclamation-triangle-fill': t.variant === 'danger' || t.variant === 'warning',
             'bi-info-circle-fill': t.variant === 'info'
           }"></i>
        <div class="flex-grow-1">
          <div *ngIf="t.title" class="fw-semibold">{{ t.title }}</div>
          <div class="small">{{ t.message }}</div>
        </div>
        <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="toast.dismiss(t.id)"></button>
      </div>
    </div>
  `,
  styles: [`
    .toast-host { position: fixed; top: 1rem; right: 1rem; z-index: 1080; display: flex; flex-direction: column; gap: .5rem; max-width: 360px; }
    .toast-item { padding: .65rem .9rem; }
  `]
})
export class ToastHostComponent {
  constructor(public toast: ToastService) {}
}
