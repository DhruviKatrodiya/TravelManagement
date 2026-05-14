import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare const bootstrap: any;

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: false,
  template: `
    <div class="dropdown app-select w-100" [class.app-select-sm]="size === 'sm'">
      <button #toggleBtn class="form-select text-start app-select-toggle"
              [class.form-select-sm]="size === 'sm'"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              (click)="closeOthers($event)"
              [disabled]="disabled">
        <span *ngIf="selectedLabel() as l; else placeholderTpl">{{ l }}</span>
        <ng-template #placeholderTpl><span class="text-muted">{{ placeholder }}</span></ng-template>
      </button>
      <ul class="dropdown-menu w-100 app-select-menu">
        <li *ngFor="let opt of options">
          <a class="dropdown-item d-flex align-items-center justify-content-between"
             href="javascript:void(0)"
             (click)="pick(opt)">
            <span>{{ opt.label }}</span>
            <i class="bi bi-check2 text-success" *ngIf="isSelected(opt)"></i>
          </a>
        </li>
        <li *ngIf="options.length === 0" class="px-3 py-2 text-muted small">No options</li>
      </ul>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true
    }
  ]
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select…';
  @Input() size: '' | 'sm' = '';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string | number>();

  @ViewChild('toggleBtn') toggleBtn?: ElementRef<HTMLButtonElement>;

  value: string | number | null = null;

  private onChange: (v: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | number | null): void { this.value = v; }
  registerOnChange(fn: (v: string | number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }

  selectedLabel(): string | null {
    const found = this.options.find(o => this.isSelected(o));
    return found ? found.label : null;
  }

  isSelected(opt: SelectOption): boolean {
    return opt.value === this.value || String(opt.value) === String(this.value);
  }

  pick(opt: SelectOption): void {
    this.value = opt.value;
    this.onChange(opt.value);
    this.onTouched();
    this.valueChange.emit(opt.value);
    this.close();
  }

  private close(): void {
    const el = this.toggleBtn?.nativeElement;
    if (!el || typeof bootstrap === 'undefined') return;
    try {
      const dd = bootstrap.Dropdown.getInstance(el) || new bootstrap.Dropdown(el);
      dd.hide();
    } catch { /* noop */ }
  }

  closeOthers(_event: MouseEvent): void {
    const myToggle = this.toggleBtn?.nativeElement;
    if (!myToggle || typeof bootstrap === 'undefined') return;
    const otherToggles = Array.from(document.querySelectorAll('.app-select-toggle[aria-expanded="true"]')) as HTMLElement[];
    for (const t of otherToggles) {
      if (t === myToggle) continue;
      try {
        const dd = bootstrap.Dropdown.getInstance(t);
        if (dd) dd.hide();
      } catch { /* noop */ }
    }
  }
}
