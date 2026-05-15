import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../models/api.models';

const TOKEN_KEY = 'travel.token';
const USER_KEY = 'travel.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiBaseUrl}/auth`;

  private readonly userSignal = signal<User | null>(this.readStoredUser());

  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly role = computed<UserRole | null>(() => this.userSignal()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'Admin');
  readonly isStaff = computed(() => this.role() === 'Staff' || this.role() === 'Admin');
  readonly isCustomer = computed(() => this.role() === 'Customer');

  /** Admin has every permission; staff are gated by the explicit permission list; customers get none. */
  hasPermission(key: string): boolean {
    const u = this.userSignal();
    if (!u) return false;
    if (u.role === 'Admin') return true;
    if (u.role !== 'Staff') return false;
    return Array.isArray(u.permissions) && u.permissions.includes(key);
  }

  constructor(private http: HttpClient, private router: Router) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, req).pipe(
      tap(r => { if (r.success && r.data) this.persist(r.data); })
    );
  }

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/register`, req).pipe(
      tap(r => { if (r.success && r.data) this.persist(r.data); })
    );
  }

  me(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.base}/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/change-password`, { currentPassword, newPassword });
  }

  logout(): void {
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
