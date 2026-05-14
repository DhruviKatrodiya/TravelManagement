import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'travel.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly modeSignal = signal<ThemeMode>(this.readStored());
  readonly mode = this.modeSignal.asReadonly();

  constructor() {
    this.apply(this.modeSignal());
  }

  set(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    this.apply(mode);
  }

  toggle(): void {
    this.set(this.modeSignal() === 'dark' ? 'light' : 'dark');
  }

  private apply(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-bs-theme', mode);
  }

  private readStored(): ThemeMode {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'dark' ? 'dark' : 'light';
  }
}
