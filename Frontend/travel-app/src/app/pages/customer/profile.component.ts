import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Observable, forkJoin, map, of, switchMap, timer } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Country, GeoState, City } from '../../core/models/api.models';

@Component({
  selector: 'app-profile',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-4">My profile</h2>

    <div class="row g-4">
      <div class="col-lg-7">
        <form [formGroup]="form" (ngSubmit)="save()" class="card border-0 shadow-sm">
          <div class="card-body">
            <h5 class="fw-bold mb-3">Personal details</h5>
            <div class="row g-3">

              <!-- Full name -->
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

              <!-- Email -->
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

              <!-- Phone -->
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

              <!-- Date of birth -->
              <div class="col-md-6">
                <label class="form-label">Date of birth</label>
                <input type="date" class="form-control" formControlName="dateOfBirth" />
              </div>

              <!-- Gender -->
              <div class="col-md-6">
                <label class="form-label">Gender</label>
                <select class="form-select" formControlName="gender">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <!-- Address -->
              <div class="col-12">
                <label class="form-label">Address</label>
                <input class="form-control" formControlName="address" />
              </div>

              <!-- Country -->
              <div class="col-md-6">
                <label class="form-label">Country</label>
                <select class="form-select" (change)="onCountryChange($event)">
                  <option value="" [selected]="selCountry === ''">Select country...</option>
                  <option *ngFor="let c of countries" [value]="c.id" [selected]="c.id == selCountry">{{ c.name }}</option>
                  <option value="other" [selected]="selCountry === 'other'">Other</option>
                </select>
                <input *ngIf="selCountry === 'other'" class="form-control mt-2" formControlName="country"
                       placeholder="Enter country name" />
              </div>

              <!-- State -->
              <div class="col-md-6">
                <label class="form-label">State</label>
                <select class="form-select" (change)="onStateChange($event)"
                        [disabled]="selCountry === '' || (selCountry !== 'other' && states.length === 0)">
                  <option value="" [selected]="selState === ''">Select state...</option>
                  <option *ngFor="let s of states" [value]="s.id" [selected]="s.id == selState">{{ s.name }}</option>
                  <option value="other" [selected]="selState === 'other'">Other</option>
                </select>
                <input *ngIf="selState === 'other'" class="form-control mt-2" formControlName="state"
                       placeholder="Enter state name" />
              </div>

              <!-- City -->
              <div class="col-md-6">
                <label class="form-label">City</label>
                <select class="form-select" (change)="onCityChange($event)"
                        [disabled]="selState === '' || (selState !== 'other' && cities.length === 0)">
                  <option value="" [selected]="selCity === ''">Select city...</option>
                  <option *ngFor="let c of cities" [value]="c.id" [selected]="c.id == selCity">{{ c.name }}</option>
                  <option value="other" [selected]="selCity === 'other'">Other</option>
                </select>
                <input *ngIf="selCity === 'other'" class="form-control mt-2" formControlName="city"
                       placeholder="Enter city name" />
              </div>

              <!-- Postal code -->
              <div class="col-md-6">
                <label class="form-label">Postal code</label>
                <input class="form-control" formControlName="postalCode"
                       [class.is-invalid]="postalCodeCtl.touched && postalCodeCtl.invalid" />
                <small class="text-danger d-block mt-1" *ngIf="postalCodeCtl.touched && postalCodeCtl.errors?.['pattern']">
                  <i class="bi bi-exclamation-circle me-1"></i>Postal code must contain only numbers.
                </small>
              </div>

              <!-- ID proof type -->
              <div class="col-md-6">
                <label class="form-label">ID proof type</label>
                <input class="form-control" formControlName="idProofType" />
              </div>

              <!-- ID proof number -->
              <div class="col-md-6">
                <label class="form-label">ID proof number</label>
                <input class="form-control" formControlName="idProofNumber" />
              </div>

            </div>

            <button class="btn btn-primary mt-4" [disabled]="form.invalid || saving || form.pending">
              <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? 'Saving...' : 'Save profile' }}
            </button>
          </div>
        </form>
      </div>

      <div class="col-lg-5">
        <form [formGroup]="passForm" (ngSubmit)="otpSent ? changePassword() : sendOtp()" class="card border-0 shadow-sm">
          <div class="card-body">
            <h5 class="fw-bold mb-3">Change password</h5>
            <div class="mb-3">
              <label class="form-label">Current password <span class="text-danger">*</span></label>
              <div class="input-group">
                <input [type]="showCurrentPwd ? 'text' : 'password'" class="form-control" formControlName="currentPassword" autocomplete="current-password" placeholder="Your current password"
                       [class.is-invalid]="passForm.get('currentPassword')?.touched && passForm.get('currentPassword')?.invalid" />
                <button type="button" class="btn btn-outline-secondary" (click)="showCurrentPwd = !showCurrentPwd" tabindex="-1">
                  <i class="bi" [class.bi-eye]="!showCurrentPwd" [class.bi-eye-slash]="showCurrentPwd"></i>
                </button>
              </div>
              <small class="text-danger d-block mt-1" *ngIf="passForm.get('currentPassword')?.touched && passForm.get('currentPassword')?.errors?.['required']">
                <i class="bi bi-exclamation-circle me-1"></i>Current password is required.
              </small>
            </div>
            <div class="mb-3">
              <label class="form-label">New password <span class="text-danger">*</span></label>
              <div class="input-group">
                <input [type]="showNewPwd ? 'text' : 'password'" class="form-control" formControlName="newPassword" autocomplete="new-password" placeholder="At least 6 characters"
                       [class.is-invalid]="passForm.get('newPassword')?.touched && passForm.get('newPassword')?.invalid" />
                <button type="button" class="btn btn-outline-secondary" (click)="showNewPwd = !showNewPwd" tabindex="-1">
                  <i class="bi" [class.bi-eye]="!showNewPwd" [class.bi-eye-slash]="showNewPwd"></i>
                </button>
              </div>
              <small class="d-block mt-1"
                     *ngIf="passForm.get('newPassword')?.touched || newPwdLen() > 0"
                     [class.text-danger]="newPwdLen() < 6"
                     [class.text-success]="newPwdLen() >= 6">
                <i class="bi" [class.bi-exclamation-circle]="newPwdLen() < 6" [class.bi-check-circle]="newPwdLen() >= 6"></i>
                {{ newPwdLen() }} / 6+ characters
                <span *ngIf="newPwdLen() < 6"> — need {{ 6 - newPwdLen() }} more</span>
              </small>
            </div>

            <div *ngIf="otpSent" class="mb-3">
              <div class="alert alert-info py-2 small mb-3">
                <i class="bi bi-envelope-check me-1"></i>
                A 6-digit OTP was sent to <strong>{{ auth.currentUser()?.email }}</strong>. It expires in 1 minute 25 seconds.
              </div>
              <label class="form-label">Enter OTP <span class="text-danger">*</span></label>
              <input class="form-control form-control-lg text-center fw-bold tracking-wide"
                     formControlName="otp" maxlength="6" placeholder="• • • • • •"
                     style="letter-spacing: 0.5rem;"
                     [class.is-invalid]="passForm.get('otp')?.touched && passForm.get('otp')?.invalid" />
              <small class="text-danger d-block mt-1" *ngIf="passForm.get('otp')?.touched && passForm.get('otp')?.errors?.['required']">
                <i class="bi bi-exclamation-circle me-1"></i>OTP is required.
              </small>
              <small class="text-danger d-block mt-1" *ngIf="passForm.get('otp')?.touched && passForm.get('otp')?.errors?.['pattern']">
                <i class="bi bi-exclamation-circle me-1"></i>OTP must be 6 digits.
              </small>
              <button type="button" class="btn btn-link btn-sm px-0 mt-1" (click)="resendOtp()" [disabled]="sendingOtp">
                <span *ngIf="sendingOtp" class="spinner-border spinner-border-sm me-1"></span>
                Resend OTP
              </button>
            </div>

            <button *ngIf="!otpSent" type="submit" class="btn btn-primary w-100" [disabled]="passForm.get('currentPassword')?.invalid || passForm.get('newPassword')?.invalid || sendingOtp">
              <span *ngIf="sendingOtp" class="spinner-border spinner-border-sm me-2"></span>
              {{ sendingOtp ? 'Sending OTP…' : 'Send OTP to email' }}
            </button>
            <div *ngIf="otpSent" class="d-flex gap-2">
              <button type="submit" class="btn btn-primary flex-grow-1" [disabled]="passForm.invalid || changingPwd">
                <span *ngIf="changingPwd" class="spinner-border spinner-border-sm me-2"></span>
                {{ changingPwd ? 'Verifying…' : 'Verify & Update Password' }}
              </button>
              <button type="button" class="btn btn-outline-secondary" (click)="cancelOtp()">Cancel</button>
            </div>

            <div *ngIf="pwdResult" class="alert mt-3 mb-0 py-2 d-flex align-items-center gap-2"
                 [class.alert-success]="pwdResult.ok" [class.alert-danger]="!pwdResult.ok">
              <i class="bi" [class.bi-check-circle-fill]="pwdResult.ok" [class.bi-exclamation-triangle-fill]="!pwdResult.ok"></i>
              {{ pwdResult.text }}
            </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private api   = inject(ApiService);
  readonly auth = inject(AuthService);
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);

  // Async validators as arrow functions — close over 'this' so they can skip
  // checks when the user hasn't changed their own email/phone.
  private emailExistsValidatorFn: AsyncValidatorFn = (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = control.value as string;
    if (!email || !email.includes('@')) return of(null);
    if (email.toLowerCase() === this.originalEmail.toLowerCase()) return of(null);
    return timer(500).pipe(
      switchMap(() => this.auth.checkEmail(email)),
      map(r => r.data?.exists ? { emailTaken: true } : null)
    );
  };

  private phoneExistsValidatorFn: AsyncValidatorFn = (control: AbstractControl): Observable<ValidationErrors | null> => {
    const phone = control.value as string;
    if (!phone || phone.length < 7) return of(null);
    if (phone === this.originalPhone) return of(null);
    return timer(500).pipe(
      switchMap(() => this.auth.checkPhone(phone)),
      map(r => r.data?.exists ? { phoneTaken: true } : null)
    );
  };

  form = this.fb.group({
    fullName:      ['', [Validators.required, Validators.maxLength(100)]],
    email:         ['', [Validators.required, Validators.email, Validators.maxLength(150)], [this.emailExistsValidatorFn]],
    phone:         ['', [Validators.required, Validators.pattern(/^\d+$/), Validators.minLength(7), Validators.maxLength(20)], [this.phoneExistsValidatorFn]],
    dateOfBirth:   [''],
    gender:        [''],
    address:       [''],
    country:       [''],
    state:         [''],
    city:          [''],
    postalCode:    ['', [Validators.pattern(/^\d+$/), Validators.maxLength(10)]],
    idProofType:   [''],
    idProofNumber: ['']
  });

  passForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(6)]],
    otp:             ['']
  });

  countries: Country[] = [];
  states:    GeoState[] = [];
  cities:    City[]     = [];

  selCountry = '';
  selState   = '';
  selCity    = '';

  originalEmail = '';
  originalPhone = '';

  saving       = false;
  changingPwd  = false;
  sendingOtp   = false;
  otpSent      = false;
  pwdResult: { ok: boolean; text: string } | null = null;
  showCurrentPwd = false;
  showNewPwd     = false;

  get fullNameCtl()    { return this.form.controls.fullName; }
  get emailCtl()       { return this.form.controls.email; }
  get phoneCtl()       { return this.form.controls.phone; }
  get countryCtl()     { return this.form.controls.country; }
  get stateCtl()       { return this.form.controls.state; }
  get cityCtl()        { return this.form.controls.city; }
  get postalCodeCtl()  { return this.form.controls.postalCode; }

  ngOnInit(): void {
    forkJoin({
      profile:   this.api.getMyProfile(),
      countries: this.api.listCountries(true)
    }).subscribe(({ profile, countries }) => {
      this.countries     = countries;
      this.originalEmail = profile.email ?? '';
      this.originalPhone = profile.phone ?? '';

      this.form.patchValue({
        fullName:      profile.fullName,
        email:         profile.email,
        phone:         profile.phone,
        dateOfBirth:   profile.dateOfBirth ? profile.dateOfBirth.substring(0, 10) : '',
        gender:        profile.gender ?? '',
        address:       profile.address,
        postalCode:    profile.postalCode,
        idProofType:   profile.idProofType,
        idProofNumber: profile.idProofNumber
      });

      // Cascade-initialize country → state → city dropdowns from saved text values
      const foundCountry = countries.find(c => c.name === profile.country);
      if (foundCountry) {
        this.selCountry = String(foundCountry.id);
        this.form.patchValue({ country: profile.country });
        this.api.listStates(foundCountry.id, true).subscribe(stateList => {
          this.states = stateList;
          const foundState = stateList.find(s => s.name === profile.state);
          if (foundState) {
            this.selState = String(foundState.id);
            this.form.patchValue({ state: profile.state });
            this.api.listCities(foundState.id, undefined, true).subscribe(cityList => {
              this.cities = cityList;
              const foundCity = cityList.find(c => c.name === profile.city);
              if (foundCity) {
                this.selCity = String(foundCity.id);
                this.form.patchValue({ city: profile.city });
              } else if (profile.city) {
                this.selCity = 'other';
                this.form.patchValue({ city: profile.city });
              }
            });
          } else if (profile.state) {
            this.selState = 'other';
            this.form.patchValue({ state: profile.state });
            if (profile.city) {
              this.selCity = 'other';
              this.form.patchValue({ city: profile.city });
            }
          }
        });
      } else if (profile.country) {
        this.selCountry = 'other';
        this.form.patchValue({ country: profile.country });
        if (profile.state) {
          this.selState = 'other';
          this.form.patchValue({ state: profile.state });
        }
        if (profile.city) {
          this.selCity = 'other';
          this.form.patchValue({ city: profile.city });
        }
      }
    });
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
  }

  save(): void {
    if (this.form.invalid || this.form.pending) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const req = { ...v, dateOfBirth: v.dateOfBirth || null };
    this.api.updateMyProfile(req).subscribe({
      next: c => {
        this.saving        = false;
        this.originalEmail = c.email ?? '';
        this.originalPhone = c.phone ?? '';
        this.auth.updateCachedUser({ fullName: c.fullName, phone: c.phone, email: c.email });
        this.toast.show('Profile updated', 'success');
      },
      error: (err: any) => {
        this.saving = false;
        const msg = err?.error?.message || 'Failed to update profile. Please try again.';
        this.toast.show(msg, 'danger');
      }
    });
  }

  sendOtp(): void {
    const currentPassword = this.passForm.get('currentPassword')!;
    const newPassword     = this.passForm.get('newPassword')!;
    currentPassword.markAsTouched();
    newPassword.markAsTouched();
    if (currentPassword.invalid || newPassword.invalid) return;
    this.sendingOtp = true;
    this.pwdResult  = null;
    this.auth.sendChangePasswordOtp(currentPassword.value!).subscribe({
      next: () => {
        this.sendingOtp = false;
        this.otpSent    = true;
        const otpCtrl   = this.passForm.get('otp')!;
        otpCtrl.reset();
        otpCtrl.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
        otpCtrl.updateValueAndValidity();
      },
      error: (err: any) => {
        this.sendingOtp = false;
        const msg = err?.error?.message || 'Failed to send OTP. Please check your current password.';
        this.pwdResult = { ok: false, text: msg };
        setTimeout(() => this.pwdResult = null, 5000);
      }
    });
  }

  resendOtp(): void {
    this.sendingOtp = true;
    this.auth.sendChangePasswordOtp(this.passForm.get('currentPassword')!.value!).subscribe({
      next: () => { this.sendingOtp = false; this.passForm.get('otp')!.reset(); this.toast.show('OTP resent to your email.', 'info'); },
      error: () => { this.sendingOtp = false; this.toast.show('Failed to resend OTP.', 'danger'); }
    });
  }

  cancelOtp(): void {
    this.otpSent = false;
    const otpCtrl = this.passForm.get('otp')!;
    otpCtrl.clearValidators();
    otpCtrl.reset();
    otpCtrl.updateValueAndValidity();
    this.pwdResult = null;
  }

  changePassword(): void {
    if (this.passForm.invalid) { this.passForm.markAllAsTouched(); return; }
    this.changingPwd = true;
    this.pwdResult   = null;
    const v = this.passForm.getRawValue();
    this.auth.changePassword(v.currentPassword!, v.newPassword!, v.otp!).subscribe({
      next: () => {
        this.changingPwd = false;
        this.otpSent     = false;
        const otpCtrl    = this.passForm.get('otp')!;
        otpCtrl.clearValidators();
        otpCtrl.updateValueAndValidity();
        this.passForm.reset();
        this.pwdResult = { ok: true, text: 'Password updated successfully.' };
        this.toast.show('Password updated successfully.', 'success');
        setTimeout(() => this.pwdResult = null, 5000);
      },
      error: (err: any) => {
        this.changingPwd = false;
        const msg = err?.error?.message || 'Failed to update password. Please try again.';
        this.pwdResult = { ok: false, text: msg };
        setTimeout(() => this.pwdResult = null, 5000);
      }
    });
  }

  newPwdLen(): number {
    return (this.passForm.value.newPassword || '').length;
  }
}
