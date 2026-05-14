import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-layout',
  standalone: false,
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark brand-gradient sticky-top">
      <div class="container">
        <a class="navbar-brand fw-bold" routerLink="/">
          <i class="bi bi-airplane-engines-fill me-2"></i>TravelHub
        </a>
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
          <ul class="navbar-nav">
            <li class="nav-item text-light d-flex align-items-center me-3">{{ auth.currentUser()?.fullName }}</li>
            <li class="nav-item">
              <button class="btn btn-outline-light btn-sm" (click)="auth.logout()">Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <main class="container py-4">
      <router-outlet></router-outlet>
    </main>
  `
})
export class CustomerLayoutComponent {
  constructor(public auth: AuthService) {}
}
