import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Vehicle } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-vehicles',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Vehicles</h2>
      <button *ngIf="auth.hasPermission('vehicles.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add vehicle</button>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onDeleteBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate vehicle?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This vehicle will be hidden from booking and allocation lists:</p>
            <p class="fw-bold mb-2">"{{ deleteTarget.name }}" — {{ deleteTarget.registrationNumber }}</p>
            <p class="text-muted small mb-0">It stays in fleet records and can be reactivated at any time. Existing allocations are not affected.</p>
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
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Vehicle details' : (editingId ? 'Edit vehicle' : 'New vehicle') }}</h5>
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
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="name" [class.is-invalid]="isInvalid(form.get('name'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('name'))">Name is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Registration # <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="registrationNumber" [class.is-invalid]="isInvalid(form.get('registrationNumber'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('registrationNumber'))">Registration number is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Type <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="type">
                    <option *ngFor="let t of types" [value]="t">{{ t }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Capacity <span class="text-danger">*</span></label>
                  <input type="number" min="1" class="form-control" formControlName="capacity" [class.is-invalid]="isInvalid(form.get('capacity'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('capacity'))">At least 1 seat.</div>
                </div>
                <div class="col-md-3"><label class="form-label">Make</label><input class="form-control" formControlName="make" /></div>
                <div class="col-md-3"><label class="form-label">Model</label><input class="form-control" formControlName="model" /></div>
                <div class="col-md-3"><label class="form-label">Year</label><input type="number" min="1990" class="form-control" formControlName="year" /></div>
                <div class="col-md-4">
                  <label class="form-label">Cost / day (₹) <span class="text-danger">*</span></label>
                  <input type="number" min="0" class="form-control" formControlName="costPerDay" [class.is-invalid]="isInvalid(form.get('costPerDay'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('costPerDay'))">Cost is required.</div>
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <div class="form-check ms-2">
                    <input class="form-check-input" type="checkbox" formControlName="isAvailable" id="vavail" />
                    <label class="form-check-label" for="vavail">Available for booking</label>
                  </div>
                </div>
                <div class="col-12"><label class="form-label">Notes</label><input class="form-control" formControlName="notes" /></div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">
                <i class="bi bi-x-lg me-1"></i>{{ viewMode ? 'Close' : 'Cancel' }}
              </button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save vehicle'">
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
          <label class="form-label small text-muted mb-1">Search name, registration or make/model</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Type</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterType" (ngModelChange)="onFilterChange()">
            <option value="">All types</option>
            <option *ngFor="let t of types" [value]="t">{{ t }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="unavailable">In service</option>
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
              <th class="sortable" (click)="toggleSort('reg')">Reg # <i class="bi" [ngClass]="sortIcon('reg')"></i></th>
              <th class="sortable" (click)="toggleSort('type')">Type <i class="bi" [ngClass]="sortIcon('type')"></i></th>
              <th class="sortable" (click)="toggleSort('capacity')">Capacity <i class="bi" [ngClass]="sortIcon('capacity')"></i></th>
              <th class="sortable" (click)="toggleSort('cost')">Cost/day <i class="bi" [ngClass]="sortIcon('cost')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of pagedVehicles()">
              <td><strong>{{ v.name }}</strong><br><small class="text-muted">{{ v.make }} {{ v.model }} {{ v.year }}</small></td>
              <td><code>{{ v.registrationNumber }}</code></td>
              <td>{{ v.type }}</td>
              <td>{{ v.capacity }}</td>
              <td>₹ {{ v.costPerDay | number:'1.0-0' }}</td>
              <td>
                <span *ngIf="!v.isActive" class="badge bg-secondary">Hidden</span>
                <span *ngIf="v.isActive" class="badge" [class.bg-success]="v.isAvailable" [class.bg-warning]="!v.isAvailable">{{ v.isAvailable ? 'Available' : 'In service' }}</span>
              </td>
              <td class="text-end">
                <button *ngIf="auth.hasPermission('vehicles.edit')" class="btn btn-sm btn-outline-primary me-1" (click)="edit(v)" [disabled]="!v.isActive">Edit</button>
                <button *ngIf="v.isActive && v.isAvailable && auth.hasPermission('vehicles.edit')" class="btn btn-sm btn-outline-warning me-1" (click)="toggleAvailable(v, false)" [disabled]="togglingId === v.id" title="Mark this vehicle as in service">
                  <span *ngIf="togglingId === v.id" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="togglingId !== v.id" class="bi bi-eye-slash me-1"></i>Mark in service
                </button>
                <button *ngIf="v.isActive && !v.isAvailable && auth.hasPermission('vehicles.edit')" class="btn btn-sm btn-outline-success me-1" (click)="toggleAvailable(v, true)" [disabled]="togglingId === v.id" title="Make this vehicle available for booking">
                  <span *ngIf="togglingId === v.id" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="togglingId !== v.id" class="bi bi-check2-circle me-1"></i>Mark available
                </button>
                <button *ngIf="v.isActive && auth.hasPermission('vehicles.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(v)" [disabled]="deleting && deleteTarget?.id === v.id" title="Hide this vehicle from the fleet">
                  <i class="bi bi-eye-slash me-1"></i>Deactivate
                </button>
                <button *ngIf="!v.isActive && auth.hasPermission('vehicles.delete')" class="btn btn-sm btn-outline-success" (click)="activate(v)" [disabled]="togglingId === v.id" title="Bring this vehicle back into the fleet">
                  <span *ngIf="togglingId === v.id" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="togglingId !== v.id" class="bi bi-check2-circle me-1"></i>Activate
                </button>
                <button *ngIf="!auth.hasPermission('vehicles.edit') && !auth.hasPermission('vehicles.delete')" class="btn btn-sm btn-outline-primary" (click)="view(v)" title="View vehicle details">
                  <i class="bi bi-eye me-1"></i>View
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredVehicles().length === 0"><td colspan="7" class="text-center text-muted py-3">{{ items.length === 0 ? 'No vehicles yet.' : 'No vehicles match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredVehicles().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredVehicles().length }}</small>
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
export class AdminVehiclesComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Vehicle[] = [];
  editingId: number | null = null;
  viewMode = false;
  formError = '';
  types = ['Car', 'SUV', 'MiniBus', 'Bus', 'Tempo', 'Other'];

  deleteTarget: Vehicle | null = null;
  deleting = false;
  togglingId: number | null = null;

  filterText = '';
  filterType = '';
  filterStatus: 'all' | 'available' | 'unavailable' | 'hidden' = 'all';

  sortKey: 'name' | 'reg' | 'type' | 'capacity' | 'cost' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    name: ['', Validators.required],
    registrationNumber: ['', Validators.required],
    type: ['Car'],
    capacity: [4, [Validators.required, Validators.min(1)]],
    make: [''],
    model: [''],
    year: [2024],
    costPerDay: [2500, [Validators.required, Validators.min(0)]],
    isAvailable: [true],
    notes: ['']
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
    this.api.listVehicles().subscribe({
      next: vs => {
        this.items = vs;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  filteredVehicles(): Vehicle[] {
    const q = this.filterText.trim().toLowerCase();
    const filtered = this.items.filter(v => {
      if (q && !((v.name || '').toLowerCase().includes(q)
              || (v.registrationNumber || '').toLowerCase().includes(q)
              || (v.make || '').toLowerCase().includes(q)
              || (v.model || '').toLowerCase().includes(q))) return false;
      if (this.filterType && v.type !== this.filterType) return false;
      if (this.filterStatus === 'available' && !(v.isActive && v.isAvailable)) return false;
      if (this.filterStatus === 'unavailable' && !(v.isActive && !v.isAvailable)) return false;
      if (this.filterStatus === 'hidden' && v.isActive) return false;
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

  private sortValue(v: Vehicle): string | number | null {
    switch (this.sortKey) {
      case 'name': return v.name;
      case 'reg': return v.registrationNumber;
      case 'type': return v.type;
      case 'capacity': return v.capacity;
      case 'cost': return v.costPerDay ?? 0;
      case 'status': return v.isAvailable ? 1 : 0;
      default: return null;
    }
  }

  toggleSort(key: 'name' | 'reg' | 'type' | 'capacity' | 'cost' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'reg' | 'type' | 'capacity' | 'cost' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterText || !!this.filterType || this.filterStatus !== 'all';
  }

  onFilterChange(): void { this.page = 1; }

  clearFilters(): void {
    this.filterText = '';
    this.filterType = '';
    this.filterStatus = 'all';
    this.page = 1;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredVehicles().length / this.pageSize)); }

  pagedVehicles(): Vehicle[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredVehicles().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    if (this.filteredVehicles().length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredVehicles().length); }

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
    this.form.reset({ name: '', registrationNumber: '', type: 'Car', capacity: 4, make: '', model: '', year: 2024, costPerDay: 2500, isAvailable: true, notes: '' });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  edit(v: Vehicle): void {
    this.editingId = v.id;
    this.viewMode = false;
    this.formError = '';
    this.form.reset({ ...v } as any);
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  view(v: Vehicle): void {
    this.editingId = v.id;
    this.viewMode = true;
    this.formError = '';
    this.form.reset({ ...v } as any);
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
    const label = `"${v.name}" — ${v.registrationNumber}`;
    const op = this.editingId ? this.api.updateVehicle(this.editingId, v) : this.api.createVehicle(v);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Vehicle ${label} updated.` : `New vehicle ${label} added.`,
          'success', 4000, { title: this.editingId ? 'Vehicle updated' : 'Vehicle created' }
        );
        this.editingId = null;
        this.unlockBody();
        this.load();
      },
      error: (err: any) => { this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.'; setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0); }
    });
  }

  toggleAvailable(v: Vehicle, available: boolean): void {
    if (this.togglingId !== null) return;
    this.togglingId = v.id;
    this.api.updateVehicle(v.id, { ...v, isAvailable: available } as any).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(
          available ? `Vehicle "${v.name}" is now available for booking.` : `Vehicle "${v.name}" is now marked in service.`,
          available ? 'success' : 'info', 4000, { title: available ? 'Vehicle available' : 'Vehicle in service' }
        );
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not update "${v.name}". Please try again.`, 'danger', 4000, { title: 'Update failed' });
      }
    });
  }

  remove(v: Vehicle): void {
    this.deleteTarget = v;
    this.lockBody();
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (this.editingId === null) this.unlockBody();
  }

  confirmDelete(): void {
    const v = this.deleteTarget;
    if (!v || this.deleting) return;
    this.deleting = true;
    this.api.setVehicleActive(v.id, false).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (this.editingId === null) this.unlockBody();
        this.toast.show(`Vehicle "${v.name}" has been hidden from the fleet.`, 'info', 4000, { title: 'Vehicle deactivated' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not deactivate "${v.name}". Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(v: Vehicle): void {
    if (this.togglingId !== null) return;
    this.togglingId = v.id;
    this.api.setVehicleActive(v.id, true).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Vehicle "${v.name}" is back in the fleet.`, 'success', 4000, { title: 'Vehicle activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate "${v.name}". Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }
}
