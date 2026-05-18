import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Tour, TourPackage, TourSchedule } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-schedules',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Trip Calendar</h2>
      <button *ngIf="auth.hasPermission('schedules.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Schedule new trip</button>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onDeleteBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Close this trip?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This scheduled trip will be closed and hidden from new bookings:</p>
            <p class="fw-bold mb-2">{{ deleteTarget.tourName }} — {{ deleteTarget.packageName }}</p>
            <p class="text-muted small mb-0">{{ deleteTarget.startDate | date:'mediumDate' }} → {{ deleteTarget.endDate | date:'mediumDate' }}. It will stay in the database with status <strong>Closed</strong> and you can reopen it anytime. Existing bookings are not affected.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="cancelDelete()" [disabled]="deleting"><i class="bi bi-x-lg me-1"></i>Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              <span *ngIf="deleting" class="spinner-border spinner-border-sm me-2"></span>
              {{ deleting ? 'Closing…' : 'Close trip' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit modal -->
    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog" (click)="onBackdropClick($event)">
      <div class="modal-dialog modal-lg modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Scheduled trip details' : (editingId ? 'Edit scheduled trip' : 'Schedule a tour') }}</h5>
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
                  <label class="form-label">Tour <span class="text-danger">*</span></label>
                  <app-select [options]="tourOptions()" formControlName="tourId" (valueChange)="onTourChange()" [invalid]="isInvalid(form.get('tourId'))"></app-select>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('tourId'))">Tour is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Package <span class="text-danger">*</span></label>
                  <app-select [options]="packageOptionsForSelectedTour()" formControlName="tourPackageId" (valueChange)="onPackageChange()" [invalid]="isInvalid(form.get('tourPackageId'))"></app-select>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('tourPackageId'))">Package is required.</div>
                  <small *ngIf="selectedPackage() as p" class="text-muted">Package capacity: {{ p.minPersons }}–{{ p.maxPersons }} persons.</small>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Start date <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" formControlName="startDate" [class.is-invalid]="isInvalid(form.get('startDate'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('startDate'))">Start date is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">End date <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" formControlName="endDate" [class.is-invalid]="isInvalid(form.get('endDate'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('endDate'))">End date is required.</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Total seats <span class="text-danger">*</span></label>
                  <input type="number" [min]="selectedPackage()?.minPersons ?? 1" [max]="selectedPackage()?.maxPersons ?? null" class="form-control" formControlName="availableSeats" [class.is-invalid]="isInvalid(form.get('availableSeats')) || seatsOutOfRange()" />
                  <div class="invalid-feedback d-block" *ngIf="seatsOutOfRange()">Must be between {{ selectedPackage()?.minPersons }} and {{ selectedPackage()?.maxPersons }} for this package.</div>
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('availableSeats')) && !seatsOutOfRange()">At least 1 seat.</div>
                  <small *ngIf="selectedPackage() as p" class="text-muted">Defaults to package max ({{ p.maxPersons }}). You can lower it for a smaller departure.</small>
                </div>
                <div class="col-12 form-check ms-2">
                  <input class="form-check-input" type="checkbox" formControlName="isActive" id="schActive" />
                  <label class="form-check-label" for="schActive">Open for bookings</label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">
                <i class="bi bi-x-lg me-1"></i>{{ viewMode ? 'Close' : 'Cancel' }}
              </button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid || seatsOutOfRange()" [title]="form.invalid || seatsOutOfRange() ? 'Fix the highlighted fields to save' : 'Save schedule'">
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
        <div class="col-md-4">
          <label class="form-label small text-muted mb-1">Search tour or package</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-4">
          <label class="form-label small text-muted mb-1">Tour</label>
          <app-select size="sm" [options]="tourFilterOptions()" [(ngModel)]="filterTourId" (valueChange)="onFilterTourChange($event)"></app-select>
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
              <th class="sortable" (click)="toggleSort('start')">Start <i class="bi" [ngClass]="sortIcon('start')"></i></th>
              <th class="sortable" (click)="toggleSort('end')">End <i class="bi" [ngClass]="sortIcon('end')"></i></th>
              <th class="sortable" (click)="toggleSort('tour')">Tour <i class="bi" [ngClass]="sortIcon('tour')"></i></th>
              <th class="sortable" (click)="toggleSort('package')">Package <i class="bi" [ngClass]="sortIcon('package')"></i></th>
              <th class="sortable" (click)="toggleSort('seats')">Seats <i class="bi" [ngClass]="sortIcon('seats')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of pagedItems()">
              <td>{{ s.startDate | date:'mediumDate' }}</td>
              <td>{{ s.endDate | date:'mediumDate' }}</td>
              <td>{{ s.tourName }}</td>
              <td>{{ s.packageName }}</td>
              <td>
                <strong>{{ s.availableSeats - s.bookedSeats }}</strong>
                <small class="text-muted"> left of {{ s.availableSeats }}</small>
              </td>
              <td><span class="badge" [class.bg-success]="s.isActive" [class.bg-secondary]="!s.isActive">{{ s.isActive ? 'Open' : 'Closed' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(s)" title="View trip details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="auth.hasPermission('schedules.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(s)">Edit</button>
                  <button *ngIf="s.isActive && auth.hasPermission('schedules.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(s)" [disabled]="togglingId === s.id" title="Close this trip">
                    <i class="bi bi-eye-slash me-1"></i>Close
                  </button>
                  <button *ngIf="!s.isActive && auth.hasPermission('schedules.delete')" class="btn btn-sm btn-outline-success" (click)="activate(s)" [disabled]="togglingId === s.id" title="Reopen this trip">
                    <span *ngIf="togglingId === s.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== s.id" class="bi bi-check2-circle me-1"></i>Reopen
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredItems().length === 0">
              <td colspan="7" class="text-center text-muted py-3">{{ items.length === 0 ? 'No scheduled trips.' : 'No trips match the filters.' }}</td>
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
export class AdminSchedulesComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: TourSchedule[] = [];
  tours: Tour[] = [];
  packages: TourPackage[] = [];
  editingId: number | null = null;
  viewMode = false;
  formError = '';
  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  deleteTarget: TourSchedule | null = null;
  deleting = false;
  togglingId: number | null = null;

  filterText = '';
  filterTourId: number | string = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  readonly statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Open' },
    { value: 'inactive', label: 'Closed' }
  ];

  sortKey: 'start' | 'end' | 'tour' | 'package' | 'seats' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    tourId: [0, [Validators.required, Validators.min(1)]],
    tourPackageId: [0, [Validators.required, Validators.min(1)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    availableSeats: [10, [Validators.required, Validators.min(1)]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.api.listTours(undefined, false).subscribe({ next: ts => this.tours = ts });
    this.api.listPackages().subscribe({ next: ps => this.packages = ps });
    this.load();
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
    this.api.listSchedules().subscribe({
      next: ss => {
        this.items = ss;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  onTourChange(): void {
    const list = this.packagesForSelectedTour();
    const firstId = list.length ? list[0].id : 0;
    this.form.patchValue({ tourPackageId: firstId });
    this.onPackageChange();
  }

  onPackageChange(): void {
    const pkg = this.selectedPackage();
    if (pkg) {
      this.form.patchValue({ availableSeats: pkg.maxPersons });
    }
  }

  selectedPackage(): TourPackage | null {
    const pid = this.form.value.tourPackageId;
    return this.packages.find(p => p.id === pid) || null;
  }

  seatsOutOfRange(): boolean {
    const pkg = this.selectedPackage();
    const seats = Number(this.form.value.availableSeats);
    if (!pkg || !seats) return false;
    return seats < pkg.minPersons || seats > pkg.maxPersons;
  }

  packagesForSelectedTour(): TourPackage[] {
    const tid = this.form.value.tourId;
    return this.packages.filter(p => p.tourId === tid);
  }

  tourOptions(): { value: number; label: string }[] {
    return this.tours.map(t => ({ value: t.id, label: t.name }));
  }

  packageOptionsForSelectedTour(): { value: number; label: string }[] {
    return this.packagesForSelectedTour().map(p => ({ value: p.id, label: p.name }));
  }

  tourFilterOptions(): { value: number | string; label: string }[] {
    return [{ value: '', label: 'All tours' }, ...this.tours.map(t => ({ value: t.id, label: t.name }))];
  }

  filteredItems(): TourSchedule[] {
    const q = this.filterText.trim().toLowerCase();
    const tid = this.filterTourId === '' ? null : Number(this.filterTourId);
    const filtered = this.items.filter(s => {
      if (q) {
        const hay = (s.tourName + ' ' + s.packageName).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (tid !== null && s.tourId !== tid) return false;
      if (this.filterStatus === 'active' && !s.isActive) return false;
      if (this.filterStatus === 'inactive' && s.isActive) return false;
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

  private sortValue(s: TourSchedule): string | number {
    switch (this.sortKey) {
      case 'start': return new Date(s.startDate).getTime();
      case 'end': return new Date(s.endDate).getTime();
      case 'tour': return s.tourName;
      case 'package': return s.packageName;
      case 'seats': return s.availableSeats - s.bookedSeats;
      case 'status': return s.isActive ? 1 : 0;
      default: return '';
    }
  }

  toggleSort(key: 'start' | 'end' | 'tour' | 'package' | 'seats' | 'status'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }

  sortIcon(key: 'start' | 'end' | 'tour' | 'package' | 'seats' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterText || this.filterTourId !== '' || this.filterStatus !== 'all';
  }
  onFilterChange(): void { this.page = 1; }
  onFilterTourChange(v: number | string): void { this.filterTourId = v; this.page = 1; }
  onFilterStatusChange(v: string | number): void { this.filterStatus = v as 'all' | 'active' | 'inactive'; this.page = 1; }
  clearFilters(): void { this.filterText = ''; this.filterTourId = ''; this.filterStatus = 'all'; this.page = 1; }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)); }
  pagedItems(): TourSchedule[] {
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
    this.form.reset({ tourId: 0, tourPackageId: 0, startDate: '', endDate: '', availableSeats: 10, isActive: true });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  edit(s: TourSchedule): void {
    this.editingId = s.id;
    this.viewMode = false;
    this.formError = '';
    this.form.reset({
      tourId: s.tourId,
      tourPackageId: s.tourPackageId,
      startDate: this.toDateInput(s.startDate),
      endDate: this.toDateInput(s.endDate),
      availableSeats: s.availableSeats,
      isActive: s.isActive
    });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  view(s: TourSchedule): void {
    this.editingId = s.id;
    this.viewMode = true;
    this.formError = '';
    this.form.reset({
      tourId: s.tourId,
      tourPackageId: s.tourPackageId,
      startDate: this.toDateInput(s.startDate),
      endDate: this.toDateInput(s.endDate),
      availableSeats: s.availableSeats,
      isActive: s.isActive
    });
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
    if (this.form.invalid || this.seatsOutOfRange()) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const v = this.form.getRawValue() as any;
    const tName = this.tours.find(t => t.id === v.tourId)?.name || '—';
    const pName = this.packages.find(p => p.id === v.tourPackageId)?.name || '—';
    const label = `${tName} — ${pName} (${v.startDate} → ${v.endDate})`;
    const op = this.editingId
      ? this.api.updateSchedule(this.editingId, v)
      : this.api.createSchedule(v);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Trip ${label} updated.` : `New trip ${label} scheduled.`,
          'success', 4000, { title: this.editingId ? 'Trip updated' : 'Trip scheduled' }
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

  remove(s: TourSchedule): void { this.deleteTarget = s; this.lockBody(); }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (this.editingId === null) this.unlockBody();
  }

  confirmDelete(): void {
    const s = this.deleteTarget;
    if (!s || this.deleting) return;
    this.deleting = true;
    this.api.updateSchedule(s.id, {
      tourId: s.tourId, tourPackageId: s.tourPackageId,
      startDate: this.toDateInput(s.startDate), endDate: this.toDateInput(s.endDate),
      availableSeats: s.availableSeats, isActive: false
    } as any).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (this.editingId === null) this.unlockBody();
        this.toast.show(`Trip "${s.tourName} — ${s.packageName}" on ${this.fmtDate(s.startDate)} is now closed for bookings.`, 'info', 4000, { title: 'Trip closed' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not close this trip. Please try again.`, 'danger', 4000, { title: 'Close failed' });
      }
    });
  }

  activate(s: TourSchedule): void {
    if (this.togglingId !== null) return;
    this.togglingId = s.id;
    this.api.updateSchedule(s.id, {
      tourId: s.tourId, tourPackageId: s.tourPackageId,
      startDate: this.toDateInput(s.startDate), endDate: this.toDateInput(s.endDate),
      availableSeats: s.availableSeats, isActive: true
    } as any).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Trip "${s.tourName} — ${s.packageName}" on ${this.fmtDate(s.startDate)} is now open for bookings.`, 'success', 4000, { title: 'Trip reopened' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not reopen this trip. Please try again.`, 'danger', 4000, { title: 'Reopen failed' });
      }
    });
  }

  private toDateInput(value: string | Date): string {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private fmtDate(value: string | Date): string {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  }
}
