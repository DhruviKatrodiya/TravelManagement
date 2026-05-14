import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { TourPackage } from '../../core/models/api.models';

@Component({
  selector: 'app-booking-create',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-3">Confirm your trip</h2>
    <p class="text-muted mb-4">Review details and place your booking. You'll pay on the next screen.</p>

    <div *ngIf="!pkg" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

    <div *ngIf="pkg" class="row g-4">
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h5 class="fw-bold mb-3">{{ pkg.name }}</h5>
            <p class="text-muted">{{ pkg.description }}</p>
            <p class="mb-1"><strong>Duration:</strong> {{ pkg.durationDays }} days / {{ pkg.durationNights }} nights</p>
            <p class="mb-1"><strong>Price:</strong> ₹ {{ pkg.pricePerPerson | number:'1.0-0' }} per adult, ₹ {{ pkg.childPrice || (pkg.pricePerPerson * 0.6) | number:'1.0-0' }} per child</p>
            <p class="mb-0"><strong>Group:</strong> {{ pkg.minPersons }}-{{ pkg.maxPersons }} persons</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="card border-0 shadow-sm mt-3">
          <div class="card-body">
            <h5 class="fw-bold mb-3">Trip details</h5>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Start date</label>
                <input type="date" class="form-control" formControlName="tripStartDate" (change)="recalcEnd()" />
              </div>
              <div class="col-md-6">
                <label class="form-label">End date</label>
                <input type="date" class="form-control" formControlName="tripEndDate" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Adults</label>
                <input type="number" min="1" class="form-control" formControlName="adults" (input)="recalc()" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Children</label>
                <input type="number" min="0" class="form-control" formControlName="children" (input)="recalc()" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Promo discount (₹)</label>
                <input type="number" min="0" class="form-control" formControlName="discount" (input)="recalc()" />
              </div>
              <div class="col-12">
                <label class="form-label">Special requests</label>
                <textarea class="form-control" rows="2" formControlName="specialRequests"></textarea>
              </div>
              <div class="col-12" *ngIf="pkg.isCustomizable">
                <label class="form-label">Custom itinerary notes (optional)</label>
                <textarea class="form-control" rows="3" formControlName="customItinerary" placeholder="Tell us how you'd like to customise..."></textarea>
              </div>
            </div>

            <button class="btn btn-primary mt-4" [disabled]="form.invalid || submitting">
              {{ submitting ? 'Booking…' : 'Confirm booking' }}
            </button>
          </div>
        </form>
      </div>

      <div class="col-lg-5">
        <div class="card border-0 shadow-sm sticky-top" style="top: 80px;">
          <div class="card-body">
            <h5 class="fw-bold">Price summary</h5>
            <div class="d-flex justify-content-between"><span>Adults × {{ form.value.adults }}</span><span>₹ {{ adultsTotal | number:'1.2-2' }}</span></div>
            <div class="d-flex justify-content-between"><span>Children × {{ form.value.children }}</span><span>₹ {{ childrenTotal | number:'1.2-2' }}</span></div>
            <div class="d-flex justify-content-between text-success"><span>Discount</span><span>− ₹ {{ form.value.discount | number:'1.2-2' }}</span></div>
            <div class="d-flex justify-content-between"><span>Tax (5%)</span><span>₹ {{ tax | number:'1.2-2' }}</span></div>
            <hr/>
            <div class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>₹ {{ total | number:'1.2-2' }}</span></div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookingCreateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  pkg?: TourPackage;
  submitting = false;
  adultsTotal = 0;
  childrenTotal = 0;
  tax = 0;
  total = 0;

  form = this.fb.group({
    tripStartDate: [this.iso(new Date(Date.now() + 7 * 86400000)), Validators.required],
    tripEndDate: [this.iso(new Date(Date.now() + 10 * 86400000)), Validators.required],
    adults: [2, [Validators.required, Validators.min(1)]],
    children: [0, [Validators.required, Validators.min(0)]],
    discount: [0, [Validators.min(0)]],
    specialRequests: [''],
    customItinerary: ['']
  });

  ngOnInit(): void {
    const pkgId = Number(this.route.snapshot.paramMap.get('packageId'));
    this.api.getPackage(pkgId).subscribe({
      next: p => {
        this.pkg = p;
        this.recalcEnd();
        this.recalc();
      }
    });
  }

  recalcEnd(): void {
    if (!this.pkg) return;
    const start = this.form.value.tripStartDate;
    if (!start) return;
    const d = new Date(start as string);
    d.setDate(d.getDate() + this.pkg.durationDays - 1);
    this.form.patchValue({ tripEndDate: this.iso(d) });
  }

  recalc(): void {
    if (!this.pkg) return;
    const v = this.form.value;
    this.adultsTotal = (v.adults || 0) * this.pkg.pricePerPerson;
    const childPrice = this.pkg.childPrice ?? this.pkg.pricePerPerson * 0.6;
    this.childrenTotal = (v.children || 0) * childPrice;
    const sub = this.adultsTotal + this.childrenTotal - (v.discount || 0);
    this.tax = Math.max(0, sub) * 0.05;
    this.total = Math.max(0, sub) + this.tax;
  }

  submit(): void {
    if (this.form.invalid || !this.pkg) return;
    this.submitting = true;
    const v = this.form.getRawValue();
    this.api.createBooking({
      tourPackageId: this.pkg.id,
      tripStartDate: v.tripStartDate!,
      tripEndDate: v.tripEndDate!,
      adults: v.adults!,
      children: v.children!,
      discount: v.discount ?? 0,
      specialRequests: v.specialRequests || undefined,
      customItinerary: v.customItinerary || undefined
    }).subscribe({
      next: b => {
        this.submitting = false;
        this.toast.show(`Booking ${b.bookingReference} created. Complete payment to confirm.`, 'success');
        this.router.navigate(['/customer/bookings', b.id]);
      },
      error: () => this.submitting = false
    });
  }

  private iso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
