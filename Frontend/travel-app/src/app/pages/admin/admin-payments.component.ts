import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Payment } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-payments',
  standalone: false,
  template: `
    <div class="mb-4">
      <h2 class="fw-bold mb-1">Payments</h2>
      <p class="text-muted small mb-0">All transactions captured by the payment gateway, linked to their bookings.</p>
    </div>

    <!-- View modal -->
    <div *ngIf="viewTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="viewTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onViewBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-credit-card me-2"></i>Payment details</h5>
          </div>
          <div class="modal-body">
            <dl class="row mb-0">
              <dt class="col-sm-5 text-muted">Transaction ref</dt>
              <dd class="col-sm-7"><code>{{ viewTarget.transactionReference }}</code></dd>
              <dt class="col-sm-5 text-muted">Booking ref</dt>
              <dd class="col-sm-7"><code>{{ viewTarget.bookingReference }}</code></dd>
              <ng-container *ngIf="viewTarget.gatewayTransactionId">
                <dt class="col-sm-5 text-muted">Gateway ID</dt>
                <dd class="col-sm-7"><code>{{ viewTarget.gatewayTransactionId }}</code></dd>
              </ng-container>
              <dt class="col-sm-5 text-muted">Method</dt>
              <dd class="col-sm-7">{{ viewTarget.method }}</dd>
              <dt class="col-sm-5 text-muted">Amount</dt>
              <dd class="col-sm-7 fw-semibold">₹ {{ viewTarget.amount | number:'1.2-2' }}</dd>
              <dt class="col-sm-5 text-muted">Status</dt>
              <dd class="col-sm-7"><span class="badge" [ngClass]="badge(viewTarget.status)">{{ viewTarget.status }}</span></dd>
              <dt class="col-sm-5 text-muted">Initiated</dt>
              <dd class="col-sm-7">{{ viewTarget.initiatedAt | date:'medium' }}</dd>
              <dt class="col-sm-5 text-muted">Completed</dt>
              <dd class="col-sm-7">{{ viewTarget.completedAt ? (viewTarget.completedAt | date:'medium') : '—' }}</dd>
              <ng-container *ngIf="viewTarget.notes">
                <dt class="col-sm-5 text-muted">Notes</dt>
                <dd class="col-sm-7">{{ viewTarget.notes }}</dd>
              </ng-container>
            </dl>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="closeView()"><i class="bi bi-x-lg me-1"></i>Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label small text-muted mb-1">Search transaction or booking</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="query" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Method</label>
          <app-select size="sm" [options]="methodFilterOptions()" [(ngModel)]="methodFilter" (valueChange)="onFilterMethodChange($event)"></app-select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <app-select size="sm" [options]="statusFilterOptions" [(ngModel)]="statusFilter" (valueChange)="onFilterStatusChange($event)"></app-select>
        </div>
        <div class="col-md-1">
          <button class="btn btn-outline-secondary btn-sm w-100" type="button" (click)="clearFilters()" [disabled]="!filtersApplied()" title="Clear filters">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick status counters -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <button class="btn btn-sm" [class.btn-primary]="statusFilter===''" [class.btn-outline-primary]="statusFilter!==''" (click)="setStatusFilter('')">All ({{ items.length }})</button>
      <button class="btn btn-sm" *ngFor="let s of statuses" [class.btn-primary]="statusFilter===s" [class.btn-outline-primary]="statusFilter!==s" (click)="setStatusFilter(s)">{{ s }} ({{ count(s) }})</button>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('txn')">Transaction <i class="bi" [ngClass]="sortIcon('txn')"></i></th>
              <th class="sortable" (click)="toggleSort('booking')">Booking <i class="bi" [ngClass]="sortIcon('booking')"></i></th>
              <th class="sortable" (click)="toggleSort('method')">Method <i class="bi" [ngClass]="sortIcon('method')"></i></th>
              <th class="sortable" (click)="toggleSort('amount')">Amount <i class="bi" [ngClass]="sortIcon('amount')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th class="sortable" (click)="toggleSort('initiated')">Initiated <i class="bi" [ngClass]="sortIcon('initiated')"></i></th>
              <th class="sortable" (click)="toggleSort('completed')">Completed <i class="bi" [ngClass]="sortIcon('completed')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pagedItems()">
              <td><code>{{ p.transactionReference }}</code></td>
              <td><code>{{ p.bookingReference }}</code></td>
              <td>{{ p.method }}</td>
              <td>₹ {{ p.amount | number:'1.2-2' }}</td>
              <td><span class="badge" [ngClass]="badge(p.status)">{{ p.status }}</span></td>
              <td>{{ p.initiatedAt | date:'short' }}</td>
              <td>{{ p.completedAt | date:'short' }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary" (click)="view(p)" title="View payment details"><i class="bi bi-eye me-1"></i>View</button>
              </td>
            </tr>
            <tr *ngIf="filtered().length === 0"><td colspan="8" class="text-center text-muted py-3">{{ items.length === 0 ? 'No payments yet.' : 'No payments match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filtered().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filtered().length }}</small>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" type="button" (click)="setPage(page - 1)" [disabled]="page === 1"><i class="bi bi-chevron-left"></i></button>
            </li>
            <li class="page-item" *ngFor="let p of pageNumbers()" [class.active]="p === page">
              <button class="page-link" type="button" (click)="setPage(p)">{{ p }}</button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPages()">
              <button class="page-link" type="button" (click)="setPage(page + 1)" [disabled]="page === totalPages()"><i class="bi bi-chevron-right"></i></button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `
})
export class AdminPaymentsComponent implements OnInit, OnDestroy {
  items: Payment[] = [];
  query = '';
  methodFilter = '';
  statusFilter = '';
  viewTarget: Payment | null = null;

