import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking, Driver, Staff, Vehicle, VehicleAllocation } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-allocations',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Vehicle, Staff &amp; Driver Allocations</h2>
      <button *ngIf="auth.hasPermission('allocations.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>New allocation</button>
    </div>

    <!-- Delete confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-trash me-2"></i>Remove allocation?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This will release the vehicle for these dates:</p>
            <p class="fw-bold mb-2">"{{ deleteTarget.vehicleName }}"</p>
            <p class="text-muted small mb-0">From <strong>{{ deleteTarget.startDate | date:'mediumDate' }}</strong> to <strong>{{ deleteTarget.endDate | date:'mediumDate' }}</strong>. The booking itself is not affected.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="cancelDelete()" [disabled]="deleting"><i class="bi bi-x-lg me-1"></i>Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              <span *ngIf="deleting" class="spinner-border spinner-border-sm me-2"></span>
              {{ deleting ? 'Removing…' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New / Edit allocation modal -->
    <div *ngIf="creating" class="modal-backdrop fade show"></div>
    <div *ngIf="creating" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Allocation details' : (editingId ? 'Edit allocation' : 'New allocation') }}</h5>
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
                  <label class="form-label">Vehicle <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="vehicleId" [class.is-invalid]="isInvalid(form.get('vehicleId'))">
                    <option [ngValue]="0">— Select —</option>
                    <option *ngFor="let v of activeVehicles()" [ngValue]="v.id">{{ v.name }} ({{ v.capacity }} seats)</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('vehicleId'))">Vehicle is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Driver <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="driverId" [class.is-invalid]="isInvalid(form.get('driverId'))">
                    <option [ngValue]="null">— Select —</option>
                    <option *ngFor="let d of activeDrivers()" [ngValue]="d.id">{{ d.fullName }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('driverId'))">Driver is required.</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Staff (tour team) <span class="text-danger">*</span></label>
                  <div class="border rounded p-2" [class.border-danger]="staffInvalid()">
                    <div *ngIf="activeStaff().length === 0" class="text-muted small">No active staff available.</div>
                    <div class="d-flex flex-wrap gap-3">
                      <div class="form-check" *ngFor="let s of activeStaff()">
                        <input class="form-check-input" type="checkbox"
                               [id]="'staff-' + s.id"
                               [checked]="isStaffSelected(s.id)"
                               (change)="toggleStaff(s.id)" />
                        <label class="form-check-label" [attr.for]="'staff-' + s.id">
                          {{ s.fullName }}<span *ngIf="s.designation" class="text-muted small"> — {{ s.designation }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="text-danger small mt-1" *ngIf="staffInvalid()">Select at least one staff member.</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Booking <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="bookingId" [class.is-invalid]="isInvalid(form.get('bookingId'))">
                    <option [ngValue]="null">— Select —</option>
                    <option *ngFor="let b of bookings" [ngValue]="b.id">{{ b.bookingReference }} — {{ b.tourName }} ({{ b.customerName }})</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('bookingId'))">Booking is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">From <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" formControlName="startDate" [class.is-invalid]="isInvalid(form.get('startDate'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('startDate'))">Start date is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">To <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" formControlName="endDate" [class.is-invalid]="isInvalid(form.get('endDate'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('endDate'))">End date is required.</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Notes</label>
                  <input class="form-control" formControlName="notes" placeholder="Optional remarks" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">
                <i class="bi bi-x-lg me-1"></i>{{ viewMode ? 'Close' : 'Cancel' }}
              </button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save allocation'">
                <i class="bi bi-check2-circle me-1"></i>{{ editingId ? 'Save changes' : 'Allocate' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label small text-muted mb-1">Search vehicle, driver or booking</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Vehicle</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterVehicleId" (ngModelChange)="onFilterChange()">
            <option [ngValue]="0">All vehicles</option>
            <option *ngFor="let v of vehicles" [ngValue]="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted mb-1">From</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="filterFrom" (ngModelChange)="onFilterChange()" />
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted mb-1">To</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="filterTo" (ngModelChange)="onFilterChange()" />
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
              <th class="sortable" (click)="toggleSort('vehicle')">Vehicle <i class="bi" [ngClass]="sortIcon('vehicle')"></i></th>
              <th class="sortable" (click)="toggleSort('driver')">Driver <i class="bi" [ngClass]="sortIcon('driver')"></i></th>
              <th class="sortable" (click)="toggleSort('staff')">Staff <i class="bi" [ngClass]="sortIcon('staff')"></i></th>
              <th class="sortable" (click)="toggleSort('booking')">Booking <i class="bi" [ngClass]="sortIcon('booking')"></i></th>
              <th class="sortable" (click)="toggleSort('start')">Period <i class="bi" [ngClass]="sortIcon('start')"></i></th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of pagedAllocations()">
              <td><strong>{{ a.vehicleName }}</strong></td>
              <td>{{ a.driverName || '—' }}</td>
              <td>{{ (a.staffNames && a.staffNames.length) ? a.staffNames.join(', ') : '—' }}</td>
              <td><code *ngIf="a.bookingReference">{{ a.bookingReference }}</code><span *ngIf="!a.bookingReference">—</span></td>
              <td>{{ a.startDate | date:'mediumDate' }} → {{ a.endDate | date:'mediumDate' }}</td>
              <td>{{ a.notes }}</td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(a)" title="View allocation details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="auth.hasPermission('allocations.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(a)">Edit</button>
                  <button *ngIf="auth.hasPermission('allocations.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(a)" [disabled]="deleting && deleteTarget?.id === a.id" title="Remove this allocation">
                    <i class="bi bi-trash me-1"></i>Remove
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredAllocations().length === 0"><td colspan="7" class="text-center text-muted py-3">{{ items.length === 0 ? 'No allocations yet.' : 'No allocations match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredAllocations().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredAllocations().length }}</small>
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
export class AdminAllocationsComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: VehicleAllocation[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  staff: Staff[] = [];
  bookings: Booking[] = [];
  creating = false;
  editingId: number | null = null;
  viewMode = false;
  formError = '';

  deleteTarget: VehicleAllocation | null = null;
  deleting = false;

  filterText = '';
  filterVehicleId = 0;
  filterFrom = '';
  filterTo = '';

  sortKey: 'vehicle' | 'driver' | 'staff' | 'booking' | 'start' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    vehicleId: [0, [Validators.required, Validators.min(1)]],
    driverId: [null as number | null, Validators.required],
    bookingId: [null as number | null, Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    notes: ['']
  });

  selectedStaffIds: number[] = [];
  staffTouched = false;

  isStaffSelected(id: number): boolean { return this.selectedStaffIds.includes(id); }
  toggleStaff(id: number): void {
    this.staffTouched = true;
    this.selectedStaffIds = this.selectedStaffIds.includes(id)
      ? this.selectedStaffIds.filter(x => x !== id)
      : [...this.selectedStaffIds, id];
  }
  staffInvalid(): boolean { return this.staffTouched && this.selectedStaffIds.length === 0; }

  ngOnInit(): void {
    this.api.listVehicles().subscribe({ next: vs => this.vehicles = vs });
    this.api.listDrivers().subscribe({ next: ds => this.drivers = ds });
    this.api.listStaff().subscribe({ next: ss => this.staff = ss });
    this.api.listBookings().subscribe({
      next: bs => this.bookings = bs.filter(b => b.status !== 'Cancelled' && b.status !== 'Completed' && b.status !== 'Refunded')
    });
    this.load();
  }
  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.deleteTarget) { this.cancelDelete(); return; }
    if (this.creating) this.cancel();
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
    this.api.listAllocations().subscribe({
      next: as => {
        this.items = as;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  activeVehicles(): Vehicle[] {
    return this.vehicles.filter(v => v.isActive !== false);
  }

  activeDrivers(): Driver[] {
    return this.drivers.filter(d => d.isActive !== false);
  }

  activeStaff(): Staff[] {
    return this.staff.filter(s => s.isActive !== false);
  }

  filteredAllocations(): VehicleAllocation[] {
    const q = this.filterText.trim().toLowerCase();
    const from = this.filterFrom ? new Date(this.filterFrom).getTime() : null;
    const to = this.filterTo ? new Date(this.filterTo).getTime() : null;
    const filtered = this.items.filter(a => {
      if (q && !((a.vehicleName || '').toLowerCase().includes(q)
              || (a.driverName || '').toLowerCase().includes(q)
              || (a.bookingReference || '').toLowerCase().includes(q)
              || (a.notes || '').toLowerCase().includes(q))) return false;
      if (this.filterVehicleId > 0 && a.vehicleId !== this.filterVehicleId) return false;
      if (from !== null && new Date(a.endDate).getTime() < from) return false;
      if (to !== null && new Date(a.startDate).getTime() > to) return false;
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

  private sortValue(a: VehicleAllocation): string | number | null {
    switch (this.sortKey) {
      case 'vehicle': return a.vehicleName;
      case 'driver': return a.driverName || '';
      case 'staff': return (a.staffNames || []).join(', ');
      case 'booking': return a.bookingReference || '';
      case 'start': return a.startDate ? new Date(a.startDate).getTime() : 0;
      default: return null;
    }
  }

  toggleSort(key: 'vehicle' | 'driver' | 'staff' | 'booking' | 'start'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'vehicle' | 'driver' | 'staff' | 'booking' | 'start'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterText || this.filterVehicleId > 0 || !!this.filterFrom || !!this.filterTo;
  }

  onFilterChange(): void { this.page = 1; }

  clearFilters(): void {
    this.filterText = '';
    this.filterVehicleId = 0;
    this.filterFrom = '';
    this.filterTo = '';
    this.page = 1;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredAllocations().length / this.pageSize)); }

  pagedAllocations(): VehicleAllocation[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredAllocations().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    if (this.filteredAllocations().length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredAllocations().length); }

  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
    scrollAdminContentTop();
  }

  startCreate(): void {
    this.editingId = null;
    this.viewMode = false;
    this.creating = true;
    this.formError = '';
    this.form.reset({ vehicleId: 0, driverId: null, bookingId: null, startDate: '', endDate: '', notes: '' });
    this.form.enable({ emitEvent: false });
    this.selectedStaffIds = [];
    this.staffTouched = false;
    this.lockBody();
  }

  edit(a: VehicleAllocation): void {
    this.editingId = a.id;
    this.viewMode = false;
    this.creating = true;
    this.formError = '';
    this.selectedStaffIds = [...(a.staffIds || [])];
    this.staffTouched = false;
    this.form.reset({
      vehicleId: a.vehicleId,
      driverId: a.driverId ?? null,
      bookingId: a.bookingId ?? null,
      startDate: (a.startDate || '').substring(0, 10),
      endDate: (a.endDate || '').substring(0, 10),
      notes: a.notes || ''
    });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  view(a: VehicleAllocation): void {
    this.editingId = a.id;
    this.viewMode = true;
    this.creating = true;
    this.formError = '';
    this.selectedStaffIds = [...(a.staffIds || [])];
    this.staffTouched = false;
    this.form.reset({
      vehicleId: a.vehicleId,
      driverId: a.driverId ?? null,
      bookingId: a.bookingId ?? null,
      startDate: (a.startDate || '').substring(0, 10),
      endDate: (a.endDate || '').substring(0, 10),
      notes: a.notes || ''
    });
    this.form.disable({ emitEvent: false });
    this.lockBody();
  }

  cancel(): void {
    this.creating = false;
    this.editingId = null;
    this.viewMode = false;
    this.formError = '';
    this.selectedStaffIds = [];
    this.staffTouched = false;
    this.form.enable({ emitEvent: false });
    this.unlockBody();
  }

  save(): void {
    this.staffTouched = true;
    if (this.form.invalid || this.selectedStaffIds.length === 0) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const v = { ...this.form.getRawValue(), staffIds: [...this.selectedStaffIds] };
    const vehicleName = this.vehicles.find(x => x.id === v.vehicleId)?.name || 'vehicle';
    const op = this.editingId
      ? this.api.updateAllocation(this.editingId, v)
      : this.api.allocateVehicle(v);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId
            ? `Allocation for "${vehicleName}" updated.`
            : `"${vehicleName}" allocated from ${v.startDate} to ${v.endDate}.`,
          'success', 4000,
          { title: this.editingId ? 'Allocation updated' : 'Vehicle allocated' }
        );
        this.creating = false;
        this.editingId = null;
        this.unlockBody();
        this.load();
      },
      error: (err: any) => {
        const apiMsg: string | undefined = err?.error?.message || err?.error?.errors?.[0];
        this.formError = apiMsg || 'Could not save. Please try again.';
        setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
        this.toast.show(
          apiMsg || (this.editingId ? `Could not update allocation. Please try again.` : `Could not allocate "${vehicleName}". Please try again.`),
          'danger', 4000,
          { title: this.editingId ? 'Update failed' : 'Allocation failed' }
        );
      }
    });
  }

  remove(a: VehicleAllocation): void {
    this.deleteTarget = a;
    this.lockBody();
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (!this.creating) this.unlockBody();
  }

  confirmDelete(): void {
    const a = this.deleteTarget;
    if (!a || this.deleting) return;
    this.deleting = true;
    this.api.deleteAllocation(a.id).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (!this.creating) this.unlockBody();
        this.toast.show(`Allocation for "${a.vehicleName}" has been removed.`, 'info', 4000, { title: 'Allocation removed' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not remove allocation. Please try again.`, 'danger', 4000, { title: 'Remove failed' });
      }
    });
  }
}
