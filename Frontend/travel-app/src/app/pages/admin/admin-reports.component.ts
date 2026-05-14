import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TripProfit } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-reports',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-4">Profit & Loss Report</h2>

    <div class="table-card mb-4">
      <form [formGroup]="form" (ngSubmit)="load()" class="row g-3 align-items-end">
        <div class="col-md-3"><label class="form-label">From</label><input type="date" class="form-control" formControlName="from" /></div>
        <div class="col-md-3"><label class="form-label">To</label><input type="date" class="form-control" formControlName="to" /></div>
        <div class="col-md-3 d-flex gap-2">
          <button class="btn btn-primary">Apply filter</button>
          <button class="btn btn-outline-secondary" type="button" (click)="reset()">Clear</button>
        </div>
      </form>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-3"><div class="kpi"><div class="label">Trips</div><div class="value">{{ items.length }}</div></div></div>
      <div class="col-md-3"><div class="kpi"><div class="label">Revenue</div><div class="value text-success">₹ {{ totals.revenue | number:'1.0-0' }}</div></div></div>
      <div class="col-md-3"><div class="kpi"><div class="label">Expenses</div><div class="value text-danger">₹ {{ totals.expenses | number:'1.0-0' }}</div></div></div>
      <div class="col-md-3"><div class="kpi"><div class="label">Profit</div><div class="value" [class.text-success]="totals.profit >= 0" [class.text-danger]="totals.profit < 0">₹ {{ totals.profit | number:'1.0-0' }}</div></div></div>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Trip date</th><th>Booking</th><th>Tour</th><th class="text-end">Revenue</th><th class="text-end">Expenses</th><th class="text-end">Profit</th></tr></thead>
          <tbody>
            <tr *ngFor="let p of items">
              <td>{{ p.tripStartDate | date }}</td>
              <td><code>{{ p.bookingReference }}</code></td>
              <td>{{ p.tourName }}</td>
              <td class="text-end">₹ {{ p.revenue | number:'1.0-0' }}</td>
              <td class="text-end">₹ {{ p.expenses | number:'1.0-0' }}</td>
              <td class="text-end" [class.text-success]="p.profit >= 0" [class.text-danger]="p.profit < 0">₹ {{ p.profit | number:'1.0-0' }}</td>
            </tr>
            <tr *ngIf="items.length === 0"><td colspan="6" class="text-center text-muted py-3">No data for this period.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminReportsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  items: TripProfit[] = [];

  form = this.fb.group({
    from: [''],
    to: ['']
  });

  totals = { revenue: 0, expenses: 0, profit: 0 };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.getTripProfits(this.form.getRawValue()).subscribe({
      next: ps => {
        this.items = ps;
        this.totals.revenue = ps.reduce((s, p) => s + p.revenue, 0);
        this.totals.expenses = ps.reduce((s, p) => s + p.expenses, 0);
        this.totals.profit = ps.reduce((s, p) => s + p.profit, 0);
      }
    });
  }

  reset(): void { this.form.reset({ from: '', to: '' }); this.load(); }
}
