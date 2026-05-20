import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SystemRoleConfig, SystemRolesResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SystemRolesService {
  private readonly base = `${environment.apiBaseUrl}/system-roles`;

  private readonly _roles                    = signal<SystemRoleConfig[]>([]);
  private readonly _staffMinLevel            = signal<number>(1);
  private readonly _adminMinLevel            = signal<number>(2);
  private readonly _superAdminMinLevel       = signal<number>(3);
  private readonly _adminRestrictedPerms     = signal<string[]>([]);

  readonly roles                    = this._roles.asReadonly();
  readonly staffMinLevel            = this._staffMinLevel.asReadonly();
  readonly adminMinLevel            = this._adminMinLevel.asReadonly();
  readonly superAdminMinLevel       = this._superAdminMinLevel.asReadonly();
  readonly adminRestrictedPerms     = this._adminRestrictedPerms.asReadonly();

  constructor(private http: HttpClient) {}

  /** Called once at app startup via APP_INITIALIZER. Falls back to defaults on error. */
  load(): Observable<SystemRolesResponse | null> {
    return this.http.get<ApiResponse<SystemRolesResponse>>(this.base).pipe(
      tap(r => {
        if (r.success && r.data) {
          this._roles.set([...r.data.roles].sort((a, b) => a.level - b.level));
          this._staffMinLevel.set(r.data.staffMinLevel);
          this._adminMinLevel.set(r.data.adminMinLevel);
          this._superAdminMinLevel.set(r.data.superAdminMinLevel);
          this._adminRestrictedPerms.set(r.data.adminRestrictedPermissions ?? []);
        }
      }),
      map(r => r.data ?? null),
      catchError(() => of(null))
    );
  }

  getByLevel(level: number): SystemRoleConfig | undefined {
    return this._roles().find(r => r.level === level);
  }

  getByName(name: string): SystemRoleConfig | undefined {
    return this._roles().find(r => r.name === name);
  }

  getByRoutePrefix(prefix: string): SystemRoleConfig | undefined {
    return this._roles().find(r => r.routePrefix === prefix);
  }

  defaultRouteFor(level: number): string {
    return this.getByLevel(level)?.defaultRoute ?? '/';
  }

  routePrefixFor(level: number): string {
    return this.getByLevel(level)?.routePrefix ?? '';
  }

  displayNameFor(level: number): string {
    return this.getByLevel(level)?.displayName ?? '';
  }

  canBypassPermissions(level: number): boolean {
    return this.getByLevel(level)?.canBypassPermissions ?? false;
  }

  /** Returns true if this permission is restricted for Admin-level users (not auto-bypassed). */
  isAdminRestricted(permission: string): boolean {
    return this._adminRestrictedPerms().includes(permission);
  }
}
