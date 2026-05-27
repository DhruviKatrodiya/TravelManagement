import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationStore, StoredNotification } from '../../core/services/notification-store.service';
import { SystemRolesService } from '../../core/services/system-roles.service';

@Component({
  selector: 'app-public-layout',
  standalone: false,
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark"
         [class.brand-gradient]="!isHome"
         [class.sticky-top]="!isHome"
         [class.navbar-transparent]="isHome">
      <div class="container">
        <a class="navbar-brand fw-bold" routerLink="/">
          <i class="bi bi-airplane-engines-fill me-2"></i>TravelHub
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMain">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="/tours" routerLinkActive="active">Tours</a></li>
            <li class="nav-item dropdown"
                [class.show]="destOpen"
                (mouseenter)="destOpen = true"
                (mouseleave)="destOpen = false"
                (touchstart)="destOpen = !destOpen; $event.stopPropagation()">
              <a class="nav-link" href="javascript:;" role="button" style="cursor: pointer;">Destinations</a>
              <ul class="dropdown-menu" [class.show]="destOpen">
                <li><a class="dropdown-item" [routerLink]="['/tours']" [queryParams]="{destination: 'India'}" (click)="destOpen = false">India</a></li>
                <li><a class="dropdown-item" [routerLink]="['/tours']" [queryParams]="{destination: 'Bhutan'}" (click)="destOpen = false">Bhutan</a></li>
                <li><a class="dropdown-item" [routerLink]="['/tours']" [queryParams]="{destination: 'Nepal'}" (click)="destOpen = false">Nepal</a></li>
              </ul>
            </li>
            <li class="nav-item"><a class="nav-link" routerLink="/about" routerLinkActive="active">About</a></li>
          </ul>
          <ul class="navbar-nav align-items-center gap-2">
            <ng-container *ngIf="!auth.isAuthenticated(); else loggedIn">
              <li class="nav-item"><a class="nav-link" routerLink="/auth/login">Login</a></li>
              <li class="nav-item"><a class="btn btn-light btn-sm ms-2 text-primary fw-semibold" routerLink="/auth/register">Sign up</a></li>
            </ng-container>
            <ng-template #loggedIn>
              <li class="nav-item" *ngIf="auth.isCustomer()"><a class="nav-link" routerLink="/customer">My account</a></li>
              <li class="nav-item" *ngIf="auth.isStaff()">
                <a class="nav-link" [routerLink]="'/' + systemRoles.routePrefixFor(auth.privilegeLevel())">
                  {{ auth.currentUser()?.fullName || systemRoles.displayNameFor(auth.privilegeLevel()) }}
                </a>
              </li>
              <!-- Notification bell for logged-in users -->
              <li class="nav-item">
                <button class="btn position-relative text-white border-0"
                        type="button" (click)="toggleNotifPanel()" aria-label="Notifications">
                  <i class="bi bi-bell" style="font-size:1.2rem"></i>
                  <span *ngIf="unreadCount() > 0" class="notif-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
                </button>
              </li>
              <li class="nav-item">
                <button class="btn btn-outline-light btn-sm ms-2" (click)="auth.logout()">Logout</button>
              </li>
            </ng-template>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Notification backdrop & panel (only for authenticated users) -->
    <ng-container *ngIf="auth.isAuthenticated()">
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
    </ng-container>

    <main [class.has-overlay-navbar]="isHome">
      <router-outlet></router-outlet>
    </main>

    <footer class="bg-dark text-light mt-5 py-4">
      <div class="container">
        <div class="row">
          <div class="col-md-6">
            <h5 class="fw-bold"><i class="bi bi-airplane-engines me-2"></i>TravelHub</h5>
            <p class="text-secondary mb-0">Curated tours across India, Bhutan and Nepal.</p>
          </div>
          <div class="col-md-3">
            <h6>Company</h6>
            <a class="d-block text-secondary text-decoration-none" routerLink="/about">About</a>
            <a class="d-block text-secondary text-decoration-none" routerLink="/tours">Tours</a>
          </div>
          <div class="col-md-3">
            <h6>Contact</h6>
            <p class="text-secondary mb-0">support&#64;travelhub.local</p>
            <p class="text-secondary mb-0">+91 90000 00000</p>
          </div>
        </div>
        <hr class="border-secondary" />
        <p class="text-secondary text-center mb-0">&copy; {{ year }} TravelHub. All rights reserved.</p>
      </div>
    </footer>
  `
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  year = new Date().getFullYear();
  isHome = false;
  destOpen = false;

  auth = inject(AuthService);
  systemRoles = inject(SystemRolesService);
  private store = inject(NotificationStore);
  private router = inject(Router);

  readonly notifList = this.store.items;
  readonly unreadCount = this.store.unreadCount;
  readonly notifPanelOpen = signal<boolean>(false);

  private routerSub!: Subscription;
  private pollTimer?: number;

  constructor() {
    this.isHome = this.computeIsHome(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => { this.isHome = this.computeIsHome((e as NavigationEnd).urlAfterRedirects); });
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.refreshNotifications();
      this.pollTimer = window.setInterval(() => this.refreshNotifications(), 60000);
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
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

  private computeIsHome(url: string): boolean {
    const path = (url || '/').split('?')[0].split('#')[0];
    return path === '/' || path === '';
  }
}
