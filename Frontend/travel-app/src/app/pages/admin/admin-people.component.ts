import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SystemRolesService } from '../../core/services/system-roles.service';
import { ToastService } from '../../core/services/toast.service';
import { AppRole, City, Country, Department, Designation, GeoState } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';
import { Observable, map, of, switchMap, timer } from 'rxjs';

function emailExistsValidator(auth: AuthService, skipValue?: string): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = (control.value as string) || '';
    if (!email || !email.includes('@')) return of(null);
    if (skipValue && email.toLowerCase() === skipValue.toLowerCase()) return of(null);
    return timer(500).pipe(
      switchMap(() => auth.checkEmail(email)),
      map(r => r.data?.exists ? { emailTaken: true } : null)
    );
  };
}

function phoneExistsValidator(auth: AuthService, skipValue?: string): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const phone = (control.value as string) || '';
    if (!phone || phone.length < 7) return of(null);
    if (skipValue && phone === skipValue) return of(null);
    return timer(500).pipe(
      switchMap(() => auth.checkPhone(phone)),
      map(r => r.data?.exists ? { phoneTaken: true } : null)
    );
  };
}

interface Person {
  id: number;
  personType: 'staff' | 'customer';
  fullName: string;
  email: string;
  phone?: string;
  appRoleId?: number | null;
  appRoleName?: string;
  systemRole?: string;
  isActive: boolean;
  joinedAt?: string;
  department?: string;
  designation?: string;
  salary?: number;
  city?: string;
  country?: string;
  totalBookings?: number;
  totalSpent?: number;
  address?: string;
  state?: string;
  postalCode?: string;
  dateOfBirth?: string;
  gender?: string;
  idProofType?: string;
  idProofNumber?: string;
}

