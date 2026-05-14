import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-settings',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-4">Settings</h2>

    <ul class="nav nav-tabs mb-3">
      <li class="nav-item"><a class="nav-link" [class.active]="tab==='profile'" href="javascript:;" (click)="tab='profile'">Profile</a></li>
      <li class="nav-item"><a class="nav-link" [class.active]="tab==='password'" href="javascript:;" (click)="tab='password'">Password</a></li>
    </ul>

    <div class="table-card" *ngIf="tab==='profile'">
      <div class="d-flex align-items-center mb-1">
        <h5 class="fw-bold mb-0"><i class="bi bi-person-circle me-2"></i>My profile</h5>
      </div>
      <p class="text-muted small mb-3">Your display name and contact phone. Email and role are managed by an admin.</p>
      <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Full name <span class="text-danger">*</span></label>
          <input class="form-control" formControlName="fullName" [class.is-invalid]="isInvalid(profileForm.get('fullName'))" />
          <div class="invalid-feedback" *ngIf="isInvalid(profileForm.get('fullName'))">Full name is required.</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Email <span class="text-danger">*</span></label>
          <input type="email" class="form-control" formControlName="email" [class.is-invalid]="isInvalid(profileForm.get('email'))" />
          <div class="invalid-feedback" *ngIf="isInvalid(profileForm.get('email'))">Valid email is required.</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Phone <span class="text-danger">*</span></label>
          <input class="form-control" formControlName="phone" [class.is-invalid]="isInvalid(profileForm.get('phone'))" />
          <div class="invalid-feedback" *ngIf="isInvalid(profileForm.get('phone'))">Phone is required.</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Role</label>
          <input class="form-control" formControlName="role" [readonly]="true" />
        </div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="profileForm.invalid || savingProfile" [title]="profileForm.invalid ? 'Fill in all required fields to save' : 'Save profile'">
            <span *ngIf="savingProfile" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!savingProfile" class="bi bi-check2-circle me-1"></i>{{ savingProfile ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </form>
    </div>

    <div class="table-card" *ngIf="tab==='password'">
      <div class="d-flex align-items-center mb-1">
        <h5 class="fw-bold mb-0"><i class="bi bi-shield-lock me-2"></i>Change password</h5>
      </div>
      <p class="text-muted small mb-3">Confirm your current password and pick a new one (at least 6 characters).</p>
      <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Current password <span class="text-danger">*</span></label>
          <input type="password" class="form-control" formControlName="currentPassword" autocomplete="current-password" placeholder="Your current password" [class.is-invalid]="isInvalid(passwordForm.get('currentPassword'))" />
          <div class="invalid-feedback" *ngIf="isInvalid(passwordForm.get('currentPassword'))">Current password is required.</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">New password <span class="text-danger">*</span></label>
          <input type="password" class="form-control" formControlName="newPassword" autocomplete="new-password" placeholder="At least 6 characters" [class.is-invalid]="isInvalid(passwordForm.get('newPassword'))" />
          <small class="d-block mt-1"
                 *ngIf="passwordForm.get('newPassword')?.touched || newPwdLen() > 0"
                 [class.text-danger]="newPwdLen() < 6"
                 [class.text-success]="newPwdLen() >= 6">
            <i class="bi" [class.bi-exclamation-circle]="newPwdLen() < 6" [class.bi-check-circle]="newPwdLen() >= 6"></i>
            {{ newPwdLen() }} / 6+ characters
            <span *ngIf="newPwdLen() < 6"> — need {{ 6 - newPwdLen() }} more</span>
          </small>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid || savingPassword" [title]="passwordForm.invalid ? 'Fill in both passwords to save' : 'Update password'">
            <span *ngIf="savingPassword" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!savingPassword" class="bi bi-check2-circle me-1"></i>{{ savingPassword ? 'Saving…' : 'Update password' }}
          </button>
        </div>
      </form>
    </div>

  `
})
export class AdminSettingsComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  tab: 'profile' | 'password' = 'profile';

  savingProfile = false;
  savingPassword = false;

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    role: [{ value: '', disabled: false }]
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) this.profileForm.patchValue({ fullName: u.fullName, email: u.email, phone: u.phone || '', role: u.role });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.savingProfile = true;
    const v = this.profileForm.getRawValue();
    this.api.updateMyAuthProfile({ fullName: v.fullName!, email: v.email!, phone: v.phone || null }).subscribe({
      next: r => {
        this.savingProfile = false;
        if (r.success && r.data) {
          const stored = JSON.parse(sessionStorage.getItem('travel.user') || 'null');
          if (stored) {
            stored.fullName = r.data.fullName;
            stored.email = r.data.email;
            stored.phone = r.data.phone;
            sessionStorage.setItem('travel.user', JSON.stringify(stored));
          }
        }
        this.toast.show('Your profile details have been saved.', 'success', 4000, { title: 'Profile updated' });
      },
      error: (err: any) => {
        this.savingProfile = false;
        const msg = err?.error?.message || 'Could not update profile. Please try again.';
        this.toast.show(msg, 'danger', 4000, { title: 'Update failed' });
      }
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPassword = true;
    const v = this.passwordForm.getRawValue();
    this.auth.changePassword(v.currentPassword!, v.newPassword!).subscribe({
      next: () => { this.savingPassword = false; this.passwordForm.reset(); this.toast.show('Use the new password next time you sign in.', 'success', 4000, { title: 'Password updated' }); },
      error: () => { this.savingPassword = false; this.toast.show('Could not update password. Check your current password and try again.', 'danger', 4000, { title: 'Update failed' }); }
    });
  }

  newPwdLen(): number {
    return (this.passwordForm.value.newPassword || '').length;
  }
}
