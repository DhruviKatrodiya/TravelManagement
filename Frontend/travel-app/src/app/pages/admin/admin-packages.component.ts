import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmModalService } from '../../core/services/confirm-modal.service';
import { Facility, Tour, TourPackage } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-packages',
  standalone: false,
  template: `
    <div class="mb-4">
      <h2 class="fw-bold mb-1">Packages</h2>
      <p class="text-muted small mb-0">Manage packages from the Tours page. This screen lets you activate or deactivate them.</p>
    </div>

    <!-- Add/Edit modal -->
    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Package details' : (editingId ? 'Edit package' : 'New package') }}</h5>
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
                  <app-select [options]="tourOptions()" formControlName="tourId" [invalid]="isInvalid(form.get('tourId'))"></app-select>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('tourId'))">Tour is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="name" [class.is-invalid]="isInvalid(form.get('name'))" placeholder="e.g. 5D/4N Deluxe" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('name'))">Package name is required.</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Days <span class="text-danger">*</span></label>
                  <input type="number" min="1" class="form-control" formControlName="durationDays" [class.is-invalid]="isInvalid(form.get('durationDays'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('durationDays'))">Must be at least 1.</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Nights <span class="text-danger">*</span></label>
                  <input type="number" min="0" class="form-control" formControlName="durationNights" [class.is-invalid]="isInvalid(form.get('durationNights'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('durationNights'))">Must be 0 or more.</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Adult ₹ <span class="text-danger">*</span></label>
                  <input type="number" min="0" class="form-control" formControlName="pricePerPerson" [class.is-invalid]="isInvalid(form.get('pricePerPerson'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('pricePerPerson'))">Price is required.</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Child ₹</label>
                  <input type="number" min="0" class="form-control" formControlName="childPrice" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Min persons <span class="text-danger">*</span></label>
                  <input type="number" min="1" class="form-control" formControlName="minPersons" [class.is-invalid]="isInvalid(form.get('minPersons'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('minPersons'))">At least 1.</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Max persons <span class="text-danger">*</span></label>
                  <input type="number" min="1" class="form-control" formControlName="maxPersons" [class.is-invalid]="isInvalid(form.get('maxPersons'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('maxPersons'))">At least 1.</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" rows="2" formControlName="description"></textarea>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Inclusions</label>
                  <input class="form-control" formControlName="inclusions" placeholder="Hotel, breakfast, transport" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Exclusions</label>
                  <input class="form-control" formControlName="exclusions" placeholder="Flights, personal expenses" />
                </div>
                <div class="col-12">
                  <label class="form-label">Facilities</label>
                  <div *ngIf="facilities.length === 0" class="text-muted small">No facilities defined yet — add them from the Facilities page.</div>
                  <div class="d-flex flex-wrap gap-2">
                    <ng-container *ngFor="let f of facilities">
                      <div class="form-check" *ngIf="!viewMode || isSelected(f.id)">
                        <input class="form-check-input" type="checkbox" [checked]="isSelected(f.id)" (change)="toggleFacility(f.id)" [id]="'f' + f.id" [disabled]="viewMode" />
                        <label class="form-check-label small" [for]="'f' + f.id">{{ f.name }} <span class="text-muted">(₹{{ f.cost }})</span></label>
                      </div>
                    </ng-container>
                    <div *ngIf="viewMode && selectedFacilityIds.length === 0" class="text-muted small fst-italic">No facilities included.</div>
                  </div>
                </div>
                <div class="col-12 d-flex gap-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" formControlName="isCustomizable" id="cust" />
                    <label class="form-check-label" for="cust">Customizable</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" formControlName="isActive" id="act" />
                    <label class="form-check-label" for="act">Active</label>
                  </div>
                </div>

                <ng-container *ngIf="editingId">
                  <div class="col-12"><hr class="my-2" /></div>
                  <div class="col-12">
                    <h6 class="fw-bold mb-2">Itinerary</h6>
                    <table class="table table-sm mb-2">
                      <thead><tr><th style="width:60px">Day</th><th>Title</th><th>Location</th><th></th></tr></thead>
                      <tbody>
                        <tr *ngFor="let it of currentItineraries">
                          <td>{{ it.dayNumber }}</td>
                          <td>{{ it.title }}</td>
                          <td>{{ it.location }}</td>
                          <td><button *ngIf="!viewMode" type="button" class="btn btn-sm btn-outline-danger" (click)="removeItinerary(it.id)">Remove</button></td>
                        </tr>
                        <tr *ngIf="currentItineraries.length === 0"><td colspan="4" class="text-center text-muted small py-2">No days yet.</td></tr>
                      </tbody>
                    </table>
                    <div *ngIf="!viewMode" [formGroup]="itForm" class="row g-2">
                      <div class="col-md-1"><input type="number" class="form-control form-control-sm" formControlName="dayNumber" placeholder="Day" /></div>
                      <div class="col-md-3"><input class="form-control form-control-sm" formControlName="title" placeholder="Title" /></div>
                      <div class="col-md-2"><input class="form-control form-control-sm" formControlName="location" placeholder="Location" /></div>
                      <div class="col-md-4"><input class="form-control form-control-sm" formControlName="description" placeholder="Description" /></div>
                      <div class="col-md-2"><button type="button" class="btn btn-sm btn-outline-primary w-100" (click)="addItinerary()">Add day</button></div>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">{{ viewMode ? 'Close' : 'Cancel' }}</button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save package'">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label small text-muted mb-1">Search package name</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterName" (ngModelChange)="onFilterChange()" />
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
              <th class="sortable" (click)="toggleSort('name')">Package <i class="bi" [ngClass]="sortIcon('name')"></i></th>
              <th class="sortable" (click)="toggleSort('tour')">Tour <i class="bi" [ngClass]="sortIcon('tour')"></i></th>
              <th class="sortable" (click)="toggleSort('duration')">Duration <i class="bi" [ngClass]="sortIcon('duration')"></i></th>
              <th class="sortable" (click)="toggleSort('price')">Price <i class="bi" [ngClass]="sortIcon('price')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pagedPackages()">
              <td><strong>{{ p.name }}</strong></td>
              <td>{{ tourName(p.tourId) }}</td>
              <td>{{ p.durationDays }}D / {{ p.durationNights }}N</td>
              <td>₹ {{ p.pricePerPerson | number:'1.0-0' }}</td>
              <td><span class="badge" [class.bg-success]="p.isActive" [class.bg-secondary]="!p.isActive">{{ p.isActive ? 'Active' : 'Hidden' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(p)" title="View package details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="p.isActive && auth.hasPermission('packages.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(p)" [disabled]="deletingId === p.id" title="Hide this package from customers">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!p.isActive && auth.hasPermission('packages.delete')" class="btn btn-sm btn-outline-success" (click)="activate(p)" [disabled]="togglingId === p.id" title="Make this package visible again">
                    <span *ngIf="togglingId === p.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== p.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                  <button *ngIf="auth.hasPermission('packages.delete')" class="btn btn-sm btn-danger" (click)="permanentDelete(p)" [disabled]="permanentDeletingId === p.id" title="Permanently delete this package">
                    <span *ngIf="permanentDeletingId === p.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="permanentDeletingId !== p.id" class="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredPackages().length === 0">
              <td colspan="6" class="text-center text-muted py-3">{{ packages.length === 0 ? 'No packages yet.' : 'No packages match the filters.' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredPackages().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredPackages().length }}</small>
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
export class AdminPackagesComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  confirmModal = inject(ConfirmModalService);

  tours: Tour[] = [];
  facilities: Facility[] = [];
  packages: TourPackage[] = [];
  editingId: number | null = null;
  viewMode = false;
  formError = '';
  selectedFacilityIds: number[] = [];
  currentItineraries: any[] = [];

  deletingId: number | null = null;
  permanentDeletingId: number | null = null;
  togglingId: number | null = null;

  filterName = '';
  filterTourId: number | string = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  sortKey: 'name' | 'tour' | 'duration' | 'price' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  readonly statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Hidden' }
  ];

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    tourId: [0 as number, [Validators.required, Validators.min(1)]],
    name: ['', Validators.required],
    durationDays: [3, [Validators.required, Validators.min(1)]],
    durationNights: [2, [Validators.required, Validators.min(0)]],
    pricePerPerson: [10000, [Validators.required, Validators.min(0)]],
    childPrice: [6000],
    minPersons: [1, [Validators.required, Validators.min(1)]],
    maxPersons: [10, [Validators.required, Validators.min(1)]],
    description: [''],
    inclusions: [''],
    exclusions: [''],
    isCustomizable: [false],
    isActive: [true]
  });

  itForm = this.fb.group({
    dayNumber: [1, Validators.required],
    title: ['', Validators.required],
    location: [''],
    description: ['']
  });

  ngOnInit(): void {
    const onlyAssigned = !this.auth.isAdmin();
    this.api.listTours(undefined, false, undefined, undefined, onlyAssigned).subscribe({
      next: ts => {
        this.tours = ts;
        const tourIdParam = this.route.snapshot.queryParamMap.get('tourId');
        const openNew = this.route.snapshot.queryParamMap.get('new') === '1';
        const tourId = tourIdParam ? Number(tourIdParam) : null;
        if (tourId && openNew && ts.some(t => t.id === tourId)) {
          this.startCreate();
          this.form.patchValue({ tourId });
        }
      }
    });
    this.api.listFacilities().subscribe({ next: fs => this.facilities = fs.filter(f => f.isActive) });
    this.load();
  }

  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.editingId !== null) this.cancel();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) this.cancel();
  }

  private lockBody(): void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }

  load(): void {
    const onlyAssigned = !this.auth.isAdmin();
    this.api.listPackages(undefined, onlyAssigned).subscribe({
      next: ps => {
        this.packages = ps;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  tourName(id: number): string { return this.tours.find(t => t.id === id)?.name || '—'; }

  tourOptions(): { value: number | string; label: string }[] {
    return this.tours.map(t => ({ value: t.id, label: t.name }));
  }

  tourFilterOptions(): { value: number | string; label: string }[] {
    return [{ value: '', label: 'All tours' }, ...this.tours.map(t => ({ value: t.id, label: t.name }))];
  }

  filteredPackages(): TourPackage[] {
    const q = this.filterName.trim().toLowerCase();
    const tid = this.filterTourId === '' ? null : Number(this.filterTourId);
    const filtered = this.packages.filter(p => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (tid !== null && p.tourId !== tid) return false;
      if (this.filterStatus === 'active' && !p.isActive) return false;
      if (this.filterStatus === 'inactive' && p.isActive) return false;
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

  private sortValue(p: TourPackage): string | number | null {
    switch (this.sortKey) {
      case 'name': return p.name;
      case 'tour': return this.tourName(p.tourId);
      case 'duration': return p.durationDays * 100 + p.durationNights;
      case 'price': return p.pricePerPerson;
      case 'status': return p.isActive ? 1 : 0;
      default: return null;
    }
  }

  toggleSort(key: 'name' | 'tour' | 'duration' | 'price' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'tour' | 'duration' | 'price' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterName || this.filterTourId !== '' || this.filterStatus !== 'all';
  }

  onFilterChange(): void { this.page = 1; }
  onFilterTourChange(v: number | string): void { this.filterTourId = v; this.page = 1; }
  onFilterStatusChange(v: string | number): void { this.filterStatus = v as 'all' | 'active' | 'inactive'; this.page = 1; }

  clearFilters(): void {
    this.filterName = '';
    this.filterTourId = '';
    this.filterStatus = 'all';
    this.page = 1;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredPackages().length / this.pageSize)); }

  pagedPackages(): TourPackage[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredPackages().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    if (this.filteredPackages().length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredPackages().length); }

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
    this.selectedFacilityIds = [];
    this.currentItineraries = [];
    this.form.reset({
      tourId: this.tours[0]?.id || 0, name: '',
      durationDays: 3, durationNights: 2, pricePerPerson: 10000, childPrice: 6000,
      minPersons: 1, maxPersons: 10,
      description: '', inclusions: '', exclusions: '',
      isCustomizable: false, isActive: true
    });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  edit(p: TourPackage): void {
    this.editingId = p.id;
    this.viewMode = false;
    this.formError = '';
    this.selectedFacilityIds = (p.facilities || []).map(f => f.facilityId);
    this.currentItineraries = p.itineraries || [];
    this.form.reset({ ...p, childPrice: p.childPrice || 0 } as any);
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  view(p: TourPackage): void {
    this.editingId = p.id;
    this.viewMode = true;
    this.formError = '';
    this.selectedFacilityIds = (p.facilities || []).map(f => f.facilityId);
    this.currentItineraries = p.itineraries || [];
    this.form.reset({ ...p, childPrice: p.childPrice || 0 } as any);
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

  isSelected(id: number): boolean { return this.selectedFacilityIds.includes(id); }
  toggleFacility(id: number): void {
    this.selectedFacilityIds = this.selectedFacilityIds.includes(id)
      ? this.selectedFacilityIds.filter(x => x !== id)
      : [...this.selectedFacilityIds, id];
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const payload = { ...this.form.getRawValue(), facilityIds: this.selectedFacilityIds } as any;
    const tName = this.tourName(payload.tourId);
    const label = `"${payload.name}" — ${tName}`;
    const op = this.editingId ? this.api.updatePackage(this.editingId, payload) : this.api.createPackage(payload);
    op.subscribe({
      next: (p: any) => {
        this.toast.show(
          this.editingId ? `Package ${label} details updated.` : `New package ${label} added.`,
          'success', 4000, { title: this.editingId ? 'Package updated' : 'Package created' }
        );
        if (!this.editingId) {
          this.editingId = p.id;
          this.currentItineraries = p.itineraries || [];
        } else {
          this.editingId = null;
          this.unlockBody();
        }
        this.load();
      },
      error: (err: any) => { this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.'; setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0); }
    });
  }

  addItinerary(): void {
    if (!this.editingId || this.itForm.invalid) return;
    const v = this.itForm.getRawValue();
    this.api.addItinerary({ tourPackageId: this.editingId, ...v }).subscribe({
      next: (i: any) => {
        this.currentItineraries = [...this.currentItineraries, i];
        this.itForm.reset({ dayNumber: (v.dayNumber || 0) + 1, title: '', location: '', description: '' });
      }
    });
  }

  removeItinerary(id: number): void {
    this.api.deleteItinerary(id).subscribe({
      next: () => this.currentItineraries = this.currentItineraries.filter(i => i.id !== id)
    });
  }

  async remove(p: TourPackage): Promise<void> {
    const tName = this.tourName(p.tourId);
    const ok = await this.confirmModal.confirm({
      title: 'Deactivate package?',
      message: `"${p.name}" — ${tName}`,
      detail: 'This package will be hidden from customers. It stays in the database and can be activated again anytime.',
      confirmLabel: 'Deactivate'
    });
    if (!ok) return;
    this.deletingId = p.id;
    this.api.updatePackage(p.id, { ...p, isActive: false, facilityIds: (p.facilities || []).map((f: any) => f.facilityId) } as any).subscribe({
      next: () => {
        this.deletingId = null;
        this.toast.show(`Package "${p.name}" of ${tName} is now hidden from customers.`, 'info', 4000, { title: 'Package deactivated' });
        this.load();
      },
      error: (err: any) => {
        this.deletingId = null;
        this.toast.show(err?.error?.message || `Could not deactivate "${p.name}". Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(p: TourPackage): void {
    if (this.togglingId !== null) return;
    this.togglingId = p.id;
    const tName = this.tourName(p.tourId);
    this.api.updatePackage(p.id, { ...p, isActive: true, facilityIds: (p.facilities || []).map(f => f.facilityId) } as any).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Package "${p.name}" of ${tName} is now visible to customers.`, 'success', 4000, { title: 'Package activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate "${p.name}". Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }

  async permanentDelete(p: TourPackage): Promise<void> {
    const tName = this.tourName(p.tourId);
    const ok = await this.confirmModal.confirm({
      title: 'Permanently delete package?',
      message: `Delete "${p.name}" — ${tName} permanently?`,
      detail: 'This will permanently remove the package from the database. This action cannot be undone.',
    });
    if (!ok) return;
    this.permanentDeletingId = p.id;
    this.api.deletePackage(p.id).subscribe({
      next: () => {
        this.permanentDeletingId = null;
        this.toast.show(`Package "${p.name}" has been permanently deleted.`, 'success', 4000, { title: 'Package deleted' });
        this.load();
      },
      error: (err: any) => {
        this.permanentDeletingId = null;
        this.toast.show(err?.error?.message || `Could not delete "${p.name}". Please try again.`, 'danger', 4000, { title: 'Delete failed' });
      }
    });
  }
}
