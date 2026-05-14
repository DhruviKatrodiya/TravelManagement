import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Review, Tour, TourPackage } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tour-detail',
  standalone: false,
  template: `
    <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

    <div *ngIf="!loading && tour">
      <div class="position-relative">
        <img [src]="tour.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400'"
             style="height: 320px; width: 100%; object-fit: cover;" alt="" />
        <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end"
             style="background: linear-gradient(180deg, transparent, rgba(0,0,0,0.7));">
          <div class="container text-white pb-4">
            <span class="badge bg-accent mb-2">{{ tour.destination }}</span>
            <h1 class="display-5 fw-bold">{{ tour.name }}</h1>
            <p class="lead mb-0">{{ tour.region }}</p>
          </div>
        </div>
      </div>

      <div class="container py-5">
        <div class="row g-4">
          <div class="col-lg-8">
            <h4 class="fw-bold">About this tour</h4>
            <p class="text-muted">{{ tour.description }}</p>

            <h5 class="fw-bold mt-4">Highlights</h5>
            <p class="text-muted">{{ tour.highlights }}</p>

            <h4 class="fw-bold mt-4">Available Packages</h4>
            <div class="accordion" id="pkgAcc">
              <div class="accordion-item" *ngFor="let p of tour.packages; let i = index">
                <h2 class="accordion-header">
                  <button class="accordion-button" [class.collapsed]="i > 0" type="button"
                          data-bs-toggle="collapse" [attr.data-bs-target]="'#pkg' + p.id">
                    <div>
                      <div class="fw-semibold">{{ p.name }}</div>
                      <small class="text-muted">{{ p.durationDays }}D / {{ p.durationNights }}N
                        &middot; ₹{{ p.pricePerPerson | number:'1.0-0' }} per person</small>
                    </div>
                  </button>
                </h2>
                <div [id]="'pkg' + p.id" class="accordion-collapse collapse" [class.show]="i === 0">
                  <div class="accordion-body">
                    <p class="text-muted">{{ p.description }}</p>
                    <div class="row g-3">
                      <div class="col-md-6">
                        <h6>Inclusions</h6>
                        <p class="text-success small mb-0">{{ p.inclusions }}</p>
                      </div>
                      <div class="col-md-6">
                        <h6>Exclusions</h6>
                        <p class="text-danger small mb-0">{{ p.exclusions }}</p>
                      </div>
                    </div>
                    <h6 class="mt-3">Day-by-day itinerary</h6>
                    <ol class="list-group list-group-numbered">
                      <li class="list-group-item d-flex align-items-start" *ngFor="let it of p.itineraries">
                        <div class="ms-2 flex-grow-1 text-start">
                          <div class="fw-semibold">{{ it.title }}</div>
                          <div class="small text-muted" *ngIf="it.location"><i class="bi bi-geo-alt me-1"></i>{{ it.location }}</div>
                          <div class="small text-muted">{{ it.description }}</div>
                        </div>
                      </li>
                    </ol>

                    <div class="d-flex gap-2 mt-3">
                      <a class="btn btn-primary" [routerLink]="['/customer/bookings/new', p.id]" *ngIf="auth.isCustomer()">Book this package</a>
                      <a class="btn btn-primary" routerLink="/auth/login" [queryParams]="{returnUrl: '/customer/bookings/new/' + p.id}" *ngIf="!auth.isAuthenticated()">Login to book</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h4 class="fw-bold mt-5">Reviews</h4>
            <div class="card border-0 shadow-sm mb-3" *ngFor="let r of reviews">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <strong>{{ r.customerName }}</strong>
                  <span>
                    <i class="bi bi-star-fill star" *ngFor="let s of stars(r.rating)"></i>
                    <i class="bi bi-star star muted" *ngFor="let s of muted(r.rating)"></i>
                  </span>
                </div>
                <p class="mb-1 fw-semibold mt-2">{{ r.title }}</p>
                <p class="text-muted small mb-0">{{ r.comment }}</p>
              </div>
            </div>
            <div *ngIf="reviews.length === 0" class="text-muted">No reviews yet. Be the first!</div>
          </div>

          <div class="col-lg-4">
            <div class="card border-0 shadow-sm sticky-top" style="top: 80px;">
              <div class="card-body">
                <h5 class="fw-bold mb-3">Quick info</h5>
                <p class="mb-1"><i class="bi bi-geo-alt text-primary me-2"></i>{{ tour.destination }} - {{ tour.region }}</p>
                <p class="mb-1"><i class="bi bi-box-seam text-primary me-2"></i>{{ tour.packages.length }} package(s)</p>
                <p class="mb-1" *ngIf="tour.reviewCount">
                  <i class="bi bi-star-fill text-warning me-2"></i>{{ tour.averageRating | number:'1.1-1' }} ({{ tour.reviewCount }} reviews)
                </p>
                <hr />
                <a class="btn btn-primary w-100" routerLink="/tours">Browse more tours</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TourDetailComponent implements OnInit {
  tour?: Tour;
  reviews: Review[] = [];
  loading = true;

  constructor(private route: ActivatedRoute, private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getTour(id).subscribe({
      next: t => { this.tour = t; this.loading = false; },
      error: () => this.loading = false
    });
    this.api.getTourReviews(id).subscribe({ next: rs => this.reviews = rs });
  }

  stars(n: number): number[] { return Array(n).fill(0); }
  muted(n: number): number[] { return Array(5 - n).fill(0); }
}
