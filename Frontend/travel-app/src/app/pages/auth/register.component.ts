import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

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

              <form [formGroup]="form" (ngSubmit)="submit()">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Full name</label>
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
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" formControlName="email"
                           [class.is-invalid]="emailCtl.touched && emailCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Email is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['email']">
                      <i class="bi bi-exclamation-circle me-1"></i>Enter a valid email address.
                    </small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Phone</label>
                    <input class="form-control" formControlName="phone"
                           [class.is-invalid]="phoneCtl.touched && phoneCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="phoneCtl.touched && phoneCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Phone is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="phoneCtl.touched && phoneCtl.errors?.['minlength']">
                      <i class="bi bi-exclamation-circle me-1"></i>Phone must be at least 7 digits.
                    </small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" formControlName="password"
                           [class.is-invalid]="passwordCtl.touched && passwordCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="passwordCtl.touched && passwordCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Password is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="passwordCtl.touched && passwordCtl.errors?.['minlength']">
                      <i class="bi bi-exclamation-circle me-1"></i>Password must be at least 6 characters.
                    </small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">City</label>
                    <input class="form-control" formControlName="city"
                           [class.is-invalid]="cityCtl.touched && cityCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="cityCtl.touched && cityCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>City is required.
                    </small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Country</label>
                    <input class="form-control" formControlName="country"
                           [class.is-invalid]="countryCtl.touched && countryCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="countryCtl.touched && countryCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Country is required.
                    </small>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Address</label>
                    <input class="form-control" formControlName="address"
                           [class.is-invalid]="addressCtl.touched && addressCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="addressCtl.touched && addressCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Address is required.
                    </small>
                  </div>
                </div>

                <button class="btn btn-primary w-100 mt-4" [disabled]="form.invalid || loading">
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = false;
  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: [''],
    country: ['India', [Validators.required]]
  });

  get fullNameCtl() { return this.form.controls.fullName; }
  get emailCtl() { return this.form.controls.email; }
  get passwordCtl() { return this.form.controls.password; }
  get phoneCtl() { return this.form.controls.phone; }
  get addressCtl() { return this.form.controls.address; }
  get cityCtl() { return this.form.controls.city; }
  get countryCtl() { return this.form.controls.country; }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.register(this.form.getRawValue() as any).subscribe({
      next: r => {
        this.loading = false;
        if (r.success) {
          this.toast.show('Welcome to TravelHub!', 'success');
          this.router.navigateByUrl('/customer');
        }
      },
      error: () => { this.loading = false; }
    });
  }
}
