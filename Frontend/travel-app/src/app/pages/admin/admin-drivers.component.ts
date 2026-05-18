import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Driver } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-drivers',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Drivers</h2>
      <button *ngIf="auth.hasPermission('drivers.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add driver</button>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onDeleteBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate driver?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This driver will be hidden from allocation lists:</p>
            <p class="fw-bold mb-2">"{{ deleteTarget.fullName }}" — {{ deleteTarget.licenseNumber }}</p>
            <p class="text-muted small mb-0">Driver records stay in the database and can be reactivated at any time. Existing allocations are not affected.</p>
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
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onBackdropClick($event)">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Driver details' : (editingId ? 'Edit driver' : 'New driver') }}</h5>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body" #modalBody>
              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="formError">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ formError }}</div>
                <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="formError = ''"></button>
              </div>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Full name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="fullName" [class.is-invalid]="isInvalid(form.get('fullName'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('fullName'))">Full name is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Phone <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="phone" [class.is-invalid]="isInvalid(form.get('phone'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('phone'))">Phone is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" formControlName="email" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">License # <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="licenseNumber" [class.is-invalid]="isInvalid(form.get('licenseNumber'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('licenseNumber'))">License number is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">License expiry</label>
                  <input type="date" class="form-control" formControlName="licenseExpiry" />
                </div>
                <div class="col-md-2">
                  <label class="form-label">Experience (yrs)</label>
                  <input type="number" min="0" class="form-control" formControlName="experienceYears" />
                </div>
                <div class="col-md-2 d-flex align-items-end">
                  <div class="form-check ms-1">
                    <input class="form-check-input" type="checkbox" formControlName="isAvailable" id="driverAvail" />
                    <label class="form-check-label" for="driverAvail">Available</label>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Address</label>
                  <input class="form-control" formControlName="address" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">
                <i class="bi bi-x-lg me-1"></i>{{ viewMode ? 'Close' : 'Cancel' }}
              </button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save driver'">
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
          <label class="form-label small text-muted mb-1">Search name, phone or license</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Experience</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterExperience" (ngModelChange)="onFilterChange()">
            <option [ngValue]="0">All</option>
            <option [ngValue]="1">1+ years</option>
            <option [ngValue]="3">3+ years</option>
            <option [ngValue]="5">5+ years</option>
            <option [ngValue]="10">10+ years</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="unavailable">On trip</option>
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
              <th class="sortable" (click)="toggleSort('name')">Name <i class="bi" [ngClass]="sortIcon('name')"></i></th>
              <th>Phone</th>
              <th class="sortable" (click)="toggleSort('license')">License <i class="bi" [ngClass]="sortIcon('license')"></i></th>
              <th class="sortable" (click)="toggleSort('experience')">Experience <i class="bi" [ngClass]="sortIcon('experience')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of pagedDrivers()">
              <td><strong>{{ d.fullName }}</strong><br><small class="text-muted">{{ d.email }}</small></td>
              <td>{{ d.phone }}</td>
              <td><code>{{ d.licenseNumber }}</code><br><small class="text-muted">Expires {{ d.licenseExpiry | date:'mediumDate' }}</small></td>
              <td>{{ d.experienceYears }} year{{ d.experienceYears === 1 ? '' : 's' }}</td>
              <td>
                <span *ngIf="!d.isActive" class="badge bg-secondary">Hidden</span>
                <span *ngIf="d.isActive" class="badge" [class.bg-success]="d.isAvailable" [class.bg-warning]="!d.isAvailable">{{ d.isAvailable ? 'Available' : 'On trip' }}</span>
              </td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(d)" title="View driver details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="auth.hasPermission('drivers.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(d)" [disabled]="!d.isActive">Edit</button>
                  <button *ngIf="d.isActive && auth.hasPermission('drivers.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(d)" [disabled]="togglingId === d.id" title="Hide this driver from allocation">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!d.isActive && auth.hasPermission('drivers.delete')" class="btn btn-sm btn-outline-success" (click)="activate(d)" [disabled]="togglingId === d.id" title="Bring this driver back for allocation">
                    <span *ngIf="togglingId === d.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== d.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredDrivers().length === 0"><td colspan="6" class="text-center text-muted py-3">{{ items.length === 0 ? 'No drivers yet.' : 'No drivers match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredDrivers().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredDrivers().length }}</small>
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
export class AdminDriversComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Driver[] = [];
  editingId: number | null = null;
  viewMode = false;
  formError = '';

  deleteTarget: Driver | null = null;
  deleting = false;
  togglingId: number | null = null;

  filterText = '';
  filterExperience = 0;
  filterStatus: 'all' | 'available' | 'unavailable' | 'hidden' = 'all';

  sortKey: 'name' | 'license' | 'experience' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    fullName: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    licenseNumber: ['', Validators.required],
    licenseExpiry: [''],
    address: [''],
    experienceYears: [0, [Validators.min(0)]],
    isAvailable: [true]
  });

  ngOnInit(): void { this.load(); }
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
    this.api.listDrivers().subscribe({
      next: ds => {
        this.items = ds;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  filteredDrivers(): Driver[] {
    const q = this.filterText.trim().toLowerCase();
    const filtered = this.items.filter(d => {
      if (q && !((d.fullName || '').toLowerCase().includes(q)
              || (d.phone || '').toLowerCase().includes(q)
              || (d.email || '').toLowerCase().includes(q)
              || (d.licenseNumber || '').toLowerCase().includes(q))) return false;
      if (this.filterExperience > 0 && (d.experienceYears || 0) < this.filterExperience) return false;
      if (this.filterStatus === 'available' && !(d.isActive && d.isAvailable)) return false;
      if (this.filterStatus === 'unavailable' && !(d.isActive && !d.isAvailable)) return false;
      if (this.filterStatus === 'hidden' && d.isActive) return false;
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

  private sortValue(d: Driver): string | number | null {
    switch (this.sortKey) {
      case 'name': return d.fullName;
      case 'license': return d.licenseNumber;
      case 'experience': return d.experienceYears;
      case 'status': return d.isAvailable ? 1 : 0;
      default: return null;
    }
  }

  toggleSort(key: 'name' | 'license' | 'experience' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'license' | 'experience' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterText || this.filterExperience > 0 || this.filterStatus !== 'all';
  }

  onFilterChange(): void { this.page = 1; }

  clearFilters(): void {
    this.filterText = '';
    this.filterExperience = 0;
    this.filterStatus = 'all';
    this.page = 1;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredDrivers().length / this.pageSize)); }

  pagedDrivers(): Driver[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredDrivers().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    if (this.filteredDrivers().length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredDrivers().length); }

  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
    scrollAdminContentTop();
  }

  startCreate(): void {
    this.editingId = 0;
    this.viewMode = false;
    this.formError = '';
    this.form.reset({ fullName: '', phone: '', email: '', licenseNumber: '', licenseExpiry: '', address: '', experienceYears: 0, isAvailable: true });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  edit(d: Driver): void {
    this.editingId = d.id;
    this.viewMode = false;
    this.formError = '';
    this.form.reset({ ...d, licenseExpiry: d.licenseExpiry?.substring(0, 10) || '' } as any);
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  view(d: Driver): void {
    this.editingId = d.id;
    this.viewMode = true;
    this.formError = '';
    this.form.reset({ ...d, licenseExpiry: d.licenseExpiry?.substring(0, 10) || '' } as any);
    this.form.disable({ emitEvent: false });
    this.lockBody();
  }

  cancel(): void {
    this.editingId = null;
    this.viewMode = false;
    this.formError = '';
    this.form.enable({ emitEvent: false });
    this.unlockBody();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const v = this.form.getRawValue() as any;
    const label = `"${v.fullName}"`;
    const op = this.editingId ? this.api.updateDriver(this.editingId, v) : this.api.createDriver(v);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Driver ${label} updated.` : `New driver ${label} added.`,
          'success', 4000, { title: this.editingId ? 'Driver updated' : 'Driver created' }
        );
        this.editingId = null;
        this.unlockBody();
        this.load();
      },
      error: (err: any) => { this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.'; setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0); }
    });
  }

  remove(d: Driver): void {
    this.deleteTarget = d;
    this.lockBody();
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (this.editingId === null) this.unlockBody();
  }

  confirmDelete(): void {
    const d = this.deleteTarget;
    if (!d || this.deleting) return;
    this.deleting = true;
    this.api.setDriverActive(d.id, false).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (this.editingId === null) this.unlockBody();
        this.toast.show(`Driver "${d.fullName}" has been hidden from allocation.`, 'info', 4000, { title: 'Driver deactivated' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not deactivate "${d.fullName}". Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(d: Driver): void {
    if (this.togglingId !== null) return;
    this.togglingId = d.id;
    this.api.setDriverActive(d.id, true).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Driver "${d.fullName}" is available again.`, 'success', 4000, { title: 'Driver activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate "${d.fullName}". Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }
}
