import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

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
              <div class="col-md-6">
                <label class="form-label">Full name</label>
                <input class="form-control" formControlName="fullName" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Phone</label>
                <input class="form-control" formControlName="phone" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Date of birth</label>
                <input type="date" class="form-control" formControlName="dateOfBirth" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Gender</label>
                <select class="form-select" formControlName="gender">
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Address</label>
                <input class="form-control" formControlName="address" />
              </div>
              <div class="col-md-4"><label class="form-label">City</label><input class="form-control" formControlName="city" /></div>
              <div class="col-md-4"><label class="form-label">State</label><input class="form-control" formControlName="state" /></div>
              <div class="col-md-4"><label class="form-label">Postal code</label><input class="form-control" formControlName="postalCode" /></div>
              <div class="col-md-4"><label class="form-label">Country</label><input class="form-control" formControlName="country" /></div>
              <div class="col-md-4"><label class="form-label">ID proof type</label><input class="form-control" formControlName="idProofType" /></div>
              <div class="col-md-4"><label class="form-label">ID proof number</label><input class="form-control" formControlName="idProofNumber" /></div>
            </div>
            <button class="btn btn-primary mt-4">Save profile</button>
          </div>
        </form>
      </div>

      <div class="col-lg-5">
        <form [formGroup]="passForm" (ngSubmit)="changePassword()" class="card border-0 shadow-sm">
          <div class="card-body">
            <h5 class="fw-bold mb-3">Change password</h5>
            <div class="mb-3">
              <label class="form-label">Current password</label>
              <input type="password" class="form-control" formControlName="currentPassword" autocomplete="current-password" placeholder="Your current password" />
              <small class="text-danger d-block mt-1" *ngIf="passForm.get('currentPassword')?.touched && !passForm.value.currentPassword">
                <i class="bi bi-exclamation-circle me-1"></i>Required.
              </small>
            </div>
            <div class="mb-3">
              <label class="form-label">New password</label>
              <input type="password" class="form-control" formControlName="newPassword" autocomplete="new-password" placeholder="At least 6 characters" />
              <small class="d-block mt-1"
                     *ngIf="passForm.get('newPassword')?.touched || newPwdLen() > 0"
                     [class.text-danger]="newPwdLen() < 6"
                     [class.text-success]="newPwdLen() >= 6">
                <i class="bi" [class.bi-exclamation-circle]="newPwdLen() < 6" [class.bi-check-circle]="newPwdLen() >= 6"></i>
                {{ newPwdLen() }} / 6+ characters
                <span *ngIf="newPwdLen() < 6"> — need {{ 6 - newPwdLen() }} more</span>
              </small>
            </div>
            <button type="submit" class="btn btn-primary w-100" [disabled]="passForm.invalid">Update password</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  form = this.fb.group({
    fullName: ['', [Validators.required]],
    phone: [''],
    dateOfBirth: [''],
    gender: [''],
    address: [''],
    city: [''],
    state: [''],
    postalCode: [''],
    country: [''],
    idProofType: [''],
    idProofNumber: ['']
  });

  passForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.api.getMyProfile().subscribe({
      next: c => this.form.patchValue({
        fullName: c.fullName,
        phone: c.phone,
        address: c.address,
        city: c.city,
        state: c.state,
        postalCode: c.postalCode,
        country: c.country,
        dateOfBirth: c.dateOfBirth ? c.dateOfBirth.substring(0, 10) : '',
        gender: c.gender,
        idProofType: c.idProofType,
        idProofNumber: c.idProofNumber
      })
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.api.updateMyProfile(v).subscribe({
      next: c => {
        this.auth.updateCachedUser({ fullName: c.fullName, phone: c.phone });
        this.toast.show('Profile updated', 'success');
      }
    });
  }

  changePassword(): void {
    if (this.passForm.invalid) return;
    const v = this.passForm.getRawValue();
    this.auth.changePassword(v.currentPassword!, v.newPassword!).subscribe({
      next: () => { this.toast.show('Password updated', 'success'); this.passForm.reset(); }
    });
  }

  newPwdLen(): number {
    return (this.passForm.value.newPassword || '').length;
  }
}
