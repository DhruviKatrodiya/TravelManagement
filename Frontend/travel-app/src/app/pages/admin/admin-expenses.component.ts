import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking, Expense } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-expenses',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">Expenses</h2>
        <p class="text-muted small mb-0">Operating costs and bookings-linked expenses recorded by staff.</p>
      </div>
      <button *ngIf="auth.hasPermission('expenses.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Record expense</button>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="kpi">
          <div class="label">Total expenses</div>
          <div class="value text-danger">₹ {{ total | number:'1.0-0' }}</div>
          <div class="sub">Active only</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="kpi">
          <div class="label">Entries</div>
          <div class="value">{{ activeCount }}</div>
          <div class="sub">{{ inactiveCount }} hidden (₹ {{ inactiveTotal | number:'1.0-0' }})</div>
        </div>
      </div>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate expense?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This expense will be hidden from active reports and totals:</p>
            <p class="fw-bold mb-2">{{ deleteTarget.category }} — ₹ {{ deleteTarget.amount | number:'1.2-2' }}</p>
            <p class="text-muted small mb-0">{{ deleteTarget.description }}. It stays in the database with status <strong>Hidden</strong> and can be activated again anytime. The Total expenses figure on the dashboard will update.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="cancelDelete()" [disabled]="deleting"><i class="bi bi-x-lg me-1"></i>Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              <span *ngIf="deleting" class="spinner-border spinner-border-sm me-2"></span>
              {{ deleting ? 'Deactivating…' : 'Deactivate' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit modal -->
    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Expense details' : (editingId ? 'Edit expense' : 'New expense') }}</h5>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Category <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="category" placeholder="e.g. Fuel, Hotel" [class.is-invalid]="isInvalid(form.get('category'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('category'))">Category is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Booking (optional)</label>
                  <app-select [options]="bookingOptions()" formControlName="bookingId"></app-select>
                </div>
                <div class="col-md-2">
                  <label class="form-label">Amount (₹) <span class="text-danger">*</span></label>
                  <input type="number" min="0.01" step="0.01" class="form-control" formControlName="amount" [class.is-invalid]="isInvalid(form.get('amount'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('amount'))">Amount must be greater than 0.</div>
                </div>
                <div class="col-md-2">
                  <label class="form-label">Date <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" formControlName="expenseDate" [class.is-invalid]="isInvalid(form.get('expenseDate'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('expenseDate'))">Date is required.</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Description <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="description" placeholder="Short note about this expense" [class.is-invalid]="isInvalid(form.get('description'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('description'))">Description is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Vendor</label>
                  <input class="form-control" formControlName="vendor" placeholder="Who you paid" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Paid by</label>
                  <input class="form-control" formControlName="paidBy" placeholder="Who paid" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">
                <i class="bi bi-x-lg me-1"></i>{{ viewMode ? 'Close' : 'Cancel' }}
              </button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save expense'">
                <i class="bi bi-check2-circle me-1"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label small text-muted mb-1">Search description or vendor</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="query" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Category</label>
          <app-select size="sm" [options]="categoryFilterOptions()" [(ngModel)]="categoryFilter" (valueChange)="onFilterCategoryChange($event)"></app-select>
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted mb-1">Booking link</label>
          <app-select size="sm" [options]="linkFilterOptions" [(ngModel)]="linkFilter" (valueChange)="onFilterLinkChange($event)"></app-select>
        </div>
        <div class="col-md-1">
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

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('date')">Date <i class="bi" [ngClass]="sortIcon('date')"></i></th>
              <th class="sortable" (click)="toggleSort('category')">Category <i class="bi" [ngClass]="sortIcon('category')"></i></th>
              <th class="sortable" (click)="toggleSort('description')">Description <i class="bi" [ngClass]="sortIcon('description')"></i></th>
              <th class="sortable" (click)="toggleSort('booking')">Booking <i class="bi" [ngClass]="sortIcon('booking')"></i></th>
              <th class="sortable" (click)="toggleSort('vendor')">Vendor <i class="bi" [ngClass]="sortIcon('vendor')"></i></th>
              <th class="sortable text-end" (click)="toggleSort('amount')">Amount <i class="bi" [ngClass]="sortIcon('amount')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of pagedItems()">
              <td>{{ e.expenseDate | date }}</td>
              <td><span class="badge bg-secondary">{{ e.category }}</span></td>
              <td>{{ e.description }}</td>
              <td><code *ngIf="e.bookingReference">{{ e.bookingReference }}</code><span *ngIf="!e.bookingReference" class="text-muted">—</span></td>
              <td>{{ e.vendor }}</td>
              <td class="text-end">₹ {{ e.amount | number:'1.2-2' }}</td>
              <td><span class="badge" [class.bg-success]="e.isActive" [class.bg-secondary]="!e.isActive">{{ e.isActive ? 'Active' : 'Hidden' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(e)" title="View expense details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="auth.hasPermission('expenses.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(e)">Edit</button>
                  <button *ngIf="e.isActive && auth.hasPermission('expenses.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(e)" [disabled]="togglingId === e.id" title="Hide this expense from reports">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!e.isActive && auth.hasPermission('expenses.delete')" class="btn btn-sm btn-outline-success" (click)="activate(e)" [disabled]="togglingId === e.id" title="Include this expense again">
                    <span *ngIf="togglingId === e.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== e.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered().length === 0"><td colspan="8" class="text-center text-muted py-3">{{ items.length === 0 ? 'No expenses recorded.' : 'No expenses match the filters.' }}</td></tr>
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
export class AdminExpensesComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Expense[] = [];
  bookings: Booking[] = [];
  editingId: number | null = null;
  viewMode = false;

  deleteTarget: Expense | null = null;
  deleting = false;
  togglingId: number | null = null;

  query = '';
  categoryFilter = '';
  linkFilter: '' | 'linked' | 'unlinked' = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  readonly linkFilterOptions = [
    { value: '', label: 'All' },
    { value: 'linked', label: 'Linked to booking' },
    { value: 'unlinked', label: 'Not linked' }
  ];

  readonly statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Hidden' }
  ];

  sortKey: 'date' | 'category' | 'description' | 'booking' | 'vendor' | 'amount' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    bookingId: [null as number | null],
    category: ['', Validators.required],
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    expenseDate: [new Date().toISOString().substring(0, 10), Validators.required],
    vendor: [''],
    paidBy: ['']
  });

  ngOnInit(): void {
    this.load();
    this.api.listBookings().subscribe({ next: bs => this.bookings = bs });
  }

  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.deleteTarget) { this.cancelDelete(); return; }
    if (this.editingId !== null) this.cancel();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) this.cancel();
  }
  onDeleteBackdrop(event: MouseEvent): void {
    if (this.deleting) return;
    if ((event.target as HTMLElement).classList.contains('modal')) this.cancelDelete();
  }
  private lockBody(): void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }

  load(): void {
    this.api.listExpenses().subscribe({
      next: es => {
        this.items = es;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  get total(): number {
    return this.items.filter(e => e.isActive).reduce((s, e) => s + e.amount, 0);
  }

  get inactiveTotal(): number {
    return this.items.filter(e => !e.isActive).reduce((s, e) => s + e.amount, 0);
  }

  get activeCount(): number { return this.items.filter(e => e.isActive).length; }
  get inactiveCount(): number { return this.items.filter(e => !e.isActive).length; }

  bookingOptions(): { value: number | null; label: string }[] {
    return [{ value: null, label: '— None —' }, ...this.bookings.map(b => ({ value: b.id, label: `${b.bookingReference} — ${b.tourName}` }))];
  }

  categoryFilterOptions(): { value: string; label: string }[] {
    const cats = Array.from(new Set(this.items.map(e => e.category))).sort();
    return [{ value: '', label: 'All categories' }, ...cats.map(c => ({ value: c, label: c }))];
  }

  filtered(): Expense[] {
    const q = this.query.trim().toLowerCase();
    const list = this.items.filter(e => {
      if (q) {
        const hay = ((e.description || '') + ' ' + (e.vendor || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (this.categoryFilter && e.category !== this.categoryFilter) return false;
      if (this.linkFilter === 'linked' && !e.bookingReference) return false;
      if (this.linkFilter === 'unlinked' && e.bookingReference) return false;
      if (this.statusFilter === 'active' && !e.isActive) return false;
      if (this.statusFilter === 'inactive' && e.isActive) return false;
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

  private sortValue(e: Expense): string | number | null {
    switch (this.sortKey) {
      case 'date': return new Date(e.expenseDate).getTime();
      case 'category': return e.category;
      case 'description': return e.description || '';
      case 'booking': return e.bookingReference || '';
      case 'vendor': return e.vendor || '';
      case 'amount': return e.amount;
      case 'status': return e.isActive ? 1 : 0;
      default: return null;
    }
  }

  toggleSort(key: 'date' | 'category' | 'description' | 'booking' | 'vendor' | 'amount' | 'status'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }

  sortIcon(key: 'date' | 'category' | 'description' | 'booking' | 'vendor' | 'amount' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean { return !!this.query || !!this.categoryFilter || this.linkFilter !== '' || this.statusFilter !== 'all'; }
  onFilterChange(): void { this.page = 1; }
  onFilterCategoryChange(v: string | number): void { this.categoryFilter = v as string; this.page = 1; }
  onFilterLinkChange(v: string | number): void { this.linkFilter = v as '' | 'linked' | 'unlinked'; this.page = 1; }
  onFilterStatusChange(v: string | number): void { this.statusFilter = v as 'all' | 'active' | 'inactive'; this.page = 1; }
  clearFilters(): void { this.query = ''; this.categoryFilter = ''; this.linkFilter = ''; this.statusFilter = 'all'; this.page = 1; }

  totalPages(): number { return Math.max(1, Math.ceil(this.filtered().length / this.pageSize)); }
  pagedItems(): Expense[] {
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

  startCreate(): void {
    this.editingId = 0;
    this.viewMode = false;
    this.form.reset({ bookingId: null, category: '', description: '', amount: 0, expenseDate: new Date().toISOString().substring(0, 10), vendor: '', paidBy: '' });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  edit(e: Expense): void {
    this.editingId = e.id;
    this.viewMode = false;
    this.form.reset({ ...e, expenseDate: e.expenseDate.substring(0, 10) } as any);
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  view(e: Expense): void {
    this.editingId = e.id;
    this.viewMode = true;
    this.form.reset({ ...e, expenseDate: e.expenseDate.substring(0, 10) } as any);
    this.form.disable({ emitEvent: false });
    this.lockBody();
  }

  cancel(): void {
    this.editingId = null;
    this.viewMode = false;
    this.form.enable({ emitEvent: false });
    this.unlockBody();
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue() as any;
    const label = `${v.category} — ₹ ${Number(v.amount).toLocaleString()}`;
    const op = this.editingId ? this.api.updateExpense(this.editingId, v) : this.api.createExpense(v);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Expense ${label} updated.` : `New expense ${label} recorded.`,
          'success', 4000, { title: this.editingId ? 'Expense updated' : 'Expense recorded' }
        );
        this.editingId = null;
        this.unlockBody();
        this.load();
      }
    });
  }

  remove(e: Expense): void { this.deleteTarget = e; this.lockBody(); }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (this.editingId === null) this.unlockBody();
  }

  confirmDelete(): void {
    const e = this.deleteTarget;
    if (!e || this.deleting) return;
    this.deleting = true;
    this.api.updateExpense(e.id, this.toRequest(e, false)).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (this.editingId === null) this.unlockBody();
        this.toast.show(`Expense "${e.category}" of ₹ ${e.amount.toLocaleString()} on ${new Date(e.expenseDate).toLocaleDateString()} is now hidden from reports.`, 'info', 4000, { title: 'Expense deactivated' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not deactivate this expense. Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(e: Expense): void {
    if (this.togglingId !== null) return;
    this.togglingId = e.id;
    this.api.updateExpense(e.id, this.toRequest(e, true)).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Expense "${e.category}" of ₹ ${e.amount.toLocaleString()} is included in reports again.`, 'success', 4000, { title: 'Expense activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate this expense. Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }

  private toRequest(e: Expense, isActive: boolean): any {
    return {
      bookingId: e.bookingId ?? null,
      tourPackageId: e.tourPackageId ?? null,
      category: e.category,
      description: e.description,
      amount: e.amount,
      expenseDate: e.expenseDate,
      vendor: e.vendor,
      paidBy: e.paidBy,
      notes: e.notes,
      isActive
    };
  }
}
