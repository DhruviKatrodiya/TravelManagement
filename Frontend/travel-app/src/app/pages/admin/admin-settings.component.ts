import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { BrandService } from '../../core/services/brand.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-settings',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-4">Settings</h2>

    <ul class="nav nav-tabs mb-3">
      <li class="nav-item"><a class="nav-link" [class.active]="tab==='profile'" href="javascript:;" (click)="tab='profile'">Profile</a></li>
      <li class="nav-item"><a class="nav-link" [class.active]="tab==='password'" href="javascript:;" (click)="tab='password'">Password</a></li>
      <li class="nav-item"><a class="nav-link" [class.active]="tab==='theme'" href="javascript:;" (click)="tab='theme'">Theme</a></li>
      <li class="nav-item" *ngIf="auth.isAdmin()"><a class="nav-link" [class.active]="tab==='brand'" href="javascript:;" (click)="tab='brand'">Brand</a></li>
    </ul>

    <div class="table-card" *ngIf="tab==='profile'">
      <h5 class="fw-bold mb-3">My profile</h5>
      <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="row g-3">
        <div class="col-md-6"><label class="form-label">Full name</label><input class="form-control" formControlName="fullName" /></div>
        <div class="col-md-6"><label class="form-label">Email</label><input class="form-control" formControlName="email" [readonly]="true" /></div>
        <div class="col-md-6"><label class="form-label">Phone</label><input class="form-control" formControlName="phone" /></div>
        <div class="col-md-6"><label class="form-label">Role</label><input class="form-control" formControlName="role" [readonly]="true" /></div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="profileForm.invalid || savingProfile">{{ savingProfile ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </div>

    <div class="table-card" *ngIf="tab==='password'">
      <h5 class="fw-bold mb-3">Change password</h5>
      <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Current password</label>
          <input type="password" class="form-control" formControlName="currentPassword" autocomplete="current-password" placeholder="Your current password" />
          <small class="text-danger d-block mt-1" *ngIf="passwordForm.get('currentPassword')?.touched && !passwordForm.value.currentPassword">
            <i class="bi bi-exclamation-circle me-1"></i>Required.
          </small>
        </div>
        <div class="col-md-6">
          <label class="form-label">New password</label>
          <input type="password" class="form-control" formControlName="newPassword" autocomplete="new-password" placeholder="At least 6 characters" />
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
          <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid || savingPassword">{{ savingPassword ? 'Saving…' : 'Update password' }}</button>
        </div>
      </form>
    </div>

    <div class="table-card" *ngIf="tab==='theme'">
      <h5 class="fw-bold mb-3">Theme</h5>
      <p class="text-muted small">Choose how the admin console looks. Saved on this device.</p>
      <div class="d-flex gap-3">
        <button class="btn" [class.btn-primary]="theme.mode()==='light'" [class.btn-outline-secondary]="theme.mode()!=='light'" (click)="setTheme('light')">
          <i class="bi bi-sun me-1"></i>Light
        </button>
        <button class="btn" [class.btn-primary]="theme.mode()==='dark'" [class.btn-outline-secondary]="theme.mode()!=='dark'" (click)="setTheme('dark')">
          <i class="bi bi-moon-stars me-1"></i>Dark
        </button>
      </div>
    </div>

    <div class="table-card" *ngIf="tab==='brand' && auth.isAdmin()">
      <h5 class="fw-bold mb-3">Brand</h5>
      <form [formGroup]="brandForm" (ngSubmit)="saveBrand()" class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Brand name (navbar title)</label>
          <input class="form-control" formControlName="brandName" placeholder="Admin Console" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Logo</label>
          <input #logoInput type="file" class="form-control" accept="image/*" (change)="onLogoSelected($event)" [disabled]="uploadingLogo" />
          <small class="text-muted" *ngIf="uploadingLogo">Uploading…</small>
          <div class="mt-2 d-flex align-items-center gap-2" *ngIf="brandForm.value.logoUrl">
            <img [src]="brandForm.value.logoUrl" alt="Logo" style="max-height:48px;max-width:160px;object-fit:contain;background:#fff;border:1px solid #dee2e6;border-radius:4px;padding:4px" (error)="onLogoError($event)" />
            <button type="button" class="btn btn-sm btn-outline-danger" (click)="clearLogo(logoInput)">Remove</button>
          </div>
        </div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="savingBrand">{{ savingBrand ? 'Saving…' : 'Save brand' }}</button>
        </div>
      </form>
    </div>
  `
})
export class AdminSettingsComponent implements OnInit {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  brand = inject(BrandService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  tab: 'profile' | 'password' | 'theme' | 'brand' = 'profile';

  savingProfile = false;
  savingPassword = false;
  savingBrand = false;
  uploadingLogo = false;

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: [{ value: '', disabled: false }],
    phone: [''],
    role: [{ value: '', disabled: false }]
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  brandForm = this.fb.group({
    brandName: [''],
    logoUrl: ['']
  });

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) this.profileForm.patchValue({ fullName: u.fullName, email: u.email, phone: u.phone || '', role: u.role });

    const s = this.brand.settings();
    this.brandForm.patchValue({ brandName: s.brandName || '', logoUrl: s.logoUrl || '' });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    const v = this.profileForm.getRawValue();
    this.api.updateMyAuthProfile({ fullName: v.fullName!, phone: v.phone || null }).subscribe({
      next: r => {
        this.savingProfile = false;
        if (r.success && r.data) {
          const stored = JSON.parse(localStorage.getItem('travel.user') || 'null');
          if (stored) {
            stored.fullName = r.data.fullName;
            stored.phone = r.data.phone;
            localStorage.setItem('travel.user', JSON.stringify(stored));
          }
        }
        this.toast.show('Profile updated', 'success');
      },
      error: () => { this.savingProfile = false; this.toast.show('Could not update profile', 'danger'); }
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword = true;
    const v = this.passwordForm.getRawValue();
    this.auth.changePassword(v.currentPassword!, v.newPassword!).subscribe({
      next: () => { this.savingPassword = false; this.passwordForm.reset(); this.toast.show('Password updated', 'success'); },
      error: () => { this.savingPassword = false; this.toast.show('Could not update password', 'danger'); }
    });
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
  }

  newPwdLen(): number {
    return (this.passwordForm.value.newPassword || '').length;
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.uploadingLogo = true;
    this.api.uploadImage(file).subscribe({
      next: url => { this.brandForm.patchValue({ logoUrl: url }); this.uploadingLogo = false; input.value = ''; },
      error: () => { this.uploadingLogo = false; this.toast.show('Logo upload failed', 'danger'); }
    });
  }

  clearLogo(input: HTMLInputElement): void {
    this.brandForm.patchValue({ logoUrl: '' });
    input.value = '';
  }

  onLogoError(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }

  saveBrand(): void {
    this.savingBrand = true;
    const v = this.brandForm.getRawValue();
    this.brand.update({ brandName: v.brandName || null, logoUrl: v.logoUrl || null }).subscribe({
      next: () => { this.savingBrand = false; this.toast.show('Brand updated', 'success'); },
      error: () => { this.savingBrand = false; this.toast.show('Could not save brand', 'danger'); }
    });
  }
}
