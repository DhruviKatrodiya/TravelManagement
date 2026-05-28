import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { BrandService } from '../../core/services/brand.service';
import { SystemRolesService } from '../../core/services/system-roles.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationStore, StoredNotification } from '../../core/services/notification-store.service';
import { ConfirmModalService } from '../../core/services/confirm-modal.service';
import { Router } from '@angular/router';

interface Lang { code: string; label: string; }
const LANG_KEY = 'travel.lang';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  template: `
    <nav class="navbar navbar-dark bg-dark px-3">
      <div class="d-flex w-100 justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <button class="btn btn-link p-1 me-2 sidebar-toggle" type="button" (click)="toggleSidebar()" [attr.aria-label]="sidebarOpen() ? 'Hide menu' : 'Show menu'">
            <i class="bi" [class.bi-list]="sidebarOpen()" [class.bi-layout-sidebar-inset]="!sidebarOpen()" style="font-size:1.4rem"></i>
          </button>
          <a class="navbar-brand fw-bold d-flex align-items-center mb-0" [routerLink]="basePath()">
            {{ displayBrandName() }}
          </a>
        </div>

        <div class="d-flex align-items-center gap-2 nav-actions">
          <!-- Language -->
          <div class="dropdown" *ngIf="auth.hasPermission('interface.language')">
            <button class="btn nav-pill dropdown-toggle d-flex align-items-center gap-1" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-translate"></i>
              <span class="small fw-semibold">{{ currentLang().code }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li *ngFor="let l of languages">
                <a class="dropdown-item d-flex align-items-center justify-content-between" href="javascript:void(0)" (click)="setLang(l)">
                  {{ l.label }}
                  <i class="bi bi-check2 text-success ms-2" *ngIf="l.code === currentLang().code"></i>
                </a>
              </li>
            </ul>
          </div>

          <!-- Theme -->
          <button *ngIf="auth.hasPermission('interface.theme')" class="btn nav-icon" type="button" (click)="theme.toggle()" [attr.aria-label]="theme.mode() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
            <i class="bi" [class.bi-sun]="theme.mode() === 'dark'" [class.bi-moon-stars]="theme.mode() === 'light'"></i>
          </button>

          <!-- Notifications -->
          <button *ngIf="auth.hasPermission('interface.notifications')" class="btn nav-icon position-relative" type="button" (click)="toggleNotifPanel()" [attr.aria-expanded]="notifPanelOpen()" aria-label="Notifications">
            <i class="bi bi-bell"></i>
            <span *ngIf="unreadCount() > 0" class="notif-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
          </button>

          <!-- Profile -->
          <div class="dropdown">
            <button class="btn p-0 border-0 bg-transparent" type="button" data-bs-toggle="dropdown" aria-expanded="false" (click)="closeNotifPanel()">
              <span class="avatar-circle">{{ initials() }}</span>
            </button>
            <div class="dropdown-menu dropdown-menu-end p-0" style="min-width:220px">
              <div class="px-3 py-2 border-bottom">
                <div class="fw-semibold small">{{ auth.currentUser()?.fullName }}</div>
                <div class="text-muted" style="font-size:.75rem">{{ auth.currentUser()?.email }}</div>
                <span class="role-badge mt-1">{{ systemRoles.displayNameFor(auth.privilegeLevel()) }}</span>
              </div>
              <a class="dropdown-item" routerLink="/"><i class="bi bi-globe me-2"></i>View site</a>
              <a class="dropdown-item" *ngIf="auth.hasPermission('settings.view')" [routerLink]="basePath() + '/settings'"><i class="bi bi-gear me-2"></i>Settings</a>
              <div class="dropdown-divider my-0"></div>
              <button class="dropdown-item text-danger" (click)="auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div *ngIf="notifPanelOpen()" class="notif-backdrop" (click)="closeNotifPanel()"></div>
    <aside class="notif-panel" [class.open]="notifPanelOpen()" role="dialog" aria-label="Notifications panel">
      <div class="notif-panel-header d-flex align-items-center justify-content-between px-3 py-3">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-bell-fill"></i>
          <strong>Notifications</strong>
          <span *ngIf="unreadCount() > 0" class="badge bg-danger">{{ unreadCount() }}</span>
        </div>
        <button type="button" class="btn btn-sm btn-light notif-close" (click)="closeNotifPanel()" aria-label="Close notifications">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="notif-panel-actions d-flex gap-2 px-3 py-3 border-bottom">
        <button *ngIf="unreadCount() > 0" class="btn btn-sm btn-outline-primary" (click)="markAllRead()">
          <i class="bi bi-check2-all me-1"></i>Mark all read
        </button>
        <button *ngIf="notifList().length > 0" class="btn btn-sm btn-outline-danger" (click)="clearAll()">
          <i class="bi bi-trash me-1"></i>Clear all
        </button>
        <button class="btn btn-sm btn-outline-secondary ms-auto" (click)="refreshNotifications()" title="Refresh">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
      <div class="notif-panel-body">
        <div *ngIf="notifList().length === 0" class="text-center text-muted small py-5">
          <i class="bi bi-bell-slash" style="font-size:2rem;opacity:.4"></i>
          <div class="mt-2">You're all caught up.</div>
        </div>
        <ul class="list-unstyled mb-0" *ngIf="notifList().length > 0">
          <li *ngFor="let n of notifList()" class="notif-item" [class.unread]="!n.isRead">
            <div class="d-flex gap-2 px-3 py-2 align-items-start">
              <i class="bi mt-1" [ngClass]="iconForVariant(n.variant)" [class.text-success]="n.variant === 'success'" [class.text-danger]="n.variant === 'danger'" [class.text-warning]="n.variant === 'warning'" [class.text-primary]="n.variant === 'info'"></i>
              <div class="flex-grow-1 min-w-0" (click)="onNotifClick(n)" style="cursor:pointer">
                <div class="small fw-semibold">{{ n.title }}</div>
                <div class="small text-muted">{{ n.message }}</div>
                <div class="text-muted" style="font-size:.7rem">{{ n.createdAt | date:'short' }}</div>
              </div>
              <button type="button" class="btn btn-sm btn-link p-0 text-muted notif-delete" (click)="removeNotif(n.uid); $event.stopPropagation()" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </aside>

    <div class="admin-shell" [class.sidebar-hidden]="!sidebarOpen()">
      <aside class="sidebar">
        <a [routerLink]="basePath()" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><i class="bi bi-graph-up"></i> Dashboard</a>
        <a *ngIf="auth.hasPermission('roles.view')" [routerLink]="basePath() + '/roles'" routerLinkActive="active"><i class="bi bi-shield-check"></i> Role Management</a>
        <a *ngIf="auth.hasPermission('tours.view')" [routerLink]="basePath() + '/tours'" routerLinkActive="active"><i class="bi bi-globe2"></i> Tours</a>
        <a *ngIf="auth.hasPermission('destinations.view')" [routerLink]="basePath() + '/destinations'" routerLinkActive="active"><i class="bi bi-geo-alt"></i> Destinations</a>
        <a *ngIf="auth.hasPermission('packages.view')" [routerLink]="basePath() + '/packages'" routerLinkActive="active"><i class="bi bi-box-seam"></i> Packages</a>
        <a *ngIf="auth.hasPermission('facilities.view')" [routerLink]="basePath() + '/facilities'" routerLinkActive="active"><i class="bi bi-cup-hot"></i> Facilities</a>
        <a *ngIf="auth.hasPermission('schedules.view')" [routerLink]="basePath() + '/schedules'" routerLinkActive="active"><i class="bi bi-calendar3"></i> Trip Calendar</a>
        <a *ngIf="auth.hasPermission('bookings.view')" [routerLink]="basePath() + '/bookings'" routerLinkActive="active"><i class="bi bi-bookmark-check"></i> Bookings</a>
        <a *ngIf="auth.hasPermission('payments.view')" [routerLink]="basePath() + '/payments'" routerLinkActive="active"><i class="bi bi-credit-card-2-front"></i> Payments</a>
        <a *ngIf="auth.hasPermission('refunds.view')" [routerLink]="basePath() + '/refunds'" routerLinkActive="active"><i class="bi bi-arrow-counterclockwise"></i> Refunds</a>
        <a *ngIf="auth.hasPermission('expenses.view')" [routerLink]="basePath() + '/expenses'" routerLinkActive="active"><i class="bi bi-cash-coin"></i> Expenses</a>
        <a *ngIf="auth.hasPermission('customers.view')" [routerLink]="basePath() + '/people'" routerLinkActive="active"><i class="bi bi-people-fill"></i> People</a>
        <a *ngIf="auth.hasPermission('reviews.view')" [routerLink]="basePath() + '/reviews'" routerLinkActive="active"><i class="bi bi-chat-quote"></i> Reviews</a>
        <a *ngIf="auth.hasPermission('vehicles.view')" [routerLink]="basePath() + '/vehicles'" routerLinkActive="active"><i class="bi bi-truck"></i> Vehicles</a>
        <a *ngIf="auth.hasPermission('allocations.view')" [routerLink]="basePath() + '/allocations'" routerLinkActive="active"><i class="bi bi-pin-map"></i> Allocations</a>
        <a *ngIf="auth.hasPermission('drivers.view')" [routerLink]="basePath() + '/drivers'" routerLinkActive="active"><i class="bi bi-person-badge"></i> Drivers</a>
        <a *ngIf="auth.hasPermission('reports.view')" [routerLink]="basePath() + '/reports'" routerLinkActive="active"><i class="bi bi-file-earmark-bar-graph"></i> Reports</a>
        <a *ngIf="auth.hasPermission('countries.view')" [routerLink]="basePath() + '/countries'" routerLinkActive="active"><i class="bi bi-globe-americas"></i> Countries</a>
        <a *ngIf="auth.hasPermission('states.view')" [routerLink]="basePath() + '/states'" routerLinkActive="active"><i class="bi bi-map"></i> States</a>
        <a *ngIf="auth.hasPermission('cities.view')" [routerLink]="basePath() + '/cities'" routerLinkActive="active"><i class="bi bi-building"></i> Cities</a>
        <a *ngIf="auth.hasPermission('departments.view')" [routerLink]="basePath() + '/departments'" routerLinkActive="active"><i class="bi bi-diagram-3"></i> Departments</a>
        <a *ngIf="auth.hasPermission('designations.view')" [routerLink]="basePath() + '/designations'" routerLinkActive="active"><i class="bi bi-person-badge-fill"></i> Designations</a>
        <a *ngIf="auth.hasPermission('settings.view')" [routerLink]="basePath() + '/settings'" routerLinkActive="active"><i class="bi bi-gear"></i> Settings</a>
      </aside>
      <section class="content">
        <router-outlet></router-outlet>
      </section>
    </div>

    <!-- ═══════ Global delete-confirmation modal ═══════ -->
    <ng-container *ngIf="confirmModal.isOpen()">
      <div class="modal-backdrop fade show" style="z-index:1070"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true"
           style="z-index:1071" (keydown.escape)="confirmModal.dismiss()">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content border-0 shadow-lg rounded-3 overflow-hidden">

            <!-- Header -->
            <div class="modal-header border-0 pb-0 pt-4 px-4">
              <div class="d-flex align-items-center gap-3">
                <div class="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center"
                     style="width:46px;height:46px;background:rgba(220,53,69,.12)">
                  <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size:1.25rem"></i>
                </div>
                <h5 class="modal-title fw-bold mb-0">{{ confirmModal.options().title }}</h5>
              </div>
            </div>

            <!-- Body -->
            <div class="modal-body px-4 pt-3 pb-2">
              <p class="fw-medium mb-2">{{ confirmModal.options().message }}</p>
              <p *ngIf="confirmModal.options().detail" class="text-muted small mb-3">
                {{ confirmModal.options().detail }}
              </p>
              <div class="d-flex align-items-center gap-2 rounded-2 px-3 py-2"
                   style="background:rgba(255,193,7,.1);border:1px solid rgba(255,193,7,.35)">
                <i class="bi bi-shield-exclamation text-warning flex-shrink-0"></i>
                <small><strong>Warning:</strong> This action is permanent and cannot be undone.</small>
              </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer border-0 px-4 pt-3 pb-4 gap-2">
              <button type="button" class="btn btn-outline-secondary px-4"
                      (click)="confirmModal.dismiss()">
                <i class="bi bi-x-lg me-1"></i>Cancel
              </button>
              <button type="button" class="btn btn-danger px-4"
                      (click)="confirmModal.accept()">
                <i class="bi bi-trash3 me-1"></i>{{ confirmModal.options().confirmLabel ?? 'Delete' }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </ng-container>
  `
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  auth          = inject(AuthService);
  brand         = inject(BrandService);
  systemRoles   = inject(SystemRolesService);
  theme         = inject(ThemeService);
  confirmModal  = inject(ConfirmModalService);
  private store  = inject(NotificationStore);
  private router = inject(Router);

  readonly basePath = computed(() => {
    const prefix = this.systemRoles.routePrefixFor(this.auth.privilegeLevel());
    return prefix ? `/${prefix}` : '/admin';
  });
  readonly sidebarOpen = signal<boolean>(this.readStored());

  readonly languages: Lang[] = [
    { code: 'EN', label: 'English' },
    { code: 'HI', label: 'हिन्दी' },
    { code: 'GU', label: 'ગુજરાતી' }
  ];
  readonly currentLang = signal<Lang>(this.readLang());

  readonly notifList = this.store.items;
  readonly unreadCount = this.store.unreadCount;
  readonly notifPanelOpen = signal<boolean>(false);

  toggleNotifPanel(): void {
    const next = !this.notifPanelOpen();
    this.notifPanelOpen.set(next);
    if (next) this.refreshNotifications();
  }

  closeNotifPanel(): void { this.notifPanelOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.notifPanelOpen()) this.closeNotifPanel();
  }

  private pollTimer?: number;

  ngOnInit(): void {
    this.refreshNotifications();
    this.pollTimer = window.setInterval(() => this.refreshNotifications(), 60000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) window.clearInterval(this.pollTimer);
  }

  toggleSidebar(): void {
    const next = !this.sidebarOpen();
    this.sidebarOpen.set(next);
    localStorage.setItem('travel.sidebarOpen', String(next));
  }

  displayBrandName(): string {
    const level = this.auth.privilegeLevel();
    const adminMin = this.systemRoles.adminMinLevel();
    // Admin tier shows the configured brand name; all other levels show their system role display name
    if (level === adminMin) return this.brand.settings().brandName || this.systemRoles.displayNameFor(level);
    return this.systemRoles.displayNameFor(level) || 'Portal';
  }

  setLang(l: Lang): void {
    this.currentLang.set(l);
    localStorage.setItem(LANG_KEY, l.code);
  }

  refreshNotifications(): void {
    if (!this.auth.isAuthenticated()) return;
    this.store.loadFromServer();
  }

  markAllRead(): void { this.store.markAllRead(); }

  removeNotif(uid: string): void { this.store.remove(uid); }

  clearAll(): void {
    const items = this.notifList();
    items.forEach(n => this.store.remove(n.uid));
  }

  iconForVariant(v: string): string {
    switch (v) {
      case 'success': return 'bi-check-circle-fill';
      case 'danger':  return 'bi-exclamation-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      default:        return 'bi-info-circle-fill';
    }
  }

  onNotifClick(n: StoredNotification): void {
    if (!n.isRead) this.store.markRead(n.uid);
    if (n.link) this.router.navigateByUrl(n.link);
  }

  initials(): string {
    const name = this.auth.currentUser()?.fullName || '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private readStored(): boolean {
    const v = localStorage.getItem('travel.sidebarOpen');
    return v === null ? true : v === 'true';
  }

  private readLang(): Lang {
    const code = localStorage.getItem(LANG_KEY);
    return this.languages.find(l => l.code === code) ?? this.languages[0];
  }
}
