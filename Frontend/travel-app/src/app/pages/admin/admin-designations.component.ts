import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Department, Designation } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-designations',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Designations</h2>
      <button *ngIf="auth.hasPermission('designations.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add designation</button>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate designation?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This designation will be hidden from staff dropdowns:</p>
            <p class="fw-bold mb-0">{{ deleteTarget.name }} ({{ deleteTarget.departmentName }})</p>
            <p class="text-muted small mt-2 mb-0">You can reactivate it at any time.</p>
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
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ editingId ? 'Edit designation' : 'New designation' }}</h5>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body" #modalBody>
              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="formError">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ formError }}</div>
                <button type="button" class="btn-close ms-2" (click)="formError = ''"></button>
              </div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Department <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="departmentId" [class.is-invalid]="isInvalid(form.get('departmentId'))">
                    <option value="">— Select department —</option>
                    <option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('departmentId'))">Department is required.</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Designation name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="name" placeholder="e.g. Tour Guide" [class.is-invalid]="isInvalid(form.get('name'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('name'))">Designation name is required.</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()"><i class="bi bi-x-lg me-1"></i>Cancel</button>
              <button class="btn btn-primary" [disabled]="form.invalid"><i class="bi bi-check2-circle me-1"></i>Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label small text-muted mb-1">Search designation</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterName" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Department</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterDeptId" (ngModelChange)="onFilterChange()">
            <option value="">All departments</option>
            <option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary btn-sm w-100" (click)="clearFilters()" [disabled]="!filtersApplied()"><i class="bi bi-x-lg"></i></button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('name')">Designation <i class="bi" [ngClass]="sortIcon('name')"></i></th>
              <th class="sortable" (click)="toggleSort('dept')">Department <i class="bi" [ngClass]="sortIcon('dept')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of pagedItems()">
              <td><strong>{{ d.name }}</strong></td>
              <td>{{ d.departmentName }}</td>
              <td><span class="badge" [class.bg-success]="d.isActive" [class.bg-secondary]="!d.isActive">{{ d.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button *ngIf="auth.hasPermission('designations.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(d)"><i class="bi bi-pencil me-1"></i>Edit</button>
                  <button *ngIf="d.isActive && auth.hasPermission('designations.toggle')" class="btn btn-sm btn-outline-danger" (click)="remove(d)" [disabled]="togglingId === d.id">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!d.isActive && auth.hasPermission('designations.toggle')" class="btn btn-sm btn-outline-success" (click)="activate(d)" [disabled]="togglingId === d.id">
                    <span *ngIf="togglingId === d.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== d.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredItems().length === 0">
              <td colspan="4" class="text-center text-muted py-3">{{ items.length === 0 ? 'No designations yet.' : 'No designations match the filters.' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div *ngIf="filteredItems().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredItems().length }}</small>
        <nav><ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="page === 1"><button class="page-link" (click)="setPage(page - 1)"><i class="bi bi-chevron-left"></i></button></li>
          <li class="page-item" *ngFor="let p of pageNumbers()" [class.active]="p === page"><button class="page-link" (click)="setPage(p)">{{ p }}</button></li>
          <li class="page-item" [class.disabled]="page === totalPages()"><button class="page-link" (click)="setPage(page + 1)"><i class="bi bi-chevron-right"></i></button></li>
        </ul></nav>
      </div>
    </div>
  `
})
export class AdminDesignationsComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Designation[] = [];
  departments: Department[] = [];
  editingId: number | null = null;
  formError = '';
  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;
  deleteTarget: Designation | null = null;
  deleting = false;
  togglingId: number | null = null;
  filterName = '';
  filterDeptId: number | string = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  sortKey: 'name' | 'dept' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    departmentId: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.api.listDepartments(true).subscribe({ next: ds => this.departments = ds });
    this.load();
  }
  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.deleteTarget) { this.cancelDelete(); return; }
    if (this.editingId !== null) this.cancel();
  }

  private lockBody(): void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }

  load(): void { this.api.listDesignations().subscribe({ next: ds => { this.items = ds; this.clampPage(); } }); }

  isInvalid(ctrl: AbstractControl | null): boolean { return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty); }

  filteredItems(): Designation[] {
    const q = this.filterName.trim().toLowerCase();
    const did = this.filterDeptId ? +this.filterDeptId : null;
    let list = this.items.filter(d => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (did && d.departmentId !== did) return false;
      if (this.filterStatus === 'active' && !d.isActive) return false;
      if (this.filterStatus === 'inactive' && d.isActive) return false;
      return true;
    });
    if (this.sortKey) {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const av = this.sortKey === 'name' ? a.name : this.sortKey === 'dept' ? a.departmentName : (a.isActive ? 1 : 0);
        const bv = this.sortKey === 'name' ? b.name : this.sortKey === 'dept' ? b.departmentName : (b.isActive ? 1 : 0);
        return typeof av === 'number' ? ((av as number) - (bv as number)) * dir : (av as string).localeCompare(bv as string) * dir;
      });
    }
    return list;
  }

  toggleSort(key: 'name' | 'dept' | 'status'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }
  sortIcon(key: string): string { if (this.sortKey !== key) return 'bi-arrow-down-up text-muted'; return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'; }
  filtersApplied(): boolean { return !!this.filterName || !!this.filterDeptId || this.filterStatus !== 'all'; }
  onFilterChange(): void { this.page = 1; }
  clearFilters(): void { this.filterName = ''; this.filterDeptId = ''; this.filterStatus = 'all'; this.page = 1; }
  totalPages(): number { return Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)); }
  pagedItems(): Designation[] { const s = (this.page - 1) * this.pageSize; return this.filteredItems().slice(s, s + this.pageSize); }
  pageStart(): number { return this.filteredItems().length === 0 ? 0 : (this.page - 1) * this.pageSize + 1; }
  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredItems().length); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }
  setPage(p: number): void { if (p >= 1 && p <= this.totalPages()) this.page = p; }
  private clampPage(): void { const t = this.totalPages(); if (this.page > t) this.page = t; if (this.page < 1) this.page = 1; }

  startCreate(): void { this.editingId = 0; this.formError = ''; this.form.reset({ name: '', departmentId: 0 }); this.lockBody(); }
  edit(d: Designation): void { this.editingId = d.id; this.formError = ''; this.form.reset({ name: d.name, departmentId: d.departmentId }); this.lockBody(); }
  cancel(): void { this.editingId = null; this.formError = ''; this.unlockBody(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const op = this.editingId ? this.api.updateDesignation(this.editingId, v) : this.api.createDesignation(v);
    op.subscribe({
      next: () => { this.toast.show(this.editingId ? 'Designation updated.' : 'Designation added.', 'success', 3000); this.cancel(); this.load(); },
      error: (err: any) => { this.formError = err?.error?.message || 'Could not save. Please try again.'; }
    });
  }

  remove(d: Designation): void { this.deleteTarget = d; this.lockBody(); }
  cancelDelete(): void { if (!this.deleting) { this.deleteTarget = null; this.unlockBody(); } }

  confirmDelete(): void {
    const d = this.deleteTarget;
    if (!d || this.deleting) return;
    this.deleting = true;
    this.api.setDesignationActive(d.id, false).subscribe({
      next: () => { this.deleting = false; this.deleteTarget = null; this.unlockBody(); this.toast.show(`"${d.name}" deactivated.`, 'info', 3000); this.load(); },
      error: () => { this.deleting = false; this.toast.show('Could not deactivate. Please try again.', 'danger', 3000); }
    });
  }

  activate(d: Designation): void {
    if (this.togglingId !== null) return;
    this.togglingId = d.id;
    this.api.setDesignationActive(d.id, true).subscribe({
      next: () => { this.togglingId = null; this.toast.show(`"${d.name}" activated.`, 'success', 3000); this.load(); },
      error: () => { this.togglingId = null; this.toast.show('Could not activate. Please try again.', 'danger', 3000); }
    });
  }
}
