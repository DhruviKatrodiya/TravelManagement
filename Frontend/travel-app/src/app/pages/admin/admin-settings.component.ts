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
      <li class="nav-item" *ngIf="auth.isAdmin()"><a class="nav-link" [class.active]="tab==='email'" href="javascript:;" (click)="tab='email'">Email</a></li>
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
          <div class="input-group">
            <input [type]="showCurrentPwd ? 'text' : 'password'" class="form-control" formControlName="currentPassword" autocomplete="current-password" placeholder="Your current password" [class.is-invalid]="isInvalid(passwordForm.get('currentPassword'))" />
            <button type="button" class="btn btn-outline-secondary" (click)="showCurrentPwd = !showCurrentPwd" tabindex="-1">
              <i class="bi" [class.bi-eye]="!showCurrentPwd" [class.bi-eye-slash]="showCurrentPwd"></i>
            </button>
          </div>
          <small class="text-danger d-block mt-1" *ngIf="isInvalid(passwordForm.get('currentPassword'))">
            <i class="bi bi-exclamation-circle me-1"></i>Current password is required.
          </small>
        </div>
        <div class="col-md-6">
          <label class="form-label">New password <span class="text-danger">*</span></label>
          <div class="input-group">
            <input [type]="showNewPwd ? 'text' : 'password'" class="form-control" formControlName="newPassword" autocomplete="new-password" placeholder="At least 6 characters" [class.is-invalid]="isInvalid(passwordForm.get('newPassword'))" />
            <button type="button" class="btn btn-outline-secondary" (click)="showNewPwd = !showNewPwd" tabindex="-1">
              <i class="bi" [class.bi-eye]="!showNewPwd" [class.bi-eye-slash]="showNewPwd"></i>
            </button>
          </div>
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

    <div class="table-card" *ngIf="tab==='email' && auth.isAdmin()">
      <div class="d-flex align-items-center mb-1">
        <h5 class="fw-bold mb-0"><i class="bi bi-envelope-check me-2"></i>Email configuration</h5>
      </div>
      <p class="text-muted small mb-3">
        Send a test email to verify your SMTP settings are working.
        Emails are sent via Gmail SMTP. If authentication fails, you need a
        <strong>Gmail App Password</strong> — go to
        <a href="https://myaccount.google.com/security" target="_blank" rel="noopener">myaccount.google.com/security</a>
        → 2-Step Verification → App Passwords, create one for Mail, and paste the 16-character code
        into <code>appsettings.json</code> under <code>Email.Password</code>.
      </p>
      <div class="row g-3 align-items-end">
        <div class="col-md-6">
          <label class="form-label">Send test email to</label>
          <input type="email" class="form-control" [(ngModel)]="testEmailAddress" placeholder="recipient@example.com" />
          <div class="form-text">Leave blank to send to your own account email.</div>
        </div>
        <div class="col-md-auto">
          <button class="btn btn-primary" (click)="sendTestEmail()" [disabled]="sendingTestEmail">
            <span *ngIf="sendingTestEmail" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!sendingTestEmail" class="bi bi-send me-1"></i>{{ sendingTestEmail ? 'Sending…' : 'Send test email' }}
          </button>
        </div>
      </div>
      <div *ngIf="testEmailResult" class="mt-3 alert" [class.alert-success]="testEmailResult.ok" [class.alert-danger]="!testEmailResult.ok">
        <i class="bi me-2" [class.bi-check-circle-fill]="testEmailResult.ok" [class.bi-exclamation-triangle-fill]="!testEmailResult.ok"></i>
        {{ testEmailResult.message }}
      </div>
    </div>

  `
})
export class AdminSettingsComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  tab: 'profile' | 'password' | 'email' = 'profile';

  savingProfile = false;
  savingPassword = false;
  showCurrentPwd = false;
  showNewPwd = false;
  sendingTestEmail = false;
  testEmailAddress = '';
  testEmailResult: { ok: boolean; message: string } | null = null;

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

  sendTestEmail(): void {
    this.sendingTestEmail = true;
    this.testEmailResult = null;
    const to = this.testEmailAddress.trim() || undefined;
    this.api.sendTestEmail(to).subscribe({
      next: msg => {
        this.sendingTestEmail = false;
        this.testEmailResult = { ok: true, message: msg || 'Test email sent successfully.' };
      },
      error: (err: any) => {
        this.sendingTestEmail = false;
        const msg = err?.error?.message || 'Failed to send test email. Check the server logs for details.';
        this.testEmailResult = { ok: false, message: msg };
      }
    });
  }
}
