import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking, Driver, Vehicle, VehicleAllocation } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-allocations',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Vehicle Allocations</h2>
      <button class="btn btn-primary" (click)="creating = !creating"><i class="bi bi-plus-lg me-1"></i>New allocation</button>
    </div>

    <div class="table-card mb-4" *ngIf="creating">
      <h5 class="fw-bold mb-3">Allocate vehicle to a trip</h5>
      <form [formGroup]="form" (ngSubmit)="save()" class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Vehicle</label>
          <select class="form-select" formControlName="vehicleId">
            <option *ngFor="let v of vehicles" [ngValue]="v.id">{{ v.name }} ({{ v.capacity }})</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Driver (optional)</label>
          <select class="form-select" formControlName="driverId">
            <option [ngValue]="null">— None —</option>
            <option *ngFor="let d of drivers" [ngValue]="d.id">{{ d.fullName }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Booking (optional)</label>
          <select class="form-select" formControlName="bookingId">
            <option [ngValue]="null">— None —</option>
            <option *ngFor="let b of bookings" [ngValue]="b.id">{{ b.bookingReference }} — {{ b.tourName }}</option>
          </select>
        </div>
        <div class="col-md-3"></div>
        <div class="col-md-3"><label class="form-label">From</label><input type="date" class="form-control" formControlName="startDate" /></div>
        <div class="col-md-3"><label class="form-label">To</label><input type="date" class="form-control" formControlName="endDate" /></div>
        <div class="col-md-6"><label class="form-label">Notes</label><input class="form-control" formControlName="notes" /></div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="form.invalid">Allocate</button>
          <button class="btn btn-link" type="button" (click)="creating = false">Cancel</button>
        </div>
      </form>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Vehicle</th><th>Driver</th><th>Booking</th><th>Period</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let a of items">
              <td><strong>{{ a.vehicleName }}</strong></td>
              <td>{{ a.driverName || '—' }}</td>
              <td><code *ngIf="a.bookingReference">{{ a.bookingReference }}</code><span *ngIf="!a.bookingReference">—</span></td>
              <td>{{ a.startDate | date:'mediumDate' }} → {{ a.endDate | date:'mediumDate' }}</td>
              <td>{{ a.notes }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" (click)="remove(a)">Remove</button>
              </td>
            </tr>
            <tr *ngIf="items.length === 0"><td colspan="6" class="text-center text-muted py-3">No allocations.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminAllocationsComponent implements OnInit {
  items: VehicleAllocation[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  bookings: Booking[] = [];
  creating = false;

  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  form = this.fb.group({
    vehicleId: [0, Validators.required],
    driverId: [null as number | null],
    bookingId: [null as number | null],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    notes: ['']
  });

  ngOnInit(): void {
    this.api.listVehicles().subscribe({ next: vs => this.vehicles = vs });
    this.api.listDrivers().subscribe({ next: ds => this.drivers = ds });
    this.api.listBookings().subscribe({ next: bs => this.bookings = bs.filter(b => b.status !== 'Cancelled') });
    this.load();
  }

  load(): void { this.api.listAllocations().subscribe({ next: as => this.items = as }); }

  save(): void {
    if (this.form.invalid) return;
    this.api.allocateVehicle(this.form.getRawValue()).subscribe({
      next: () => { this.toast.show('Vehicle allocated', 'success'); this.creating = false; this.load(); }
    });
  }

  remove(a: VehicleAllocation): void {
    if (!confirm('Remove this allocation?')) return;
    this.api.deleteAllocation(a.id).subscribe({ next: () => { this.toast.show('Removed', 'info'); this.load(); } });
  }
}
