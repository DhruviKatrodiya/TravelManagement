import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Staff } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-staff',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Staff members</h2>
      <button *ngIf="auth.isAdmin()" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add staff</button>
    </div>

    <div class="alert alert-info small">
      Staff accounts are seeded by an admin only. Customers cannot self-register as staff.
    </div>

    <!-- Permissions modal -->
    <div *ngIf="permsTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="permsTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onPermsBackdrop($event)">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-shield-lock me-2"></i>Permissions for {{ permsTarget.fullName }}</h5>
          </div>
          <div class="modal-body">
            <p class="text-muted small mb-3">Tick the actions this staff member is allowed to perform. Admins always have every permission.</p>
            <div *ngFor="let group of permsGrouped; trackBy: trackByModule" class="mb-3">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <h6 class="fw-bold mb-0 text-capitalize">{{ group.module }}</h6>
                <div>
                  <button type="button" class="btn btn-sm btn-link p-0 me-2" (click)="selectAllInGroup(group.module, true)">All</button>
                  <button type="button" class="btn btn-sm btn-link p-0 text-muted" (click)="selectAllInGroup(group.module, false)">None</button>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-3">
                <div class="form-check" *ngFor="let key of group.keys; trackBy: trackByKey">
                  <input class="form-check-input" type="checkbox"
                         [id]="'perm-' + key"
                         [checked]="permsSelected.has(key)"
                         (change)="togglePerm(key)" />
                  <label class="form-check-label small" [attr.for]="'perm-' + key">{{ permLabel(key) }}</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="closePermissions()" [disabled]="permsSaving"><i class="bi bi-x-lg me-1"></i>Cancel</button>
            <button type="button" class="btn btn-primary" (click)="savePermissions()" [disabled]="permsSaving">
              <span *ngIf="permsSaving" class="spinner-border spinner-border-sm me-2"></span>
              <i *ngIf="!permsSaving" class="bi bi-check2-circle me-1"></i>{{ permsSaving ? 'Saving…' : 'Save permissions' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onDeleteBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate staff?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This staff member will no longer be able to log in:</p>
            <p class="fw-bold mb-2">"{{ deleteTarget.fullName }}" — {{ deleteTarget.email }}</p>
            <p class="text-muted small mb-0">Their records stay in the database. You can reactivate them at any time from this list.</p>
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
            <h5 class="modal-title fw-bold">{{ editingId ? 'Edit staff' : 'New staff member' }}</h5>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body" #modalBody>
              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="formError">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ formError }}</div>
                <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="formError = ''"></button>
              </div>
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
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="phone" [class.is-invalid]="isInvalid(form.get('phone'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('phone'))">Phone is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Designation <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="designation" [class.is-invalid]="isInvalid(form.get('designation'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('designation'))">Designation is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Department <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="department" [class.is-invalid]="isInvalid(form.get('department'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('department'))">Department is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Salary (₹) <span class="text-danger">*</span></label>
                  <input type="number" min="0" class="form-control" formControlName="salary" [class.is-invalid]="isInvalid(form.get('salary'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('salary'))">Salary is required.</div>
                </div>
                <div class="col-12" *ngIf="editingId">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" formControlName="isActive" id="staffActive" />
                    <label class="form-check-label" for="staffActive">Active</label>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()"><i class="bi bi-x-lg me-1"></i>Cancel</button>
              <button class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save staff member'">
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
          <label class="form-label small text-muted mb-1">Search name, email or designation</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Department</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterDepartment" (ngModelChange)="onFilterChange()">
            <option value="">All departments</option>
            <option *ngFor="let d of departmentOptions()" [value]="d">{{ d }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
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
              <th class="sortable" (click)="toggleSort('designation')">Designation <i class="bi" [ngClass]="sortIcon('designation')"></i></th>
              <th class="sortable" (click)="toggleSort('department')">Department <i class="bi" [ngClass]="sortIcon('department')"></i></th>
              <th class="sortable" (click)="toggleSort('joined')">Joined <i class="bi" [ngClass]="sortIcon('joined')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of pagedStaff()">
              <td><strong>{{ s.fullName }}</strong></td>
              <td>{{ s.email }}</td>
              <td>{{ s.phone }}</td>
              <td>{{ s.designation }}</td>
              <td>{{ s.department }}</td>
              <td>{{ s.joinedAt | date:'mediumDate' }}</td>
              <td><span class="badge" [class.bg-success]="s.isActive" [class.bg-secondary]="!s.isActive">{{ s.isActive ? 'Active' : 'Disabled' }}</span></td>
              <td class="text-end">
                <ng-container *ngIf="auth.isAdmin(); else readOnlyStf">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(s)">Edit</button>
                  <button class="btn btn-sm btn-outline-secondary me-1" (click)="openPermissions(s)" title="Manage permissions">
                    <i class="bi bi-shield-lock me-1"></i>Permissions
                  </button>
                  <button *ngIf="s.isActive" class="btn btn-sm btn-outline-danger" (click)="remove(s)" [disabled]="togglingId === s.id" title="Block this staff from logging in">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!s.isActive" class="btn btn-sm btn-outline-success" (click)="activate(s)" [disabled]="togglingId === s.id" title="Allow this staff to log in again">
                    <span *ngIf="togglingId === s.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== s.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </ng-container>
                <ng-template #readOnlyStf><span class="text-muted small">View only</span></ng-template>
              </td>
            </tr>
            <tr *ngIf="filteredStaff().length === 0"><td colspan="8" class="text-center text-muted py-3">{{ items.length === 0 ? 'No staff members yet.' : 'No staff match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredStaff().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredStaff().length }}</small>
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
export class AdminStaffComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Staff[] = [];
  editingId: number | null = null;
  formError = '';

  deleteTarget: Staff | null = null;
  deleting = false;
  togglingId: number | null = null;

  permsTarget: Staff | null = null;
  permsCatalog: string[] = [];
  permsGrouped: { module: string; keys: string[] }[] = [];
  permsSelected = new Set<string>();
  permsSaving = false;

  filterText = '';
  filterDepartment = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  sortKey: 'name' | 'email' | 'designation' | 'department' | 'joined' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    phone: ['', Validators.required],
    designation: ['', Validators.required],
    department: ['', Validators.required],
    salary: [null as number | null, [Validators.required, Validators.min(0)]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.load();
    this.api.listPermissionCatalog().subscribe({
      next: list => {
        this.permsCatalog = list || [];
        this.permsGrouped = this.buildGroups(this.permsCatalog);
      }
    });
  }

  private buildGroups(catalog: string[]): { module: string; keys: string[] }[] {
    const groups = new Map<string, string[]>();
    for (const key of catalog) {
      const [mod] = key.split('.');
      const arr = groups.get(mod) ?? [];
      arr.push(key);
      groups.set(mod, arr);
    }
    return Array.from(groups.entries()).map(([module, keys]) => ({ module, keys }));
  }

  openPermissions(s: Staff): void {
    this.permsTarget = s;
    this.permsSelected = new Set<string>();
    this.lockBody();
    this.api.getStaffPermissions(s.id).subscribe({
      next: perms => this.permsSelected = new Set(perms || [])
    });
  }

  closePermissions(): void {
    if (this.permsSaving) return;
    this.permsTarget = null;
    this.permsSelected.clear();
    if (this.editingId === null && !this.deleteTarget) this.unlockBody();
  }

  onPermsBackdrop(event: MouseEvent): void {
    if (this.permsSaving) return;
    if ((event.target as HTMLElement).classList.contains('modal')) this.closePermissions();
  }

  togglePerm(key: string): void {
    if (this.permsSelected.has(key)) this.permsSelected.delete(key);
    else this.permsSelected.add(key);
  }

  trackByModule(_index: number, item: { module: string }): string { return item.module; }
  trackByKey(_index: number, key: string): string { return key; }

  permLabel(key: string): string {
    const [, action] = key.split('.');
    return action ? action.charAt(0).toUpperCase() + action.slice(1) : key;
  }


  selectAllInGroup(module: string, on: boolean): void {
    for (const key of this.permsCatalog) {
      if (!key.startsWith(module + '.')) continue;
      if (on) this.permsSelected.add(key);
      else this.permsSelected.delete(key);
    }
  }

  savePermissions(): void {
    const target = this.permsTarget;
    if (!target || this.permsSaving) return;
    this.permsSaving = true;
    const list = Array.from(this.permsSelected);
    this.api.setStaffPermissions(target.id, list).subscribe({
      next: () => {
        this.permsSaving = false;
        this.toast.show(`Permissions for "${target.fullName}" updated.`, 'success', 4000, { title: 'Permissions saved' });
        this.permsTarget = null;
        this.permsSelected.clear();
        if (this.editingId === null && !this.deleteTarget) this.unlockBody();
      },
      error: () => {
        this.permsSaving = false;
        this.toast.show(`Could not save permissions. Please try again.`, 'danger', 4000, { title: 'Save failed' });
      }
    });
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

  private savedScrollY = 0;
  private lockBody(): void {
    if (!document.body.classList.contains('modal-open')) {
      this.savedScrollY = window.scrollY;
      document.body.style.top = `-${this.savedScrollY}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    document.body.classList.add('modal-open');
  }
  private unlockBody(): void {
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    if (this.savedScrollY) {
      window.scrollTo(0, this.savedScrollY);
      this.savedScrollY = 0;
    }
  }

  load(): void {
    this.api.listStaff().subscribe({
      next: ss => {
        this.items = ss;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  departmentOptions(): string[] {
    const set = new Set<string>();
    for (const s of this.items) if (s.department) set.add(s.department);
    return Array.from(set).sort();
  }

  filteredStaff(): Staff[] {
    const q = this.filterText.trim().toLowerCase();
    const filtered = this.items.filter(s => {
      if (q && !((s.fullName || '').toLowerCase().includes(q)
              || (s.email || '').toLowerCase().includes(q)
              || (s.designation || '').toLowerCase().includes(q))) return false;
      if (this.filterDepartment && (s.department || '') !== this.filterDepartment) return false;
      if (this.filterStatus === 'active' && !s.isActive) return false;
      if (this.filterStatus === 'inactive' && s.isActive) return false;
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

  private sortValue(s: Staff): string | number | null {
    switch (this.sortKey) {
      case 'name': return s.fullName;
      case 'email': return s.email;
      case 'designation': return s.designation || '';
      case 'department': return s.department || '';
      case 'joined': return s.joinedAt ? new Date(s.joinedAt).getTime() : 0;
      case 'status': return s.isActive ? 1 : 0;
      default: return null;
    }
  }

  toggleSort(key: 'name' | 'email' | 'designation' | 'department' | 'joined' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'email' | 'designation' | 'department' | 'joined' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterText || !!this.filterDepartment || this.filterStatus !== 'all';
  }

  onFilterChange(): void { this.page = 1; }

  clearFilters(): void {
    this.filterText = '';
    this.filterDepartment = '';
    this.filterStatus = 'all';
    this.page = 1;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredStaff().length / this.pageSize)); }

  pagedStaff(): Staff[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredStaff().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    if (this.filteredStaff().length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredStaff().length); }

  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
    scrollAdminContentTop();
  }

  startCreate(): void {
    this.editingId = 0;
    this.formError = '';
    this.form.reset({ fullName: '', email: '', password: '', phone: '', designation: '', department: '', salary: null, isActive: true });
    this.form.controls['password'].setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls['password'].updateValueAndValidity();
    this.lockBody();
  }

  edit(s: Staff): void {
    this.editingId = s.id;
    this.formError = '';
    this.form.controls['password'].clearValidators();
    this.form.controls['password'].updateValueAndValidity();
    this.form.reset({
      fullName: s.fullName,
      email: s.email,
      password: '',
      phone: s.phone || '',
      designation: s.designation || '',
      department: s.department || '',
      salary: s.salary || 0,
      isActive: s.isActive
    });
    this.lockBody();
  }

  cancel(): void { this.editingId = null; this.formError = ''; this.unlockBody(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const v = this.form.getRawValue() as any;
    const label = `"${v.fullName}" — ${v.email}`;
    const op = this.editingId ? this.api.updateStaff(this.editingId, v) : this.api.createStaff(v);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Staff ${label} updated.` : `New staff ${label} added.`,
          'success', 4000, { title: this.editingId ? 'Staff updated' : 'Staff created' }
        );
        this.editingId = null;
        this.unlockBody();
        this.load();
      },
      error: (err: any) => { this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.'; setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0); }
    });
  }

  remove(s: Staff): void {
    this.deleteTarget = s;
    this.lockBody();
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (this.editingId === null) this.unlockBody();
  }

  confirmDelete(): void {
    const s = this.deleteTarget;
    if (!s || this.deleting) return;
    this.deleting = true;
    this.api.updateStaff(s.id, { ...s, isActive: false } as any).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (this.editingId === null) this.unlockBody();
        this.toast.show(`Staff "${s.fullName}" can no longer log in.`, 'info', 4000, { title: 'Staff deactivated' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not deactivate "${s.fullName}". Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(s: Staff): void {
    if (this.togglingId !== null) return;
    this.togglingId = s.id;
    this.api.updateStaff(s.id, { ...s, isActive: true } as any).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Staff "${s.fullName}" can log in again.`, 'success', 4000, { title: 'Staff activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate "${s.fullName}". Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }
}
