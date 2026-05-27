import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SystemRolesService } from '../../core/services/system-roles.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow border-0">
            <div class="card-body p-4 p-md-5">
              <h3 class="fw-bold mb-1">Welcome back</h3>
              <p class="text-muted mb-4">Sign in to manage your bookings.</p>

              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="errorMessage">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ errorMessage }}</div>
                <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="errorMessage = ''"></button>
              </div>

              <form [formGroup]="form" (ngSubmit)="submit()">
                <div class="mb-3">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <input type="email" class="form-control" formControlName="email"
                         [class.is-invalid]="emailCtl.touched && emailCtl.invalid" />
                  <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['required']">
                    <i class="bi bi-exclamation-circle me-1"></i>Email is required.
                  </small>
                  <small class="text-danger d-block mt-1" *ngIf="emailCtl.touched && emailCtl.errors?.['email']">
                    <i class="bi bi-exclamation-circle me-1"></i>Enter a valid email address.
                  </small>
                </div>
                <div class="mb-3">
                  <div class="d-flex justify-content-between align-items-baseline">
                    <label class="form-label">Password <span class="text-danger">*</span></label>
                    <a routerLink="/auth/forgot-password" class="small">Forgot password?</a>
                  </div>
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
                <button class="btn btn-primary w-100" [disabled]="form.invalid || loading">
                  {{ loading ? 'Signing in...' : 'Sign in' }}
                </button>
              </form>

              <p class="mt-4 text-center mb-0">
                New to TravelHub? <a routerLink="/auth/register">Create account</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb          = inject(FormBuilder);
  private auth        = inject(AuthService);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private toast       = inject(ToastService);
  private systemRoles = inject(SystemRolesService);

  loading = false;
  errorMessage = '';
  showPassword = false;
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get emailCtl()    { return this.form.controls.email; }
  get passwordCtl() { return this.form.controls.password; }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const v = this.form.getRawValue();
    this.auth.login({ email: v.email!, password: v.password! }).subscribe({
      next: r => {
        this.loading = false;
        if (r.success) {
          const user = r.data?.user;
          this.toast.show(`Welcome back, ${user?.fullName ?? 'there'}!`, 'success', 4000, { title: 'Signed in', persist: false });
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          this.router.navigateByUrl(returnUrl || this.defaultLanding());
        }
      },
      error: (err: any) => {
        this.loading = false;
        const apiMsg: string | undefined = err?.error?.message || err?.error?.errors?.[0];
        this.errorMessage = apiMsg || 'Invalid email or password.';
      }
    });
  }

  private defaultLanding(): string {
    const user = this.auth.currentUser();
    if (!user) return '/';
    const fromConfig = this.systemRoles.defaultRouteFor(user.privilegeLevel);
    if (fromConfig && fromConfig !== '/') return fromConfig;
    // Fallback when _roles hasn't loaded yet: role name convention (SuperAdmin → /superadmin)
    return user.privilegeLevel >= 1 ? '/' + user.role.toLowerCase() : '/customer';
  }
}
