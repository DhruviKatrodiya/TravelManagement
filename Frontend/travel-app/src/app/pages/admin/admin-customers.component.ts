import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Customer } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-customers',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Customers</h2>
      <button *ngIf="auth.isAdmin()" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add customer</button>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onDeleteBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate customer?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This customer will no longer be able to log in:</p>
            <p class="fw-bold mb-2">"{{ deleteTarget.fullName }}" — {{ deleteTarget.email }}</p>
            <p class="text-muted small mb-0">Their bookings and history stay in the database. You can reactivate them at any time from this list.</p>
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
            <h5 class="modal-title fw-bold">{{ editingId ? 'Edit customer' : 'New customer' }}</h5>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body" #modalBody>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Full name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="fullName" [class.is-invalid]="isInvalid(form.get('fullName'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('fullName'))">Full name is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <input type="email" class="form-control" formControlName="email" [class.is-invalid]="isInvalid(form.get('email'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('email'))">Valid email is required.</div>
                </div>

                <div class="col-md-6" *ngIf="editingId === 0">
                  <label class="form-label">Initial password <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="password" placeholder="At least 6 characters" [class.is-invalid]="isInvalid(form.get('password'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('password'))">At least 6 characters.</div>
                  <small class="text-muted">Share this with the customer; they can change it after sign-in.</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="phone" [class.is-invalid]="isInvalid(form.get('phone'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('phone'))">Phone is required.</div>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Date of birth</label>
                  <input type="date" class="form-control" formControlName="dateOfBirth" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Gender</label>
                  <select class="form-select" formControlName="gender">
                    <option value="">—</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Country</label>
                  <input class="form-control" formControlName="country" />
                </div>

                <div class="col-12">
                  <label class="form-label">Address <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="address" [class.is-invalid]="isInvalid(form.get('address'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('address'))">Address is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">City <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="city" [class.is-invalid]="isInvalid(form.get('city'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('city'))">City is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">State <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="state" [class.is-invalid]="isInvalid(form.get('state'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('state'))">State is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Postal code <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="postalCode" [class.is-invalid]="isInvalid(form.get('postalCode'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('postalCode'))">Postal code is required.</div>
                </div>

                <ng-container *ngIf="editingId !== 0">
                  <div class="col-md-6"><label class="form-label">ID proof type</label><input class="form-control" formControlName="idProofType" /></div>
                  <div class="col-md-6"><label class="form-label">ID proof number</label><input class="form-control" formControlName="idProofNumber" /></div>
                </ng-container>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()"><i class="bi bi-x-lg me-1"></i>Cancel</button>
              <button class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save customer'">
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
          <label class="form-label small text-muted mb-1">Search name or email</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterName" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Country</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterCountry" (ngModelChange)="onFilterChange()">
            <option value="">All countries</option>
            <option *ngFor="let c of countryOptions()" [value]="c">{{ c }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted mb-1">Bookings</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterBookings" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="with">With bookings</option>
            <option value="without">Without bookings</option>
          </select>
        </div>
        <div class="col-md-1">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Hidden</option>
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
              <th class="sortable" (click)="toggleSort('email')">Email <i class="bi" [ngClass]="sortIcon('email')"></i></th>
              <th>Phone</th>
              <th class="sortable" (click)="toggleSort('city')">City <i class="bi" [ngClass]="sortIcon('city')"></i></th>
              <th class="sortable" (click)="toggleSort('bookings')">Bookings <i class="bi" [ngClass]="sortIcon('bookings')"></i></th>
              <th class="sortable" (click)="toggleSort('spent')">Total spent <i class="bi" [ngClass]="sortIcon('spent')"></i></th>
              <th class="sortable" (click)="toggleSort('joined')">Joined <i class="bi" [ngClass]="sortIcon('joined')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of pagedCustomers()">
              <td><strong>{{ c.fullName }}</strong></td>
              <td>{{ c.email }}</td>
              <td>{{ c.phone }}</td>
              <td>{{ c.city }}</td>
              <td>{{ c.totalBookings }}</td>
              <td>₹ {{ c.totalSpent | number:'1.0-0' }}</td>
              <td>{{ c.createdAt | date:'mediumDate' }}</td>
              <td><span class="badge" [class.bg-success]="c.isActive" [class.bg-secondary]="!c.isActive">{{ c.isActive ? 'Active' : 'Hidden' }}</span></td>
              <td class="text-end">
                <ng-container *ngIf="auth.isAdmin(); else readOnlyCust">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(c)">Edit</button>
                  <button *ngIf="c.isActive" class="btn btn-sm btn-outline-danger" (click)="remove(c)" [disabled]="togglingId === c.id" title="Block this customer from logging in">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!c.isActive" class="btn btn-sm btn-outline-success" (click)="activate(c)" [disabled]="togglingId === c.id" title="Allow this customer to log in again">
                    <span *ngIf="togglingId === c.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== c.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </ng-container>
                <ng-template #readOnlyCust><span class="text-muted small">View only</span></ng-template>
              </td>
            </tr>
            <tr *ngIf="filteredCustomers().length === 0"><td colspan="9" class="text-center text-muted py-3">{{ items.length === 0 ? 'No customers yet.' : 'No customers match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredCustomers().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredCustomers().length }}</small>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" type="button" (click)="setPage(page - 1)" [disabled]="page === 1" aria-label="Previous">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
            <li class="page-item" *ngFor="let p of pageNumbers()" [class.active]="p === page">
              <button class="page-link" type="button" (click)="setPage(p)">{{ p }}</button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPages()">
              <button class="page-link" type="button" (click)="setPage(page + 1)" [disabled]="page === totalPages()" aria-label="Next">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `
})
export class AdminCustomersComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Customer[] = [];
  editingId: number | null = null;

  deleteTarget: Customer | null = null;
  deleting = false;

  filterName = '';
  filterCountry = '';
  filterBookings: 'all' | 'with' | 'without' = 'all';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  togglingId: number | null = null;

  sortKey: 'name' | 'email' | 'city' | 'bookings' | 'spent' | 'joined' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    phone: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    country: ['India'],
    dateOfBirth: [''],
    gender: [''],
    idProofType: [''],
    idProofNumber: ['']
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
    this.api.listCustomers().subscribe({
      next: cs => {
        this.items = cs;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  readonly supportedCountries: string[] = ['India', 'Bhutan', 'Nepal'];

  countryOptions(): string[] { return this.supportedCountries; }

  filteredCustomers(): Customer[] {
    const q = this.filterName.trim().toLowerCase();
    const filtered = this.items.filter(c => {
      if (q && !c.fullName.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (this.filterCountry && (c.country || '') !== this.filterCountry) return false;
      if (this.filterBookings === 'with' && c.totalBookings === 0) return false;
      if (this.filterBookings === 'without' && c.totalBookings > 0) return false;
      if (this.filterStatus === 'active' && !c.isActive) return false;
      if (this.filterStatus === 'inactive' && c.isActive) return false;
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

  private sortValue(c: Customer): string | number | null {
    switch (this.sortKey) {
      case 'name': return c.fullName;
      case 'email': return c.email;
      case 'city': return c.city || '';
      case 'bookings': return c.totalBookings;
      case 'spent': return c.totalSpent;
      case 'joined': return c.createdAt ? new Date(c.createdAt).getTime() : 0;
      case 'status': return c.isActive ? 1 : 0;
      default: return null;
    }
  }

  toggleSort(key: 'name' | 'email' | 'city' | 'bookings' | 'spent' | 'joined' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'email' | 'city' | 'bookings' | 'spent' | 'joined' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterName || !!this.filterCountry || this.filterBookings !== 'all' || this.filterStatus !== 'all';
  }

  onFilterChange(): void { this.page = 1; }

  clearFilters(): void {
    this.filterName = '';
    this.filterCountry = '';
    this.filterBookings = 'all';
    this.filterStatus = 'all';
    this.page = 1;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredCustomers().length / this.pageSize)); }

  pagedCustomers(): Customer[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredCustomers().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    if (this.filteredCustomers().length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredCustomers().length); }

  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
    scrollAdminContentTop();
  }

  startCreate(): void {
    this.editingId = 0;
    this.form.reset({
      fullName: '', email: '', password: '', phone: '',
      address: '', city: '', state: '', postalCode: '', country: 'India',
      dateOfBirth: '', gender: '', idProofType: '', idProofNumber: ''
    });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.lockBody();
  }

  edit(c: Customer): void {
    this.editingId = c.id;
    this.form.reset({
      fullName: c.fullName,
      email: c.email,
      password: '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      postalCode: c.postalCode || '',
      country: c.country || 'India',
      dateOfBirth: c.dateOfBirth ? c.dateOfBirth.substring(0, 10) : '',
      gender: c.gender || '',
      idProofType: c.idProofType || '',
      idProofNumber: c.idProofNumber || ''
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.lockBody();
  }

  cancel(): void { this.editingId = null; this.unlockBody(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const label = `"${v.fullName}" — ${v.email}`;
    if (this.editingId === 0) {
      this.api.createCustomer(v).subscribe({
        next: () => {
          this.toast.show(`New customer ${label} added.`, 'success', 4000, { title: 'Customer created' });
          this.editingId = null;
          this.unlockBody();
          this.load();
        }
      });
    } else {
      const { password, ...update } = v;
      this.api.updateCustomer(this.editingId!, update).subscribe({
        next: () => {
          this.toast.show(`Customer ${label} details updated.`, 'success', 4000, { title: 'Customer updated' });
          this.editingId = null;
          this.unlockBody();
          this.load();
        }
      });
    }
  }

  remove(c: Customer): void {
    this.deleteTarget = c;
    this.lockBody();
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (this.editingId === null) this.unlockBody();
  }

  confirmDelete(): void {
    const c = this.deleteTarget;
    if (!c || this.deleting) return;
    this.deleting = true;
    this.api.setCustomerActive(c.id, false).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (this.editingId === null) this.unlockBody();
        this.toast.show(`Customer "${c.fullName}" can no longer log in.`, 'info', 4000, { title: 'Customer deactivated' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not deactivate "${c.fullName}". Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(c: Customer): void {
    if (this.togglingId !== null) return;
    this.togglingId = c.id;
    this.api.setCustomerActive(c.id, true).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Customer "${c.fullName}" can log in again.`, 'success', 4000, { title: 'Customer activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate "${c.fullName}". Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }
}
