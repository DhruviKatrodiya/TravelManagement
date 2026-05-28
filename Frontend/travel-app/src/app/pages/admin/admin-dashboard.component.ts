import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models/api.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  template: `
    <h2 class="fw-bold mb-1">{{ auth.isAdmin() ? 'Business Overview' : 'Operations Overview' }}</h2>

    <div *ngIf="!stats" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

    <ng-container *ngIf="stats">
      <!-- KPI cards — each gated by its own permission -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-md-3" *ngIf="auth.hasPermission('dashboard.totalrevenue')">
          <div class="kpi"><div class="label">Total revenue</div><div class="value text-success">₹ {{ stats.totalRevenue | number:'1.0-0' }}</div><div class="sub">Lifetime</div></div>
        </div>
        <div class="col-sm-6 col-md-3" *ngIf="auth.hasPermission('dashboard.expenses')">
          <div class="kpi"><div class="label">Total expenses</div><div class="value text-danger">₹ {{ stats.totalExpenses | number:'1.0-0' }}</div><div class="sub">Lifetime</div></div>
        </div>
        <div class="col-sm-6 col-md-3" *ngIf="auth.hasPermission('dashboard.profit')">
          <div class="kpi"><div class="label">Profit</div><div class="value" [class.text-success]="stats.profit >= 0" [class.text-danger]="stats.profit < 0">₹ {{ stats.profit | number:'1.0-0' }}</div><div class="sub">Revenue − expenses</div></div>
        </div>
        <div class="col-sm-6 col-md-3" *ngIf="auth.hasPermission('dashboard.customers')">
          <div class="kpi"><div class="label">Customers</div><div class="value">{{ stats.totalCustomers }}</div><div class="sub">Registered</div></div>
        </div>
        <div class="col-sm-6 col-md-3" *ngIf="auth.hasPermission('dashboard.bookings')">
          <div class="kpi"><div class="label">Bookings</div><div class="value">{{ stats.totalBookings }}</div><div class="sub">{{ stats.confirmedBookings }} confirmed</div></div>
        </div>
        <div class="col-sm-6 col-md-3" *ngIf="auth.hasPermission('dashboard.pending')">
          <div class="kpi"><div class="label">Pending</div><div class="value text-warning">{{ stats.pendingBookings }}</div><div class="sub">Awaiting payment</div></div>
        </div>
        <div class="col-sm-6 col-md-3" *ngIf="auth.hasPermission('dashboard.tours_packages')">
          <div class="kpi"><div class="label">Tours / Packages</div><div class="value">{{ stats.activeTours }} / {{ stats.activePackages }}</div><div class="sub">Currently active</div></div>
        </div>
        <div class="col-sm-6 col-md-3" *ngIf="auth.hasPermission('dashboard.fleet')">
          <div class="kpi"><div class="label">Fleet</div><div class="value">{{ stats.vehiclesAvailable }} / {{ stats.driversAvailable }}</div><div class="sub">Vehicles / Drivers</div></div>
        </div>
      </div>

      <!-- Charts — each gated independently -->
      <div class="row g-3 mb-4">
        <div class="col-lg-6" *ngIf="auth.hasPermission('dashboard.revenue_chart')">
          <div class="table-card h-100">
            <h6 class="fw-bold mb-3">Monthly revenue</h6>
            <div style="position: relative; height: 260px;">
              <canvas #revChart></canvas>
            </div>
            <div *ngIf="noMonthlyRevenue()" class="text-center text-muted small mt-2">No revenue data in the last 6 months.</div>
          </div>
        </div>
        <div class="col-lg-6" *ngIf="auth.hasPermission('dashboard.bookings_chart')">
          <div class="table-card h-100">
            <h6 class="fw-bold mb-3">Monthly bookings</h6>
            <div style="position: relative; height: 260px;">
              <canvas #bookChart></canvas>
            </div>
            <div *ngIf="noMonthlyBookings()" class="text-center text-muted small mt-2">No bookings in the last 6 months.</div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-6" *ngIf="auth.hasPermission('dashboard.destinations_chart')">
          <div class="table-card h-100">
            <h6 class="fw-bold mb-3">Bookings by destination</h6>
            <div style="position: relative; height: 260px;">
              <canvas #destChart></canvas>
            </div>
            <div *ngIf="stats.bookingsByDestination.length === 0" class="text-center text-muted small mt-2">No destination data yet.</div>
          </div>
        </div>
        <div class="col-lg-6" *ngIf="auth.hasPermission('dashboard.top_tours')">
          <div class="table-card h-100 d-flex flex-column">
            <h6 class="fw-bold mb-3">Top tours</h6>
            <table class="table table-sm mb-0">
              <thead><tr><th>Tour</th><th class="text-end">Bookings</th><th class="text-end">Revenue</th></tr></thead>
              <tbody>
                <tr *ngFor="let t of pagedTopTours()">
                  <td>{{ t.name }}</td>
                  <td class="text-end">{{ t.bookings }}</td>
                  <td class="text-end">₹ {{ t.revenue | number:'1.0-0' }}</td>
                </tr>
                <tr *ngIf="stats.topTours.length === 0"><td colspan="3" class="text-center text-muted">No data yet.</td></tr>
              </tbody>
            </table>
            <div *ngIf="totalPages() > 1" class="d-flex align-items-center justify-content-between mt-auto pt-3">
              <small class="text-muted">
                Showing {{ pageStart() }}–{{ pageEnd() }} of {{ stats.topTours.length }}
              </small>
              <nav>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" [class.disabled]="topPage === 1">
                    <button class="page-link" type="button" (click)="setPage(topPage - 1)" [disabled]="topPage === 1" aria-label="Previous">
                      <i class="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  <li class="page-item" *ngFor="let p of pageNumbers()" [class.active]="p === topPage">
                    <button class="page-link" type="button" (click)="setPage(p)">{{ p }}</button>
                  </li>
                  <li class="page-item" [class.disabled]="topPage === totalPages()">
                    <button class="page-link" type="button" (click)="setPage(topPage + 1)" [disabled]="topPage === totalPages()" aria-label="Next">
                      <i class="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  auth = inject(AuthService);
  stats?: DashboardStats;

  topPage = 1;
  readonly topPageSize = 5;

  @ViewChild('revChart') revRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookChart') bookRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('destChart') destRef?: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: s => {
        this.stats = s;
        this.cdr.detectChanges();
        requestAnimationFrame(() => this.drawCharts());
      }
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }

  noMonthlyRevenue(): boolean {
    return !this.stats || this.stats.monthlyRevenue.every(m => !m.value);
  }

  noMonthlyBookings(): boolean {
    return !this.stats || this.stats.monthlyBookings.every(m => !m.value);
  }

  totalPages(): number {
    const len = this.stats?.topTours.length ?? 0;
    return Math.max(1, Math.ceil(len / this.topPageSize));
  }

  pagedTopTours() {
    if (!this.stats) return [];
    const start = (this.topPage - 1) * this.topPageSize;
    return this.stats.topTours.slice(start, start + this.topPageSize);
  }

  pageStart(): number {
    if (!this.stats || this.stats.topTours.length === 0) return 0;
    return (this.topPage - 1) * this.topPageSize + 1;
  }

  pageEnd(): number {
    if (!this.stats) return 0;
    return Math.min(this.topPage * this.topPageSize, this.stats.topTours.length);
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.topPage = p;
  }

  private drawCharts(): void {
    if (!this.stats) return;
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const css = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => (css.getPropertyValue(name).trim() || fallback);

    const primary     = v('--tm-primary', '#636B2F');
    const primaryDark = v('--tm-primary-dark', '#3D4127');
    const accent      = v('--tm-accent', '#D4DE95');
    const sage        = v('--tm-sage', '#BAC095');
    const pink        = v('--tm-pink', '#d97757');
    const amber       = v('--tm-amber', '#c69b29');
    const cyan        = v('--tm-cyan', '#5a8a8a');
    const purple      = v('--tm-purple', '#7b6f47');
    const textColor   = v('--tm-text', '#3D4127');
    const borderSoft  = v('--tm-border', '#e3e6d2');

    const primaryRgb  = v('--tm-primary-rgb', '99, 107, 47');
    const fillSoft    = `rgba(${primaryRgb}, 0.18)`;

    const destPalette = [primary, sage, amber, cyan, pink, purple, accent, primaryDark];

    if (this.revRef) {
      this.charts.push(new Chart(this.revRef.nativeElement, {
        type: 'line',
        data: {
          labels: this.stats.monthlyRevenue.map(m => m.month),
          datasets: [{
            data: this.stats.monthlyRevenue.map(m => m.value),
            label: 'Revenue (₹)',
            borderColor: primary,
            backgroundColor: fillSoft,
            pointBackgroundColor: primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: textColor, callback: (v) => '₹ ' + v }, grid: { color: borderSoft } },
            x: { ticks: { color: textColor }, grid: { color: borderSoft } }
          }
        }
      }));
    }
    if (this.bookRef) {
      this.charts.push(new Chart(this.bookRef.nativeElement, {
        type: 'bar',
        data: {
          labels: this.stats.monthlyBookings.map(m => m.month),
          datasets: [{
            data: this.stats.monthlyBookings.map(m => m.value),
            label: 'Bookings',
            backgroundColor: sage,
            hoverBackgroundColor: primary,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: textColor, precision: 0 }, grid: { color: borderSoft } },
            x: { ticks: { color: textColor }, grid: { color: borderSoft } }
          }
        }
      }));
    }
    if (this.destRef && this.stats.bookingsByDestination.length > 0) {
      this.charts.push(new Chart(this.destRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: this.stats.bookingsByDestination.map(d => d.destination),
          datasets: [{
            data: this.stats.bookingsByDestination.map(d => d.count),
            backgroundColor: destPalette.slice(0, this.stats.bookingsByDestination.length),
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
        }
      }));
    }
  }
}
