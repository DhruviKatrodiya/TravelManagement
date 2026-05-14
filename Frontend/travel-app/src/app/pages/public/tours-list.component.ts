import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Tour } from '../../core/models/api.models';

@Component({
  selector: 'app-tours-list',
  standalone: false,
  template: `
    <section class="container py-5">
      <div class="page-header d-flex flex-wrap justify-content-between align-items-end gap-3">
        <div>
          <h2 class="fw-bold mb-1">Browse Tours</h2>
          <p class="text-muted mb-0">
            {{ filtered.length }} tour(s) available
            <ng-container *ngIf="destinationLabel">
              for <span class="badge bg-accent text-dark">{{ destinationLabel }}</span>
              <button class="btn btn-link btn-sm p-0 ms-2 align-baseline" (click)="clearDestination()">clear</button>
            </ng-container>
            <ng-container *ngIf="!destinationLabel && keyword">
              matching <span class="badge bg-accent text-dark">{{ keyword }}</span>
              <button class="btn btn-link btn-sm p-0 ms-2 align-baseline" (click)="clearKeyword()">clear</button>
            </ng-container>
          </p>
        </div>
        <div class="btn-group">
          <button class="btn btn-outline-primary" [class.active]="filter === ''" (click)="setFilter('')">All</button>
          <button class="btn btn-outline-primary" [class.active]="filter === 'India'" (click)="setFilter('India')">India</button>
          <button class="btn btn-outline-primary" [class.active]="filter === 'Bhutan'" (click)="setFilter('Bhutan')">Bhutan</button>
          <button class="btn btn-outline-primary" [class.active]="filter === 'Nepal'" (click)="setFilter('Nepal')">Nepal</button>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

      <div class="row g-4 mt-1">
        <div class="col-md-6 col-lg-4" *ngFor="let t of filtered">
          <div class="card tour-card border-0 shadow-sm h-100">
            <img [src]="t.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'" alt="{{ t.name }}" />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="card-title fw-bold mb-1">{{ t.name }}</h5>
                <span class="badge bg-accent">{{ t.destination }}</span>
              </div>
              <p class="text-muted small mb-2">{{ t.region }}</p>
              <p class="card-text mb-3" *ngIf="t.description">{{ t.description | slice:0:120 }}{{ (t.description?.length || 0) > 120 ? '…' : '' }}</p>
              <div class="mb-2 small">
                <ng-container *ngIf="t.reviewCount; else noRev">
                  <ng-container *ngFor="let s of [1,2,3,4,5]">
                    <i class="bi bi-star-fill text-warning" *ngIf="s <= round(t.averageRating)"></i>
                    <i class="bi bi-star text-warning" *ngIf="s > round(t.averageRating)"></i>
                  </ng-container>
                  <span class="text-muted ms-1">{{ t.averageRating | number:'1.1-1' }} ({{ t.reviewCount }} review{{ t.reviewCount === 1 ? '' : 's' }})</span>
                </ng-container>
                <ng-template #noRev>
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
                  From <strong>₹{{ minPrice(t) | number:'1.0-0' }}</strong>
                </small>
                <a class="btn btn-outline-primary btn-sm" [routerLink]="['/tours', t.id]">View</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && filtered.length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-search display-4 d-block mb-2"></i>
        No tours match your filter.
      </div>
    </section>
  `
})
export class ToursListComponent implements OnInit {
  tours: Tour[] = [];
  filter = '';
  keyword = '';
  destinationId: number | null = null;
  destinationLabel = '';
  loading = true;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(qp => {
      this.filter = qp.get('destination') || '';
      this.keyword = qp.get('q') || '';
      const did = qp.get('destinationId');
      this.destinationId = did ? Number(did) : null;
      this.destinationLabel = qp.get('destinationName') || '';
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.api.listTours(this.filter || undefined, true, this.keyword || undefined, this.destinationId || undefined).subscribe({
      next: ts => { this.tours = ts; this.loading = false; },
      error: () => this.loading = false
    });
  }

  setFilter(value: string): void {
    this.filter = value;
    this.destinationId = null;
    this.destinationLabel = '';
    this.load();
  }

  clearKeyword(): void {
    this.keyword = '';
    this.load();
  }

  clearDestination(): void {
    this.destinationId = null;
    this.destinationLabel = '';
    this.load();
  }

  get filtered(): Tour[] { return this.tours; }

  minPrice(t: Tour): number {
    if (!t.packages || t.packages.length === 0) return 0;
    return Math.min(...t.packages.map(p => p.pricePerPerson));
  }

  round(n: number): number { return Math.round(n); }
}
