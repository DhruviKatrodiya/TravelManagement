import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Booking } from '../../core/models/api.models';

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
      <div class="col-12">
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

      <div class="col-12">
        <div class="table-card">
          <h5 class="fw-bold mb-3">Tour History</h5>
          <div *ngIf="history.length === 0" class="text-muted">No past tours yet.</div>
          <div *ngIf="history.length > 0" class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Tour</th>
                  <th>Dates</th>
                  <th>Travelers</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of history">
                  <td>
                    <div class="fw-semibold">{{ b.tourName }}</div>
                    <small class="text-muted">{{ b.packageName }}</small><br/>
                    <small class="text-muted">{{ b.bookingReference }}</small>
                  </td>
                  <td>
                    <div>{{ b.tripStartDate | date:'d MMM yyyy' }}</div>
                    <small class="text-muted">→ {{ b.tripEndDate | date:'d MMM yyyy' }}</small>
                  </td>
                  <td>
                    <span>{{ b.adults }} adult<span *ngIf="b.adults !== 1">s</span></span>
                    <span *ngIf="b.children > 0">, {{ b.children }} child<span *ngIf="b.children !== 1">ren</span></span>
                  </td>
                  <td>
                    <div class="fw-semibold">₹{{ b.totalAmount | number:'1.0-0' }}</div>
                    <small class="text-success" *ngIf="b.amountDue === 0">Paid</small>
                    <small class="text-warning" *ngIf="b.amountDue > 0">Due: ₹{{ b.amountDue | number:'1.0-0' }}</small>
                  </td>
                  <td>
                    <span class="badge"
                          [class.bg-success]="b.status === 'Confirmed' || b.status === 'Completed'"
                          [class.bg-danger]="b.status === 'Cancelled'"
                          [class.bg-info]="b.status === 'Refunded'"
                          [class.bg-warning]="b.status === 'Pending'"
                          [class.text-dark]="b.status === 'Pending'">
                      {{ b.status }}
                    </span>
                  </td>
                  <td>
                    <a class="btn btn-sm btn-outline-primary" [routerLink]="['/customer/bookings', b.id]">View</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerDashboardComponent implements OnInit {
  bookings: Booking[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.listBookings().subscribe({ next: bs => this.bookings = bs });
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

  get history(): Booking[] {
    const today = new Date();
    return this.bookings
      .filter(b => new Date(b.tripEndDate) < today || b.status === 'Cancelled' || b.status === 'Refunded')
      .sort((a, b) => new Date(b.tripEndDate).getTime() - new Date(a.tripEndDate).getTime());
  }
}
