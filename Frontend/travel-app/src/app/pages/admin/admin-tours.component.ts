import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Facility, HomeDestination, Tour, TourPackage } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-tours',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Tours</h2>
      <button *ngIf="auth.hasPermission('tours.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add tour</button>
    </div>

    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate tour?</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">This tour will be hidden from customers:</p>
            <p class="fw-bold mb-2">"{{ deleteTarget.name }}"</p>
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

    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ viewMode ? 'Tour details' : (editingId ? 'Edit tour' : 'New tour') }}</h5>
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
                  <input class="form-control" formControlName="name" [class.is-invalid]="isInvalid(form.get('name'))" />
                  <div class="invalid-feedback" *ngIf="isInvalid(form.get('name'))">Tour name is required.</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Country <span class="text-danger">*</span></label>
                  <app-select [options]="destinationOptions" formControlName="destination"></app-select>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('destination'))">Country is required.</div>
                </div>
                <div class="col-md-3"><label class="form-label">Region</label><input class="form-control" formControlName="region" /></div>
                <div class="col-md-6">
                  <label class="form-label">Destination</label>
                  <app-select [options]="homeDestinationOptions" formControlName="homeDestinationId" [searchable]="true"></app-select>
                  <small class="text-muted" *ngIf="!viewMode">Link this tour to a popular destination card shown on the home page.</small>
                </div>
                <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" rows="2" formControlName="description"></textarea></div>
                <div class="col-12"><label class="form-label">Highlights</label><input class="form-control" formControlName="highlights" /></div>
                <div class="col-12">
                  <label class="form-label">Image</label>
                  <input *ngIf="!viewMode" #imgInput type="file" class="form-control" accept="image/*" (change)="onImageSelected($event)" [disabled]="uploading" />
                  <small class="text-muted" *ngIf="uploading">Uploading…</small>
                  <div *ngIf="form.value.imageUrl" class="mt-2 d-flex align-items-start gap-2">
                    <img [src]="form.value.imageUrl" alt="Preview" (error)="onPreviewError($event)" style="max-height:120px;max-width:200px;object-fit:cover;border-radius:6px;border:1px solid #dee2e6;background:#f8f9fa" />
                    <button *ngIf="!viewMode" type="button" class="btn btn-sm btn-outline-danger" (click)="clearImage(imgInput)">Remove</button>
                  </div>
                  <small *ngIf="!viewMode && previewBroken" class="text-danger d-block mt-1">Existing image URL failed to load. Choose a new file to replace it.</small>
                </div>
                <div class="col-12 form-check ms-2"><input class="form-check-input" type="checkbox" formControlName="isActive" id="isActive" /><label class="form-check-label" for="isActive">Active</label></div>

                <ng-container>
                  <div class="col-12"><hr class="my-2" /></div>
                  <div class="col-12 d-flex align-items-center justify-content-between">
                    <h6 class="fw-bold mb-0"><i class="bi bi-box-seam me-2"></i>Packages</h6>
                    <button *ngIf="!viewMode" type="button" class="btn btn-sm btn-outline-primary" (click)="addPackage()" [disabled]="!tourDetailsValid()" [title]="tourDetailsValid() ? 'Add a pricing package' : 'Fill in Name and Country first'">
                      <i class="bi bi-plus-lg me-1"></i>Add package
                    </button>
                  </div>
                  <div class="col-12">
                    <div *ngIf="!tourDetailsValid()" class="alert alert-warning d-flex align-items-center mb-2 py-2 px-3">
                      <i class="bi bi-info-circle-fill me-2"></i>
                      <span class="small">Enter the tour <strong>Name</strong> and <strong>Country</strong> above to enable adding packages.</span>
                    </div>
                    <div *ngIf="tourDetailsValid() && packages.length === 0" class="alert alert-light border d-flex align-items-center mb-2 py-2 px-3">
                      <i class="bi bi-lightbulb me-2 text-primary"></i>
                      <span class="small text-muted">No packages yet — click <strong>"Add package"</strong> to define pricing options, or skip and add them later.</span>
                    </div>
                    <div formArrayName="packages">
                      <div *ngFor="let pkg of packages.controls; let i = index" [formGroupName]="i" class="border rounded p-3 mb-2 position-relative">
                        <button *ngIf="!viewMode" type="button" class="btn btn-sm btn-link text-danger position-absolute top-0 end-0" (click)="removePackage(i)" title="Remove package">
                          <i class="bi bi-x-lg"></i>
                        </button>
                        <div class="row g-2">
                          <div class="col-md-6">
                            <label class="form-label small mb-1">Package name <span class="text-danger">*</span></label>
                            <input class="form-control form-control-sm" formControlName="name" placeholder="e.g. 5D/4N Deluxe" [class.is-invalid]="isInvalid(pkg.get('name'))" />
                            <div class="invalid-feedback" *ngIf="isInvalid(pkg.get('name'))">Package name is required.</div>
                          </div>
                          <div class="col-md-3">
                            <label class="form-label small mb-1">Days <span class="text-danger">*</span></label>
                            <input type="number" min="1" class="form-control form-control-sm" formControlName="durationDays" [class.is-invalid]="isInvalid(pkg.get('durationDays'))" />
                            <div class="invalid-feedback" *ngIf="isInvalid(pkg.get('durationDays'))">Must be at least 1.</div>
                          </div>
                          <div class="col-md-3">
                            <label class="form-label small mb-1">Nights <span class="text-danger">*</span></label>
                            <input type="number" min="0" class="form-control form-control-sm" formControlName="durationNights" [class.is-invalid]="isInvalid(pkg.get('durationNights'))" />
                            <div class="invalid-feedback" *ngIf="isInvalid(pkg.get('durationNights'))">Must be 0 or more.</div>
                          </div>
                          <div class="col-md-3">
                            <label class="form-label small mb-1">Price / person (₹) <span class="text-danger">*</span></label>
                            <input type="number" min="0" class="form-control form-control-sm" formControlName="pricePerPerson" [class.is-invalid]="isInvalid(pkg.get('pricePerPerson'))" />
                            <div class="invalid-feedback" *ngIf="isInvalid(pkg.get('pricePerPerson'))">Price is required.</div>
                          </div>
                          <div class="col-md-3">
                            <label class="form-label small mb-1">Child price (₹)</label>
                            <input type="number" min="0" class="form-control form-control-sm" formControlName="childPrice" />
                          </div>
                          <div class="col-md-3">
                            <label class="form-label small mb-1">Min persons <span class="text-danger">*</span></label>
                            <input type="number" min="1" class="form-control form-control-sm" formControlName="minPersons" [class.is-invalid]="isInvalid(pkg.get('minPersons'))" />
                            <div class="invalid-feedback" *ngIf="isInvalid(pkg.get('minPersons'))">At least 1.</div>
                          </div>
                          <div class="col-md-3">
                            <label class="form-label small mb-1">Max persons <span class="text-danger">*</span></label>
                            <input type="number" min="1" class="form-control form-control-sm" formControlName="maxPersons" [class.is-invalid]="isInvalid(pkg.get('maxPersons'))" />
                            <div class="invalid-feedback" *ngIf="isInvalid(pkg.get('maxPersons'))">At least 1.</div>
                          </div>
                          <div class="col-12">
                            <label class="form-label small mb-1">Description</label>
                            <input class="form-control form-control-sm" formControlName="description" placeholder="Short summary of what's included" />
                          </div>
                          <div class="col-md-6">
                            <label class="form-label small mb-1">Inclusions</label>
                            <input class="form-control form-control-sm" formControlName="inclusions" placeholder="e.g. Hotel, breakfast, transport" />
                          </div>
                          <div class="col-md-6">
                            <label class="form-label small mb-1">Exclusions</label>
                            <input class="form-control form-control-sm" formControlName="exclusions" placeholder="e.g. Flights, personal expenses" />
                          </div>
                          <div class="col-12">
                            <label class="form-label small mb-1">Facilities</label>
                            <div *ngIf="facilities.length === 0" class="text-muted small">No facilities defined yet — add them from the Facilities page.</div>
                            <div class="d-flex flex-wrap gap-2">
                              <ng-container *ngFor="let f of facilities">
                                <div class="form-check" *ngIf="!viewMode || isFacilitySelected(pkg, f.id)">
                                  <input class="form-check-input" type="checkbox"
                                         [checked]="isFacilitySelected(pkg, f.id)"
                                         (change)="toggleFacility(pkg, f.id)"
                                         [id]="'pkg' + i + 'fac' + f.id"
                                         [disabled]="viewMode" />
                                  <label class="form-check-label small" [attr.for]="'pkg' + i + 'fac' + f.id">
                                    {{ f.name }} <span class="text-muted">(₹{{ f.cost }})</span>
                                  </label>
                                </div>
                              </ng-container>
                              <div *ngIf="viewMode && !hasAnyFacility(pkg)" class="text-muted small fst-italic">No facilities included.</div>
                            </div>
                          </div>
                          <div class="col-md-6 form-check ms-2 mt-2">
                            <input class="form-check-input" type="checkbox" formControlName="isCustomizable" [id]="'pkgCust' + i" />
                            <label class="form-check-label small" [attr.for]="'pkgCust' + i">Customizable</label>
                          </div>

                          <div class="col-12 mt-2">
                            <div class="d-flex align-items-center justify-content-between mb-1">
                              <label class="form-label small mb-0 fw-semibold"><i class="bi bi-calendar3 me-1"></i>Day-by-day itinerary</label>
                              <button *ngIf="!viewMode" type="button" class="btn btn-sm btn-outline-primary" (click)="addItineraryRow(pkg)">
                                <i class="bi bi-plus-lg me-1"></i>Add day
                              </button>
                            </div>
                            <div formArrayName="itineraries">
                              <div *ngIf="itinerariesOf(pkg).length === 0" class="text-muted small fst-italic">No itinerary days yet.</div>
                              <div *ngFor="let it of itinerariesOf(pkg).controls; let j = index" [formGroupName]="j" class="row g-2 align-items-start mb-2 border-start border-2 ps-2">
                                <div class="col-md-1">
                                  <input type="number" min="1" class="form-control form-control-sm" formControlName="dayNumber" placeholder="Day" [class.is-invalid]="isInvalid(it.get('dayNumber'))" />
                                  <div class="text-danger small mt-1" *ngIf="isInvalid(it.get('dayNumber'))">Day is required.</div>
                                </div>
                                <div class="col-md-3">
                                  <input class="form-control form-control-sm" formControlName="title" placeholder="Title" [class.is-invalid]="isInvalid(it.get('title'))" />
                                  <div class="text-danger small mt-1" *ngIf="isInvalid(it.get('title'))">Title is required.</div>
                                </div>
                                <div class="col-md-3">
                                  <input class="form-control form-control-sm" formControlName="location" placeholder="Location" [class.is-invalid]="isInvalid(it.get('location'))" />
                                  <div class="text-danger small mt-1" *ngIf="isInvalid(it.get('location'))">Location is required.</div>
                                </div>
                                <div class="col-md-4">
                                  <input class="form-control form-control-sm" formControlName="description" placeholder="Description" [class.is-invalid]="isInvalid(it.get('description'))" />
                                  <div class="text-danger small mt-1" *ngIf="isInvalid(it.get('description'))">Description is required.</div>
                                </div>
                                <div class="col-md-1 text-end">
                                  <button *ngIf="!viewMode" type="button" class="btn btn-sm btn-link text-danger p-0" (click)="removeItineraryRow(pkg, j)" title="Remove day">
                                    <i class="bi bi-x-lg"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()">
                <i class="bi bi-x-lg me-1"></i>{{ viewMode ? 'Close' : 'Cancel' }}
              </button>
              <button *ngIf="!viewMode" class="btn btn-primary" [disabled]="form.invalid" [title]="form.invalid ? 'Fill in all required fields to save' : 'Save tour'">
                <i class="bi bi-check2-circle me-1"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label small text-muted mb-1">Search tour name</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterName" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Country</label>
          <app-select size="sm" [options]="destinationFilterOptions" [(ngModel)]="filterDestination" (valueChange)="onFilterChange()"></app-select>
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
              <th class="sortable" (click)="toggleSort('destination')">Country <i class="bi" [ngClass]="sortIcon('destination')"></i></th>
              <th>Destination</th>
              <th class="sortable" (click)="toggleSort('region')">Region <i class="bi" [ngClass]="sortIcon('region')"></i></th>
              <th class="sortable" (click)="toggleSort('packages')">Packages <i class="bi" [ngClass]="sortIcon('packages')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of pagedTours()">
              <td><strong>{{ t.name }}</strong></td>
              <td><span class="badge bg-secondary">{{ t.destination }}</span></td>
              <td>
                <span *ngIf="linkedDestination(t.id) as dest" class="badge bg-info text-dark">{{ dest.name }}</span>
                <span *ngIf="!linkedDestination(t.id)" class="text-muted small">—</span>
              </td>
              <td>{{ t.region }}</td>
              <td>
                <ng-container *ngIf="activePackageCount(t) as count">
                  <span *ngIf="count > 0">{{ count }} package{{ count === 1 ? '' : 's' }}</span>
                </ng-container>
                <span *ngIf="activePackageCount(t) === 0" class="text-muted">—</span>
              </td>
              <td><span class="badge" [class.bg-success]="t.isActive" [class.bg-secondary]="!t.isActive">{{ t.isActive ? 'Active' : 'Hidden' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(t)" title="View tour details"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="auth.hasPermission('tours.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(t)">Edit</button>
                  <button *ngIf="t.isActive && auth.hasPermission('tours.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(t)" [disabled]="togglingId === t.id" title="Hide this tour from customers">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!t.isActive && auth.hasPermission('tours.delete')" class="btn btn-sm btn-outline-success" (click)="activate(t)" [disabled]="togglingId === t.id" title="Make this tour visible again">
                    <span *ngIf="togglingId === t.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== t.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredTours().length === 0"><td colspan="7" class="text-center text-muted py-3">{{ tours.length === 0 ? 'No tours yet.' : 'No tours match the filters.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredTours().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filteredTours().length }}</small>
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
export class AdminToursComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  tours: Tour[] = [];
  editingId: number | null = null;
  viewMode = false;
  uploading = false;
  previewBroken = false;
  formError = '';

  deleteTarget: Tour | null = null;
  deleting = false;
  togglingId: number | null = null;

  filterName = '';
  filterDestination = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  sortKey: 'name' | 'destination' | 'region' | 'packages' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  readonly destinationFilterOptions = [
    { value: '', label: 'All countries' },
    { value: 'India', label: 'India' },
    { value: 'Bhutan', label: 'Bhutan' },
    { value: 'Nepal', label: 'Nepal' }
  ];
  readonly destinationOptions = [
    { value: 'India', label: 'India' },
    { value: 'Bhutan', label: 'Bhutan' },
    { value: 'Nepal', label: 'Nepal' }
  ];
  readonly statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Hidden' }
  ];

  onFilterStatusChange(v: string | number): void {
    this.filterStatus = v as 'all' | 'active' | 'inactive';
    this.onFilterChange();
  }

  facilities: Facility[] = [];
  homeDestinations: HomeDestination[] = [];
  originalHomeDestinationId: number | null = null;

  get homeDestinationOptions(): { value: number | string; label: string }[] {
    return [
      { value: '', label: '— None —' },
      ...this.homeDestinations.map(d => ({ value: d.id, label: d.name }))
    ];
  }

  linkedDestination(tourId: number): HomeDestination | undefined {
    return this.homeDestinations.find(d => d.tourId === tourId);
  }

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  page = 1;
  readonly pageSize = 10;

  form = this.fb.group({
    name: ['', Validators.required],
    destination: ['India', Validators.required],
    region: [''],
    description: [''],
    highlights: [''],
    imageUrl: [''],
    isActive: [true],
    homeDestinationId: [null as any],
    packages: this.fb.array([])
  });

  get packages(): FormArray { return this.form.get('packages') as FormArray; }

  private removedPackageIds: number[] = [];

  private removedItineraryIds = new Map<AbstractControl, number[]>();

  private buildPackageGroup(initial?: Partial<TourPackage>): FormGroup {
    const itinerariesArr = this.fb.array(
      (initial?.itineraries || []).map(it => this.buildItineraryGroup(it))
    );
    return this.fb.group({
      id: [initial?.id ?? null],
      name: [initial?.name ?? '', Validators.required],
      durationDays: [initial?.durationDays ?? 1, [Validators.required, Validators.min(1)]],
      durationNights: [initial?.durationNights ?? 0, [Validators.required, Validators.min(0)]],
      pricePerPerson: [initial?.pricePerPerson ?? 0, [Validators.required, Validators.min(0)]],
      childPrice: [initial?.childPrice ?? 0, [Validators.min(0)]],
      minPersons: [initial?.minPersons ?? 1, [Validators.required, Validators.min(1)]],
      maxPersons: [initial?.maxPersons ?? 10, [Validators.required, Validators.min(1)]],
      description: [initial?.description ?? ''],
      inclusions: [initial?.inclusions ?? ''],
      exclusions: [initial?.exclusions ?? ''],
      facilityIds: this.fb.control<number[]>((initial?.facilities || []).map(f => f.facilityId)),
      isCustomizable: [initial?.isCustomizable ?? true],
      itineraries: itinerariesArr
    });
  }

  private buildItineraryGroup(initial?: any): FormGroup {
    return this.fb.group({
      id: [initial?.id ?? null],
      dayNumber: [initial?.dayNumber ?? 1, [Validators.required, Validators.min(1)]],
      title: [initial?.title ?? '', Validators.required],
      location: [initial?.location ?? '', Validators.required],
      description: [initial?.description ?? '', Validators.required]
    });
  }

  itinerariesOf(pkg: AbstractControl): FormArray {
    return pkg.get('itineraries') as FormArray;
  }

  addItineraryRow(pkg: AbstractControl): void {
    const arr = this.itinerariesOf(pkg);
    const nextDay = arr.length === 0 ? 1 : Math.max(...arr.controls.map(c => Number(c.get('dayNumber')?.value) || 0)) + 1;
    arr.push(this.buildItineraryGroup({ dayNumber: nextDay }));
  }

  removeItineraryRow(pkg: AbstractControl, index: number): void {
    const arr = this.itinerariesOf(pkg);
    const id = arr.at(index)?.get('id')?.value as number | null;
    if (id) {
      const list = this.removedItineraryIds.get(pkg) || [];
      list.push(id);
      this.removedItineraryIds.set(pkg, list);
    }
    arr.removeAt(index);
  }

  isFacilitySelected(pkg: AbstractControl, facilityId: number): boolean {
    const ids = (pkg.get('facilityIds')?.value as number[]) || [];
    return ids.includes(facilityId);
  }

  hasAnyFacility(pkg: AbstractControl): boolean {
    const ids = (pkg.get('facilityIds')?.value as number[]) || [];
    return ids.length > 0;
  }

  toggleFacility(pkg: AbstractControl, facilityId: number): void {
    const ctrl = pkg.get('facilityIds');
    if (!ctrl) return;
    const ids = (ctrl.value as number[]) || [];
    ctrl.setValue(ids.includes(facilityId) ? ids.filter(x => x !== facilityId) : [...ids, facilityId]);
    ctrl.markAsDirty();
  }

  addPackage(): void {
    if (!this.tourDetailsValid()) return;
    this.packages.push(this.buildPackageGroup());
    setTimeout(() => {
      const el = this.modalBodyRef?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 0);
  }

  removePackage(i: number): void {
    const grp = this.packages.at(i);
    const id = grp?.get('id')?.value as number | null;
    if (id) this.removedPackageIds.push(id);
    if (grp) this.removedItineraryIds.delete(grp);
    this.packages.removeAt(i);
  }

  tourDetailsValid(): boolean {
    const name = (this.form.get('name')?.value ?? '').toString().trim();
    const dest = (this.form.get('destination')?.value ?? '').toString().trim();
    return name.length > 0 && dest.length > 0;
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  activePackageCount(t: Tour): number {
    return (t.packages || []).filter(p => p.isActive).length;
  }

  private markAllTouched(): void {
    this.form.markAllAsTouched();
  }

  ngOnInit(): void {
    this.load();
    this.api.listFacilities().subscribe({ next: fs => this.facilities = fs.filter(f => f.isActive) });
    this.api.listHomeDestinations(false).subscribe({ next: ds => this.homeDestinations = ds });
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
    const onlyAssigned = !this.auth.isAdmin();
    this.api.listTours(undefined, false, undefined, undefined, onlyAssigned).subscribe({
      next: ts => {
        this.tours = ts;
        const total = this.totalPages();
        if (this.page > total) this.page = total;
        if (this.page < 1) this.page = 1;
      }
    });
  }

  filteredTours(): Tour[] {
    const q = this.filterName.trim().toLowerCase();
    const filtered = this.tours.filter(t => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      if (this.filterDestination && t.destination !== this.filterDestination) return false;
      if (this.filterStatus === 'active' && !t.isActive) return false;
      if (this.filterStatus === 'inactive' && t.isActive) return false;
      return true;
    });
    if (!this.sortKey) return filtered;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = this.tourSortValue(a);
      const bv = this.tourSortValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return av.toString().localeCompare(bv.toString()) * dir;
    });
  }

  private tourSortValue(t: Tour): string | number | null {
    switch (this.sortKey) {
      case 'name': return t.name;
      case 'destination': return t.destination;
      case 'region': return t.region || '';
      case 'packages': return this.activePackageCount(t);
      case 'status': return t.isActive ? 1 : 0;
      default: return null;
    }
  }

  toggleSort(key: 'name' | 'destination' | 'region' | 'packages' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'destination' | 'region' | 'packages' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  filtersApplied(): boolean {
    return !!this.filterName || !!this.filterDestination || this.filterStatus !== 'all';
  }

  onFilterChange(): void { this.page = 1; }

  clearFilters(): void {
    this.filterName = '';
    this.filterDestination = '';
    this.filterStatus = 'all';
    this.page = 1;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTours().length / this.pageSize));
  }

  pagedTours(): Tour[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredTours().slice(start, start + this.pageSize);
  }

  pageStart(): number {
    const len = this.filteredTours().length;
    if (len === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredTours().length);
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
    scrollAdminContentTop();
  }

  startCreate(): void {
    this.editingId = 0;
    this.previewBroken = false;
    this.formError = '';
    this.originalHomeDestinationId = null;
    this.packages.clear();
    this.form.reset({ name: '', destination: 'India', region: '', description: '', highlights: '', imageUrl: '', isActive: true, homeDestinationId: null });
    this.lockBody();
  }

  edit(t: Tour): void {
    this.editingId = t.id;
    this.viewMode = false;
    this.previewBroken = false;
    this.formError = '';
    this.packages.clear();
    this.removedPackageIds = [];
    const linked = this.homeDestinations.find(d => d.tourId === t.id);
    this.originalHomeDestinationId = linked?.id ?? null;
    this.form.reset({ name: t.name, destination: t.destination, region: t.region || '', description: t.description || '', highlights: t.highlights || '', imageUrl: t.imageUrl || '', isActive: t.isActive, homeDestinationId: this.originalHomeDestinationId });
    this.form.enable({ emitEvent: false });
    this.lockBody();
    this.api.listPackages(t.id).subscribe({
      next: pkgs => (pkgs || []).forEach((p: TourPackage) => this.packages.push(this.buildPackageGroup(p)))
    });
  }

  view(t: Tour): void {
    this.editingId = t.id;
    this.viewMode = true;
    this.previewBroken = false;
    this.formError = '';
    this.packages.clear();
    this.removedPackageIds = [];
    const linked = this.homeDestinations.find(d => d.tourId === t.id);
    this.originalHomeDestinationId = linked?.id ?? null;
    this.form.reset({ name: t.name, destination: t.destination, region: t.region || '', description: t.description || '', highlights: t.highlights || '', imageUrl: t.imageUrl || '', isActive: t.isActive, homeDestinationId: this.originalHomeDestinationId });
    this.lockBody();
    this.api.listPackages(t.id).subscribe({
      next: pkgs => {
        (pkgs || []).forEach((p: TourPackage) => this.packages.push(this.buildPackageGroup(p)));
        this.form.disable({ emitEvent: false });
      }
    });
    this.form.disable({ emitEvent: false });
  }

  cancel(): void {
    this.editingId = null;
    this.viewMode = false;
    this.formError = '';
    this.packages.clear();
    this.removedPackageIds = [];
    this.removedItineraryIds.clear();
    this.originalHomeDestinationId = null;
    this.form.enable({ emitEvent: false });
    this.unlockBody();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.uploading = true;
    this.api.uploadImage(file).subscribe({
      next: url => { this.form.patchValue({ imageUrl: url }); this.previewBroken = false; this.uploading = false; input.value = ''; },
      error: () => { this.uploading = false; this.toast.show('Image upload failed', 'danger'); }
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

  save(): void {
    if (this.form.invalid) { this.markAllTouched(); return; }
    this.formError = '';
    const { packages, homeDestinationId: rawHdId, ...tourFields } = this.form.getRawValue() as any;
    const newHdId: number | null = rawHdId ? Number(rawHdId) : null;
    const pkgRows: any[] = packages || [];
    const pkgControls = this.packages.controls;

    const tourName = (tourFields.name || '').toString().trim();
    const tourDest = (tourFields.destination || '').toString().trim();
    const label = `"${tourName}" (${tourDest})`;

    const stripItineraries = (row: any) => { const { itineraries: _omit, ...rest } = row; return rest; };

    const syncItineraries = (ctrl: AbstractControl, packageId: number) => {
      const removed = this.removedItineraryIds.get(ctrl) || [];
      const rows = (this.itinerariesOf(ctrl).getRawValue() as any[]) || [];
      const newRows = rows.filter(r => !r.id);
      const deleteCalls = removed.map(id => this.api.deleteItinerary(id));
      const addCalls = newRows.map(r => this.api.addItinerary({
        tourPackageId: packageId,
        dayNumber: r.dayNumber,
        title: r.title,
        location: r.location,
        description: r.description
      }));
      return [...deleteCalls, ...addCalls];
    };

    const createPackageWithItineraries = (row: any, ctrl: AbstractControl, tourId: number) => new Promise<void>((resolve, reject) => {
      this.api.createPackage({ ...stripItineraries(row), tourId, isActive: true }).subscribe({
        next: (pkg: any) => {
          const calls = syncItineraries(ctrl, pkg.id);
          if (calls.length === 0) { resolve(); return; }
          forkJoin(calls).subscribe({ next: () => resolve(), error: () => reject() });
        },
        error: () => reject()
      });
    });

    const linkHd = (tourId: number): Promise<void> => {
      const oldId = this.originalHomeDestinationId;
      if (newHdId === oldId) return Promise.resolve();
      const calls: any[] = [];
      if (oldId) {
        const d = this.homeDestinations.find(x => x.id === oldId);
        if (d) calls.push(this.api.updateHomeDestination(d.id, { ...d, tourId: null } as any));
      }
      if (newHdId) {
        const d = this.homeDestinations.find(x => x.id === newHdId);
        if (d) calls.push(this.api.updateHomeDestination(d.id, { ...d, tourId } as any));
      }
      if (calls.length === 0) return Promise.resolve();
      return new Promise<void>(resolve => forkJoin(calls).subscribe({
        next: () => { this.api.listHomeDestinations(false).subscribe({ next: ds => this.homeDestinations = ds }); resolve(); },
        error: () => resolve()
      }));
    };

    if (this.editingId) {
      const tourId = this.editingId;
      this.api.updateTour(tourId, tourFields).subscribe({
        next: () => {
          const deletes = this.removedPackageIds.map(id => this.api.deletePackage(id));
          const updates = pkgRows
            .filter(p => p.id)
            .map(p => this.api.updatePackage(p.id, { ...stripItineraries(p), tourId, isActive: true }));
          const itinerarySyncs: any[] = [];
          pkgRows.forEach((p, idx) => {
            if (p.id) itinerarySyncs.push(...syncItineraries(pkgControls[idx], p.id));
          });
          const newCreates = pkgRows
            .map((p, idx) => ({ p, ctrl: pkgControls[idx] }))
            .filter(({ p }) => !p.id)
            .map(({ p, ctrl }) => createPackageWithItineraries(p, ctrl, tourId));

          const otherCalls = [...deletes, ...updates, ...itinerarySyncs];
          const otherPromise: Promise<unknown> = otherCalls.length === 0
            ? Promise.resolve()
            : new Promise((resolve, reject) => forkJoin(otherCalls).subscribe({ next: () => resolve(null), error: () => reject() }));

          Promise.all([otherPromise, ...newCreates]).then(() => linkHd(tourId)).then(() => {
            const summary = `Tour ${label} saved — ${pkgRows.length} package${pkgRows.length === 1 ? '' : 's'}` + (this.removedPackageIds.length ? `, ${this.removedPackageIds.length} removed.` : '.');
            this.toast.show(summary, 'success', 4000, { title: 'Tour saved' });
            this.finishEdit();
          }).catch(() => {
            this.toast.show(`Tour ${label} saved, but some packages or itineraries failed to sync.`, 'danger', 4000, { title: 'Partial save' });
            this.finishEdit();
          });
        },
        error: (err: any) => { this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.'; setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0); }
      });
      return;
    }

    this.api.createTour(tourFields).subscribe({
      next: created => {
        const finish = () => linkHd(created.id).then(() => {
          this.toast.show(pkgRows.length === 0
            ? `New tour ${label} added.`
            : `New tour ${label} added with ${pkgRows.length} package${pkgRows.length === 1 ? '' : 's'}.`,
            'success', 4000, { title: 'Tour created' });
          this.finishEdit();
        });
        if (pkgRows.length === 0) { finish(); return; }
        const newCreates = pkgRows.map((p, idx) => createPackageWithItineraries(p, pkgControls[idx], created.id));
        Promise.all(newCreates).then(() => finish()).catch(() => {
          this.toast.show(`Tour ${label} created, but some packages failed to save.`, 'danger', 4000, { title: 'Partial save' });
          this.finishEdit();
        });
      },
      error: (err: any) => { this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.'; setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0); }
    });
  }

  private finishEdit(): void {
    this.editingId = null;
    this.originalHomeDestinationId = null;
    this.packages.clear();
    this.removedPackageIds = [];
    this.removedItineraryIds.clear();
    this.unlockBody();
    this.load();
    this.api.listHomeDestinations(false).subscribe({ next: ds => this.homeDestinations = ds });
  }

  remove(t: Tour): void {
    this.deleteTarget = t;
    this.lockBody();
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.deleteTarget = null;
    if (this.editingId === null) this.unlockBody();
  }

  confirmDelete(): void {
    const t = this.deleteTarget;
    if (!t || this.deleting) return;
    this.deleting = true;
    this.api.updateTour(t.id, { ...t, isActive: false } as any).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteTarget = null;
        if (this.editingId === null) this.unlockBody();
        this.toast.show(`Tour "${t.name}" (${t.destination}) is now hidden from customers.`, 'info', 4000, { title: 'Tour deactivated' });
        this.load();
      },
      error: () => {
        this.deleting = false;
        this.toast.show(`Could not deactivate "${t.name}". Please try again.`, 'danger', 4000, { title: 'Deactivate failed' });
      }
    });
  }

  activate(t: Tour): void {
    if (this.togglingId !== null) return;
    this.togglingId = t.id;
    this.api.updateTour(t.id, { ...t, isActive: true } as any).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Tour "${t.name}" (${t.destination}) is now visible to customers.`, 'success', 4000, { title: 'Tour activated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not activate "${t.name}". Please try again.`, 'danger', 4000, { title: 'Activate failed' });
      }
    });
  }
}
