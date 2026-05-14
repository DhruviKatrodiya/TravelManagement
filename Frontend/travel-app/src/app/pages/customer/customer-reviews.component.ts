import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking, Review } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-customer-reviews',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-end mb-4">
      <div>
        <h2 class="fw-bold mb-1">My Reviews</h2>
        <p class="text-muted mb-0">Reviews you've posted on tours you booked.</p>
      </div>
      <button class="btn btn-primary" (click)="startWrite()" [disabled]="writing || eligibleBookings().length === 0">
        <i class="bi bi-plus-lg me-1"></i>Write new review
      </button>
    </div>

    <div class="table-card mb-4" *ngIf="writing">
      <h5 class="fw-bold mb-3">Write a review</h5>
      <form [formGroup]="form" (ngSubmit)="submit()" class="row g-3">
        <div class="col-12">
          <label class="form-label">Trip</label>
          <select class="form-select" formControlName="bookingId">
            <option [ngValue]="0" disabled>Pick one of your completed trips…</option>
            <option *ngFor="let b of eligibleBookings()" [ngValue]="b.id">
              {{ b.tourName }} — {{ b.packageName }} ({{ b.tripStartDate | date:'mediumDate' }})
            </option>
          </select>
          <small class="text-muted" *ngIf="eligibleBookings().length === 0">
            Only completed trips you haven't reviewed yet appear here.
          </small>
        </div>
        <div class="col-md-4">
          <label class="form-label">Rating</label>
          <select class="form-select" formControlName="rating">
            <option *ngFor="let r of [5,4,3,2,1]" [ngValue]="r">{{ r }} star{{ r > 1 ? 's' : '' }}</option>
          </select>
        </div>
        <div class="col-md-8">
          <label class="form-label">Title <small class="text-muted">(optional)</small></label>
          <input class="form-control" formControlName="title" placeholder="A short headline" />
        </div>
        <div class="col-12">
          <label class="form-label">Comment <small class="text-muted">(optional)</small></label>
          <textarea class="form-control" rows="4" formControlName="comment" placeholder="Tell other travellers what you liked…"></textarea>
        </div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="form.invalid || posting">{{ posting ? 'Posting…' : 'Post review' }}</button>
          <button class="btn btn-link" type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </div>

    <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

    <div *ngIf="!loading && reviews.length === 0 && !writing" class="table-card text-center py-5">
      <i class="bi bi-chat-quote display-5 text-muted d-block mb-2"></i>
      <h5 class="fw-bold">No reviews yet</h5>
      <p class="text-muted mb-3" *ngIf="eligibleBookings().length > 0">
        You have {{ eligibleBookings().length }} completed trip(s) waiting for a review.
      </p>
      <p class="text-muted mb-3" *ngIf="eligibleBookings().length === 0">
        Once a trip is marked completed by the team you can review it here.
      </p>
      <button class="btn btn-primary btn-sm" (click)="startWrite()" *ngIf="eligibleBookings().length > 0">
        <i class="bi bi-plus-lg me-1"></i>Write your first review
      </button>
    </div>

    <div class="row g-3" *ngIf="!loading && reviews.length > 0">
      <div class="col-md-6" *ngFor="let r of reviews">
        <div class="table-card h-100">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="fw-bold mb-0">{{ r.tourName }}</h6>
              <small class="text-muted">{{ r.createdAt | date:'mediumDate' }}</small>
            </div>
            <span class="badge" [class.bg-success]="r.isApproved" [class.bg-warning]="!r.isApproved">
              {{ r.isApproved ? 'Published' : 'Pending review' }}
            </span>
          </div>
          <div class="mb-2">
            <span class="star" *ngFor="let s of stars(r.rating)"><i class="bi bi-star-fill"></i></span>
            <span class="star muted" *ngFor="let s of emptyStars(r.rating)"><i class="bi bi-star"></i></span>
            <span class="ms-2 text-muted small">{{ r.rating }} / 5</span>
          </div>
          <h6 class="fw-semibold mb-1" *ngIf="r.title">{{ r.title }}</h6>
          <p class="mb-3 text-muted" *ngIf="r.comment">{{ r.comment }}</p>
          <p class="text-muted small fst-italic mb-3" *ngIf="!r.comment">(no comment)</p>
          <div class="text-end">
            <button class="btn btn-sm btn-outline-danger" (click)="remove(r)">
              <i class="bi bi-trash me-1"></i>Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerReviewsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  reviews: Review[] = [];
  bookings: Booking[] = [];
  loading = true;
  writing = false;
  posting = false;

  form = this.fb.group({
    bookingId: [0, [Validators.required, Validators.min(1)]],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    title: [''],
    comment: ['']
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.listMyReviews().subscribe({
      next: rs => {
        this.reviews = rs;
        this.api.listBookings().subscribe({
          next: bs => { this.bookings = bs; this.loading = false; },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  eligibleBookings(): Booking[] {
    const reviewedBookingIds = new Set(this.reviews.map(r => r.bookingId).filter((id): id is number => !!id));
    return this.bookings.filter(b => b.status === 'Completed' && !reviewedBookingIds.has(b.id));
  }

  startWrite(): void {
    const first = this.eligibleBookings()[0];
    this.form.reset({
      bookingId: first ? first.id : 0,
      rating: 5,
      title: '',
      comment: ''
    });
    this.writing = true;
    scrollAdminContentTop();
  }

  cancel(): void { this.writing = false; }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.posting = true;
    this.api.createReview({
      tourId: 0,
      bookingId: v.bookingId,
      rating: v.rating,
      title: v.title || undefined,
      comment: v.comment || undefined
    }).subscribe({
      next: () => {
        this.posting = false;
        this.writing = false;
        this.toast.show('Thanks for your review!', 'success');
        this.load();
      },
      error: () => { this.posting = false; }
    });
  }

  remove(r: Review): void {
    if (!confirm(`Delete your review of "${r.tourName}"?`)) return;
    this.api.deleteMyReview(r.id).subscribe({
      next: () => { this.toast.show('Review deleted', 'info'); this.load(); }
    });
  }

  stars(n: number): number[] { return Array.from({ length: n }, (_, i) => i); }
  emptyStars(n: number): number[] { return Array.from({ length: Math.max(0, 5 - n) }, (_, i) => i); }
}
