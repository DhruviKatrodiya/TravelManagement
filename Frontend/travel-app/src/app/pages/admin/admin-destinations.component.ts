import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmModalService } from '../../core/services/confirm-modal.service';
import { HomeDestination } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-destinations',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-0">Popular Destinations</h2>
        <p class="text-muted small mb-0">Shown in the "Popular Destinations" section of the public home page.</p>
      </div>
      <button *ngIf="auth.hasPermission('destinations.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add destination</button>
    </div>

    <!-- Add/Edit modal -->
    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Destination details' : (editingId ? 'Edit destination' : 'New destination') }}</h5>
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
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="name" placeholder="e.g. Taj Mahal" [class.is-invalid]="isInvalid(form.get('name'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('name'))">Destination name is required.</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Country <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="country" placeholder="India / Bhutan / Nepal" [class.is-invalid]="isInvalid(form.get('country'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('country'))">Country is required.</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Sort order</label>
                  <input type="number" class="form-control" formControlName="sortOrder" />
                </div>
                <div class="col-12">
                  <label class="form-label">Blurb</label>
                  <input class="form-control" formControlName="blurb" placeholder="One short line shown on the card" />
                </div>
                <div class="col-12">
                  <label class="form-label">Image <span *ngIf="!viewMode" class="text-danger">*</span></label>
                  <input *ngIf="!viewMode" #imgInput type="file" class="form-control" accept="image/*" (change)="onImageSelected($event)" [disabled]="uploading" />
                  <small class="text-muted" *ngIf="uploading">Uploading…</small>
                  <div *ngIf="form.value.imageUrl" class="mt-2 d-flex align-items-start gap-2">
                    <img [src]="form.value.imageUrl" alt="Preview" (error)="onPreviewError($event)" style="max-height:120px;max-width:200px;object-fit:cover;border-radius:6px;border:1px solid #dee2e6;background:#f8f9fa" />
                    <button *ngIf="!viewMode" type="button" class="btn btn-sm btn-outline-danger" (click)="clearImage(imgInput)">Remove</button>
                  </div>
                  <ng-container *ngIf="!viewMode">
                    <small class="text-muted d-block mt-1">Or paste a URL:</small>
                    <input class="form-control mt-1" formControlName="imageUrl" placeholder="https://… or /uploads/…" [class.is-invalid]="isInvalid(form.get('imageUrl'))" />
                    <div class="invalid-feedback" *ngIf="isInvalid(form.get('imageUrl'))">Image is required — choose a file or paste a URL.</div>
                    <small class="text-danger d-block mt-1" *ngIf="previewBroken">Image URL failed to load — choose a new file or paste a working URL.</small>
                  </ng-container>
                </div>
                <div class="col-12 form-check ms-2">
                  <input class="form-check-input" type="checkbox" formControlName="isActive" id="destActive" />
                  <label class="form-check-label" for="destActive">Active (shown on home page)</label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">
                <i class="bi bi-x-lg me-1"></i>{{ viewMode ? 'Close' : 'Cancel' }}
              </button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save destination'">
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
          <label class="form-label small text-muted mb-1">Search destination name</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterName" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Country</label>
          <app-select size="sm" [options]="countryFilterOptions()" [(ngModel)]="filterCountry" (valueChange)="onFilterChange()"></app-select>
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
              <th style="width:90px">Image</th>
              <th class="sortable" (click)="toggleSort('name')">Name <i class="bi" [ngClass]="sortIcon('name')"></i></th>
              <th class="sortable" (click)="toggleSort('country')">Country <i class="bi" [ngClass]="sortIcon('country')"></i></th>
              <th>Blurb</th>
              <th class="sortable" (click)="toggleSort('order')">Order <i class="bi" [ngClass]="sortIcon('order')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of pagedItems()">
              <td><img [src]="d.imageUrl" alt="" (error)="onRowImgError($event)" style="width:72px;height:48px;object-fit:cover;border-radius:6px" /></td>
              <td><strong>{{ d.name }}</strong></td>
              <td><span class="badge bg-secondary">{{ d.country }}</span></td>
              <td class="text-muted small">{{ d.blurb }}</td>
              <td>{{ d.sortOrder }}</td>
              <td><span class="badge" [class.bg-success]="d.isActive" [class.bg-secondary]="!d.isActive">{{ d.isActive ? 'Active' : 'Hidden' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(d)" title="View destination details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="auth.hasPermission('destinations.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(d)">Edit</button>
                  <button *ngIf="d.isActive && auth.hasPermission('destinations.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(d)" [disabled]="deletingId === d.id" title="Hide this destination">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!d.isActive && auth.hasPermission('destinations.delete')" class="btn btn-sm btn-outline-success" (click)="activate(d)" [disabled]="togglingId === d.id" title="Make this destination visible again">
                    <span *ngIf="togglingId === d.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== d.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                  <button *ngIf="auth.hasPermission('destinations.delete')" class="btn btn-sm btn-danger" (click)="permanentDelete(d)" [disabled]="permanentDeletingId === d.id" title="Permanently delete this destination">
                    <span *ngIf="permanentDeletingId === d.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="permanentDeletingId !== d.id" class="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredItems().length === 0">
              <td colspan="7" class="text-center text-muted py-3">{{ items.length === 0 ? 'No destinations yet.' : 'No destinations match the filters.' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredItems().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredItems().length }}</small>
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
export class AdminDestinationsComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  confirmModal = inject(ConfirmModalService);

  items: HomeDestination[] = [];
  editingId: number | null = null;
  viewMode = false;
  uploading = false;
  previewBroken = false;
  formError = '';

  deletingId: number | null = null;
  permanentDeletingId: number | null = null;
  togglingId: number | null = null;

  filterName = '';
  filterCountry = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  readonly statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Hidden' }
  ];

  sortKey: 'name' | 'country' | 'order' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  toggleSort(key: 'name' | 'country' | 'order' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'country' | 'order' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  private destSortValue(d: HomeDestination): string | number {
    switch (this.sortKey) {
      case 'name': return d.name;
      case 'country': return d.country;
      case 'order': return d.sortOrder;
      case 'status': return d.isActive ? 1 : 0;
      default: return '';
    }
  }

  countryFilterOptions(): { value: string; label: string }[] {
    const all = [{ value: '', label: 'All countries' }];
    return [...all, ...this.availableCountries().map(c => ({ value: c, label: c }))];
  }

  onFilterStatusChange(v: string | number): void {
    this.filterStatus = v as 'all' | 'active' | 'inactive';
    this.onFilterChange();
  }

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    country: ['India', [Validators.required, Validators.maxLength(60)]],
    imageUrl: ['', [Validators.required, Validators.maxLength(500)]],
    blurb: ['', [Validators.maxLength(200)]],
    sortOrder: [0],
    isActive: [true]
  });

  ngOnInit(): void { this.load(); }

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
    this.api.listHomeDestinations(false, onlyAssigned).subscribe({
      next: ds => {
        this.items = ds;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  filteredItems(): HomeDestination[] {
    const q = this.filterName.trim().toLowerCase();
    const filtered = this.items.filter(d => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (this.filterCountry && d.country !== this.filterCountry) return false;
      if (this.filterStatus === 'active' && !d.isActive) return false;
      if (this.filterStatus === 'inactive' && d.isActive) return false;
      return true;
    });
    if (!this.sortKey) return filtered;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = this.destSortValue(a);
      const bv = this.destSortValue(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return av.toString().localeCompare(bv.toString()) * dir;
    });
  }

  availableCountries(): string[] {
    return Array.from(new Set(this.items.map(d => d.country))).sort();
  }

  filtersApplied(): boolean {
    return !!this.filterName || !!this.filterCountry || this.filterStatus !== 'all';
  }

  onFilterChange(): void { this.page = 1; }

  clearFilters(): void {
    this.filterName = '';
    this.filterCountry = '';
    this.filterStatus = 'all';
    this.page = 1;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize));
  }

  pagedItems(): HomeDestination[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    const len = this.filteredItems().length;
    if (len === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredItems().length);
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
  }

  startCreate(): void {
    this.editingId = 0;
    this.viewMode = false;
    this.previewBroken = false;
    this.formError = '';
    const nextOrder = this.items.length === 0 ? 1 : Math.max(...this.items.map(i => i.sortOrder)) + 1;
    this.form.reset({ name: '', country: 'India', imageUrl: '', blurb: '', sortOrder: nextOrder, isActive: true });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  edit(d: HomeDestination): void {
    this.editingId = d.id;
    this.viewMode = false;
    this.previewBroken = false;
    this.formError = '';
    this.form.reset({
      name: d.name, country: d.country, imageUrl: d.imageUrl,
      blurb: d.blurb || '', sortOrder: d.sortOrder, isActive: d.isActive
    });
    this.form.enable({ emitEvent: false });
    this.lockBody();
  }

  view(d: HomeDestination): void {
    this.editingId = d.id;
    this.viewMode = true;
    this.previewBroken = false;
    this.formError = '';
    this.form.reset({
      name: d.name, country: d.country, imageUrl: d.imageUrl,
      blurb: d.blurb || '', sortOrder: d.sortOrder, isActive: d.isActive
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
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const v = this.form.getRawValue() as any;

    // Client-side duplicate order check
    const orderConflict = this.items.find(
      d => d.sortOrder === v.sortOrder && d.id !== (this.editingId ?? 0)
    );
    if (orderConflict) {
      this.formError = `Order number ${v.sortOrder} is already assigned to "${orderConflict.name}". Please choose a different order number.`;
      setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      return;
    }

    const label = `"${v.name}" (${v.country})`;
    const op = this.editingId
      ? this.api.updateHomeDestination(this.editingId, v)
      : this.api.createHomeDestination(v);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Destination ${label} details updated.` : `New destination ${label} added.`,
          'success', 4000, { title: this.editingId ? 'Destination updated' : 'Destination created' }
        );
        this.editingId = null;
        this.unlockBody();
        this.load();
      },
      error: (err: any) => { this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.'; setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0); }
    });
  }

  async remove(d: HomeDestination): Promise<void> {
    const ok = await this.confirmModal.confirm({
      title: 'Deactivate destination?',
      message: `"${d.name}" (${d.country})`,
      detail: 'This destination will be hidden from the public home page. It stays in the database and can be activated again anytime.',
      confirmLabel: 'Deactivate'
    });
    if (!ok) return;
    this.deletingId = d.id;
    this.api.updateHomeDestination(d.id, { ...d, isActive: false } as any).subscribe({
      next: () => {
        this.deletingId = null;
        this.toast.show(`Destination "${d.name}" (${d.country}) is now hidden from the home page.`, 'info', 4000, { title: 'Destination deactivated' });
        this.load();
      },
      error: (err: any) => {
        this.deletingId = null;
        this.toast.show(err?.error?.message || `Could not deactivate "${d.name}". Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(d: HomeDestination): void {
    if (this.togglingId !== null) return;
    this.togglingId = d.id;
    this.api.updateHomeDestination(d.id, { ...d, isActive: true } as any).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Destination "${d.name}" (${d.country}) is now visible on the home page.`, 'success', 4000, { title: 'Destination activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate "${d.name}". Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }

  async permanentDelete(d: HomeDestination): Promise<void> {
    const ok = await this.confirmModal.confirm({
      title: 'Permanently delete destination?',
      message: `Delete "${d.name}" (${d.country}) permanently?`,
      detail: 'This will permanently remove the destination from the database. This action cannot be undone.',
    });
    if (!ok) return;
    this.permanentDeletingId = d.id;
    this.api.deleteHomeDestination(d.id).subscribe({
      next: () => {
        this.permanentDeletingId = null;
        this.toast.show(`Destination "${d.name}" has been permanently deleted.`, 'success', 4000, { title: 'Destination deleted' });
        this.load();
      },
      error: (err: any) => {
        this.permanentDeletingId = null;
        this.toast.show(err?.error?.message || `Could not delete "${d.name}". Please try again.`, 'danger', 4000, { title: 'Delete failed' });
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.uploading = true;
    this.api.uploadImage(file).subscribe({
      next: url => { this.form.patchValue({ imageUrl: url }); this.previewBroken = false; this.uploading = false; input.value = ''; },
      error: () => { this.uploading = false; this.toast.show('Image upload failed', 'danger', 4000, { title: 'Upload failed' }); }
    });
  }

  clearImage(input: HTMLInputElement): void {
    this.form.patchValue({ imageUrl: '' });
    this.previewBroken = false;
    input.value = '';
  }

  onPreviewError(event: Event): void {
    this.previewBroken = true;
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }

  onRowImgError(event: Event): void {
    (event.target as HTMLImageElement).style.opacity = '0.3';
  }
}
