import { Component } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: false,
  template: `
    <div class="toast-host">
      <div *ngFor="let t of toast.toasts()"
           class="toast show align-items-center text-bg-{{t.variant}} border-0">
        <div class="d-flex">
          <div class="toast-body">{{ t.message }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto"
                  (click)="toast.dismiss(t.id)"></button>
        </div>
      </div>
    </div>
  `
})
export class ToastHostComponent {
  constructor(public toast: ToastService) {}
}
