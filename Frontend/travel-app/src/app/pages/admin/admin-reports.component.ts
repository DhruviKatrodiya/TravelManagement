import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TripProfit } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-reports',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-4">Profit & Loss Report</h2>

    <!-- Period filter -->
    <div class="table-card mb-3">
      <form [formGroup]="form" (ngSubmit)="load()" class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label small text-muted mb-1">From</label>
          <input type="date" class="form-control form-control-sm" formControlName="from" />
        </div>
        <div class="col-md-4">
          <label class="form-label small text-muted mb-1">To</label>
          <input type="date" class="form-control form-control-sm" formControlName="to" />
        </div>
        <div class="col-md-4 d-flex gap-2">
          <button class="btn btn-primary btn-sm flex-grow-1"><i class="bi bi-funnel me-1"></i>Apply</button>
          <button class="btn btn-outline-secondary btn-sm" type="button" (click)="reset()" [disabled]="!filtersApplied()" title="Clear filters">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </form>
    </div>

    <!-- KPI cards (dashboard style) -->
    <div class="row g-3 mb-3">
      <div class="col-md-3">
        <div class="kpi">
          <div class="label">Trips</div>
          <div class="value">{{ items.length }}</div>
          <div class="sub">In selected period</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="kpi">
          <div class="label">Revenue</div>
          <div class="value text-success">₹ {{ totals.revenue | number:'1.0-0' }}</div>
          <div class="sub">Booking income</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="kpi">
          <div class="label">Expenses</div>
          <div class="value text-danger">₹ {{ totals.expenses | number:'1.0-0' }}</div>
          <div class="sub">Tracked costs</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="kpi">
          <div class="label">Profit</div>
          <div class="value" [class.text-success]="totals.profit >= 0" [class.text-danger]="totals.profit < 0">₹ {{ totals.profit | number:'1.0-0' }}</div>
          <div class="sub">Revenue − expenses</div>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="row g-2 align-items-center mb-3">
        <div class="col-md-6">
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Search booking reference or tour…" [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
            <button class="btn btn-outline-secondary" type="button" *ngIf="filterText" (click)="filterText = ''; onFilterChange()" title="Clear search">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('date')">Trip date <i class="bi" [ngClass]="sortIcon('date')"></i></th>
              <th class="sortable" (click)="toggleSort('booking')">Booking <i class="bi" [ngClass]="sortIcon('booking')"></i></th>
              <th class="sortable" (click)="toggleSort('tour')">Tour <i class="bi" [ngClass]="sortIcon('tour')"></i></th>
              <th class="sortable text-end" (click)="toggleSort('revenue')">Revenue <i class="bi" [ngClass]="sortIcon('revenue')"></i></th>
              <th class="sortable text-end" (click)="toggleSort('expenses')">Expenses <i class="bi" [ngClass]="sortIcon('expenses')"></i></th>
              <th class="sortable text-end" (click)="toggleSort('profit')">Profit <i class="bi" [ngClass]="sortIcon('profit')"></i></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of paged()">
              <td>{{ p.tripStartDate | date:'mediumDate' }}</td>
              <td><code>{{ p.bookingReference }}</code></td>
              <td>{{ p.tourName }}</td>
              <td class="text-end">₹ {{ p.revenue | number:'1.0-0' }}</td>
              <td class="text-end">₹ {{ p.expenses | number:'1.0-0' }}</td>
              <td class="text-end" [class.text-success]="p.profit >= 0" [class.text-danger]="p.profit < 0">₹ {{ p.profit | number:'1.0-0' }}</td>
            </tr>
            <tr *ngIf="filtered().length === 0"><td colspan="6" class="text-center text-muted py-3">{{ items.length === 0 ? 'No data for this period.' : 'No trips match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filtered().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filtered().length }}</small>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" type="button" (click)="setPage(page - 1)" [disabled]="page === 1" aria-label="Previous"><i class="bi bi-chevron-left"></i></button>
            </li>
            <li class="page-item" *ngFor="let p of pageNumbers()" [class.active]="p === page">
              <button class="page-link" type="button" (click)="setPage(p)">{{ p }}</button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPages()">
              <button class="page-link" type="button" (click)="setPage(page + 1)" [disabled]="page === totalPages()" aria-label="Next"><i class="bi bi-chevron-right"></i></button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `
})
export class AdminReportsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  items: TripProfit[] = [];
  filterText = '';

  sortKey: 'date' | 'booking' | 'tour' | 'revenue' | 'expenses' | 'profit' | null = 'date';
  sortDir: 'asc' | 'desc' = 'desc';

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    from: [''],
    to: ['']
  });

  totals = { revenue: 0, expenses: 0, profit: 0 };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.getTripProfits(this.form.getRawValue()).subscribe({
      next: ps => {
        this.items = ps;
        this.page = 1;
        this.recomputeTotals();
      }
    });
  }

  private recomputeTotals(): void {
    // KPI totals always reflect the full period (not affected by the table search).
    this.totals.revenue = this.items.reduce((s, p) => s + p.revenue, 0);
    this.totals.expenses = this.items.reduce((s, p) => s + p.expenses, 0);
    this.totals.profit = this.items.reduce((s, p) => s + p.profit, 0);
  }

  filtered(): TripProfit[] {
    const q = this.filterText.trim().toLowerCase();
    const list = this.items.filter(p => {
      if (q && !((p.bookingReference || '').toLowerCase().includes(q)
              || (p.tourName || '').toLowerCase().includes(q))) return false;
      return true;
    });
    if (!this.sortKey) return list;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = this.sortValue(a);
      const bv = this.sortValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return av.toString().localeCompare(bv.toString()) * dir;
    });
  }

  private sortValue(p: TripProfit): string | number | null {
    switch (this.sortKey) {
      case 'date': return p.tripStartDate ? new Date(p.tripStartDate).getTime() : 0;
      case 'booking': return p.bookingReference || '';
      case 'tour': return p.tourName || '';
      case 'revenue': return p.revenue;
      case 'expenses': return p.expenses;
      case 'profit': return p.profit;
      default: return null;
    }
  }

  toggleSort(key: 'date' | 'booking' | 'tour' | 'revenue' | 'expenses' | 'profit'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'date' | 'booking' | 'tour' | 'revenue' | 'expenses' | 'profit'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  onFilterChange(): void {
    this.page = 1;
  }

  filtersApplied(): boolean {
    const v = this.form.getRawValue();
    return !!this.filterText || !!v.from || !!v.to;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filtered().length / this.pageSize)); }

  paged(): TripProfit[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    if (this.filtered().length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filtered().length); }

  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
    scrollAdminContentTop();
  }

  reset(): void {
    this.form.reset({ from: '', to: '' });
    this.filterText = '';
    this.page = 1;
    this.load();
  }
}
