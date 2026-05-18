import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow border-0">
            <div class="card-body p-4 p-md-5">

              <ng-container *ngIf="!sent">
                <h3 class="fw-bold mb-1">Forgot password?</h3>
                <p class="text-muted mb-3">Enter your email and we'll send you a new temporary password.</p>
                <div class="alert alert-warning small mb-4 py-2">
                  <i class="bi bi-info-circle me-1"></i>
                  This is a temporary password. Once you change your password, this temporary password will no longer work.
                  Please log in using the temporary password and change your password from your
                  <strong>Profile → Change Password</strong> settings.
                </div>

                <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="errorMessage">
                  <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                  <div class="flex-grow-1">{{ errorMessage }}</div>
                  <button type="button" class="btn-close ms-2" (click)="errorMessage = ''"></button>
                </div>

                <form [formGroup]="form" (ngSubmit)="submit()">
                  <div class="mb-3">
                    <label class="form-label">Email address <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" formControlName="email"
                           placeholder="you@example.com"
                           [class.is-invalid]="emailCtl.touched && emailCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>Email is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['email']">
                      <i class="bi bi-exclamation-circle me-1"></i>Enter a valid email address.
                    </small>
                  </div>
                  <button type="submit" class="btn btn-primary w-100" [disabled]="form.invalid || loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Sending…' : 'Send temporary password' }}
                  </button>
                </form>

                <p class="mt-4 text-center mb-0">
                  <a routerLink="/auth/login"><i class="bi bi-arrow-left me-1"></i>Back to sign in</a>
                </p>
              </ng-container>

              <ng-container *ngIf="sent">
                <div class="text-center py-2">
                  <div class="mb-3">
                    <i class="bi bi-envelope-check" style="font-size:3rem;color:#5a6b2a;"></i>
                  </div>
                  <h3 class="fw-bold mb-2">Check your email</h3>
                  <p class="text-muted mb-1">We sent a temporary password to</p>
                  <p class="fw-semibold mb-3">{{ submittedEmail }}</p>
                  <p class="text-muted small mb-4">
                    Use that password to sign in, then go to your profile and choose
                    <strong>Change Password</strong> to set a new one.
                  </p>
                  <a routerLink="/auth/login" class="btn btn-primary w-100">
                    <i class="bi bi-box-arrow-in-right me-1"></i>Sign in
                  </a>
                </div>
              </ng-container>

            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  loading = false;
  sent = false;
  errorMessage = '';
  submittedEmail = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get emailCtl() { return this.form.controls.email; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    const email = this.form.value.email!;
    this.api.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.submittedEmail = email;
        this.sent = true;
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }
}
