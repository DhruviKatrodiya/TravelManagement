import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Vehicle } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-vehicles',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Vehicles</h2>
      <button class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add vehicle</button>
    </div>

    <div class="table-card mb-4" *ngIf="editingId !== null">
      <h5 class="fw-bold mb-3">{{ editingId ? 'Edit vehicle' : 'New vehicle' }}</h5>
      <form [formGroup]="form" (ngSubmit)="save()" class="row g-3">
        <div class="col-md-4"><label class="form-label">Name</label><input class="form-control" formControlName="name" /></div>
        <div class="col-md-4"><label class="form-label">Registration #</label><input class="form-control" formControlName="registrationNumber" /></div>
        <div class="col-md-4">
          <label class="form-label">Type</label>
          <select class="form-select" formControlName="type">
            <option *ngFor="let t of types" [value]="t">{{ t }}</option>
          </select>
        </div>
        <div class="col-md-3"><label class="form-label">Capacity</label><input type="number" class="form-control" formControlName="capacity" /></div>
        <div class="col-md-3"><label class="form-label">Make</label><input class="form-control" formControlName="make" /></div>
        <div class="col-md-3"><label class="form-label">Model</label><input class="form-control" formControlName="model" /></div>
        <div class="col-md-3"><label class="form-label">Year</label><input type="number" class="form-control" formControlName="year" /></div>
        <div class="col-md-3"><label class="form-label">Cost/day (₹)</label><input type="number" class="form-control" formControlName="costPerDay" /></div>
        <div class="col-md-3 d-flex align-items-end">
          <div class="form-check"><input class="form-check-input" type="checkbox" formControlName="isAvailable" id="va" /><label class="form-check-label" for="va">Available</label></div>
        </div>
        <div class="col-12"><label class="form-label">Notes</label><input class="form-control" formControlName="notes" /></div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="form.invalid">Save</button>
          <button class="btn btn-link" type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Name</th><th>Reg #</th><th>Type</th><th>Capacity</th><th>Cost/day</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let v of items">
              <td><strong>{{ v.name }}</strong><br><small class="text-muted">{{ v.make }} {{ v.model }} {{ v.year }}</small></td>
              <td><code>{{ v.registrationNumber }}</code></td>
              <td>{{ v.type }}</td>
              <td>{{ v.capacity }}</td>
              <td>₹ {{ v.costPerDay | number:'1.0-0' }}</td>
              <td><span class="badge" [class.bg-success]="v.isAvailable" [class.bg-warning]="!v.isAvailable">{{ v.isAvailable ? 'Available' : 'In service' }}</span></td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(v)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" (click)="remove(v)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="items.length === 0"><td colspan="7" class="text-center text-muted py-3">No vehicles yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminVehiclesComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: Vehicle[] = [];
  editingId: number | null = null;
  types = ['Car', 'SUV', 'MiniBus', 'Bus', 'Tempo', 'Other'];

  form = this.fb.group({
    name: ['', Validators.required],
    registrationNumber: ['', Validators.required],
    type: ['Car'],
    capacity: [4, [Validators.required, Validators.min(1)]],
    make: [''],
    model: [''],
    year: [2024],
    costPerDay: [2500],
    isAvailable: [true],
    notes: ['']
  });

  ngOnInit(): void { this.load(); }
  load(): void { this.api.listVehicles().subscribe({ next: vs => this.items = vs }); }

  startCreate(): void {
    this.editingId = 0;
    this.form.reset({ name: '', registrationNumber: '', type: 'Car', capacity: 4, make: '', model: '', year: 2024, costPerDay: 2500, isAvailable: true, notes: '' });
  }

  edit(v: Vehicle): void {
    this.editingId = v.id;
    this.form.reset({ ...v } as any);
  }

  cancel(): void { this.editingId = null; }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const op = this.editingId ? this.api.updateVehicle(this.editingId, v) : this.api.createVehicle(v);
    op.subscribe({ next: () => { this.toast.show('Saved', 'success'); this.editingId = null; this.load(); } });
  }

  remove(v: Vehicle): void {
    if (!confirm(`Delete vehicle "${v.name}"?`)) return;
    this.api.deleteVehicle(v.id).subscribe({ next: () => { this.toast.show('Deleted', 'info'); this.load(); } });
  }
}
