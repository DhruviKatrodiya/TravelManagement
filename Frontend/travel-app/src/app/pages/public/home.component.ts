import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { HomeDestination, Review, Tour } from '../../core/models/api.models';

@Component({
  selector: 'app-home',
  standalone: false,
  template: `
    <section class="hero-slideshow">
      <div class="hero-slide" *ngFor="let img of heroSlides; let i = index"
           [class.active]="i === currentSlide"
           [style.backgroundImage]="'url(' + img + ')'"></div>
      <div class="hero-overlay"></div>
      <div class="container text-center position-relative hero-content">
        <h1 class="display-4 fw-bold mb-3">Discover the Himalayas & Beyond</h1>
        <p class="lead mb-4">Curated multi-day tours across India, Bhutan and Nepal — book in minutes.</p>
        <a class="btn btn-light btn-lg text-primary fw-semibold" routerLink="/tours">Browse Tours</a>
        <div class="hero-dots mt-4">
          <button type="button" *ngFor="let img of heroSlides; let i = index"
                  class="hero-dot" [class.active]="i === currentSlide"
                  (click)="goToSlide(i)" [attr.aria-label]="'Slide ' + (i + 1)"></button>
        </div>
      </div>
    </section>

    <section class="container py-5">
      <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 class="fw-bold mb-1">Popular Destinations</h2>
          <p class="text-muted mb-0">Iconic places our travellers love most.</p>
        </div>
        <a routerLink="/tours" class="link-primary">Explore all <i class="bi bi-arrow-right"></i></a>
      </div>
      <div class="row g-4">
        <div class="col-sm-6 col-lg-3" *ngFor="let d of destinations">
          <a class="destination-card"
             [routerLink]="['/tours']"
             [queryParams]="destinationQuery(d)">
            <img [src]="d.imageUrl" alt="{{ d.name }}" loading="lazy" (error)="onImgError($event)" />
            <div class="destination-overlay">
              <span class="badge destination-country">{{ d.country }}</span>
              <h5 class="destination-name">{{ d.name }}</h5>
              <p class="destination-blurb">{{ d.blurb }}</p>
              <div class="destination-meta">
                <span class="me-2" *ngIf="d.tourCount">
                  <i class="bi bi-compass me-1"></i>{{ d.tourCount }} tour{{ d.tourCount === 1 ? '' : 's' }}
                </span>
                <span *ngIf="d.reviewCount">
                  <i class="bi bi-star-fill text-warning me-1"></i>{{ d.averageRating | number:'1.1-1' }}
                  <span class="opacity-75">({{ d.reviewCount }})</span>
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>

    <section class="container py-5">
      <div class="d-flex justify-content-between align-items-end mb-4">
        <h2 class="fw-bold mb-0">Featured Tours</h2>
        <a routerLink="/tours" class="link-primary">See all <i class="bi bi-arrow-right"></i></a>
      </div>

      <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

      <div class="row g-4">
        <div class="col-md-6 col-lg-4" *ngFor="let t of tours">
          <div class="card tour-card border-0 shadow-sm h-100">
            <img [src]="t.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'" alt="{{ t.name }}" (error)="onImgError($event)" />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="card-title fw-bold mb-1">{{ t.name }}</h5>
                <span class="badge bg-accent">{{ t.destination }}</span>
              </div>
              <p class="text-muted small mb-2">{{ t.region }}</p>
              <p class="card-text mb-3" *ngIf="t.description">{{ t.description | slice:0:100 }}{{ (t.description?.length || 0) > 100 ? '…' : '' }}</p>
              <div class="mb-2 small">
                <ng-container *ngIf="t.reviewCount; else noReviews">
                  <ng-container *ngFor="let s of [1,2,3,4,5]">
                    <i class="bi bi-star-fill text-warning" *ngIf="s <= round(t.averageRating)"></i>
                    <i class="bi bi-star text-warning" *ngIf="s > round(t.averageRating)"></i>
                  </ng-container>
                  <span class="text-muted ms-1">{{ t.averageRating | number:'1.1-1' }} ({{ t.reviewCount }} review{{ t.reviewCount === 1 ? '' : 's' }})</span>
                </ng-container>
                <ng-template #noReviews>
                  <i class="bi bi-star text-muted"></i>
                  <i class="bi bi-star text-muted"></i>
                  <i class="bi bi-star text-muted"></i>
                  <i class="bi bi-star text-muted"></i>
                  <i class="bi bi-star text-muted"></i>
                  <span class="text-muted ms-1">No reviews yet</span>
                </ng-template>
              </div>
              <div class="d-flex align-items-center justify-content-between">
                <small class="text-muted" *ngIf="t.packages?.length">
                  From <strong>₹{{ minPrice(t) | number:'1.0-0' }}</strong> / person
                </small>
                <a class="btn btn-outline-primary btn-sm" [routerLink]="['/tours', t.id]">View</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-strip py-4">
      <div class="container">
        <div class="row g-4 text-center">
          <div class="col-6 col-md-3">
            <div class="stat-num">{{ tours.length || '—' }}+</div>
            <div class="stat-label">Curated Tours</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-num">{{ destinations.length || '—' }}</div>
            <div class="stat-label">Iconic Destinations</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-num">{{ totalReviews() }}+</div>
            <div class="stat-label">Happy Travellers</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-num">24/7</div>
            <div class="stat-label">Customer Support</div>
          </div>
        </div>
      </div>
    </section>

    <section class="container py-5">
      <div class="text-center mb-4">
        <h2 class="fw-bold mb-1">How it works</h2>
        <p class="text-muted mb-0">Plan your dream trip in four simple steps.</p>
      </div>
      <div class="row g-4">
        <div class="col-md-6 col-lg-3">
          <div class="step-card h-100">
            <div class="step-badge">1</div>
            <i class="bi bi-search display-6 text-primary"></i>
            <h6 class="fw-bold mt-3 mb-1">Explore</h6>
            <p class="small text-muted mb-0">Browse tours across India, Bhutan, and Nepal — filter by destination, duration, or budget.</p>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="step-card h-100">
            <div class="step-badge">2</div>
            <i class="bi bi-card-checklist display-6 text-primary"></i>
            <h6 class="fw-bold mt-3 mb-1">Choose a package</h6>
            <p class="small text-muted mb-0">Pick the duration, hotel category, and facilities that fit your style.</p>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="step-card h-100">
            <div class="step-badge">3</div>
            <i class="bi bi-credit-card-2-front display-6 text-primary"></i>
            <h6 class="fw-bold mt-3 mb-1">Book securely</h6>
            <p class="small text-muted mb-0">Pay through Paytm or Google Pay with bank-grade security and instant confirmation.</p>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="step-card h-100">
            <div class="step-badge">4</div>
            <i class="bi bi-suitcase-lg display-6 text-primary"></i>
            <h6 class="fw-bold mt-3 mb-1">Travel happy</h6>
            <p class="small text-muted mb-0">Vehicles, guides, and accommodation — all sorted. You just pack and go.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="container py-5">
      <div class="row g-4 text-center">
        <div class="col-md-3">
          <div class="p-3"><i class="bi bi-shield-check display-5 text-primary"></i></div>
          <h6 class="fw-bold">Secure payments</h6>
          <p class="small text-muted mb-0">Paytm & Google Pay supported.</p>
        </div>
        <div class="col-md-3">
          <div class="p-3"><i class="bi bi-globe2 display-5 text-primary"></i></div>
          <h6 class="fw-bold">Multi-country</h6>
          <p class="small text-muted mb-0">India, Bhutan, Nepal coverage.</p>
        </div>
        <div class="col-md-3">
          <div class="p-3"><i class="bi bi-bus-front display-5 text-primary"></i></div>
          <h6 class="fw-bold">Vehicle options</h6>
          <p class="small text-muted mb-0">Cars, mini buses, full coaches.</p>
        </div>
        <div class="col-md-3">
          <div class="p-3"><i class="bi bi-clock-history display-5 text-primary"></i></div>
          <h6 class="fw-bold">24/7 support</h6>
          <p class="small text-muted mb-0">Help whenever you need it.</p>
        </div>
      </div>
    </section>

    <section class="testimonials-section py-5" *ngIf="testimonials.length">
      <div class="container">
        <div class="text-center mb-4">
          <h2 class="fw-bold mb-1">What our travellers say</h2>
          <p class="text-muted mb-0">Real reviews from travellers who explored with us.</p>
        </div>
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let r of testimonials">
            <div class="testimonial-card h-100">
              <div class="mb-2">
                <ng-container *ngFor="let s of [1,2,3,4,5]">
                  <i class="bi bi-star-fill text-warning" *ngIf="s <= r.rating"></i>
                  <i class="bi bi-star text-warning" *ngIf="s > r.rating"></i>
                </ng-container>
              </div>
              <h6 class="fw-bold mb-1" *ngIf="r.title">{{ r.title }}</h6>
              <p class="mb-3 text-muted small">"{{ r.comment }}"</p>
              <div class="d-flex align-items-center">
                <div class="avatar me-2">{{ initials(r.customerName) }}</div>
                <div>
                  <div class="fw-semibold small">{{ r.customerName }}</div>
                  <div class="text-muted small">{{ r.tourName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-banner py-5">
      <div class="container text-center">
        <h2 class="fw-bold mb-2">Ready for your next adventure?</h2>
        <p class="lead mb-4 opacity-75">Sign up free and unlock member-only fares, easy bookings, and trip reminders.</p>
        <div class="d-flex flex-wrap gap-2 justify-content-center">
          <a class="btn btn-light btn-lg text-primary fw-semibold" routerLink="/auth/register">Create free account</a>
          <a class="btn btn-outline-light btn-lg" routerLink="/tours">Browse tours</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-slideshow {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    .hero-slideshow .btn-light { color: var(--tm-primary-dark, #3f5128); }
    .hero-slideshow .btn-light:hover { color: var(--tm-primary-dark, #3f5128); background-color: var(--tm-accent, #d4de95); border-color: var(--tm-accent, #d4de95); }
    .hero-slide {
      position: absolute;
      inset: 0;
      background-position: center;
      background-size: cover;
      background-repeat: no-repeat;
      opacity: 0;
      transition: opacity 1.2s ease-in-out;
      transform: scale(1);
      animation: heroKenBurns 12s ease-in-out forwards paused;
    }
    .hero-slide.active {
      opacity: 1;
      animation-play-state: running;
    }
    @keyframes heroKenBurns {
      from { transform: scale(1); }
      to   { transform: scale(1.08); }
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55));
    }
    .hero-content { z-index: 2; color: #fff; }
    .hero-content h1, .hero-content p { text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55); }
    .hero-dots {
      display: flex; justify-content: center; gap: 0.5rem;
    }
    .hero-dot {
      width: 10px; height: 10px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.25);
      padding: 0; cursor: pointer;
      transition: all .2s ease;
    }
    .hero-dot.active { background: #fff; transform: scale(1.25); }
    .hero-dot:hover { background: rgba(255,255,255,0.7); }
    .destination-card {
      display: block;
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      height: 280px;
      text-decoration: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.10);
      transition: transform .25s ease, box-shadow .25s ease;
    }
    .destination-card:hover { transform: translateY(-6px); box-shadow: 0 18px 36px rgba(0,0,0,0.22); }
    .destination-card img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform .4s ease;
    }
    .destination-card:hover img { transform: scale(1.06); }
    .destination-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 1rem 1.1rem 1.1rem;
      background: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.05) 100%);
      color: #fff;
    }
    .destination-country {
      align-self: flex-start;
      background: rgba(255,255,255,0.18);
      backdrop-filter: blur(6px);
      color: #fff;
      font-weight: 500;
      letter-spacing: 0.04em;
      margin-bottom: 0.5rem;
    }
    .destination-name { font-weight: 700; margin: 0 0 0.2rem; color: #fff; }
    .destination-blurb { font-size: 0.85rem; opacity: 0.9; margin: 0 0 0.4rem; color: #fff; }
    .destination-meta { font-size: 0.8rem; color: #fff; opacity: 0.95; }

    .stats-strip { background: #f5f1e8; border-top: 1px solid #e8e1d0; border-bottom: 1px solid #e8e1d0; }
    .stat-num { font-size: 2rem; font-weight: 700; color: #5a6f3a; line-height: 1; }
    .stat-label { font-size: 0.85rem; color: #6c757d; margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; }

    .step-card {
      background: #fff;
      border: 1px solid #ececec;
      border-radius: 14px;
      padding: 1.5rem 1.2rem;
      text-align: center;
      position: relative;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .step-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.08); }
    .step-badge {
      position: absolute;
      top: -14px; left: 50%; transform: translateX(-50%);
      width: 32px; height: 32px; border-radius: 50%;
      background: #5a6f3a; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem;
      box-shadow: 0 4px 10px rgba(90,111,58,0.35);
    }

    .testimonials-section { background: #faf8f3; }
    .testimonial-card {
      background: #fff;
      border-radius: 14px;
      padding: 1.4rem;
      box-shadow: 0 6px 18px rgba(0,0,0,0.06);
    }
    .avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: #5a6f3a; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 0.85rem;
    }

    .cta-banner {
      background: linear-gradient(135deg, #5a6f3a 0%, #3f5128 100%);
      color: #fff;
    }
    .cta-banner h2 { color: #fff; }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  tours: Tour[] = [];
  destinations: HomeDestination[] = [];
  testimonials: Review[] = [];
  loading = true;

  heroSlides: string[] = [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80',
    'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=1600&q=80'
  ];
  currentSlide = 0;
  private slideTimer: any = null;

  private readonly fallbackImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.slideTimer = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
    }, 5000);
    this.api.listTours().subscribe({
      next: ts => { this.tours = ts.slice(0, 6); this.loading = false; },
      error: () => this.loading = false
    });
    this.api.listFeaturedReviews(6).subscribe({
      next: rs => this.testimonials = rs
    });
    this.api.listHomeDestinations().subscribe({
      next: ds => this.destinations = ds
    });
  }

  destinationQuery(d: HomeDestination): Record<string, string | number> {
    const params: Record<string, string | number> = {
      destinationId: d.id,
      destinationName: d.name
    };
    return params;
  }

  minPrice(t: Tour): number {
    if (!t.packages || t.packages.length === 0) return 0;
    return Math.min(...t.packages.map(p => p.pricePerPerson));
  }

  round(n: number): number { return Math.round(n); }

  totalReviews(): number {
    return this.tours.reduce((sum, t) => sum + (t.reviewCount || 0), 0);
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  }

  goToSlide(i: number): void {
    this.currentSlide = i;
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = setInterval(() => {
        this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.fallbackImage) img.src = this.fallbackImage;
  }
}
