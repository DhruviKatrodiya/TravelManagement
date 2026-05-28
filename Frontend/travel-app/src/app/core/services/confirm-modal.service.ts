import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title:          string;
  message:        string;
  detail?:        string;
  confirmLabel?:  string;  // defaults to 'Delete'
}

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  private resolveFn?: (v: boolean) => void;

  readonly isOpen  = signal(false);
  readonly options = signal<ConfirmOptions>({ title: '', message: '' });

  confirm(opts: ConfirmOptions): Promise<boolean> {
    this.options.set({ confirmLabel: 'Delete', ...opts });
    this.isOpen.set(true);
    document.body.classList.add('modal-open');
    return new Promise(resolve => { this.resolveFn = resolve; });
  }

  accept(): void  { this.close(true);  }
  dismiss(): void { this.close(false); }

  private close(result: boolean): void {
    this.isOpen.set(false);
    document.body.classList.remove('modal-open');
    this.resolveFn?.(result);
    this.resolveFn = undefined;
  }
}
