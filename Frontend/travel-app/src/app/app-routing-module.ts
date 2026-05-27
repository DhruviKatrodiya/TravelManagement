import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { authGuard, staffHomeRedirectGuard } from './core/guards/role.guard';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { CustomerLayoutComponent } from './layout/customer-layout/customer-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

import { HomeComponent } from './pages/public/home.component';
import { ToursListComponent } from './pages/public/tours-list.component';
import { TourDetailComponent } from './pages/public/tour-detail.component';
import { AboutComponent } from './pages/public/about.component';

import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password.component';

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
import { AdminCountriesComponent } from './pages/admin/admin-countries.component';
import { AdminStatesComponent } from './pages/admin/admin-states.component';
import { AdminCitiesComponent } from './pages/admin/admin-cities.component';
import { AdminDepartmentsComponent } from './pages/admin/admin-departments.component';
import { AdminDesignationsComponent } from './pages/admin/admin-designations.component';
import { AdminRolesComponent } from './pages/admin/admin-roles.component';
import { AdminPeopleComponent } from './pages/admin/admin-people.component';

// Child routes shared across all management panels (staff / admin / superadmin / any future panel)
const managementChildren = [
  { path: '', component: AdminDashboardComponent },
  { path: 'tours',       component: AdminToursComponent,       canActivate: [authGuard], data: { permission: 'tours.view' } },
  { path: 'packages',    component: AdminPackagesComponent,    canActivate: [authGuard], data: { permission: 'packages.view' } },
  { path: 'facilities',  component: AdminFacilitiesComponent,  canActivate: [authGuard], data: { permission: 'facilities.view' } },
  { path: 'vehicles',    component: AdminVehiclesComponent,    canActivate: [authGuard], data: { permission: 'vehicles.view' } },
  { path: 'drivers',     component: AdminDriversComponent,     canActivate: [authGuard], data: { permission: 'drivers.view' } },
  { path: 'staff',       redirectTo: 'people', pathMatch: 'full' as const },
  { path: 'customers',   redirectTo: 'people', pathMatch: 'full' as const },
  { path: 'people',      component: AdminPeopleComponent,      canActivate: [authGuard], data: { permission: 'customers.view' } },
  { path: 'bookings',    component: AdminBookingsComponent,    canActivate: [authGuard], data: { permission: 'bookings.view' } },
  { path: 'payments',    component: AdminPaymentsComponent,    canActivate: [authGuard], data: { permission: 'payments.view' } },
  { path: 'expenses',    component: AdminExpensesComponent,    canActivate: [authGuard], data: { permission: 'expenses.view' } },
  { path: 'refunds',     component: AdminRefundsComponent,     canActivate: [authGuard], data: { permission: 'refunds.view' } },
  { path: 'reviews',     component: AdminReviewsComponent,     canActivate: [authGuard], data: { permission: 'reviews.view' } },
  { path: 'schedules',   component: AdminSchedulesComponent,   canActivate: [authGuard], data: { permission: 'schedules.view' } },
  { path: 'allocations', component: AdminAllocationsComponent, canActivate: [authGuard], data: { permission: 'allocations.view' } },
  { path: 'reports',     component: AdminReportsComponent,     canActivate: [authGuard], data: { permission: 'reports.view' } },
  { path: 'destinations',component: AdminDestinationsComponent,canActivate: [authGuard], data: { permission: 'destinations.view' } },
  { path: 'roles',       component: AdminRolesComponent,       canActivate: [authGuard], data: { permission: 'roles.view' } },
  { path: 'countries',   component: AdminCountriesComponent,   canActivate: [authGuard], data: { permission: 'countries.view' } },
  { path: 'states',      component: AdminStatesComponent,      canActivate: [authGuard], data: { permission: 'states.view' } },
  { path: 'cities',      component: AdminCitiesComponent,      canActivate: [authGuard], data: { permission: 'cities.view' } },
  { path: 'departments', component: AdminDepartmentsComponent, canActivate: [authGuard], data: { permission: 'departments.view' } },
  { path: 'designations',component: AdminDesignationsComponent,canActivate: [authGuard], data: { permission: 'designations.view' } },
  { path: 'settings',    component: AdminSettingsComponent }
];

const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent, canActivate: [staffHomeRedirectGuard] },
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
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent }
    ]
  },
  // Customer panel — accessible to any authenticated user (no level enforcement from guard)
  {
    path: 'customer',
    component: CustomerLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: CustomerDashboardComponent },
      { path: 'bookings', component: CustomerBookingsComponent },
      { path: 'bookings/new/:packageId', component: BookingCreateComponent },
      { path: 'bookings/:id', component: BookingDetailComponent },
      { path: 'reviews', component: CustomerReviewsComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  // Management panels — fully dynamic. The route prefix comes from the URL param and is validated
  // against appsettings.json SystemRoles[] by the guard. Adding a new role only requires a new
  // entry in appsettings.json — no code change needed here.
  {
    path: ':rolePrefix',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: managementChildren
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
