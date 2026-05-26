import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationStore, StoredNotification } from '../../core/services/notification-store.service';

@Component({
  selector: 'app-customer-layout',
  standalone: false,
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark brand-gradient sticky-top">
      <div class="container">
        <a class="navbar-brand fw-bold" routerLink="/">
          <i class="bi bi-airplane-engines-fill me-2"></i>TravelHub
        </a>

        <!-- Bell icon always visible on mobile, before toggler -->
        <button class="btn position-relative me-2 text-white border-0 d-lg-none"
                type="button" (click)="toggleNotifPanel()" aria-label="Notifications">
          <i class="bi bi-bell" style="font-size:1.2rem"></i>
          <span *ngIf="unreadCount() > 0" class="notif-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
        </button>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navC">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navC">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link" routerLink="/customer" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="/customer/bookings" routerLinkActive="active">My Bookings</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="/customer/reviews" routerLinkActive="active">My Reviews</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="/customer/profile" routerLinkActive="active">Profile</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="/tours">Browse Tours</a></li>
          </ul>
          <ul class="navbar-nav align-items-center gap-2">
            <li class="nav-item d-flex align-items-center">
              <a class="nav-link text-white px-2 d-flex align-items-center gap-1"
                 routerLink="/customer/profile" routerLinkActive="active" style="cursor:pointer">
                <i class="bi bi-person-circle"></i>
                <span>{{ auth.currentUser()?.fullName }}</span>
              </a>
            </li>
            <!-- Bell icon for desktop (inside collapse) -->
            <li class="nav-item d-none d-lg-flex">
              <button class="btn position-relative text-white border-0"
                      type="button" (click)="toggleNotifPanel()" aria-label="Notifications">
                <i class="bi bi-bell" style="font-size:1.2rem"></i>
                <span *ngIf="unreadCount() > 0" class="notif-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
              </button>
            </li>
            <li class="nav-item">
              <button class="btn btn-outline-light btn-sm" (click)="auth.logout()">Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Notification backdrop & panel -->
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
              <i class="bi mt-1" [ngClass]="iconForVariant(n.variant)"
                 [class.text-success]="n.variant === 'success'"
                 [class.text-danger]="n.variant === 'danger'"
                 [class.text-warning]="n.variant === 'warning'"
                 [class.text-primary]="n.variant === 'info'"></i>
              <div class="flex-grow-1 min-w-0" (click)="onNotifClick(n)" style="cursor:pointer">
                <div class="small fw-semibold">{{ n.title }}</div>
                <div class="small text-muted">{{ n.message }}</div>
                <div class="text-muted" style="font-size:.7rem">{{ n.createdAt | date:'short' }}</div>
              </div>
              <button type="button" class="btn btn-sm btn-link p-0 text-muted notif-delete"
                      (click)="removeNotif(n.uid); $event.stopPropagation()" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </aside>

    <main class="container py-4">
      <router-outlet></router-outlet>
    </main>
  `
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private store = inject(NotificationStore);
  private router = inject(Router);

  readonly notifList = this.store.items;
  readonly unreadCount = this.store.unreadCount;
  readonly notifPanelOpen = signal<boolean>(false);

  private pollTimer?: number;

  ngOnInit(): void {
    this.refreshNotifications();
    this.pollTimer = window.setInterval(() => this.refreshNotifications(), 60000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) window.clearInterval(this.pollTimer);
  }

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

  refreshNotifications(): void {
    if (!this.auth.isAuthenticated()) return;
    this.store.loadFromServer();
  }

  markAllRead(): void { this.store.markAllRead(); }

  removeNotif(uid: string): void { this.store.remove(uid); }

  clearAll(): void {
    this.notifList().forEach(n => this.store.remove(n.uid));
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
}
