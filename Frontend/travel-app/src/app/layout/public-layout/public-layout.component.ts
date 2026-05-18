import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

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
          <ul class="navbar-nav">
            <ng-container *ngIf="!auth.isAuthenticated(); else loggedIn">
              <li class="nav-item"><a class="nav-link" routerLink="/auth/login">Login</a></li>
              <li class="nav-item"><a class="btn btn-light btn-sm ms-2 text-primary fw-semibold" routerLink="/auth/register">Sign up</a></li>
            </ng-container>
            <ng-template #loggedIn>
              <li class="nav-item" *ngIf="auth.isCustomer()"><a class="nav-link" routerLink="/customer">My account</a></li>
              <li class="nav-item" *ngIf="auth.isStaff()">
                <a class="nav-link" [routerLink]="auth.isAdmin() ? '/admin' : '/staff'">
                  {{ auth.currentUser()?.fullName || (auth.isAdmin() ? 'Admin' : 'Staff') }}
                </a>
              </li>
              <li class="nav-item">
                <button class="btn btn-outline-light btn-sm ms-2" (click)="auth.logout()">Logout</button>
              </li>
            </ng-template>
          </ul>
        </div>
      </div>
    </nav>

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
export class PublicLayoutComponent implements OnDestroy {
  year = new Date().getFullYear();
  isHome = false;
  destOpen = false;
  private sub: Subscription;

  constructor(public auth: AuthService, private router: Router) {
    this.isHome = this.computeIsHome(this.router.url);
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => { this.isHome = this.computeIsHome((e as NavigationEnd).urlAfterRedirects); });
  }

  private computeIsHome(url: string): boolean {
    const path = (url || '/').split('?')[0].split('#')[0];
    return path === '/' || path === '';
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
