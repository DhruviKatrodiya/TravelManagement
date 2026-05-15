import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { authGuard } from './core/guards/role.guard';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { CustomerLayoutComponent } from './layout/customer-layout/customer-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

import { HomeComponent } from './pages/public/home.component';
import { ToursListComponent } from './pages/public/tours-list.component';
import { TourDetailComponent } from './pages/public/tour-detail.component';
import { AboutComponent } from './pages/public/about.component';

import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';

import { CustomerDashboardComponent } from './pages/customer/customer-dashboard.component';
import { CustomerBookingsComponent } from './pages/customer/customer-bookings.component';
import { BookingDetailComponent } from './pages/customer/booking-detail.component';
import { BookingCreateComponent } from './pages/customer/booking-create.component';
import { ProfileComponent } from './pages/customer/profile.component';
import { CustomerReviewsComponent } from './pages/customer/customer-reviews.component';

import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { AdminToursComponent } from './pages/admin/admin-tours.component';
import { AdminPackagesComponent } from './pages/admin/admin-packages.component';
import { AdminFacilitiesComponent } from './pages/admin/admin-facilities.component';
import { AdminVehiclesComponent } from './pages/admin/admin-vehicles.component';
import { AdminDriversComponent } from './pages/admin/admin-drivers.component';
import { AdminStaffComponent } from './pages/admin/admin-staff.component';
import { AdminCustomersComponent } from './pages/admin/admin-customers.component';
import { AdminBookingsComponent } from './pages/admin/admin-bookings.component';
import { AdminPaymentsComponent } from './pages/admin/admin-payments.component';
import { AdminExpensesComponent } from './pages/admin/admin-expenses.component';
import { AdminRefundsComponent } from './pages/admin/admin-refunds.component';
import { AdminReviewsComponent } from './pages/admin/admin-reviews.component';
import { AdminSchedulesComponent } from './pages/admin/admin-schedules.component';
import { AdminAllocationsComponent } from './pages/admin/admin-allocations.component';
import { AdminReportsComponent } from './pages/admin/admin-reports.component';
import { AdminSettingsComponent } from './pages/admin/admin-settings.component';
import { AdminDestinationsComponent } from './pages/admin/admin-destinations.component';

const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'tours', component: ToursListComponent },
      { path: 'tours/:id', component: TourDetailComponent },
      { path: 'about', component: AboutComponent }
    ]
  },
  {
    path: 'auth',
    component: PublicLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },
  {
    path: 'customer',
    component: CustomerLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['Customer', 'Admin', 'Staff'] },
    children: [
      { path: '', component: CustomerDashboardComponent },
      { path: 'bookings', component: CustomerBookingsComponent },
      { path: 'bookings/new/:packageId', component: BookingCreateComponent },
      { path: 'bookings/:id', component: BookingDetailComponent },
      { path: 'reviews', component: CustomerReviewsComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['Admin', 'Staff'] },
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'tours', component: AdminToursComponent, canActivate: [authGuard], data: { permission: 'tours.view' } },
      { path: 'packages', component: AdminPackagesComponent, canActivate: [authGuard], data: { permission: 'packages.view' } },
      { path: 'facilities', component: AdminFacilitiesComponent, canActivate: [authGuard], data: { permission: 'facilities.view' } },
      { path: 'vehicles', component: AdminVehiclesComponent, canActivate: [authGuard], data: { permission: 'vehicles.view' } },
      { path: 'drivers', component: AdminDriversComponent, canActivate: [authGuard], data: { permission: 'drivers.view' } },
      { path: 'staff', component: AdminStaffComponent, data: { roles: ['Admin'] } },
      { path: 'customers', component: AdminCustomersComponent, canActivate: [authGuard], data: { permission: 'customers.view' } },
      { path: 'bookings', component: AdminBookingsComponent, canActivate: [authGuard], data: { permission: 'bookings.view' } },
      { path: 'payments', component: AdminPaymentsComponent, canActivate: [authGuard], data: { permission: 'payments.view' } },
      { path: 'expenses', component: AdminExpensesComponent, canActivate: [authGuard], data: { permission: 'expenses.view' } },
      { path: 'refunds', component: AdminRefundsComponent, canActivate: [authGuard], data: { permission: 'refunds.view' } },
      { path: 'reviews', component: AdminReviewsComponent, canActivate: [authGuard], data: { permission: 'reviews.view' } },
      { path: 'schedules', component: AdminSchedulesComponent, canActivate: [authGuard], data: { permission: 'schedules.view' } },
      { path: 'allocations', component: AdminAllocationsComponent, canActivate: [authGuard], data: { permission: 'allocations.view' } },
      { path: 'reports', component: AdminReportsComponent, canActivate: [authGuard], data: { permission: 'reports.view' } },
      { path: 'destinations', component: AdminDestinationsComponent, canActivate: [authGuard], data: { permission: 'destinations.view' } },
      { path: 'settings', component: AdminSettingsComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
