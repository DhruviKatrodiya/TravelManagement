import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Staff } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-staff',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Staff members</h2>
      <button class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add staff</button>
    </div>

    <div class="alert alert-info small">
      Staff accounts are seeded by an admin only. Customers cannot self-register as staff.
    </div>

    <div class="table-card mb-4" *ngIf="creating || editingId !== null">
      <h5 class="fw-bold mb-3">{{ editingId ? 'Edit staff' : 'New staff member' }}</h5>
      <form [formGroup]="form" (ngSubmit)="save()" class="row g-3">
        <div class="col-md-6"><label class="form-label">Full name</label><input class="form-control" formControlName="fullName" /></div>
        <div class="col-md-6"><label class="form-label">Email</label><input class="form-control" formControlName="email" [readonly]="!!editingId" /></div>
        <div class="col-md-6" *ngIf="!editingId"><label class="form-label">Password</label><input type="password" class="form-control" formControlName="password" /></div>
        <div class="col-md-6"><label class="form-label">Phone</label><input class="form-control" formControlName="phone" /></div>
        <div class="col-md-4"><label class="form-label">Designation</label><input class="form-control" formControlName="designation" /></div>
        <div class="col-md-4"><label class="form-label">Department</label><input class="form-control" formControlName="department" /></div>
        <div class="col-md-4"><label class="form-label">Salary (₹)</label><input type="number" class="form-control" formControlName="salary" /></div>
        <div class="col-12" *ngIf="editingId">
          <div class="form-check"><input class="form-check-input" type="checkbox" formControlName="isActive" id="sa" /><label class="form-check-label" for="sa">Active</label></div>
        </div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="form.invalid">Save</button>
          <button class="btn btn-link" type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Name</th><th>Email</th><th>Designation</th><th>Department</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let s of items">
              <td><strong>{{ s.fullName }}</strong><br><small class="text-muted">{{ s.phone }}</small></td>
              <td>{{ s.email }}</td>
              <td>{{ s.designation }}</td>
              <td>{{ s.department }}</td>
              <td>{{ s.joinedAt | date }}</td>
              <td><span class="badge" [class.bg-success]="s.isActive" [class.bg-secondary]="!s.isActive">{{ s.isActive ? 'Active' : 'Disabled' }}</span></td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(s)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" (click)="remove(s)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="items.length === 0"><td colspan="7" class="text-center text-muted py-3">No staff members yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminStaffComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Staff[] = [];
  editingId: number | null = null;
  creating = false;

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    phone: [''],
    designation: [''],
    department: [''],
    salary: [0],
    isActive: [true]
  });

  ngOnInit(): void { this.load(); }
  load(): void { this.api.listStaff().subscribe({ next: ss => this.items = ss }); }

  startCreate(): void {
    this.creating = true;
    this.editingId = null;
    this.form.reset({ fullName: '', email: '', password: '', phone: '', designation: '', department: '', salary: 0, isActive: true });
    this.form.controls['password'].addValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls['password'].updateValueAndValidity();
  }

  edit(s: Staff): void {
    this.editingId = s.id;
    this.creating = false;
    this.form.controls['password'].clearValidators();
    this.form.controls['password'].updateValueAndValidity();
    this.form.reset({ fullName: s.fullName, email: s.email, password: '', phone: s.phone || '', designation: s.designation || '', department: s.department || '', salary: s.salary || 0, isActive: s.isActive });
  }

  cancel(): void { this.editingId = null; this.creating = false; }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const op = this.editingId ? this.api.updateStaff(this.editingId, v) : this.api.createStaff(v);
    op.subscribe({ next: () => { this.toast.show('Saved', 'success'); this.cancel(); this.load(); } });
  }

  remove(s: Staff): void {
    if (!confirm(`Delete staff "${s.fullName}"?`)) return;
    this.api.deleteStaff(s.id).subscribe({ next: () => { this.toast.show('Deleted', 'info'); this.load(); } });
  }
}
