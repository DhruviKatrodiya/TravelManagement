import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Booking, Notification } from '../../core/models/api.models';

@Component({
  selector: 'app-customer-dashboard',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">My Travel Dashboard</h2>
      <a class="btn btn-primary" routerLink="/tours">Plan a new trip</a>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="kpi"><div class="label">Total trips</div><div class="value">{{ bookings.length }}</div></div>
      </div>
      <div class="col-md-3">
        <div class="kpi"><div class="label">Confirmed</div><div class="value text-success">{{ count('Confirmed') }}</div></div>
      </div>
      <div class="col-md-3">
        <div class="kpi"><div class="label">Pending</div><div class="value text-warning">{{ count('Pending') }}</div></div>
      </div>
      <div class="col-md-3">
        <div class="kpi"><div class="label">Cancelled</div><div class="value text-danger">{{ count('Cancelled') }}</div></div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-7">
        <div class="table-card">
          <h5 class="fw-bold mb-3">Upcoming trips</h5>
          <div *ngIf="upcoming.length === 0" class="text-muted">No upcoming bookings yet.</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let b of upcoming">
              <div>
                <div class="fw-semibold">{{ b.tourName }} — {{ b.packageName }}</div>
                <small class="text-muted">{{ b.bookingReference }} · {{ b.tripStartDate | date }} → {{ b.tripEndDate | date }}</small>
              </div>
              <a class="btn btn-sm btn-outline-primary" [routerLink]="['/customer/bookings', b.id]">View</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="table-card">
          <h5 class="fw-bold mb-3">Notifications</h5>
          <div *ngIf="notifications.length === 0" class="text-muted">No notifications.</div>
          <div class="list-group list-group-flush">
            <a class="list-group-item list-group-item-action" *ngFor="let n of notifications" [routerLink]="n.link || []">
              <div class="d-flex justify-content-between">
                <strong>{{ n.title }}</strong>
                <small class="text-muted">{{ n.createdAt | date:'short' }}</small>
              </div>
              <p class="mb-0 small text-muted">{{ n.message }}</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerDashboardComponent implements OnInit {
  bookings: Booking[] = [];
  notifications: Notification[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.listBookings().subscribe({ next: bs => this.bookings = bs });
    this.api.listNotifications().subscribe({ next: ns => this.notifications = ns.slice(0, 10) });
  }

  count(status: string): number {
    return this.bookings.filter(b => b.status === status).length;
  }

  get upcoming(): Booking[] {
    const today = new Date();
    return this.bookings
      .filter(b => new Date(b.tripEndDate) >= today && b.status !== 'Cancelled')
      .sort((a, b) => new Date(a.tripStartDate).getTime() - new Date(b.tripStartDate).getTime())
      .slice(0, 5);
  }
}
