import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';

export interface AppSettings {
  logoUrl?: string | null;
  brandName?: string | null;
  themeMode?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/settings`;

  private readonly settingsSignal = signal<AppSettings>({});
  readonly settings = this.settingsSignal.asReadonly();

  load(): Observable<ApiResponse<AppSettings>> {
    return this.http.get<ApiResponse<AppSettings>>(this.base).pipe(
      tap(r => { if (r.success && r.data) this.settingsSignal.set(r.data); })
    );
  }

  update(req: AppSettings): Observable<ApiResponse<AppSettings>> {
    return this.http.put<ApiResponse<AppSettings>>(this.base, req).pipe(
      tap(r => { if (r.success && r.data) this.settingsSignal.set(r.data); })
    );
  }
}
