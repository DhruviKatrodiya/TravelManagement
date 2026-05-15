import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking, BookingStatus, Tour } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-bookings',
  standalone: false,
  template: `
    <div class="mb-4">
      <h2 class="fw-bold mb-1">All Bookings</h2>
      <p class="text-muted small mb-0">Track every booking, change its status, and search by reference or customer.</p>
    </div>

    <!-- View modal -->
    <div *ngIf="viewing" class="modal-backdrop fade show"></div>
    <div *ngIf="viewing" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onViewBackdrop($event)">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Booking details</h5>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="text-muted small">Reference</div>
                <div class="fw-semibold"><code>{{ viewing.bookingReference }}</code></div>
              </div>
              <div class="col-md-6">
                <div class="text-muted small">Status</div>
                <span class="badge" [ngClass]="badgeClass(viewing.status)">{{ viewing.status }}</span>
              </div>
              <div class="col-md-6">
                <div class="text-muted small">Customer</div>
                <div class="fw-semibold">{{ viewing.customerName }}</div>
                <div class="small text-muted">{{ viewing.customerEmail }}</div>
              </div>
              <div class="col-md-6">
                <div class="text-muted small">Tour / Package</div>
                <div class="fw-semibold">{{ viewing.tourName }}</div>
                <div class="small text-muted">{{ viewing.packageName }}</div>
              </div>
              <div class="col-md-6">
                <div class="text-muted small">Trip dates</div>
                <div>{{ viewing.tripStartDate | date:'mediumDate' }} → {{ viewing.tripEndDate | date:'mediumDate' }}</div>
              </div>
              <div class="col-md-6">
                <div class="text-muted small">Travellers</div>
                <div>{{ viewing.adults }} adult{{ viewing.adults === 1 ? '' : 's' }}<span *ngIf="viewing.children > 0">, {{ viewing.children }} child{{ viewing.children === 1 ? '' : 'ren' }}</span></div>
              </div>
              <div class="col-12"><hr class="my-1" /></div>
              <div class="col-md-3">
                <div class="text-muted small">Sub-total</div>
                <div>₹ {{ viewing.subTotal | number:'1.0-0' }}</div>
              </div>
              <div class="col-md-3">
                <div class="text-muted small">Discount</div>
                <div>₹ {{ viewing.discount | number:'1.0-0' }}</div>
              </div>
              <div class="col-md-3">
                <div class="text-muted small">Tax</div>
                <div>₹ {{ viewing.tax | number:'1.0-0' }}</div>
              </div>
              <div class="col-md-3">
                <div class="text-muted small">Total</div>
                <div class="fw-bold">₹ {{ viewing.totalAmount | number:'1.0-0' }}</div>
              </div>
              <div class="col-md-6">
                <div class="text-muted small">Paid</div>
                <div class="text-success fw-semibold">₹ {{ viewing.amountPaid | number:'1.0-0' }}</div>
              </div>
              <div class="col-md-6">
                <div class="text-muted small">Due</div>
                <div [class.text-danger]="viewing.amountDue > 0" [class.fw-semibold]="viewing.amountDue > 0">₹ {{ viewing.amountDue | number:'1.0-0' }}</div>
              </div>
              <div class="col-12" *ngIf="viewing.specialRequests">
                <div class="text-muted small">Special requests</div>
                <div>{{ viewing.specialRequests }}</div>
              </div>
              <div class="col-12" *ngIf="viewing.customItinerary">
                <div class="text-muted small">Custom itinerary</div>
                <div class="small">{{ viewing.customItinerary }}</div>
              </div>
              <div class="col-12 text-muted small">
                Booked {{ viewing.bookedAt | date:'mediumDate' }}<span *ngIf="viewing.cancelledAt"> • Cancelled {{ viewing.cancelledAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" (click)="closeView()"><i class="bi bi-x-lg me-1"></i>Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label small text-muted mb-1">Search reference or customer</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="query" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <app-select size="sm" [options]="statusFilterOptions" [(ngModel)]="statusFilter" (valueChange)="onFilterStatusChange($event)"></app-select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Tour</label>
          <app-select size="sm" [options]="tourFilterOptions()" [(ngModel)]="tourFilter" (valueChange)="onFilterTourChange($event)"></app-select>
        </div>
        <div class="col-md-1">
          <button class="btn btn-outline-secondary btn-sm w-100" type="button" (click)="clearFilters()" [disabled]="!filtersApplied()" title="Clear filters">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick status counts -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <button class="btn btn-sm" [class.btn-primary]="statusFilter===''" [class.btn-outline-primary]="statusFilter!==''" (click)="setStatusFilter('')">All ({{ items.length }})</button>
      <button class="btn btn-sm" *ngFor="let s of statuses" [class.btn-primary]="statusFilter===s" [class.btn-outline-primary]="statusFilter!==s" (click)="setStatusFilter(s)">{{ s }} ({{ count(s) }})</button>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('ref')">Reference <i class="bi" [ngClass]="sortIcon('ref')"></i></th>
              <th class="sortable" (click)="toggleSort('customer')">Customer <i class="bi" [ngClass]="sortIcon('customer')"></i></th>
              <th class="sortable" (click)="toggleSort('tour')">Tour <i class="bi" [ngClass]="sortIcon('tour')"></i></th>
              <th class="sortable" (click)="toggleSort('start')">Trip dates <i class="bi" [ngClass]="sortIcon('start')"></i></th>
              <th class="sortable" (click)="toggleSort('total')">Total <i class="bi" [ngClass]="sortIcon('total')"></i></th>
              <th class="sortable" (click)="toggleSort('paid')">Paid <i class="bi" [ngClass]="sortIcon('paid')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of pagedItems()">
              <td class="text-nowrap"><code>{{ b.bookingReference }}</code></td>
              <td class="text-nowrap">{{ b.customerName }}<br><small class="text-muted">{{ b.customerEmail }}</small></td>
              <td class="text-nowrap">{{ b.tourName }}<br><small class="text-muted">{{ b.packageName }}</small></td>
              <td class="text-nowrap">{{ b.tripStartDate | date:'mediumDate' }} → {{ b.tripEndDate | date:'mediumDate' }}</td>
              <td class="text-nowrap">₹ {{ b.totalAmount | number:'1.0-0' }}</td>
              <td class="text-nowrap">₹ {{ b.amountPaid | number:'1.0-0' }}</td>
              <td class="text-nowrap"><span class="badge" [ngClass]="badgeClass(b.status)">{{ b.status }}</span></td>
              <td class="text-end">
                <div class="dropdown" *ngIf="auth.hasPermission('bookings.edit')">
                  <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" data-bs-strategy="fixed">Status</button>
                  <ul class="dropdown-menu dropdown-menu-end shadow">
                    <li *ngFor="let s of statuses">
                      <a class="dropdown-item d-flex align-items-center justify-content-between" href="javascript:void(0)" (click)="setStatus(b, s)">
                        <span>{{ s }}</span>
                        <i class="bi bi-check2 text-success" *ngIf="b.status === s"></i>
                      </a>
                    </li>
                  </ul>
                </div>
                <button *ngIf="!auth.hasPermission('bookings.edit')" class="btn btn-sm btn-outline-primary" (click)="view(b)" title="View booking details">
                  <i class="bi bi-eye me-1"></i>View
                </button>
              </td>
            </tr>
            <tr *ngIf="filtered().length === 0"><td colspan="8" class="text-center text-muted py-3">{{ items.length === 0 ? 'No bookings found.' : 'No bookings match the filters.' }}</td></tr>
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
export class AdminBookingsComponent implements OnInit {
  items: Booking[] = [];
  tours: Tour[] = [];
  viewing: Booking | null = null;
  query = '';
  statusFilter: string = '';
  tourFilter: string | number = '';
  statuses: BookingStatus[] = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Refunded'];

  readonly statusFilterOptions = [
    { value: '', label: 'All statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Refunded', label: 'Refunded' }
  ];

  sortKey: 'ref' | 'customer' | 'tour' | 'start' | 'total' | 'paid' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  page = 1;
  readonly pageSize = 10;

  auth = inject(AuthService);
  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
    this.api.listTours(undefined, false).subscribe({ next: ts => this.tours = ts });
  }

  load(): void {
    this.api.listBookings().subscribe({
      next: bs => {
        this.items = bs;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  count(s: string): number { return this.items.filter(i => i.status === s).length; }

  tourFilterOptions(): { value: string | number; label: string }[] {
    const sorted = [...this.tours].sort((a, b) => a.name.localeCompare(b.name));
    return [{ value: '', label: 'All tours' }, ...sorted.map(t => ({ value: t.name, label: t.name }))];
  }

  filtered(): Booking[] {
    const q = this.query.trim().toLowerCase();
    const list = this.items.filter(b =>
      (!this.statusFilter || b.status === this.statusFilter) &&
      (!this.tourFilter || b.tourName === this.tourFilter) &&
      (!q || b.bookingReference.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q) || b.customerEmail.toLowerCase().includes(q))
    );
    if (!this.sortKey) return list;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = this.sortValue(a);
      const bv = this.sortValue(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return av.toString().localeCompare(bv.toString()) * dir;
    });
  }

  private sortValue(b: Booking): string | number {
    switch (this.sortKey) {
      case 'ref': return b.bookingReference;
      case 'customer': return b.customerName;
      case 'tour': return b.tourName;
      case 'start': return new Date(b.tripStartDate).getTime();
      case 'total': return b.totalAmount;
      case 'paid': return b.amountPaid;
      case 'status': return b.status;
      default: return '';
    }
  }

  toggleSort(key: 'ref' | 'customer' | 'tour' | 'start' | 'total' | 'paid' | 'status'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }

  sortIcon(key: 'ref' | 'customer' | 'tour' | 'start' | 'total' | 'paid' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean { return !!this.query || !!this.statusFilter || this.tourFilter !== ''; }
  onFilterChange(): void { this.page = 1; }
  onFilterStatusChange(v: string | number): void { this.statusFilter = v as string; this.page = 1; }
  onFilterTourChange(v: string | number): void { this.tourFilter = v; this.page = 1; }
  setStatusFilter(v: string): void { this.statusFilter = v; this.page = 1; }
  clearFilters(): void { this.query = ''; this.statusFilter = ''; this.tourFilter = ''; this.page = 1; }

  totalPages(): number { return Math.max(1, Math.ceil(this.filtered().length / this.pageSize)); }
  pagedItems(): Booking[] {
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

  setStatus(b: Booking, s: BookingStatus): void {
    if (b.status === s) return;
    const prev = b.status;
    this.api.updateBookingStatus(b.id, s).subscribe({
      next: () => {
        this.toast.show(
          `Booking ${b.bookingReference} (${b.customerName}) changed from ${prev} → ${s}.`,
          'success', 4000, { title: 'Booking status updated' }
        );
        this.load();
      },
      error: () => {
        this.toast.show(`Could not update booking ${b.bookingReference}. Please try again.`, 'danger', 4000, { title: 'Update failed' });
      }
    });
  }

  badgeClass(s: string): string {
    return ({ Confirmed: 'bg-success', Pending: 'bg-warning text-dark', Cancelled: 'bg-danger', Completed: 'bg-secondary', Refunded: 'bg-info text-dark' } as Record<string, string>)[s] || 'bg-secondary';
  }

  view(b: Booking): void {
    this.viewing = b;
    document.body.classList.add('modal-open');
  }

  closeView(): void {
    this.viewing = null;
    document.body.classList.remove('modal-open');
  }

  onViewBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) this.closeView();
  }
}
