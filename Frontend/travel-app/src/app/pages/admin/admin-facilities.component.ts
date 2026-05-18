import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Facility } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-facilities',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Facilities</h2>
      <button *ngIf="auth.hasPermission('facilities.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add facility</button>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onDeleteBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate facility?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This facility will be hidden when adding packages:</p>
            <p class="fw-bold mb-2">"{{ deleteTarget.name }}" ({{ deleteTarget.type }})</p>
            <p class="text-muted small mb-0">It will stay in the database with status <strong>Hidden</strong> and you can activate it again anytime.</p>
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
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Facility details' : (editingId ? 'Edit facility' : 'New facility') }}</h5>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body" #modalBody>
              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="formError">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ formError }}</div>
                <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="formError = ''"></button>
              </div>
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="name" placeholder="e.g. 3-Star Hotel Stay" [class.is-invalid]="isInvalid(form.get('name'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('name'))">Facility name is required.</div>
                </div>
                <div class="col-md-5">
                  <label class="form-label">Type <span class="text-danger">*</span></label>
                  <app-select [options]="typeOptions" formControlName="type" [invalid]="isInvalid(form.get('type'))"></app-select>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('type'))">Type is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cost (₹) <span class="text-danger">*</span></label>
                  <input type="number" min="0" class="form-control" formControlName="cost" [class.is-invalid]="isInvalid(form.get('cost'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('cost'))">Cost is required (0 or more).</div>
                </div>
                <div class="col-md-6 d-flex align-items-end">
                  <div class="form-check"><input class="form-check-input" type="checkbox" formControlName="isActive" id="fa" /><label class="form-check-label" for="fa">Active</label></div>
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <input class="form-control" formControlName="description" placeholder="Short description shown to admins" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">
                <i class="bi bi-x-lg me-1"></i>{{ viewMode ? 'Close' : 'Cancel' }}
              </button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save facility'">
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
          <label class="form-label small text-muted mb-1">Search facility name</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterName" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Type</label>
          <app-select size="sm" [options]="typeFilterOptions" [(ngModel)]="filterType" (valueChange)="onFilterChange()"></app-select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <app-select size="sm" [options]="statusFilterOptions" [(ngModel)]="filterStatus" (valueChange)="onFilterStatusChange($event)"></app-select>
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
              <th class="sortable" (click)="toggleSort('type')">Type <i class="bi" [ngClass]="sortIcon('type')"></i></th>
              <th class="sortable" (click)="toggleSort('cost')">Cost <i class="bi" [ngClass]="sortIcon('cost')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let f of pagedItems()">
              <td><strong>{{ f.name }}</strong><br><small class="text-muted">{{ f.description }}</small></td>
              <td>{{ f.type }}</td>
              <td>₹ {{ f.cost | number:'1.2-2' }}</td>
              <td><span class="badge" [class.bg-success]="f.isActive" [class.bg-secondary]="!f.isActive">{{ f.isActive ? 'Active' : 'Hidden' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(f)" title="View facility details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="auth.hasPermission('facilities.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(f)">Edit</button>
                  <button *ngIf="f.isActive && auth.hasPermission('facilities.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(f)" [disabled]="togglingId === f.id" title="Hide this facility">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!f.isActive && auth.hasPermission('facilities.delete')" class="btn btn-sm btn-outline-success" (click)="activate(f)" [disabled]="togglingId === f.id" title="Make this facility available again">
                    <span *ngIf="togglingId === f.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== f.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredItems().length === 0">
              <td colspan="5" class="text-center text-muted py-3">{{ items.length === 0 ? 'No facilities yet.' : 'No facilities match the filters.' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredItems().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredItems().length }}</small>
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
export class AdminFacilitiesComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Facility[] = [];
  editingId: number | null = null;
  viewMode = false;
  formError = '';
  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;
  types = ['Breakfast', 'Lunch', 'Dinner', 'Hotel', 'Transportation', 'Guide', 'Other'];

  readonly typeOptions = this.types.map(t => ({ value: t, label: t }));
  readonly typeFilterOptions = [{ value: '', label: 'All types' }, ...this.typeOptions];
  readonly statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Hidden' }
  ];

  deleteTarget: Facility | null = null;
  deleting = false;
  togglingId: number | null = null;

  filterName = '';
  filterType = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  sortKey: 'name' | 'type' | 'cost' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    name: ['', Validators.required],
    type: ['Other', Validators.required],
    cost: [500, [Validators.required, Validators.min(0)]],
    description: [''],
    isActive: [true]
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
    this.api.listFacilities().subscribe({
      next: fs => {
        this.items = fs;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  filteredItems(): Facility[] {
    const q = this.filterName.trim().toLowerCase();
    const filtered = this.items.filter(f => {
      if (q && !f.name.toLowerCase().includes(q)) return false;
      if (this.filterType && f.type !== this.filterType) return false;
      if (this.filterStatus === 'active' && !f.isActive) return false;
      if (this.filterStatus === 'inactive' && f.isActive) return false;
      return true;
    });
    if (!this.sortKey) return filtered;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = this.sortValue(a);
      const bv = this.sortValue(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return av.toString().localeCompare(bv.toString()) * dir;
    });
  }

  private sortValue(f: Facility): string | number {
    switch (this.sortKey) {
      case 'name': return f.name;
      case 'type': return f.type;
      case 'cost': return f.cost;
      case 'status': return f.isActive ? 1 : 0;
      default: return '';
    }
  }

  toggleSort(key: 'name' | 'type' | 'cost' | 'status'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'type' | 'cost' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterName || !!this.filterType || this.filterStatus !== 'all';
  }
  onFilterChange(): void { this.page = 1; }
  onFilterStatusChange(v: string | number): void { this.filterStatus = v as 'all' | 'active' | 'inactive'; this.page = 1; }
  clearFilters(): void { this.filterName = ''; this.filterType = ''; this.filterStatus = 'all'; this.page = 1; }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)); }
  pagedItems(): Facility[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  }
  pageStart(): number { return this.filteredItems().length === 0 ? 0 : (this.page - 1) * this.pageSize + 1; }
  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredItems().length); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }
  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
  }

  startCreate(): void {
    this.editingId = 0;
    this.viewMode = false;
    this.formError = '';
    this.form.reset({ name: '', type: 'Other', cost: 500, description: '', isActive: true });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  edit(f: Facility): void {
    this.editingId = f.id;
    this.viewMode = false;
    this.formError = '';
    this.form.reset({ name: f.name, type: f.type, cost: f.cost, description: f.description || '', isActive: f.isActive });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  view(f: Facility): void {
    this.editingId = f.id;
    this.viewMode = true;
    this.formError = '';
    this.form.reset({ name: f.name, type: f.type, cost: f.cost, description: f.description || '', isActive: f.isActive });
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

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const v = this.form.getRawValue() as any;
    const label = `"${v.name}" (${v.type})`;
    const op = this.editingId ? this.api.updateFacility(this.editingId, v) : this.api.createFacility(v);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Facility ${label} details updated.` : `New facility ${label} added.`,
          'success', 4000, { title: this.editingId ? 'Facility updated' : 'Facility created' }
        );
        this.editingId = null;
        this.unlockBody();
        this.load();
      },
      error: (err: any) => {
        this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.';
        setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      }
    });
  }

  remove(f: Facility): void { this.deleteTarget = f; this.lockBody(); }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (this.editingId === null) this.unlockBody();
  }

  confirmDelete(): void {
    const f = this.deleteTarget;
    if (!f || this.deleting) return;
    this.deleting = true;
    this.api.updateFacility(f.id, { ...f, isActive: false } as any).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (this.editingId === null) this.unlockBody();
        this.toast.show(`Facility "${f.name}" (${f.type}) is now hidden from package builders.`, 'info', 4000, { title: 'Facility deactivated' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not deactivate "${f.name}". Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(f: Facility): void {
    if (this.togglingId !== null) return;
    this.togglingId = f.id;
    this.api.updateFacility(f.id, { ...f, isActive: true } as any).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Facility "${f.name}" (${f.type}) is now available again.`, 'success', 4000, { title: 'Facility activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate "${f.name}". Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }
}
