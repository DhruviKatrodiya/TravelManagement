import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, interval, tap } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../models/api.models';
import { SystemRolesService } from './system-roles.service';

const TOKEN_KEY = 'travel.token';
const USER_KEY  = 'travel.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiBaseUrl}/auth`;

  private readonly userSignal = signal<User | null>(this.readStoredUser());
  private sessionPoll$: Subscription | null = null;
  private readonly SESSION_POLL_MS = 30_000;
  private readonly INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  private boundResetInactivity = () => this.resetInactivityTimer();
  readonly currentUser      = this.userSignal.asReadonly();
  readonly isAuthenticated  = computed(() => !!this.userSignal());
  readonly role             = computed<UserRole | null>(() => this.userSignal()?.role ?? null);
  readonly privilegeLevel   = computed(() => this.userSignal()?.privilegeLevel ?? -1);

  readonly isSuperAdmin = computed(() => this.privilegeLevel() >= this.systemRoles.superAdminMinLevel());
  readonly isAdmin      = computed(() => this.privilegeLevel() >= this.systemRoles.adminMinLevel());
  readonly isStaff      = computed(() => this.privilegeLevel() >= this.systemRoles.staffMinLevel());
  readonly isCustomer   = computed(() => this.privilegeLevel() === 0);

  hasPermission(key: string): boolean {
    const u = this.userSignal();
    if (!u) return false;
    // SuperAdmin bypasses all permission checks
    if (this.systemRoles.canBypassPermissions(this.privilegeLevel())) return true;
    // All others (Admin, Staff): check individually assigned permissions only
    return Array.isArray(u.permissions) && u.permissions.includes(key);
  }

  constructor(private http: HttpClient, private router: Router, private systemRoles: SystemRolesService) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Resume polling and inactivity timer if token already exists (e.g. page refresh within same tab)
    if (this.getToken()) {
      this.startSessionPoll();
      this.startInactivityTimer();
    }
  }

  private startSessionPoll(): void {
    this.stopSessionPoll();
    this.sessionPoll$ = interval(this.SESSION_POLL_MS).pipe(
      filter(() => !!this.getToken())
    ).subscribe(() => {
      this.http.get<ApiResponse<User>>(`${this.base}/me`).subscribe({
        next: r => { if (r.success && r.data) this.updateCachedUser(r.data); },
        error: () => {}
      });
    });
  }

  private stopSessionPoll(): void {
    this.sessionPoll$?.unsubscribe();
    this.sessionPoll$ = null;
  }

  private startInactivityTimer(): void {
    this.clearInactivityTimer();
    this.activityEvents.forEach(e => window.addEventListener(e, this.boundResetInactivity, { passive: true }));
    this.inactivityTimer = setTimeout(() => this.forceLogout(), this.INACTIVITY_TIMEOUT_MS);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer !== null) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.activityEvents.forEach(e => window.removeEventListener(e, this.boundResetInactivity));
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer !== null) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = setTimeout(() => this.forceLogout(), this.INACTIVITY_TIMEOUT_MS);
    }
  }

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, req).pipe(
      tap(r => { if (r.success && r.data) this.persist(r.data); })
    );
  }

  checkEmail(email: string): Observable<ApiResponse<{ exists: boolean }>> {
    return this.http.get<ApiResponse<{ exists: boolean }>>(`${this.base}/check-email`, { params: { email } });
  }

  checkPhone(phone: string): Observable<ApiResponse<{ exists: boolean }>> {
    return this.http.get<ApiResponse<{ exists: boolean }>>(`${this.base}/check-phone`, { params: { phone } });
  }

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/register`, req).pipe(
      tap(r => { if (r.success && r.data) this.persist(r.data); })
    );
  }

  me(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.base}/me`);
  }

  sendChangePasswordOtp(currentPassword: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/send-change-password-otp`, { currentPassword });
  }

  changePassword(currentPassword: string, newPassword: string, otp: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/change-password`, { currentPassword, newPassword, otp });
  }

  /** User-initiated logout: invalidates this tab's session on the backend. */
  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.base}/logout`, {}).subscribe({ error: () => {} });
    }
    this.forceLogout();
  }

  /** Force-logout without a backend call — used by the interceptor on 401 or inactivity timeout. */
  forceLogout(): void {
    this.stopSessionPoll();
    this.clearInactivityTimer();
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    this.router.navigateByUrl('/auth/login');
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  private persist(auth: AuthResponse): void {
    sessionStorage.setItem(TOKEN_KEY, auth.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    this.userSignal.set(auth.user);
    this.startSessionPoll();
    this.startInactivityTimer();
  }

  updateCachedUser(patch: Partial<User>): void {
    const current = this.userSignal();
    if (!current) return;
    const next = { ...current, ...patch };
    sessionStorage.setItem(USER_KEY, JSON.stringify(next));
    this.userSignal.set(next);
  }

  private readStoredUser(): User | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  }
}
