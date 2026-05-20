import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Review } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-reviews',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Reviews</h2>
    </div>

    <!-- View modal -->
    <div *ngIf="viewTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="viewTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onViewBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-chat-left-text me-2"></i>Review details</h5>
          </div>
          <div class="modal-body">
            <dl class="row mb-0">
              <dt class="col-sm-4 text-muted">Customer</dt>
              <dd class="col-sm-8">{{ viewTarget.customerName }}</dd>
              <dt class="col-sm-4 text-muted">Tour</dt>
              <dd class="col-sm-8">{{ viewTarget.tourName }}</dd>
              <dt class="col-sm-4 text-muted">Rating</dt>
              <dd class="col-sm-8">
                <span *ngFor="let s of [1,2,3,4,5]">
                  <i class="bi" [ngClass]="s <= viewTarget.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'"></i>
                </span>
                <span class="ms-1 text-muted small">({{ viewTarget.rating }}/5)</span>
              </dd>
              <ng-container *ngIf="viewTarget.title">
                <dt class="col-sm-4 text-muted">Title</dt>
                <dd class="col-sm-8"><strong>{{ viewTarget.title }}</strong></dd>
              </ng-container>
              <dt class="col-sm-4 text-muted">Comment</dt>
              <dd class="col-sm-8">{{ viewTarget.comment || '—' }}</dd>
              <dt class="col-sm-4 text-muted">Status</dt>
              <dd class="col-sm-8"><span class="badge" [class.bg-success]="viewTarget.isApproved" [class.bg-secondary]="!viewTarget.isApproved">{{ viewTarget.isApproved ? 'Visible' : 'Hidden' }}</span></dd>
              <dt class="col-sm-4 text-muted">Posted</dt>
              <dd class="col-sm-8">{{ viewTarget.createdAt | date:'medium' }}</dd>
            </dl>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="closeView()"><i class="bi bi-x-lg me-1"></i>Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-trash me-2"></i>Delete review?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This will permanently remove the review:</p>
            <p class="fw-bold mb-1">"{{ deleteTarget.title || '(no title)' }}"</p>
            <p class="text-muted small mb-0">By <strong>{{ deleteTarget.customerName }}</strong> on <strong>{{ deleteTarget.tourName }}</strong>. This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="cancelDelete()" [disabled]="deleting"><i class="bi bi-x-lg me-1"></i>Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              <span *ngIf="deleting" class="spinner-border spinner-border-sm me-2"></span>
              {{ deleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label small text-muted mb-1">Search customer, tour or comment</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Rating</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterRating" (ngModelChange)="onFilterChange()">
            <option [ngValue]="0">All ratings</option>
            <option [ngValue]="5">5 stars only</option>
            <option [ngValue]="4">4 stars and up</option>
            <option [ngValue]="3">3 stars and up</option>
            <option [ngValue]="2">2 stars and up</option>
            <option [ngValue]="1">1 star and up</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <div class="col-md-1">
          <button class="btn btn-outline-secondary btn-sm w-100" type="button" (click)="clearFilters()" [disabled]="!filtersApplied()" title="Clear filters">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('customer')">Customer <i class="bi" [ngClass]="sortIcon('customer')"></i></th>
              <th class="sortable" (click)="toggleSort('tour')">Tour <i class="bi" [ngClass]="sortIcon('tour')"></i></th>
              <th class="sortable" (click)="toggleSort('rating')">Rating <i class="bi" [ngClass]="sortIcon('rating')"></i></th>
              <th>Title / Comment</th>
              <th class="sortable" (click)="toggleSort('posted')">Posted <i class="bi" [ngClass]="sortIcon('posted')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of pagedReviews()">
              <td>{{ r.customerName }}</td>
              <td>{{ r.tourName }}</td>
              <td>
                <span class="star" *ngFor="let s of [1,2,3,4,5]">
                  <i class="bi" [ngClass]="s <= r.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'"></i>
                </span>
              </td>
              <td><strong>{{ r.title }}</strong><br><small class="text-muted">{{ r.comment }}</small></td>
              <td>{{ r.createdAt | date:'short' }}</td>
              <td><span class="badge" [class.bg-success]="r.isApproved" [class.bg-secondary]="!r.isApproved">{{ r.isApproved ? 'Visible' : 'Hidden' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(r)" title="View review details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="r.isApproved && auth.hasPermission('reviews.edit')" class="btn btn-sm btn-outline-warning" (click)="approve(r, false)" [disabled]="togglingId === r.id" title="Hide this review from customers">
                    <span *ngIf="togglingId === r.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== r.id" class="bi bi-eye-slash me-1"></i>Hide
                  </button>
                  <button *ngIf="!r.isApproved && auth.hasPermission('reviews.edit')" class="btn btn-sm btn-outline-success" (click)="approve(r, true)" [disabled]="togglingId === r.id" title="Show this review on the tour page">
                    <span *ngIf="togglingId === r.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== r.id" class="bi bi-check2-circle me-1"></i>Approve
                  </button>
                  <button *ngIf="auth.hasPermission('reviews.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(r)" [disabled]="deleting && deleteTarget?.id === r.id" title="Delete this review">
                    <i class="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredReviews().length === 0"><td colspan="7" class="text-center text-muted py-3">{{ items.length === 0 ? 'No reviews yet.' : 'No reviews match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredReviews().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredReviews().length }}</small>
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
export class AdminReviewsComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items: Review[] = [];

  viewTarget: Review | null = null;
  deleteTarget: Review | null = null;
  deleting = false;
  togglingId: number | null = null;

  filterText = '';
  filterRating = 0;
  filterStatus: 'all' | 'visible' | 'hidden' = 'all';

  sortKey: 'customer' | 'tour' | 'rating' | 'posted' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  page = 1;
  readonly pageSize = 10;

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.viewTarget) { this.closeView(); return; }
    if (this.deleteTarget) this.cancelDelete();
  }

  view(r: Review): void { this.viewTarget = r; this.lockBody(); }
  closeView(): void { this.viewTarget = null; if (!this.deleteTarget) this.unlockBody(); }
  onViewBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) this.closeView();
  }

  onDeleteBackdrop(event: MouseEvent): void {
    if (this.deleting) return;
    if ((event.target as HTMLElement).classList.contains('modal')) this.cancelDelete();
  }

  private lockBody(): void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }

  load(): void {
    this.api.listReviews().subscribe({
      next: rs => {
        this.items = rs;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  filteredReviews(): Review[] {
    const q = this.filterText.trim().toLowerCase();
    const filtered = this.items.filter(r => {
      if (q && !(r.customerName.toLowerCase().includes(q)
              || r.tourName.toLowerCase().includes(q)
              || (r.title || '').toLowerCase().includes(q)
              || (r.comment || '').toLowerCase().includes(q))) return false;
      if (this.filterRating > 0 && r.rating < this.filterRating) return false;
      if (this.filterStatus === 'visible' && !r.isApproved) return false;
      if (this.filterStatus === 'hidden' && r.isApproved) return false;
      return true;
    });
    if (!this.sortKey) return filtered;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = this.sortValue(a);
      const bv = this.sortValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return av.toString().localeCompare(bv.toString()) * dir;
    });
  }

  private sortValue(r: Review): string | number | null {
    switch (this.sortKey) {
      case 'customer': return r.customerName;
      case 'tour': return r.tourName;
      case 'rating': return r.rating;
      case 'posted': return r.createdAt ? new Date(r.createdAt).getTime() : 0;
      case 'status': return r.isApproved ? 1 : 0;
      default: return null;
    }
  }

  toggleSort(key: 'customer' | 'tour' | 'rating' | 'posted' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'customer' | 'tour' | 'rating' | 'posted' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterText || this.filterRating > 0 || this.filterStatus !== 'all';
  }

  onFilterChange(): void { this.page = 1; }

  clearFilters(): void {
    this.filterText = '';
    this.filterRating = 0;
    this.filterStatus = 'all';
    this.page = 1;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredReviews().length / this.pageSize)); }

  pagedReviews(): Review[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredReviews().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    if (this.filteredReviews().length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredReviews().length); }

  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
    scrollAdminContentTop();
  }

  approve(r: Review, val: boolean): void {
    if (this.togglingId !== null) return;
    this.togglingId = r.id;
    this.api.approveReview(r.id, val).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(
          val ? `Review by "${r.customerName}" is now visible.` : `Review by "${r.customerName}" is now hidden.`,
          val ? 'success' : 'info', 4000, { title: val ? 'Review approved' : 'Review hidden' }
        );
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not update the review. Please try again.`, 'danger', 4000, { title: 'Update failed' });
      }
    });
  }

  remove(r: Review): void {
    this.deleteTarget = r;
    this.lockBody();
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    this.unlockBody();
  }

  confirmDelete(): void {
    const r = this.deleteTarget;
    if (!r || this.deleting) return;
    this.deleting = true;
    this.api.deleteReview(r.id).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        this.unlockBody();
        this.toast.show(`Review by "${r.customerName}" on "${r.tourName}" has been deleted.`, 'info', 4000, { title: 'Review deleted' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not delete the review. Please try again.`, 'danger', 4000, { title: 'Delete failed' });
      }
    });
  }
}