  statuses = ['Initiated', 'Pending', 'Success', 'Failed', 'Refunded'];

  readonly statusFilterOptions = [
    { value: '', label: 'All statuses' },
    { value: 'Initiated', label: 'Initiated' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Success', label: 'Success' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Refunded', label: 'Refunded' }
  ];

  sortKey: 'txn' | 'booking' | 'method' | 'amount' | 'status' | 'initiated' | 'completed' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  page = 1;
  readonly pageSize = 10;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.listPayments().subscribe({
      next: ps => {
        this.items = ps;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.viewTarget) this.closeView(); }

  view(p: Payment): void { this.viewTarget = p; this.lockBody(); }
  closeView(): void { this.viewTarget = null; this.unlockBody(); }
  onViewBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) this.closeView();
  }

  private lockBody(): void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }

  count(s: string): number { return this.items.filter(i => i.status === s).length; }

  methodFilterOptions(): { value: string; label: string }[] {
    const methods = Array.from(new Set(this.items.map(p => p.method))).sort();
    return [{ value: '', label: 'All methods' }, ...methods.map(m => ({ value: m, label: m }))];
  }

  filtered(): Payment[] {
    const q = this.query.trim().toLowerCase();
    const list = this.items.filter(p =>
      (!this.statusFilter || p.status === this.statusFilter) &&
      (!this.methodFilter || p.method === this.methodFilter) &&
      (!q || p.transactionReference.toLowerCase().includes(q) || p.bookingReference.toLowerCase().includes(q))
    );
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

  private sortValue(p: Payment): string | number | null {
    switch (this.sortKey) {
      case 'txn': return p.transactionReference;
      case 'booking': return p.bookingReference;
      case 'method': return p.method;
      case 'amount': return p.amount;
      case 'status': return p.status;
      case 'initiated': return p.initiatedAt ? new Date(p.initiatedAt).getTime() : null;
      case 'completed': return p.completedAt ? new Date(p.completedAt).getTime() : null;
      default: return null;
    }
  }

  toggleSort(key: 'txn' | 'booking' | 'method' | 'amount' | 'status' | 'initiated' | 'completed'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }

  sortIcon(key: 'txn' | 'booking' | 'method' | 'amount' | 'status' | 'initiated' | 'completed'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean { return !!this.query || !!this.statusFilter || !!this.methodFilter; }
  onFilterChange(): void { this.page = 1; }
  onFilterMethodChange(v: string | number): void { this.methodFilter = v as string; this.page = 1; }
  onFilterStatusChange(v: string | number): void { this.statusFilter = v as string; this.page = 1; }
  setStatusFilter(v: string): void { this.statusFilter = v; this.page = 1; }
  clearFilters(): void { this.query = ''; this.methodFilter = ''; this.statusFilter = ''; this.page = 1; }

  totalPages(): number { return Math.max(1, Math.ceil(this.filtered().length / this.pageSize)); }
  pagedItems(): Payment[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  }
  pageStart(): number { return this.filtered().length === 0 ? 0 : (this.page - 1) * this.pageSize + 1; }
  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filtered().length); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }
  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
  }

  badge(s: string): string {
    return ({ Success: 'bg-success', Pending: 'bg-warning text-dark', Initiated: 'bg-info text-dark', Failed: 'bg-danger', Refunded: 'bg-secondary' } as Record<string, string>)[s] || 'bg-secondary';
  }
}
