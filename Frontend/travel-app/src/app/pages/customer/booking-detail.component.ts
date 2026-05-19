import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Booking, Payment, PaymentMethod } from '../../core/models/api.models';
import { ToastService } from '../../core/services/toast.service';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-booking-detail',
  standalone: false,
  template: `
    <div *ngIf="!booking" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

    <div *ngIf="booking">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">{{ booking.tourName }}</h2>
          <p class="text-muted mb-0"><code>{{ booking.bookingReference }}</code></p>
        </div>
        <span class="badge fs-6" [ngClass]="badgeClass(booking.status)">{{ booking.status }}</span>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <h5 class="fw-bold">Trip details</h5>
              <p class="mb-1"><strong>Package:</strong> {{ booking.packageName }}</p>
              <p class="mb-1"><strong>Travel dates:</strong> {{ booking.tripStartDate | date }} → {{ booking.tripEndDate | date }}</p>
              <p class="mb-1"><strong>Guests:</strong> {{ booking.adults }} adult(s), {{ booking.children }} child(ren)</p>
              <p class="mb-0" *ngIf="booking.specialRequests"><strong>Special requests:</strong> {{ booking.specialRequests }}</p>
            </div>
          </div>

          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <h5 class="fw-bold">Payments</h5>
              <table class="table table-sm mb-0">
                <thead>
                  <tr><th>Reference</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of payments">
                    <td><code>{{ p.transactionReference }}</code></td>
                    <td>{{ p.method }}</td>
                    <td>₹ {{ p.amount | number:'1.2-2' }}</td>
                    <td>{{ p.status }}</td>
                    <td>{{ p.completedAt || p.initiatedAt | date:'short' }}</td>
                  </tr>
                  <tr *ngIf="payments.length === 0"><td colspan="5" class="text-center text-muted">No payments yet.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card border-0 shadow-sm" *ngIf="booking.status !== 'Cancelled' && booking.status !== 'Completed'">
            <div class="card-body">
              <h5 class="fw-bold">Actions</h5>
              <ng-container *ngIf="canCancel(); else cancelExpired">
                <ng-container *ngIf="!showCancelForm">
                  <button class="btn btn-outline-danger" (click)="showCancelForm = true">Cancel booking</button>
                  <small class="d-block text-muted mt-2">
                    You can cancel up to <strong>{{ cancelDeadline() | date:'short' }}</strong>
                    (24 hours after booking).
                  </small>
                </ng-container>
                <ng-container *ngIf="showCancelForm">
                  <p class="text-danger fw-semibold mb-2"><i class="bi bi-exclamation-triangle me-1"></i>Please provide a reason for cancellation.</p>
                  <textarea class="form-control mb-2" [(ngModel)]="cancelNote" rows="3"
                            placeholder="Reason for cancellation (required, min 5 characters)"
                            [class.is-invalid]="cancelNoteInvalid"></textarea>
                  <small class="text-danger d-block mb-2" *ngIf="cancelNoteInvalid">
                    <i class="bi bi-exclamation-circle me-1"></i>Cancellation reason is required (minimum 5 characters).
                  </small>
                  <div class="d-flex gap-2">
                    <button class="btn btn-danger" (click)="cancel()" [disabled]="cancelling">
                      <span *ngIf="cancelling" class="spinner-border spinner-border-sm me-1"></span>
                      {{ cancelling ? 'Cancelling…' : 'Confirm cancellation' }}
                    </button>
                    <button class="btn btn-outline-secondary" (click)="showCancelForm = false; cancelNote = ''; cancelNoteInvalid = false">Back</button>
                  </div>
                </ng-container>
              </ng-container>
              <ng-template #cancelExpired>
                <small class="text-muted">
                  The 24-hour cancellation window closed on
                  <strong>{{ cancelDeadline() | date:'short' }}</strong>.
                  Please contact support for further assistance.
                </small>
              </ng-template>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <h5 class="fw-bold">Payment summary</h5>
              <div class="d-flex justify-content-between"><span>Subtotal</span><span>₹ {{ booking.subTotal | number:'1.2-2' }}</span></div>
              <div class="d-flex justify-content-between text-success"><span>Discount</span><span>− ₹ {{ booking.discount | number:'1.2-2' }}</span></div>
              <div class="d-flex justify-content-between"><span>Tax (5%)</span><span>₹ {{ booking.tax | number:'1.2-2' }}</span></div>
              <hr/>
              <div class="d-flex justify-content-between fw-bold"><span>Total</span><span>₹ {{ booking.totalAmount | number:'1.2-2' }}</span></div>
              <div class="d-flex justify-content-between text-success"><span>Paid</span><span>₹ {{ booking.amountPaid | number:'1.2-2' }}</span></div>
              <div class="d-flex justify-content-between text-danger fw-semibold" *ngIf="booking.amountDue > 0"><span>Due</span><span>₹ {{ booking.amountDue | number:'1.2-2' }}</span></div>
            </div>
          </div>

          <div class="card border-0 shadow-sm mb-3" *ngIf="booking.amountDue > 0 && booking.status !== 'Cancelled'">
            <div class="card-body">
              <h5 class="fw-bold">Pay now</h5>
              <form [formGroup]="payForm" (ngSubmit)="pay()">
                <div class="mb-2">
                  <label class="form-label">Method</label>
                  <select class="form-select" formControlName="method">
                    <option value="Paytm">Paytm</option>
                    <option value="GooglePay">Google Pay</option>
                    <option value="BankTransfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div class="mb-2">
                  <label class="form-label">Amount (₹)</label>
                  <input type="number" class="form-control" formControlName="amount" />
                </div>
                <button type="submit" class="btn btn-success w-100" [disabled]="payForm.invalid || paying">
                  {{ paying ? 'Processing…' : 'Pay ₹' + (payForm.value.amount || 0) }}
                </button>
                <small class="d-block text-muted mt-2">Gateway is stubbed for demo — confirmation is simulated.</small>
              </form>
            </div>
          </div>

          <div class="card border-0 shadow-sm" *ngIf="booking.status === 'Completed'">
            <div class="card-body">
              <h5 class="fw-bold">Leave a review</h5>
              <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
                <div class="mb-2">
                  <label class="form-label">Rating</label>
                  <select class="form-select" formControlName="rating">
                    <option *ngFor="let r of [1,2,3,4,5]" [value]="r">{{ r }} star{{ r > 1 ? 's' : '' }}</option>
                  </select>
                </div>
                <div class="mb-2">
                  <label class="form-label">Title</label>
                  <input class="form-control" formControlName="title" />
                </div>
                <div class="mb-2">
                  <label class="form-label">Comment</label>
                  <textarea class="form-control" rows="3" formControlName="comment"></textarea>
                </div>
                <button class="btn btn-primary w-100">Post review</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  booking?: Booking;
  payments: Payment[] = [];
  paying = false;
  showCancelForm = false;
  cancelNote = '';
  cancelNoteInvalid = false;
  cancelling = false;

  payForm = this.fb.group({
    method: ['Paytm' as PaymentMethod, Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]]
  });

  reviewForm = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    title: [''],
    comment: ['']
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number): void {
    this.api.getBooking(id).subscribe({
      next: b => {
        this.booking = b;
        this.payForm.patchValue({ amount: b.amountDue || b.totalAmount });
      }
    });
    this.api.listPayments(id).subscribe({ next: p => this.payments = p });
  }

  pay(): void {
    if (this.payForm.invalid || !this.booking) return;
    this.paying = true;
    const v = this.payForm.getRawValue();
    this.api.initiatePayment({ bookingId: this.booking.id, method: v.method, amount: v.amount }).subscribe({
      next: r => {
        // Simulate gateway success
        this.api.confirmPayment({ transactionReference: r.transactionReference, success: true, gatewayTransactionId: 'SIM-' + Date.now() })
          .subscribe({
            next: () => {
              this.paying = false;
              this.toast.show('Payment received. Booking will be confirmed.', 'success');
              this.load(this.booking!.id);
            },
            error: () => { this.paying = false; }
          });
      },
      error: () => { this.paying = false; }
    });
  }

  cancel(): void {
    if (!this.booking) return;
    if (!this.canCancel()) { this.toast.show('Cancellation window has closed.', 'danger'); return; }
    const note = this.cancelNote.trim();
    if (note.length < 5) { this.cancelNoteInvalid = true; return; }
    this.cancelNoteInvalid = false;
    this.cancelling = true;
    this.api.cancelBooking(this.booking.id, note).subscribe({
      next: () => {
        this.cancelling = false;
        this.showCancelForm = false;
        this.cancelNote = '';
        this.toast.show('Booking cancelled.', 'info');
        this.load(this.booking!.id);
      },
      error: (err: any) => {
        this.cancelling = false;
        this.toast.show(err?.error?.message || 'Could not cancel booking.', 'danger');
      }
    });
  }

  cancelDeadline(): Date | null {
    if (!this.booking?.bookedAt) return null;
    const t = new Date(this.booking.bookedAt).getTime();
    return new Date(t + 24 * 60 * 60 * 1000);
  }

  canCancel(): boolean {
    const deadline = this.cancelDeadline();
    return !!deadline && Date.now() < deadline.getTime();
  }

  submitReview(): void {
    if (!this.booking) return;
    const v = this.reviewForm.getRawValue();
    this.api.createReview({
      tourId: 0,
      bookingId: this.booking.id,
      rating: v.rating,
      title: v.title,
      comment: v.comment
    }).subscribe({ next: () => this.toast.show('Thanks for your review!', 'success') });
  }

  badgeClass(s: string): string {
    return { Confirmed: 'bg-success', Pending: 'bg-warning text-dark', Cancelled: 'bg-danger', Completed: 'bg-secondary', Refunded: 'bg-info text-dark' }[s] || 'bg-secondary';
  }
}
