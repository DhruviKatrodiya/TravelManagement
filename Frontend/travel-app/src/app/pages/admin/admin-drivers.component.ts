import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Driver } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-drivers',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Drivers</h2>
      <button class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add driver</button>
    </div>

    <div class="table-card mb-4" *ngIf="editingId !== null">
      <h5 class="fw-bold mb-3">{{ editingId ? 'Edit driver' : 'New driver' }}</h5>
      <form [formGroup]="form" (ngSubmit)="save()" class="row g-3">
        <div class="col-md-4"><label class="form-label">Full name</label><input class="form-control" formControlName="fullName" /></div>
        <div class="col-md-3"><label class="form-label">Phone</label><input class="form-control" formControlName="phone" /></div>
        <div class="col-md-5"><label class="form-label">Email</label><input class="form-control" formControlName="email" /></div>
        <div class="col-md-4"><label class="form-label">License #</label><input class="form-control" formControlName="licenseNumber" /></div>
        <div class="col-md-4"><label class="form-label">License expiry</label><input type="date" class="form-control" formControlName="licenseExpiry" /></div>
        <div class="col-md-2"><label class="form-label">Experience (yrs)</label><input type="number" class="form-control" formControlName="experienceYears" /></div>
        <div class="col-md-2 d-flex align-items-end">
          <div class="form-check"><input class="form-check-input" type="checkbox" formControlName="isAvailable" id="da" /><label class="form-check-label" for="da">Available</label></div>
        </div>
        <div class="col-12"><label class="form-label">Address</label><input class="form-control" formControlName="address" /></div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="form.invalid">Save</button>
          <button class="btn btn-link" type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Name</th><th>Phone</th><th>License</th><th>Experience</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let d of items">
              <td><strong>{{ d.fullName }}</strong><br><small class="text-muted">{{ d.email }}</small></td>
              <td>{{ d.phone }}</td>
              <td><code>{{ d.licenseNumber }}</code><br><small class="text-muted">Expires {{ d.licenseExpiry | date }}</small></td>
              <td>{{ d.experienceYears }} years</td>
              <td><span class="badge" [class.bg-success]="d.isAvailable" [class.bg-warning]="!d.isAvailable">{{ d.isAvailable ? 'Available' : 'On trip' }}</span></td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(d)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" (click)="remove(d)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="items.length === 0"><td colspan="6" class="text-center text-muted py-3">No drivers yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminDriversComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Driver[] = [];
  editingId: number | null = null;

  form = this.fb.group({
    fullName: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    licenseNumber: ['', Validators.required],
    licenseExpiry: [''],
    address: [''],
    experienceYears: [0],
    isAvailable: [true]
  });

  ngOnInit(): void { this.load(); }
  load(): void { this.api.listDrivers().subscribe({ next: ds => this.items = ds }); }

  startCreate(): void {
    this.editingId = 0;
    this.form.reset({ fullName: '', phone: '', email: '', licenseNumber: '', licenseExpiry: '', address: '', experienceYears: 0, isAvailable: true });
  }

  edit(d: Driver): void {
    this.editingId = d.id;
    this.form.reset({ ...d, licenseExpiry: d.licenseExpiry?.substring(0, 10) || '' } as any);
  }

  cancel(): void { this.editingId = null; }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const op = this.editingId ? this.api.updateDriver(this.editingId, v) : this.api.createDriver(v);
    op.subscribe({ next: () => { this.toast.show('Saved', 'success'); this.editingId = null; this.load(); } });
  }

  remove(d: Driver): void {
    if (!confirm(`Delete driver "${d.fullName}"?`)) return;
    this.api.deleteDriver(d.id).subscribe({ next: () => { this.toast.show('Deleted', 'info'); this.load(); } });
  }
}
