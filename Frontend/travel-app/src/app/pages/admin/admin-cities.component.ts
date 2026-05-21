import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { City, Country, GeoState } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-cities',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Cities</h2>
      <button *ngIf="auth.hasPermission('cities.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add city</button>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate city?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This city will be hidden from dropdowns:</p>
            <p class="fw-bold mb-0">{{ deleteTarget.name }} — {{ deleteTarget.stateName }}, {{ deleteTarget.countryName }}</p>
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
            <h5 class="modal-title fw-bold">{{ editingId ? 'Edit city' : 'New city' }}</h5>
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
                  <label class="form-label">Country <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="selectedCountryId" [ngModelOptions]="{standalone: true}" (ngModelChange)="onModalCountryChange($event)" (blur)="countryTouched = true" [class.is-invalid]="countryTouched && !selectedCountryId">
                    <option value="">— Select country —</option>
                    <option *ngFor="let c of countries" [value]="c.id">{{ c.name }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="countryTouched && !selectedCountryId">Country is required.</div>
                </div>
                <div class="col-12">
                  <label class="form-label">State <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="stateId" [class.is-invalid]="isInvalid(form.get('stateId'))">
                    <option value="">— Select state —</option>
                    <option *ngFor="let s of modalStates" [value]="s.id">{{ s.name }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('stateId'))">State is required.</div>
                </div>
                <div class="col-12">
                  <label class="form-label">City name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="name" placeholder="e.g. Ahmedabad" [class.is-invalid]="isInvalid(form.get('name'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('name'))">City name is required.</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()"><i class="bi bi-x-lg me-1"></i>Cancel</button>
              <button class="btn btn-primary" [disabled]="form.invalid || !selectedCountryId"><i class="bi bi-check2-circle me-1"></i>Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Search city</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterName" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Country</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterCountryId" (ngModelChange)="onFilterCountryChange($event)">
            <option value="">All countries</option>
            <option *ngFor="let c of countries" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">State</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStateId" (ngModelChange)="onFilterChange()">
            <option value="">All states</option>
            <option *ngFor="let s of filterStates" [value]="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="col-md-1">
          <button class="btn btn-outline-secondary btn-sm w-100" (click)="clearFilters()" [disabled]="!filtersApplied()"><i class="bi bi-x-lg"></i></button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('name')">City <i class="bi" [ngClass]="sortIcon('name')"></i></th>
              <th class="sortable" (click)="toggleSort('state')">State <i class="bi" [ngClass]="sortIcon('state')"></i></th>
              <th class="sortable" (click)="toggleSort('country')">Country <i class="bi" [ngClass]="sortIcon('country')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of pagedItems()">
              <td><strong>{{ c.name }}</strong></td>
              <td>{{ c.stateName }}</td>
              <td>{{ c.countryName }}</td>
              <td><span class="badge" [class.bg-success]="c.isActive" [class.bg-secondary]="!c.isActive">{{ c.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button *ngIf="auth.hasPermission('cities.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(c)"><i class="bi bi-pencil me-1"></i>Edit</button>
                  <button *ngIf="c.isActive && auth.hasPermission('cities.toggle')" class="btn btn-sm btn-outline-danger" (click)="remove(c)" [disabled]="togglingId === c.id">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!c.isActive && auth.hasPermission('cities.toggle')" class="btn btn-sm btn-outline-success" (click)="activate(c)" [disabled]="togglingId === c.id">
                    <span *ngIf="togglingId === c.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== c.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredItems().length === 0">
              <td colspan="5" class="text-center text-muted py-3">{{ items.length === 0 ? 'No cities yet.' : 'No cities match the filters.' }}</td>
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
export class AdminCitiesComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: City[] = [];
  countries: Country[] = [];
  allStates: GeoState[] = [];
  modalStates: GeoState[] = [];
  filterStates: GeoState[] = [];
  selectedCountryId: number | string = '';
  countryTouched = false;
  editingId: number | null = null;
  formError = '';
  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;
  deleteTarget: City | null = null;
  deleting = false;
  togglingId: number | null = null;
  filterName = '';
  filterCountryId: number | string = '';
  filterStateId: number | string = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  sortKey: 'name' | 'state' | 'country' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    stateId: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.api.listCountries(true).subscribe({ next: cs => this.countries = cs });
    this.api.listStates().subscribe({ next: ss => { this.allStates = ss; } });
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

  load(): void { this.api.listCities().subscribe({ next: cs => { this.items = cs; this.clampPage(); } }); }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  onModalCountryChange(countryId: any): void {
    this.selectedCountryId = countryId;
    this.form.patchValue({ stateId: 0 });
    this.modalStates = countryId ? this.allStates.filter(s => s.countryId === +countryId && s.isActive) : [];
  }

  onFilterCountryChange(countryId: any): void {
    this.filterCountryId = countryId;
    this.filterStateId = '';
    this.filterStates = countryId ? this.allStates.filter(s => s.countryId === +countryId) : [];
    this.page = 1;
  }

  filteredItems(): City[] {
    const q = this.filterName.trim().toLowerCase();
    const cid = this.filterCountryId ? +this.filterCountryId : null;
    const sid = this.filterStateId ? +this.filterStateId : null;
    let list = this.items.filter(c => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (cid && c.countryId !== cid) return false;
      if (sid && c.stateId !== sid) return false;
      if (this.filterStatus === 'active' && !c.isActive) return false;
      if (this.filterStatus === 'inactive' && c.isActive) return false;
      return true;
    });
    if (this.sortKey) {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const av = this.sortKey === 'name' ? a.name : this.sortKey === 'state' ? a.stateName : this.sortKey === 'country' ? a.countryName : (a.isActive ? 1 : 0);
        const bv = this.sortKey === 'name' ? b.name : this.sortKey === 'state' ? b.stateName : this.sortKey === 'country' ? b.countryName : (b.isActive ? 1 : 0);
        return typeof av === 'number' ? ((av as number) - (bv as number)) * dir : (av as string).localeCompare(bv as string) * dir;
      });
    }
    return list;
  }

  toggleSort(key: 'name' | 'state' | 'country' | 'status'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.page = 1;
  }
  sortIcon(key: string): string { if (this.sortKey !== key) return 'bi-arrow-down-up text-muted'; return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'; }
  filtersApplied(): boolean { return !!this.filterName || !!this.filterCountryId || !!this.filterStateId || this.filterStatus !== 'all'; }
  onFilterChange(): void { this.page = 1; }
  clearFilters(): void { this.filterName = ''; this.filterCountryId = ''; this.filterStateId = ''; this.filterStates = []; this.filterStatus = 'all'; this.page = 1; }
  totalPages(): number { return Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)); }
  pagedItems(): City[] { const s = (this.page - 1) * this.pageSize; return this.filteredItems().slice(s, s + this.pageSize); }
  pageStart(): number { return this.filteredItems().length === 0 ? 0 : (this.page - 1) * this.pageSize + 1; }
  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredItems().length); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }
  setPage(p: number): void { if (p >= 1 && p <= this.totalPages()) this.page = p; }
  private clampPage(): void { const t = this.totalPages(); if (this.page > t) this.page = t; if (this.page < 1) this.page = 1; }

  startCreate(): void {
    this.editingId = 0;
    this.formError = '';
    this.selectedCountryId = '';
    this.countryTouched = false;
    this.modalStates = [];
    this.form.reset({ name: '', stateId: 0 });
    this.lockBody();
  }

  edit(c: City): void {
    this.editingId = c.id;
    this.formError = '';
    this.selectedCountryId = c.countryId;
    this.countryTouched = false;
    this.modalStates = this.allStates.filter(s => s.countryId === c.countryId && s.isActive);
    this.form.reset({ name: c.name, stateId: c.stateId });
    this.lockBody();
  }

  cancel(): void { this.editingId = null; this.formError = ''; this.countryTouched = false; this.unlockBody(); }

  save(): void {
    this.countryTouched = true;
    if (this.form.invalid || !this.selectedCountryId) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const op = this.editingId ? this.api.updateCity(this.editingId, v) : this.api.createCity(v);
    op.subscribe({
      next: () => { this.toast.show(this.editingId ? 'City updated.' : 'City added.', 'success', 3000); this.cancel(); this.load(); },
      error: (err: any) => { this.formError = err?.error?.message || 'Could not save. Please try again.'; }
    });
  }

  remove(c: City): void { this.deleteTarget = c; this.lockBody(); }
  cancelDelete(): void { if (!this.deleting) { this.deleteTarget = null; this.unlockBody(); } }

  confirmDelete(): void {
    const c = this.deleteTarget;
    if (!c || this.deleting) return;
    this.deleting = true;
    this.api.setCityActive(c.id, false).subscribe({
      next: () => { this.deleting = false; this.deleteTarget = null; this.unlockBody(); this.toast.show(`"${c.name}" deactivated.`, 'info', 3000); this.load(); },
      error: () => { this.deleting = false; this.toast.show('Could not deactivate. Please try again.', 'danger', 3000); }
    });
  }

  activate(c: City): void {
    if (this.togglingId !== null) return;
    this.togglingId = c.id;
    this.api.setCityActive(c.id, true).subscribe({
      next: () => { this.togglingId = null; this.toast.show(`"${c.name}" activated.`, 'success', 3000); this.load(); },
      error: () => { this.togglingId = null; this.toast.show('Could not activate. Please try again.', 'danger', 3000); }
    });
  }
}
