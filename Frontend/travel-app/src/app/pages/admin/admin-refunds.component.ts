import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Refund, RefundStatus } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-refunds',
  standalone: false,
  template: `
    <div class="mb-4">
      <h2 class="fw-bold mb-1">Refund requests</h2>
      <p class="text-muted small mb-0">Review customer refund requests and approve or reject them. The customer is notified by email + in-app.</p>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label small text-muted mb-1">Search booking or customer</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="query" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-6">
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

    <!-- Quick status chips -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <button class="btn btn-sm" [class.btn-primary]="statusFilter===''" [class.btn-outline-primary]="statusFilter!==''" (click)="setStatusFilter('')">All ({{ items.length }})</button>
      <button class="btn btn-sm" *ngFor="let s of statuses" [class.btn-primary]="statusFilter===s" [class.btn-outline-primary]="statusFilter!==s" (click)="setStatusFilter(s)">{{ s }} ({{ count(s) }})</button>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('booking')">Booking <i class="bi" [ngClass]="sortIcon('booking')"></i></th>
              <th class="sortable" (click)="toggleSort('customer')">Customer <i class="bi" [ngClass]="sortIcon('customer')"></i></th>
              <th class="sortable" (click)="toggleSort('reason')">Reason <i class="bi" [ngClass]="sortIcon('reason')"></i></th>
              <th class="sortable" (click)="toggleSort('requested')">Requested <i class="bi" [ngClass]="sortIcon('requested')"></i></th>
              <th class="sortable" (click)="toggleSort('approved')">Approved <i class="bi" [ngClass]="sortIcon('approved')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of pagedItems()">
              <td><code>{{ r.bookingReference }}</code><br><small class="text-muted">{{ r.requestedAt | date:'short' }}</small></td>
              <td>{{ r.customerName }}</td>
              <td>{{ r.reason }}</td>
              <td>₹ {{ r.requestedAmount | number:'1.2-2' }}</td>
              <td>
                <span *ngIf="r.approvedAmount != null">₹ {{ r.approvedAmount | number:'1.2-2' }}</span>
                <input *ngIf="r.status === 'Requested'" type="number" min="0" class="form-control form-control-sm w-auto" [(ngModel)]="approve[r.id]" [value]="r.requestedAmount" />
              </td>
              <td><span class="badge" [ngClass]="badge(r.status)">{{ r.status }}</span></td>
              <td class="text-end">
                <div *ngIf="r.status === 'Requested'" class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-success" (click)="process(r, 'Processed')" [disabled]="processingId === r.id">
                    <span *ngIf="processingId === r.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="processingId !== r.id" class="bi bi-check2-circle me-1"></i>Approve
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="process(r, 'Rejected')" [disabled]="processingId === r.id">
                    <i class="bi bi-x-circle me-1"></i>Reject
                  </button>
                </div>
                <span *ngIf="r.status !== 'Requested'" class="text-muted small">No actions</span>
              </td>
            </tr>
            <tr *ngIf="filtered().length === 0"><td colspan="7" class="text-center text-muted py-3">{{ items.length === 0 ? 'No refund requests.' : 'No refunds match the filters.' }}</td></tr>
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
export class AdminRefundsComponent implements OnInit {
  items: Refund[] = [];
  approve: Record<number, number> = {};
  processingId: number | null = null;

  query = '';
  statusFilter = '';

  statuses: RefundStatus[] = ['Requested', 'Approved', 'Processed', 'Rejected'];

  readonly statusFilterOptions = [
    { value: '', label: 'All statuses' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Processed', label: 'Processed' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  sortKey: 'booking' | 'customer' | 'reason' | 'requested' | 'approved' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  page = 1;
  readonly pageSize = 10;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.listRefunds().subscribe({
      next: rs => {
        this.items = rs;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  count(s: string): number { return this.items.filter(i => i.status === s).length; }

  filtered(): Refund[] {
    const q = this.query.trim().toLowerCase();
    const list = this.items.filter(r =>
      (!this.statusFilter || r.status === this.statusFilter) &&
      (!q || r.bookingReference.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q))
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

  private sortValue(r: Refund): string | number | null {
    switch (this.sortKey) {
      case 'booking': return r.bookingReference;
      case 'customer': return r.customerName;
      case 'reason': return r.reason || '';
      case 'requested': return r.requestedAmount;
      case 'approved': return r.approvedAmount ?? null;
      case 'status': return r.status;
      default: return null;
    }
  }

  toggleSort(key: 'booking' | 'customer' | 'reason' | 'requested' | 'approved' | 'status'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }

  sortIcon(key: 'booking' | 'customer' | 'reason' | 'requested' | 'approved' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean { return !!this.query || !!this.statusFilter; }
  onFilterChange(): void { this.page = 1; }
  onFilterStatusChange(v: string | number): void { this.statusFilter = v as string; this.page = 1; }
  setStatusFilter(v: string): void { this.statusFilter = v; this.page = 1; }
  clearFilters(): void { this.query = ''; this.statusFilter = ''; this.page = 1; }

  totalPages(): number { return Math.max(1, Math.ceil(this.filtered().length / this.pageSize)); }
  pagedItems(): Refund[] {
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

  process(r: Refund, status: RefundStatus): void {
    if (this.processingId !== null) return;
    this.processingId = r.id;
    const amount = status === 'Rejected' ? 0 : (this.approve[r.id] ?? r.requestedAmount);
    const notes = status === 'Rejected' ? 'Refund request rejected' : 'Refund processed';
    this.api.processRefund(r.id, { status, approvedAmount: amount, adminNotes: notes }).subscribe({
      next: () => {
        this.processingId = null;
        const label = `${r.bookingReference} (${r.customerName})`;
        if (status === 'Rejected') {
          this.toast.show(`Refund request for ${label} was rejected.`, 'info', 4000, { title: 'Refund rejected' });
        } else {
          this.toast.show(`Refund of ₹ ${amount.toLocaleString()} for ${label} has been processed.`, 'success', 4000, { title: 'Refund processed' });
        }
        this.load();
      },
      error: () => {
        this.processingId = null;
        this.toast.show(`Could not process refund for ${r.bookingReference}. Please try again.`, 'danger', 4000, { title: 'Action failed' });
      }
    });
  }

  badge(s: string): string {
    return ({ Processed: 'bg-success', Approved: 'bg-info text-dark', Requested: 'bg-warning text-dark', Rejected: 'bg-danger' } as Record<string, string>)[s] || 'bg-secondary';
  }
}
