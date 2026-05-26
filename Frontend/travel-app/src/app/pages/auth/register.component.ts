import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Observable, map, of, switchMap, timer } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
import { Country, GeoState, City } from '../../core/models/api.models';

function emailExistsValidator(auth: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = control.value as string;
    if (!email || !email.includes('@')) return of(null);
    return timer(500).pipe(
      switchMap(() => auth.checkEmail(email)),
      map(r => r.data?.exists ? { emailTaken: true } : null)
    );
  };
}

function phoneExistsValidator(auth: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const phone = control.value as string;
    if (!phone || phone.length < 7) return of(null);
    return timer(500).pipe(
      switchMap(() => auth.checkPhone(phone)),
      map(r => r.data?.exists ? { phoneTaken: true } : null)
    );
  };
}

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-7">
          <div class="card shadow border-0">
            <div class="card-body p-4 p-md-5">
              <h3 class="fw-bold mb-1">Create your account</h3>
              <p class="text-muted mb-4">Book curated tours across India, Bhutan and Nepal.</p>

              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="errorMessage">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ errorMessage }}</div>
                <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="errorMessage = ''"></button>
              </div>

              <form [formGroup]="form" (ngSubmit)="submit()">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Full name <span class="text-danger">*</span></label>
                    <input class="form-control" formControlName="fullName"
                           [class.is-invalid]="fullNameCtl.touched && fullNameCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="fullNameCtl.touched && fullNameCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Full name is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="fullNameCtl.touched && fullNameCtl.errors?.['maxlength']">
                      <i class="bi bi-exclamation-circle me-1"></i>Maximum 100 characters.
                    </small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email <span class="text-danger">*</span></label>
                    <div class="input-group">
                      <input type="email" class="form-control" formControlName="email"
                             [class.is-invalid]="emailCtl.touched && emailCtl.invalid" />
                      <span class="input-group-text" *ngIf="emailCtl.pending">
                        <span class="spinner-border spinner-border-sm text-secondary"></span>
                      </span>
                    </div>
                    <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Email is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['email']">
                      <i class="bi bi-exclamation-circle me-1"></i>Enter a valid email address.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['emailTaken']">
                      <i class="bi bi-exclamation-circle me-1"></i>An account with this email already exists.
                    </small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Phone <span class="text-danger">*</span></label>
                    <div class="input-group">
                      <input class="form-control" formControlName="phone" inputmode="numeric"
                             [class.is-invalid]="phoneCtl.touched && phoneCtl.invalid"
                             (keypress)="$event.charCode >= 48 && $event.charCode <= 57" />
                      <span class="input-group-text" *ngIf="phoneCtl.pending">
                        <span class="spinner-border spinner-border-sm text-secondary"></span>
                      </span>
                    </div>
                    <small class="text-danger d-block mt-1" *ngIf="phoneCtl.touched && phoneCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Phone is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="phoneCtl.touched && phoneCtl.errors?.['pattern']">
                      <i class="bi bi-exclamation-circle me-1"></i>Phone must contain only numbers.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="phoneCtl.touched && phoneCtl.errors?.['minlength']">
                      <i class="bi bi-exclamation-circle me-1"></i>Phone must be at least 7 digits.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="phoneCtl.touched && phoneCtl.errors?.['phoneTaken']">
                      <i class="bi bi-exclamation-circle me-1"></i>This phone number is already registered.
                    </small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Password <span class="text-danger">*</span></label>
                    <div class="input-group">
                      <input [type]="showPassword ? 'text' : 'password'" class="form-control" formControlName="password"
                             [class.is-invalid]="passwordCtl.touched && passwordCtl.invalid" />
                      <button type="button" class="btn btn-outline-secondary" (click)="showPassword = !showPassword" tabindex="-1">
                        <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                      </button>
                    </div>
                    <small class="text-danger d-block mt-1" *ngIf="passwordCtl.touched && passwordCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Password is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="passwordCtl.touched && passwordCtl.errors?.['minlength']">
                      <i class="bi bi-exclamation-circle me-1"></i>Password must be at least 6 characters.
                    </small>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Address <span class="text-danger">*</span></label>
                    <input class="form-control" formControlName="address"
                           [class.is-invalid]="addressCtl.touched && addressCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="addressCtl.touched && addressCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Address is required.
                    </small>
                  </div>

                  <!-- Country -->
                  <div class="col-md-6">
                    <label class="form-label">Country <span class="text-danger">*</span></label>
                    <select class="form-select" [class.is-invalid]="countryCtl.touched && countryCtl.invalid"
                            (change)="onCountryChange($event)">
                      <option value="" [selected]="selCountry === ''">Select country...</option>
                      <option *ngFor="let c of countries" [value]="c.id" [selected]="c.id == selCountry">{{ c.name }}</option>
                      <option value="other" [selected]="selCountry === 'other'">Other</option>
                    </select>
                    <input *ngIf="selCountry === 'other'" class="form-control mt-2" formControlName="country"
                           placeholder="Enter country name"
                           [class.is-invalid]="countryCtl.touched && countryCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="countryCtl.touched && countryCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Country is required.
                    </small>
                  </div>

                  <!-- State -->
                  <div class="col-md-6">
                    <label class="form-label">State <span class="text-danger">*</span></label>
                    <select class="form-select" [class.is-invalid]="stateCtl.touched && stateCtl.invalid"
                            [value]="selState" (change)="onStateChange($event)"
                            [disabled]="selCountry === '' || (selCountry !== 'other' && states.length === 0)">
                      <option value="">Select state...</option>
                      <option *ngFor="let s of states" [value]="s.id">{{ s.name }}</option>
                      <option value="other">Other</option>
                    </select>
                    <input *ngIf="selState === 'other'" class="form-control mt-2" formControlName="state"
                           placeholder="Enter state name"
                           [class.is-invalid]="stateCtl.touched && stateCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="stateCtl.touched && stateCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>State is required.
                    </small>
                  </div>

                  <!-- City -->
                  <div class="col-md-6">
                    <label class="form-label">City <span class="text-danger">*</span></label>
                    <select class="form-select" [class.is-invalid]="cityCtl.touched && cityCtl.invalid"
                            [value]="selCity" (change)="onCityChange($event)"
                            [disabled]="selState === '' || (selState !== 'other' && cities.length === 0)">
                      <option value="">Select city...</option>
                      <option *ngFor="let c of cities" [value]="c.id">{{ c.name }}</option>
                      <option value="other">Other</option>
                    </select>
                    <input *ngIf="selCity === 'other'" class="form-control mt-2" formControlName="city"
                           placeholder="Enter city name"
                           [class.is-invalid]="cityCtl.touched && cityCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="cityCtl.touched && cityCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>City is required.
                    </small>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label">Postal code <span class="text-danger">*</span></label>
                    <input class="form-control" formControlName="postalCode"
                           [class.is-invalid]="postalCodeCtl.touched && postalCodeCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="postalCodeCtl.touched && postalCodeCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Postal code is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="postalCodeCtl.touched && postalCodeCtl.errors?.['pattern']">
                      <i class="bi bi-exclamation-circle me-1"></i>Postal code must contain only numbers.
                    </small>
                  </div>
                </div>

                <button class="btn btn-primary w-100 mt-4" [disabled]="form.invalid || loading || form.pending">
                  {{ loading ? 'Creating account...' : 'Create account' }}
                </button>

                <p class="mt-3 text-center mb-0">
                  Already have an account? <a routerLink="/auth/login">Sign in</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);
  private api  = inject(ApiService);
  private toast = inject(ToastService);

  loading = false;
  errorMessage = '';
  showPassword = false;

  countries: Country[] = [];
  states: GeoState[]   = [];
  cities: City[]       = [];

  selCountry = '';
  selState   = '';
  selCity    = '';

  form = this.fb.group({
    fullName:   ['', [Validators.required, Validators.maxLength(100)]],
    email:      ['', [Validators.required, Validators.email], [emailExistsValidator(this.auth)]],
    password:   ['', [Validators.required, Validators.minLength(6)]],
    phone:      ['', [Validators.required, Validators.pattern(/^\d+$/), Validators.minLength(7), Validators.maxLength(20)], [phoneExistsValidator(this.auth)]],
    address:    ['', [Validators.required]],
    city:       ['', [Validators.required]],
    state:      ['', [Validators.required]],
    country:    ['', [Validators.required]],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d+$/)]]
  });

  get fullNameCtl()   { return this.form.controls.fullName; }
  get emailCtl()      { return this.form.controls.email; }
  get passwordCtl()   { return this.form.controls.password; }
  get phoneCtl()      { return this.form.controls.phone; }
  get addressCtl()    { return this.form.controls.address; }
  get cityCtl()       { return this.form.controls.city; }
  get stateCtl()      { return this.form.controls.state; }
  get countryCtl()    { return this.form.controls.country; }
  get postalCodeCtl() { return this.form.controls.postalCode; }

  ngOnInit(): void {
    this.api.listCountries(true).subscribe(list => this.countries = list);
  }

  onCountryChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selCountry = val;
    this.selState   = '';
    this.selCity    = '';
    this.states     = [];
    this.cities     = [];
    this.stateCtl.setValue('');
    this.cityCtl.setValue('');

    if (val === 'other') {
      this.countryCtl.setValue('');
    } else if (val) {
      const found = this.countries.find(c => c.id === +val);
      this.countryCtl.setValue(found?.name ?? '');
      this.api.listStates(+val, true).subscribe(list => this.states = list);
    } else {
      this.countryCtl.setValue('');
    }
    this.countryCtl.markAsTouched();
  }

  onStateChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selState = val;
    this.selCity  = '';
    this.cities   = [];
    this.cityCtl.setValue('');

    if (val === 'other') {
      this.stateCtl.setValue('');
    } else if (val) {
      const found = this.states.find(s => s.id === +val);
      this.stateCtl.setValue(found?.name ?? '');
      this.api.listCities(+val, undefined, true).subscribe(list => this.cities = list);
    } else {
      this.stateCtl.setValue('');
    }
    this.stateCtl.markAsTouched();
  }

  onCityChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selCity = val;

    if (val === 'other') {
      this.cityCtl.setValue('');
    } else if (val) {
      const found = this.cities.find(c => c.id === +val);
      this.cityCtl.setValue(found?.name ?? '');
    } else {
      this.cityCtl.setValue('');
    }
    this.cityCtl.markAsTouched();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.auth.register(this.form.getRawValue() as any).subscribe({
      next: r => {
        this.loading = false;
        if (r.success) {
          this.toast.show('Account created successfully! Please sign in.', 'success');
          this.auth.forceLogout();
        } else if (r.message) {
          this.errorMessage = r.message;
        }
      },
      error: (err: any) => {
        this.loading = false;
        const apiMsg: string | undefined = err?.error?.message || err?.error?.errors?.[0];
        this.errorMessage = apiMsg || 'Could not create your account. Please try again.';
      }
    });
  }
}
