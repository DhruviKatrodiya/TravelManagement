import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Booking } from '../../core/models/api.models';

@Component({
  selector: 'app-customer-bookings',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-4">My Bookings</h2>
    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Reference</th><th>Tour</th><th>Trip dates</th><th>Guests</th><th>Total</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of bookings">
              <td><code>{{ b.bookingReference }}</code></td>
              <td>{{ b.tourName }} — <span class="text-muted small">{{ b.packageName }}</span></td>
              <td>{{ b.tripStartDate | date }} → {{ b.tripEndDate | date }}</td>
              <td>{{ b.adults }}A / {{ b.children }}C</td>
              <td>₹ {{ b.totalAmount | number:'1.0-0' }}</td>
              <td><span class="badge" [ngClass]="badgeClass(b.status)">{{ b.status }}</span></td>
              <td class="text-end"><a class="btn btn-sm btn-outline-primary" [routerLink]="['/customer/bookings', b.id]">View</a></td>
            </tr>
            <tr *ngIf="bookings.length === 0">
              <td colspan="7" class="text-center text-muted py-4">You haven't booked any trips yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CustomerBookingsComponent implements OnInit {
  bookings: Booking[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.listBookings().subscribe({ next: bs => this.bookings = bs });
  }

  badgeClass(s: string): string {
    return { Confirmed: 'bg-success', Pending: 'bg-warning text-dark', Cancelled: 'bg-danger', Completed: 'bg-secondary', Refunded: 'bg-info text-dark' }[s] || 'bg-secondary';
  }
}
