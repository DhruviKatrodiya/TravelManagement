import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Review } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-reviews',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-4">Reviews</h2>
    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Customer</th><th>Tour</th><th>Rating</th><th>Title / Comment</th><th>Posted</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let r of items">
              <td>{{ r.customerName }}</td>
              <td>{{ r.tourName }}</td>
              <td>
                <span class="star" *ngFor="let s of [1,2,3,4,5]">
                  <i class="bi" [ngClass]="s <= r.rating ? 'bi-star-fill' : 'bi-star'"></i>
                </span>
              </td>
              <td><strong>{{ r.title }}</strong><br><small class="text-muted">{{ r.comment }}</small></td>
              <td>{{ r.createdAt | date:'short' }}</td>
              <td><span class="badge" [class.bg-success]="r.isApproved" [class.bg-warning]="!r.isApproved">{{ r.isApproved ? 'Visible' : 'Hidden' }}</span></td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" (click)="approve(r, !r.isApproved)">{{ r.isApproved ? 'Hide' : 'Approve' }}</button>
                <button class="btn btn-sm btn-outline-danger" (click)="remove(r)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="items.length === 0"><td colspan="7" class="text-center text-muted py-3">No reviews yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminReviewsComponent implements OnInit {
  items: Review[] = [];

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }
  load(): void { this.api.listReviews().subscribe({ next: rs => this.items = rs }); }

  approve(r: Review, val: boolean): void {
    this.api.approveReview(r.id, val).subscribe({ next: () => { this.toast.show(val ? 'Approved' : 'Hidden', 'success'); this.load(); } });
  }
  remove(r: Review): void {
    if (!confirm('Delete this review?')) return;
    this.api.deleteReview(r.id).subscribe({ next: () => { this.toast.show('Deleted', 'info'); this.load(); } });
  }
}
