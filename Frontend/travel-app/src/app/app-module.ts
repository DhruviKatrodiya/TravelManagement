import { APP_INITIALIZER, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SystemRolesService } from './core/services/system-roles.service';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { CustomerLayoutComponent } from './layout/customer-layout/customer-layout.component';
import { ToastHostComponent } from './shared/toast-host.component';

import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password.component';

import { HomeComponent } from './pages/public/home.component';
import { ToursListComponent } from './pages/public/tours-list.component';
import { TourDetailComponent } from './pages/public/tour-detail.component';
import { AboutComponent } from './pages/public/about.component';

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
import { AdminCountriesComponent } from './pages/admin/admin-countries.component';
import { AdminStatesComponent } from './pages/admin/admin-states.component';
import { AdminCitiesComponent } from './pages/admin/admin-cities.component';
import { AdminDepartmentsComponent } from './pages/admin/admin-departments.component';
import { AdminDesignationsComponent } from './pages/admin/admin-designations.component';
import { AdminRolesComponent } from './pages/admin/admin-roles.component';
import { AdminPeopleComponent } from './pages/admin/admin-people.component';
import { SelectFieldComponent } from './shared/select-field.component';

@NgModule({
  declarations: [
    App,
    PublicLayoutComponent,
    AdminLayoutComponent,
    CustomerLayoutComponent,
    ToastHostComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    HomeComponent,
    ToursListComponent,
    TourDetailComponent,
    AboutComponent,
    CustomerDashboardComponent,
    CustomerBookingsComponent,
    BookingDetailComponent,
    BookingCreateComponent,
    ProfileComponent,
    CustomerReviewsComponent,
    AdminDashboardComponent,
    AdminToursComponent,
    AdminPackagesComponent,
    AdminFacilitiesComponent,
    AdminVehiclesComponent,
    AdminDriversComponent,
    AdminStaffComponent,
    AdminCustomersComponent,
    AdminBookingsComponent,
    AdminPaymentsComponent,
    AdminExpensesComponent,
    AdminRefundsComponent,
    AdminReviewsComponent,
    AdminSchedulesComponent,
    AdminAllocationsComponent,
    AdminReportsComponent,
    AdminSettingsComponent,
    AdminDestinationsComponent,
    AdminCountriesComponent,
    AdminStatesComponent,
    AdminCitiesComponent,
    AdminDepartmentsComponent,
    AdminDesignationsComponent,
    AdminRolesComponent,
    AdminPeopleComponent,
    SelectFieldComponent
  ],
  exports: [
    SelectFieldComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (svc: SystemRolesService) => () => svc.load(),
      deps: [SystemRolesService],
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }
