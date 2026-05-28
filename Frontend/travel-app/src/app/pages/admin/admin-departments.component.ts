import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmModalService } from '../../core/services/confirm-modal.service';
import { Department } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-departments',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Departments</h2>
      <button *ngIf="auth.hasPermission('departments.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add department</button>
    </div>

    <!-- Add/Edit modal -->
    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ editingId ? 'Edit department' : 'New department' }}</h5>
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
                  <label class="form-label">Department name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="name" placeholder="e.g. Operations" [class.is-invalid]="isInvalid(form.get('name'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('name'))">Department name is required.</div>
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
        <div class="col-md-7">
          <label class="form-label small text-muted mb-1">Search department</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterName" (ngModelChange)="onFilterChange()" />
          </div>
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
              <th class="sortable" (click)="toggleSort('name')">Department <i class="bi" [ngClass]="sortIcon('name')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of pagedItems()">
              <td><strong>{{ d.name }}</strong></td>
              <td><span class="badge" [class.bg-success]="d.isActive" [class.bg-secondary]="!d.isActive">{{ d.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button *ngIf="auth.hasPermission('departments.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(d)"><i class="bi bi-pencil me-1"></i>Edit</button>
                  <button *ngIf="d.isActive && auth.hasPermission('departments.toggle')" class="btn btn-sm btn-outline-danger" (click)="remove(d)" [disabled]="deletingId === d.id">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!d.isActive && auth.hasPermission('departments.toggle')" class="btn btn-sm btn-outline-success" (click)="activate(d)" [disabled]="togglingId === d.id">
                    <span *ngIf="togglingId === d.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== d.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                  <button *ngIf="auth.hasPermission('departments.delete')" class="btn btn-sm btn-danger" (click)="permanentDelete(d)" [disabled]="permanentDeletingId === d.id" title="Permanently delete this record">
                    <span *ngIf="permanentDeletingId === d.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="permanentDeletingId !== d.id" class="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredItems().length === 0">
              <td colspan="3" class="text-center text-muted py-3">{{ items.length === 0 ? 'No departments yet.' : 'No departments match the filters.' }}</td>
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
export class AdminDepartmentsComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirmModal = inject(ConfirmModalService);

  items: Department[] = [];
  editingId: number | null = null;
  formError = '';
  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;
  deletingId: number | null = null;
  togglingId: number | null = null;
  permanentDeletingId: number | null = null;
  filterName = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  sortKey: 'name' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]]
  });

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.editingId !== null) this.cancel();
  }

  private lockBody(): void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }

  load(): void { this.api.listDepartments().subscribe({ next: ds => { this.items = ds; this.clampPage(); } }); }

  isInvalid(ctrl: AbstractControl | null): boolean { return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty); }

  filteredItems(): Department[] {
    const q = this.filterName.trim().toLowerCase();
    let list = this.items.filter(d => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (this.filterStatus === 'active' && !d.isActive) return false;
      if (this.filterStatus === 'inactive' && d.isActive) return false;
      return true;
    });
    if (this.sortKey) {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const av = this.sortKey === 'name' ? a.name : (a.isActive ? 1 : 0);
        const bv = this.sortKey === 'name' ? b.name : (b.isActive ? 1 : 0);
        return typeof av === 'number' ? ((av as number) - (bv as number)) * dir : (av as string).localeCompare(bv as string) * dir;
      });
    }
    return list;
  }

  toggleSort(key: 'name' | 'status'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }
  sortIcon(key: string): string { if (this.sortKey !== key) return 'bi-arrow-down-up text-muted'; return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'; }
  filtersApplied(): boolean { return !!this.filterName || this.filterStatus !== 'all'; }
  onFilterChange(): void { this.page = 1; }
  clearFilters(): void { this.filterName = ''; this.filterStatus = 'all'; this.page = 1; }
  totalPages(): number { return Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)); }
  pagedItems(): Department[] { const s = (this.page - 1) * this.pageSize; return this.filteredItems().slice(s, s + this.pageSize); }
  pageStart(): number { return this.filteredItems().length === 0 ? 0 : (this.page - 1) * this.pageSize + 1; }
  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredItems().length); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }
  setPage(p: number): void { if (p >= 1 && p <= this.totalPages()) this.page = p; }
  private clampPage(): void { const t = this.totalPages(); if (this.page > t) this.page = t; if (this.page < 1) this.page = 1; }

  startCreate(): void { this.editingId = 0; this.formError = ''; this.form.reset({ name: '' }); this.lockBody(); }
  edit(d: Department): void { this.editingId = d.id; this.formError = ''; this.form.reset({ name: d.name }); this.lockBody(); }
  cancel(): void { this.editingId = null; this.formError = ''; this.unlockBody(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const op = this.editingId ? this.api.updateDepartment(this.editingId, v) : this.api.createDepartment(v);
    op.subscribe({
      next: () => { this.toast.show(this.editingId ? 'Department updated.' : 'Department added.', 'success', 3000); this.cancel(); this.load(); },
      error: (err: any) => { this.formError = err?.error?.message || 'Could not save. Please try again.'; }
    });
  }

  async remove(d: Department): Promise<void> {
    const ok = await this.confirmModal.confirm({
      title: 'Deactivate Department',
      message: `Deactivate "${d.name}"?`,
      detail: 'This department will be hidden from staff dropdowns. You can reactivate it at any time.',
    });
    if (!ok) return;
    this.deletingId = d.id;
    this.api.setDepartmentActive(d.id, false).subscribe({
      next: () => {
        this.deletingId = null;
        this.toast.show(`"${d.name}" deactivated.`, 'info', 3000, { title: 'Deactivated' });
        this.load();
      },
      error: (err: any) => {
        this.deletingId = null;
        const msg = err?.error?.message || 'Could not deactivate. Please try again.';
        this.toast.show(msg, 'danger', 5000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(d: Department): void {
    if (this.togglingId !== null) return;
    this.togglingId = d.id;
    this.api.setDepartmentActive(d.id, true).subscribe({
      next: () => { this.togglingId = null; this.toast.show(`"${d.name}" activated.`, 'success', 3000); this.load(); },
      error: () => { this.togglingId = null; this.toast.show('Could not activate. Please try again.', 'danger', 3000); }
    });
  }

  async permanentDelete(d: Department): Promise<void> {
    const ok = await this.confirmModal.confirm({
      title: 'Permanently delete department?',
      message: `Delete "${d.name}" permanently?`,
      detail: 'This will permanently remove the department from the database. This action cannot be undone.',
    });
    if (!ok) return;
    this.permanentDeletingId = d.id;
    this.api.deleteDepartment(d.id).subscribe({
      next: () => {
        this.permanentDeletingId = null;
        this.toast.show(`"${d.name}" permanently deleted.`, 'success', 4000, { title: 'Deleted' });
        this.load();
      },
      error: (err: any) => {
        this.permanentDeletingId = null;
        this.toast.show(err?.error?.message || `Could not delete "${d.name}". Please try again.`, 'danger', 4000, { title: 'Delete failed' });
      }
    });
  }
}