@Component({
  selector: 'app-admin-people',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">People Management</h2>
      <button *ngIf="auth.hasPermission('customers.create')" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add person</button>
    </div>

    <!-- View modal -->
    <div *ngIf="viewTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="viewTarget" class="modal fade show d-block" tabindex="-1" (click)="onViewBackdrop($event)">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-person me-2"></i>{{ viewTarget.fullName }}</h5>
          </div>
          <div class="modal-body">
            <dl class="row mb-0 small">
              <dt class="col-sm-4 text-muted">Email</dt><dd class="col-sm-8">{{ viewTarget.email }}</dd>
              <dt class="col-sm-4 text-muted">Phone</dt><dd class="col-sm-8">{{ viewTarget.phone || '—' }}</dd>
              <dt class="col-sm-4 text-muted">Role</dt>
              <dd class="col-sm-8">
                <span *ngIf="viewTarget.appRoleName" class="badge bg-primary">{{ viewTarget.appRoleName }}</span>
                <span *ngIf="!viewTarget.appRoleName" class="text-muted">—</span>
              </dd>
              <ng-container *ngIf="viewTarget.personType === 'staff'">
                <dt class="col-sm-4 text-muted">Department</dt><dd class="col-sm-8">{{ viewTarget.department || '—' }}</dd>
                <dt class="col-sm-4 text-muted">Designation</dt><dd class="col-sm-8">{{ viewTarget.designation || '—' }}</dd>
                <dt class="col-sm-4 text-muted">Salary</dt><dd class="col-sm-8">{{ viewTarget.salary != null ? ('₹ ' + (viewTarget.salary | number:'1.2-2')) : '—' }}</dd>
              </ng-container>
              <ng-container *ngIf="viewTarget.personType === 'customer'">
                <dt class="col-sm-4 text-muted">City</dt><dd class="col-sm-8">{{ viewTarget.city || '—' }}</dd>
                <dt class="col-sm-4 text-muted">Country</dt><dd class="col-sm-8">{{ viewTarget.country || '—' }}</dd>
                <dt class="col-sm-4 text-muted">Bookings</dt><dd class="col-sm-8">{{ viewTarget.totalBookings ?? 0 }}</dd>
                <dt class="col-sm-4 text-muted">Total spent</dt><dd class="col-sm-8">{{ viewTarget.totalSpent != null ? ('₹ ' + (viewTarget.totalSpent | number:'1.0-0')) : '—' }}</dd>
              </ng-container>
              <dt class="col-sm-4 text-muted">Joined</dt><dd class="col-sm-8">{{ viewTarget.joinedAt | date:'mediumDate' }}</dd>
              <dt class="col-sm-4 text-muted">Status</dt>
              <dd class="col-sm-8"><span class="badge" [class.bg-success]="viewTarget.isActive" [class.bg-secondary]="!viewTarget.isActive">{{ viewTarget.isActive ? 'Active' : 'Disabled' }}</span></dd>
            </dl>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" (click)="closeView()"><i class="bi bi-x-lg me-1"></i>Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Deactivate confirmation -->
    <div *ngIf="deleteTarget" class="modal-backdrop fade show"></div>
    <div *ngIf="deleteTarget" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold text-danger"><i class="bi bi-eye-slash me-2"></i>Deactivate person?</h5></div>
          <div class="modal-body">
            <p class="mb-1">This person will no longer be able to log in:</p>
            <p class="fw-bold mb-2">"{{ deleteTarget.fullName }}" — {{ deleteTarget.email }}</p>
            <p class="text-muted small mb-0">Their records stay in the database. You can reactivate them at any time.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" (click)="cancelDelete()" [disabled]="deleting"><i class="bi bi-x-lg me-1"></i>Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              <span *ngIf="deleting" class="spinner-border spinner-border-sm me-2"></span>{{ deleting ? 'Deactivating…' : 'Deactivate' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit form modal -->
    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold">{{ editingId ? 'Edit person' : 'New person' }}</h5></div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body" #modalBody>
              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="formError">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ formError }}</div>
                <button type="button" class="btn-close ms-2" (click)="formError = ''"></button>
              </div>

              <!-- Basic info -->
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Full name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="fullName" [class.is-invalid]="isInvalid(form.get('fullName'))" />
                  <div class="invalid-feedback">Full name is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <input type="email" class="form-control" formControlName="email" [class.is-invalid]="isInvalid(form.get('email'))" />
                    <span class="input-group-text" *ngIf="form.get('email')?.pending">
                      <span class="spinner-border spinner-border-sm text-secondary"></span>
                    </span>
                  </div>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('email')) && form.get('email')?.errors?.['required']">Email is required.</div>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('email')) && form.get('email')?.errors?.['email']">Enter a valid email address.</div>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('email')) && form.get('email')?.errors?.['emailTaken']">This email is already registered.</div>
                </div>
                <div class="col-md-6" *ngIf="editingId === 0">
                  <label class="form-label">Password <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <input [type]="showPassword ? 'text' : 'password'" class="form-control" formControlName="password"
                           placeholder="At least 6 characters" [class.is-invalid]="isInvalid(form.get('password'))" autocomplete="new-password" />
                    <button type="button" class="btn btn-outline-secondary" (click)="showPassword = !showPassword" tabindex="-1">
                      <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                    </button>
                    <div class="invalid-feedback">At least 6 characters required.</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <input class="form-control" formControlName="phone" [class.is-invalid]="isInvalid(form.get('phone'))" />
                    <span class="input-group-text" *ngIf="form.get('phone')?.pending">
                      <span class="spinner-border spinner-border-sm text-secondary"></span>
                    </span>
                  </div>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('phone')) && form.get('phone')?.errors?.['required']">Phone is required.</div>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('phone')) && form.get('phone')?.errors?.['phoneTaken']">This phone number is already registered.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Role <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="appRoleId" [class.is-invalid]="isInvalid(form.get('appRoleId'))"
                          (change)="onRoleChange()">
                    <option [ngValue]="null">— Select role —</option>
                    <option *ngFor="let r of roles" [ngValue]="r.id">{{ r.name }}</option>
                  </select>
                  <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('appRoleId'))">Role is required.</div>
                </div>
                <!-- Access level — SuperAdmin only, staff type only -->
                <div class="col-md-6" *ngIf="auth.isSuperAdmin() && formType === 'staff'">
                  <label class="form-label">Access level</label>
                  <select class="form-select" formControlName="systemRole">
                    <option value="Staff">Staff Member</option>
                    <option value="Admin">Administrator</option>
                  </select>
                  <div class="text-muted small mt-1" *ngIf="editingId">
                    <i class="bi bi-info-circle me-1"></i>
                    User must log out and back in for this change to take effect.
                  </div>
                </div>
              </div>

              <div *ngIf="editingId === 0 && !formType" class="alert alert-info small mt-3 mb-0">
                <i class="bi bi-info-circle me-1"></i>Select a role above to see additional fields.
              </div>

              <!-- Staff-specific fields -->
              <ng-container *ngIf="formType === 'staff'">
                <hr class="my-3" />
                <h6 class="fw-semibold mb-3 text-muted small text-uppercase">Work Details</h6>
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Department <span class="text-danger">*</span></label>
                    <select *ngIf="!deptIsOther" class="form-select" formControlName="department"
                            [class.is-invalid]="isInvalid(form.get('department'))" (change)="onDeptChange()">
                      <option value="">— Select —</option>
                      <option *ngFor="let d of departments" [value]="d.name">{{ d.name }}</option>
                      <option value="__other__">Other…</option>
                    </select>
                    <div *ngIf="deptIsOther" class="input-group">
                      <input type="text" class="form-control" placeholder="Department name…"
                             [value]="form.get('department')?.value" (input)="onCustomDeptInput($event)"
                             [class.is-invalid]="isInvalid(form.get('department'))" />
                      <button type="button" class="btn btn-outline-secondary" (click)="clearDeptOther()"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('department'))">Department is required.</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Designation <span class="text-danger">*</span></label>
                    <select *ngIf="!desigIsOther" class="form-select" formControlName="designation"
                            [class.is-invalid]="isInvalid(form.get('designation'))" (change)="onDesigChange()">
                      <option value="">— Select —</option>
                      <option *ngFor="let d of formDesignations" [value]="d.name">{{ d.name }}</option>
                      <option value="__other__">Other…</option>
                    </select>
                    <div *ngIf="desigIsOther" class="input-group">
                      <input type="text" class="form-control" placeholder="Designation name…"
                             [value]="form.get('designation')?.value" (input)="onCustomDesigInput($event)"
                             [class.is-invalid]="isInvalid(form.get('designation'))" />
                      <button type="button" class="btn btn-outline-secondary" (click)="clearDesigOther()"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('designation'))">Designation is required.</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Salary (₹) <span class="text-danger">*</span></label>
                    <input type="number" min="0" class="form-control" formControlName="salary"
                           [class.is-invalid]="isInvalid(form.get('salary'))" />
                    <div class="invalid-feedback">Salary is required.</div>
                  </div>
                </div>
              </ng-container>

              <!-- Customer-specific fields -->
              <ng-container *ngIf="formType === 'customer'">
                <hr class="my-3" />
                <h6 class="fw-semibold mb-3 text-muted small text-uppercase">Address &amp; Personal</h6>
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Address <span class="text-danger">*</span></label>
                    <input class="form-control" formControlName="address" [class.is-invalid]="isInvalid(form.get('address'))" />
                    <div class="invalid-feedback">Address is required.</div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">City <span class="text-danger">*</span></label>
                    <select *ngIf="!cityIsOther" class="form-select" formControlName="city"
                            [class.is-invalid]="isInvalid(form.get('city'))" (change)="onCityChange()">
                      <option value="">— Select city —</option>
                      <option *ngFor="let c of allCities" [value]="c.name">{{ c.name }}</option>
                      <option value="__other__">Other…</option>
                    </select>
                    <div *ngIf="cityIsOther" class="input-group">
                      <input type="text" class="form-control" placeholder="City name…"
                             [value]="form.get('city')?.value" (input)="onCustomCityInput($event)"
                             [class.is-invalid]="isInvalid(form.get('city'))" />
                      <button type="button" class="btn btn-outline-secondary" (click)="clearCityOther()"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('city'))">City is required.</div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">State <span class="text-danger">*</span></label>
                    <select *ngIf="!stateIsOther" class="form-select" formControlName="state"
                            [class.is-invalid]="isInvalid(form.get('state'))" (change)="onStateCustChange()">
                      <option value="">— Select state —</option>
                      <option *ngFor="let s of allStates" [value]="s.name">{{ s.name }}</option>
                      <option value="__other__">Other…</option>
                    </select>
                    <div *ngIf="stateIsOther" class="input-group">
                      <input type="text" class="form-control" placeholder="State name…"
                             [value]="form.get('state')?.value" (input)="onCustomStateInput($event)"
                             [class.is-invalid]="isInvalid(form.get('state'))" />
                      <button type="button" class="btn btn-outline-secondary" (click)="clearStateOther()"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('state'))">State is required.</div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Country <span class="text-danger">*</span></label>
                    <select *ngIf="!countryIsOther" class="form-select" formControlName="country"
                            [class.is-invalid]="isInvalid(form.get('country'))" (change)="onCountryCustChange()">
                      <option value="">— Select country —</option>
                      <option *ngFor="let c of countries" [value]="c.name">{{ c.name }}</option>
                      <option value="__other__">Other…</option>
                    </select>
                    <div *ngIf="countryIsOther" class="input-group">
                      <input type="text" class="form-control" placeholder="Country name…"
                             [value]="form.get('country')?.value" (input)="onCustomCountryInput($event)"
                             [class.is-invalid]="isInvalid(form.get('country'))" />
                      <button type="button" class="btn btn-outline-secondary" (click)="clearCountryOther()"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="text-danger small mt-1" *ngIf="isInvalid(form.get('country'))">Country is required.</div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Postal code <span class="text-danger">*</span></label>
                    <input class="form-control" formControlName="postalCode" [class.is-invalid]="isInvalid(form.get('postalCode'))" />
                    <div class="invalid-feedback">Postal code is required.</div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Date of birth</label>
                    <input type="date" class="form-control" formControlName="dateOfBirth" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Gender</label>
                    <select class="form-select" formControlName="gender">
                      <option value="">—</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <ng-container *ngIf="editingId">
                    <div class="col-md-6">
                      <label class="form-label">ID proof type</label>
                      <input class="form-control" formControlName="idProofType" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">ID proof number</label>
                      <input class="form-control" formControlName="idProofNumber" />
                    </div>
                  </ng-container>
                </div>
              </ng-container>

              <!-- Active toggle (edit only) -->
              <div class="mt-3" *ngIf="editingId">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" formControlName="isActive" id="personActive" />
                  <label class="form-check-label" for="personActive">Active</label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()"><i class="bi bi-x-lg me-1"></i>Cancel</button>
              <button class="btn btn-primary" [disabled]="form.invalid || form.pending"><i class="bi bi-check2-circle me-1"></i>Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label small text-muted mb-1">Search name or email</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Role</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterRoleId" (ngModelChange)="onFilterChange()">
            <option value="">All roles</option>
            <option *ngFor="let r of roles" [value]="r.id">{{ r.name }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </select>
        </div>
        <div class="col-md-1">
          <button class="btn btn-outline-secondary btn-sm w-100" (click)="clearFilters()" [disabled]="!filtersApplied()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th class="sortable" (click)="toggleSort('name')">Name <i class="bi" [ngClass]="sortIcon('name')"></i></th>
              <th class="sortable" (click)="toggleSort('email')">Email <i class="bi" [ngClass]="sortIcon('email')"></i></th>
              <th>Phone</th>
              <th class="sortable" (click)="toggleSort('role')">Role <i class="bi" [ngClass]="sortIcon('role')"></i></th>
              <th class="sortable" (click)="toggleSort('joined')">Joined <i class="bi" [ngClass]="sortIcon('joined')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of paged()">
              <td><strong>{{ p.fullName }}</strong></td>
              <td class="text-muted small">{{ p.email }}</td>
              <td class="text-muted small">{{ p.phone || '—' }}</td>
              <td>
                <span *ngIf="p.appRoleName"
                      class="badge"
                      [style.background]="roleColor(p.appRoleName)"
                      style="color:#fff;">{{ p.appRoleName }}</span>
                <span *ngIf="!p.appRoleName" class="text-muted small">—</span>
              </td>
              <td class="text-muted small">{{ p.joinedAt | date:'mediumDate' }}</td>
              <td><span class="badge" [class.bg-success]="p.isActive" [class.bg-secondary]="!p.isActive">{{ p.isActive ? 'Active' : 'Disabled' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-primary" (click)="view(p)"><i class="bi bi-eye me-1"></i>View</button>
                  <button *ngIf="auth.hasPermission('customers.edit')" class="btn btn-sm btn-outline-secondary" (click)="edit(p)">Edit</button>
                  <button *ngIf="p.isActive && auth.hasPermission('customers.delete')" class="btn btn-sm btn-outline-danger" (click)="remove(p)" [disabled]="togglingId === p.id">
                    <i class="bi bi-eye-slash me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!p.isActive && auth.hasPermission('customers.edit')" class="btn btn-sm btn-outline-success" (click)="activate(p)" [disabled]="togglingId === p.id">
                    <span *ngIf="togglingId === p.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== p.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered().length === 0">
              <td colspan="7" class="text-center text-muted py-3">
                {{ items.length === 0 ? 'No people yet. Click "Add person" to create one.' : 'No people match the current filters.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div *ngIf="filtered().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ filtered().length }}</small>
        <nav><ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="page === 1"><button class="page-link" (click)="setPage(page - 1)"><i class="bi bi-chevron-left"></i></button></li>
          <li class="page-item" *ngFor="let n of pageNumbers()" [class.active]="n === page"><button class="page-link" (click)="setPage(n)">{{ n }}</button></li>
          <li class="page-item" [class.disabled]="page === totalPages()"><button class="page-link" (click)="setPage(page + 1)"><i class="bi bi-chevron-right"></i></button></li>
        </ul></nav>
      </div>
    </div>
  `
})
export class AdminPeopleComponent implements OnInit, OnDestroy {
  auth        = inject(AuthService);
  systemRoles = inject(SystemRolesService);
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Person[] = [];
  roles: AppRole[] = [];
  departments: Department[] = [];
  allDesignations: Designation[] = [];
  formDesignations: Designation[] = [];
  countries: Country[] = [];
  allStates: GeoState[] = [];
  allCities: City[] = [];

  filterText = '';
  filterRoleId = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  sortKey: 'name' | 'email' | 'role' | 'joined' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  readonly pageSize = 15;

  viewTarget: Person | null = null;
  deleteTarget: Person | null = null;
  deleting = false;
  togglingId: number | null = null;
  editingId: number | null = null;
  editingPersonType: 'staff' | 'customer' | null = null;
  formError = '';
  showPassword = false;
  deptIsOther = false;
  desigIsOther = false;
  cityIsOther = false;
  stateIsOther = false;
  countryIsOther = false;

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  form = this.fb.group({
    fullName:      ['', Validators.required],
    email:         ['', [Validators.required, Validators.email]],
    password:      [''],
    phone:         ['', Validators.required],
    appRoleId:     [null as number | null, Validators.required],
    systemRole:    ['Staff'],
    department:    [''],
    designation:   [''],
    salary:        [null as number | null],
    dateOfBirth:   [''],
    gender:        [''],
    address:       [''],
    city:          [''],
    state:         [''],
    country:       [''],
    postalCode:    [''],
    idProofType:   [''],
    idProofNumber: [''],
    isActive:      [true]
  });

  get formType(): 'staff' | 'customer' | null {
    if (this.editingPersonType) return this.editingPersonType;
    const roleId = this.form.controls.appRoleId.value;
    if (!roleId) return null;
    const appRole = this.roles.find(r => r.id === +roleId);
    if (!appRole) return null;
    // If the AppRole name matches a system role that is below the staff access level, it is customer-type
    const sysRole = this.systemRoles.getByName(appRole.name);
    return (sysRole && sysRole.level < this.systemRoles.staffMinLevel()) ? 'customer' : 'staff';
  }

  ngOnInit(): void {
    this.loadAll();
    this.api.listRoles(true).subscribe({ next: rs => this.roles = rs });
    this.api.listDepartments(true).subscribe({ next: ds => this.departments = ds });
    this.api.listDesignations(undefined, true).subscribe({ next: ds => this.allDesignations = ds });
    this.api.listCountries(true).subscribe({ next: cs => this.countries = cs });
    this.api.listStates(undefined, true).subscribe({ next: ss => this.allStates = ss });
    this.api.listCities(undefined, undefined, true).subscribe({ next: cs => this.allCities = cs });
  }

  ngOnDestroy(): void { this.unlockBody(); }

  loadAll(): void {
    let staffDone = false, custDone = false;
    let sp: Person[] = [], cp: Person[] = [];
    const merge = () => { if (staffDone && custDone) this.items = [...sp, ...cp]; };
    this.api.listStaff().subscribe({
      next: ss => { sp = ss.map(s => ({ ...s, personType: 'staff' as const }) as Person); staffDone = true; merge(); }
    });
    this.api.listCustomers().subscribe({
      next: cs => { cp = cs.map(c => ({ ...c, personType: 'customer' as const, joinedAt: c.createdAt }) as Person); custDone = true; merge(); }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.viewTarget) { this.closeView(); return; }
    if (this.deleteTarget) { this.cancelDelete(); return; }
    if (this.editingId !== null) { this.cancel(); return; }
  }

  isInvalid(ctrl: AbstractControl | null): boolean { return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty); }
  private lockBody(): void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }

  // ── View ──────────────────────────────────────────────────────────
  view(p: Person): void { this.viewTarget = p; this.lockBody(); }
  closeView(): void { this.viewTarget = null; if (this.editingId === null && !this.deleteTarget) this.unlockBody(); }
  onViewBackdrop(e: MouseEvent): void { if ((e.target as HTMLElement).classList.contains('modal')) this.closeView(); }

  // ── Deactivate ────────────────────────────────────────────────────
  remove(p: Person): void { this.deleteTarget = p; this.lockBody(); }
  cancelDelete(): void { if (this.deleting) return; this.deleteTarget = null; if (this.editingId === null) this.unlockBody(); }
  confirmDelete(): void {
    const p = this.deleteTarget;
    if (!p || this.deleting) return;
    this.deleting = true;
    const op$ = p.personType === 'staff'
      ? this.api.updateStaff(p.id, { ...p, isActive: false } as any)
      : this.api.setCustomerActive(p.id, false);
    op$.subscribe({
      next: () => { this.deleting = false; this.deleteTarget = null; if (this.editingId === null) this.unlockBody(); this.toast.show(`"${p.fullName}" deactivated.`, 'info', 4000, { title: 'Deactivated' }); this.loadAll(); },
      error: () => { this.deleting = false; this.toast.show(`Could not deactivate "${p.fullName}".`, 'danger', 4000); }
    });
  }

  activate(p: Person): void {
    if (this.togglingId !== null) return;
    this.togglingId = p.id;
    const op$ = p.personType === 'staff'
      ? this.api.updateStaff(p.id, { ...p, isActive: true } as any)
      : this.api.setCustomerActive(p.id, true);
    op$.subscribe({
      next: () => { this.togglingId = null; this.toast.show(`"${p.fullName}" activated.`, 'success', 3000, { title: 'Activated' }); this.loadAll(); },
      error: () => { this.togglingId = null; this.toast.show(`Could not activate "${p.fullName}".`, 'danger', 4000); }
    });
  }

  // ── Add / Edit ────────────────────────────────────────────────────
  startCreate(): void {
    this.editingId = 0;
    this.editingPersonType = null;
    this.formError = '';
    this.showPassword = false;
    this.deptIsOther = false;
    this.desigIsOther = false;
    this.cityIsOther = false;
    this.stateIsOther = false;
    this.countryIsOther = false;
    this.formDesignations = [];
    this.form.reset({ fullName: '', email: '', password: '', phone: '', appRoleId: null, systemRole: 'Staff', department: '', designation: '', salary: null, dateOfBirth: '', gender: '', address: '', city: '', state: '', country: '', postalCode: '', idProofType: '', idProofNumber: '', isActive: true });
    this.clearFieldValidators();
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.email.setAsyncValidators([emailExistsValidator(this.auth)]);
    this.form.controls.phone.setAsyncValidators([phoneExistsValidator(this.auth)]);
    this.lockBody();
  }

  edit(p: Person): void {
    this.editingId = p.id;
    this.editingPersonType = p.personType;
    this.formError = '';
    this.showPassword = false;
    this.deptIsOther = !!p.department && !this.departments.some(d => d.name === p.department);
    this.syncFormDesignations(p.department || '');
    this.desigIsOther = !!p.designation && !this.formDesignations.some(d => d.name === p.designation);
    this.cityIsOther    = !!p.city    && !this.allCities.some(c => c.name === p.city);
    this.stateIsOther   = !!p.state   && !this.allStates.some(s => s.name === p.state);
    this.countryIsOther = !!p.country && !this.countries.some(c => c.name === p.country);
    this.form.reset({
      fullName: p.fullName, email: p.email, password: '', phone: p.phone || '',
      appRoleId: p.appRoleId ?? null, systemRole: p.systemRole || 'Staff',
      department: p.department || '', designation: p.designation || '',
      salary: p.salary ?? null,
      dateOfBirth: p.dateOfBirth ? (p.dateOfBirth as string).substring(0, 10) : '',
      gender: p.gender || '', address: p.address || '', city: p.city || '', state: p.state || '',
      country: p.country || '', postalCode: p.postalCode || '', idProofType: p.idProofType || '',
      idProofNumber: p.idProofNumber || '', isActive: p.isActive
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.setValidatorsForType(p.personType);
    this.form.controls.email.setAsyncValidators([emailExistsValidator(this.auth, p.email)]);
    this.form.controls.phone.setAsyncValidators([phoneExistsValidator(this.auth, p.phone || '')]);
    this.lockBody();
  }

  cancel(): void {
    this.editingId = null; this.editingPersonType = null; this.formError = '';
    this.showPassword = false; this.deptIsOther = false; this.desigIsOther = false;
    this.cityIsOther = false; this.stateIsOther = false; this.countryIsOther = false;
    this.form.controls.email.clearAsyncValidators();
    this.form.controls.phone.clearAsyncValidators();
    this.unlockBody();
  }

  onRoleChange(): void { const t = this.formType; if (t) this.setValidatorsForType(t); }

  private clearFieldValidators(): void {
    (['department', 'designation', 'salary', 'address', 'city', 'state', 'country', 'postalCode'] as const).forEach(k => {
      this.form.controls[k].clearValidators();
      this.form.controls[k].updateValueAndValidity();
    });
  }

  private setValidatorsForType(type: 'staff' | 'customer'): void {
    const c = this.form.controls;
    if (type === 'staff') {
      c.department.setValidators([Validators.required]);
      c.designation.setValidators([Validators.required]);
      c.salary.setValidators([Validators.required, Validators.min(0)]);
      c.address.clearValidators(); c.city.clearValidators(); c.state.clearValidators();
      c.country.clearValidators(); c.postalCode.clearValidators();
    } else {
      c.department.clearValidators(); c.designation.clearValidators(); c.salary.clearValidators();
      c.address.setValidators([Validators.required]); c.city.setValidators([Validators.required]);
      c.state.setValidators([Validators.required]); c.country.setValidators([Validators.required]);
      c.postalCode.setValidators([Validators.required]);
    }
    (['department', 'designation', 'salary', 'address', 'city', 'state', 'country', 'postalCode'] as const).forEach(k => {
      c[k].updateValueAndValidity();
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const v = this.form.getRawValue() as any;
    const type = this.formType;
    if (!type) return;
    const isNew = this.editingId === 0;
    let op$: Observable<any>;
    if (type === 'staff') {
      const payload: any = { fullName: v.fullName, email: v.email, phone: v.phone, department: v.department, designation: v.designation, salary: v.salary, appRoleId: v.appRoleId, isActive: v.isActive, systemRole: v.systemRole };
      if (isNew) payload.password = v.password;
      op$ = isNew ? this.api.createStaff(payload) : this.api.updateStaff(this.editingId!, payload);
    } else {
      const payload: any = { fullName: v.fullName, email: v.email, phone: v.phone, address: v.address, city: v.city, state: v.state, country: v.country, postalCode: v.postalCode, dateOfBirth: v.dateOfBirth || null, gender: v.gender, idProofType: v.idProofType, idProofNumber: v.idProofNumber, appRoleId: v.appRoleId };
      if (isNew) payload.password = v.password;
      op$ = isNew ? this.api.createCustomer(payload) : this.api.updateCustomer(this.editingId!, payload);
    }
    op$.subscribe({
      next: () => {
        this.toast.show(isNew ? `"${v.fullName}" added.` : `"${v.fullName}" updated.`, 'success', 4000, { title: isNew ? 'Person created' : 'Person updated' });
        this.editingId = null; this.editingPersonType = null;
        this.form.controls.email.clearAsyncValidators();
        this.form.controls.phone.clearAsyncValidators();
        this.unlockBody(); this.loadAll();
      },
      error: (err: any) => {
        this.formError = err?.error?.message || 'Could not save. Please try again.';
        setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      }
    });
  }

  // ── Dept / Desig ──────────────────────────────────────────────────
  onDeptChange(): void {
    const name = this.form.controls.department.value || '';
    if (name === '__other__') { this.deptIsOther = true; this.formDesignations = []; this.form.patchValue({ department: '', designation: '' }, { emitEvent: false }); return; }
    this.deptIsOther = false; this.desigIsOther = false;
    const dept = this.departments.find(d => d.name === name);
    this.formDesignations = dept ? this.allDesignations.filter(d => d.departmentId === dept.id) : [];
    this.form.patchValue({ designation: '' }, { emitEvent: false });
  }

  onCustomDeptInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.form.patchValue({ department: val, designation: '' }, { emitEvent: false });
    const dept = this.departments.find(d => d.name.toLowerCase() === val.toLowerCase());
    this.formDesignations = dept ? this.allDesignations.filter(d => d.departmentId === dept.id) : [];
    this.desigIsOther = false;
  }

  clearDeptOther(): void { this.deptIsOther = false; this.desigIsOther = false; this.formDesignations = []; this.form.patchValue({ department: '', designation: '' }, { emitEvent: false }); }

  onDesigChange(): void {
    const val = this.form.controls.designation.value || '';
    if (val === '__other__') { this.desigIsOther = true; this.form.patchValue({ designation: '' }, { emitEvent: false }); } else { this.desigIsOther = false; }
  }

  onCustomDesigInput(e: Event): void { this.form.patchValue({ designation: (e.target as HTMLInputElement).value }, { emitEvent: false }); }
  clearDesigOther(): void { this.desigIsOther = false; this.form.patchValue({ designation: '' }, { emitEvent: false }); }

  private syncFormDesignations(deptName: string): void {
    const dept = this.departments.find(d => d.name === deptName);
    this.formDesignations = dept ? this.allDesignations.filter(d => d.departmentId === dept.id) : [];
  }

  // ── City cascade ──────────────────────────────────────────────────
  onCityChange(): void {
    const val = this.form.controls.city.value || '';
    if (val === '__other__') { this.cityIsOther = true; this.form.patchValue({ city: '' }, { emitEvent: false }); return; }
    const city = this.allCities.find(c => c.name === val);
    if (city) this.form.patchValue({ state: (city as any).stateName, country: (city as any).countryName }, { emitEvent: false });
  }

  onStateCustChange(): void {
    const val = this.form.controls.state.value || '';
    if (val === '__other__') { this.stateIsOther = true; this.form.patchValue({ state: '' }, { emitEvent: false }); }
  }

  onCountryCustChange(): void {
    const val = this.form.controls.country.value || '';
    if (val === '__other__') { this.countryIsOther = true; this.form.patchValue({ country: '' }, { emitEvent: false }); }
  }

  onCustomCityInput(e: Event): void { this.form.patchValue({ city: (e.target as HTMLInputElement).value }, { emitEvent: false }); }
  onCustomStateInput(e: Event): void { this.form.patchValue({ state: (e.target as HTMLInputElement).value }, { emitEvent: false }); }
  onCustomCountryInput(e: Event): void { this.form.patchValue({ country: (e.target as HTMLInputElement).value }, { emitEvent: false }); }

  clearCityOther(): void { this.cityIsOther = false; this.form.patchValue({ city: '' }, { emitEvent: false }); }
  clearStateOther(): void { this.stateIsOther = false; this.form.patchValue({ state: '' }, { emitEvent: false }); }
  clearCountryOther(): void { this.countryIsOther = false; this.form.patchValue({ country: '' }, { emitEvent: false }); }

  // ── Filter / Sort / Page ──────────────────────────────────────────
  filtered(): Person[] {
    const q = this.filterText.trim().toLowerCase();
    const f = this.items.filter(p => {
      if (q && !p.fullName.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) return false;
      if (this.filterRoleId && String(p.appRoleId) !== String(this.filterRoleId)) return false;
      if (this.filterStatus === 'active' && !p.isActive) return false;
      if (this.filterStatus === 'inactive' && p.isActive) return false;
      return true;
    });
    if (!this.sortKey) return f;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...f].sort((a, b) => {
      const av = this.sortVal(a), bv = this.sortVal(b);
      if (av == null && bv == null) return 0; if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return av.toString().localeCompare(bv.toString()) * dir;
    });
  }

  private sortVal(p: Person): string | number | null {
    switch (this.sortKey) {
      case 'name':   return p.fullName;
      case 'email':  return p.email;
      case 'role':   return p.appRoleName || '';
      case 'joined': return p.joinedAt ? new Date(p.joinedAt).getTime() : 0;
      case 'status': return p.isActive ? 1 : 0;
      default:       return null;
    }
  }

  toggleSort(k: 'name' | 'email' | 'role' | 'joined' | 'status'): void {
    if (this.sortKey === k) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; else { this.sortKey = k; this.sortDir = 'asc'; } this.page = 1;
  }
  sortIcon(k: string): string { if (this.sortKey !== k) return 'bi-arrow-down-up text-muted'; return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'; }
  filtersApplied(): boolean { return !!this.filterText || !!this.filterRoleId || this.filterStatus !== 'all'; }
  onFilterChange(): void { this.page = 1; }
  clearFilters(): void { this.filterText = ''; this.filterRoleId = ''; this.filterStatus = 'all'; this.page = 1; }
  totalPages(): number { return Math.max(1, Math.ceil(this.filtered().length / this.pageSize)); }
  paged(): Person[] { const s = (this.page - 1) * this.pageSize; return this.filtered().slice(s, s + this.pageSize); }
  pageStart(): number { if (!this.filtered().length) return 0; return (this.page - 1) * this.pageSize + 1; }
  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filtered().length); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }
  setPage(p: number): void { if (p < 1 || p > this.totalPages()) return; this.page = p; scrollAdminContentTop(); }

  private readonly ROLE_COLORS = [
    '#4f6ef7', '#2da44e', '#e36209', '#8250df',
    '#cf222e', '#0969da', '#1a7f37', '#9a6700',
    '#6639ba', '#c0392b'
  ];

  roleColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return this.ROLE_COLORS[Math.abs(hash) % this.ROLE_COLORS.length];
  }
}
