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

              <!-- Step 1: Enter email -->
              <ng-container *ngIf="step === 'email'">
                <h3 class="fw-bold mb-1">Forgot password?</h3>
                <p class="text-muted mb-3">Enter your email and we'll send you a verification OTP.</p>
                <div class="alert alert-warning small mb-4 py-2">
                  <i class="bi bi-info-circle me-1"></i>
                  After verifying the OTP, a temporary password will be sent to your email.
                  Log in with it, then change your password from
                  <strong>Profile → Change Password</strong>.
                </div>

                <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="errorMessage">
                  <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                  <div class="flex-grow-1">{{ errorMessage }}</div>
                  <button type="button" class="btn-close ms-2" (click)="errorMessage = ''"></button>
                </div>

                <form [formGroup]="emailForm" (ngSubmit)="sendOtp()">
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
                  <button type="submit" class="btn btn-primary w-100" [disabled]="emailForm.invalid || loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Sending OTP…' : 'Send OTP' }}
                  </button>
                </form>

                <p class="mt-4 text-center mb-0">
                  <a routerLink="/auth/login"><i class="bi bi-arrow-left me-1"></i>Back to sign in</a>
                </p>
              </ng-container>

              <!-- Step 2: Enter OTP -->
              <ng-container *ngIf="step === 'otp'">
                <div class="text-center mb-4">
                  <i class="bi bi-shield-lock" style="font-size:2.5rem;color:#5a6b2a;"></i>
                  <h3 class="fw-bold mt-2 mb-1">Enter OTP</h3>
                  <p class="text-muted small mb-0">
                    A 6-digit OTP was sent to <strong>{{ submittedEmail }}</strong>.<br/>
                    It expires in <strong>1 minute 25 seconds</strong>.
                  </p>
                </div>

                <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="errorMessage">
                  <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                  <div class="flex-grow-1">{{ errorMessage }}</div>
                  <button type="button" class="btn-close ms-2" (click)="errorMessage = ''"></button>
                </div>

                <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()">
                  <div class="mb-3">
                    <label class="form-label">6-digit OTP <span class="text-danger">*</span></label>
                    <input class="form-control form-control-lg text-center fw-bold"
                           formControlName="otp" maxlength="6" placeholder="• • • • • •"
                           style="letter-spacing: 0.5rem;"
                           [class.is-invalid]="otpCtl.touched && otpCtl.invalid" />
                    <small class="text-danger d-block mt-1" *ngIf="otpCtl.touched && otpCtl.errors?.['required']">
                      <i class="bi bi-exclamation-circle me-1"></i>OTP is required.
                    </small>
                    <small class="text-danger d-block mt-1" *ngIf="otpCtl.touched && otpCtl.errors?.['pattern']">
                      <i class="bi bi-exclamation-circle me-1"></i>Enter the 6-digit code from your email.
                    </small>
                  </div>
                  <button type="submit" class="btn btn-primary w-100 mb-2" [disabled]="otpForm.invalid || loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Verifying…' : 'Verify OTP' }}
                  </button>
                </form>

                <div class="d-flex justify-content-between align-items-center mt-2">
                  <button class="btn btn-link btn-sm px-0 text-muted" (click)="step = 'email'; errorMessage = ''">
                    <i class="bi bi-arrow-left me-1"></i>Change email
                  </button>
                  <button class="btn btn-link btn-sm px-0" (click)="resendOtp()" [disabled]="resending">
                    <span *ngIf="resending" class="spinner-border spinner-border-sm me-1"></span>
                    Resend OTP
                  </button>
                </div>
              </ng-container>

              <!-- Step 3: Done -->
              <ng-container *ngIf="step === 'done'">
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

  step: 'email' | 'otp' | 'done' = 'email';
  loading = false;
  resending = false;
  errorMessage = '';
  submittedEmail = '';

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  get emailCtl() { return this.emailForm.controls.email; }
  get otpCtl()   { return this.otpForm.controls.otp; }

  sendOtp(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    const email = this.emailForm.value.email!;
    this.api.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.submittedEmail = email;
        this.otpForm.reset();
        this.step = 'otp';
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }

  resendOtp(): void {
    this.resending = true;
    this.errorMessage = '';
    this.api.forgotPassword(this.submittedEmail).subscribe({
      next: () => { this.resending = false; this.otpForm.reset(); },
      error: () => { this.resending = false; }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    this.api.verifyForgotPasswordOtp(this.submittedEmail, this.otpForm.value.otp!).subscribe({
      next: () => {
        this.loading = false;
        this.step = 'done';
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Invalid or expired OTP. Please try again.';
      }
    });
  }
}
