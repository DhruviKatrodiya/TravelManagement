import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, AppRole, Booking, BookingCreateRequest, City, Country, Customer, CustomPermission,
  CustomPermissionCreateRequest, CustomPermissionUpdateRequest, DashboardStats,
  Department, Designation, Driver, Expense, Facility, GeoState, HomeDestination, Notification,
  Payment, PaymentInitiateResponse, Refund, Review, Staff, Tour, TourPackage, TourSchedule,
  TripProfit, Vehicle, VehicleAllocation
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private unwrap<T>(o: Observable<ApiResponse<T>>): Observable<T> {
    return o.pipe(map(r => r.data as T));
  }

  private toParams(obj: Record<string, any>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    }
    return p;
  }

  listTours(destination?: string, activeOnly: boolean = true, q?: string, homeDestinationId?: number, assignedToMe?: boolean): Observable<Tour[]> {
    return this.unwrap(this.http.get<ApiResponse<Tour[]>>(`${this.base}/tours`, { params: this.toParams({ destination, activeOnly, q, homeDestinationId, assignedToMe }) }));
  }
  getTour(id: number): Observable<Tour> { return this.unwrap(this.http.get<ApiResponse<Tour>>(`${this.base}/tours/${id}`)); }
  getTourReviews(id: number): Observable<Review[]> { return this.unwrap(this.http.get<ApiResponse<Review[]>>(`${this.base}/tours/${id}/reviews`)); }
  createTour(req: Partial<Tour>): Observable<Tour> { return this.unwrap(this.http.post<ApiResponse<Tour>>(`${this.base}/tours`, req)); }
  updateTour(id: number, req: Partial<Tour>): Observable<Tour> { return this.unwrap(this.http.put<ApiResponse<Tour>>(`${this.base}/tours/${id}`, req)); }
  deleteTour(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/tours/${id}`)); }

  listPackages(tourId?: number, assignedToMe?: boolean): Observable<TourPackage[]> {
    return this.unwrap(this.http.get<ApiResponse<TourPackage[]>>(`${this.base}/packages`, { params: this.toParams({ tourId, assignedToMe }) }));
  }
  getPackage(id: number): Observable<TourPackage> { return this.unwrap(this.http.get<ApiResponse<TourPackage>>(`${this.base}/packages/${id}`)); }
  createPackage(req: any): Observable<TourPackage> { return this.unwrap(this.http.post<ApiResponse<TourPackage>>(`${this.base}/packages`, req)); }
  updatePackage(id: number, req: any): Observable<TourPackage> { return this.unwrap(this.http.put<ApiResponse<TourPackage>>(`${this.base}/packages/${id}`, req)); }
  deletePackage(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/packages/${id}`)); }
  addItinerary(req: any): Observable<any> { return this.unwrap(this.http.post<ApiResponse<any>>(`${this.base}/packages/itineraries`, req)); }
  deleteItinerary(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/packages/itineraries/${id}`)); }

  listFacilities(): Observable<Facility[]> { return this.unwrap(this.http.get<ApiResponse<Facility[]>>(`${this.base}/facilities`)); }
  createFacility(req: any): Observable<Facility> { return this.unwrap(this.http.post<ApiResponse<Facility>>(`${this.base}/facilities`, req)); }
  updateFacility(id: number, req: any): Observable<Facility> { return this.unwrap(this.http.put<ApiResponse<Facility>>(`${this.base}/facilities/${id}`, req)); }
  deleteFacility(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/facilities/${id}`)); }

  listVehicles(availableOnly?: boolean): Observable<Vehicle[]> {
    return this.unwrap(this.http.get<ApiResponse<Vehicle[]>>(`${this.base}/vehicles`, { params: this.toParams({ availableOnly }) }));
  }
  createVehicle(req: any): Observable<Vehicle> { return this.unwrap(this.http.post<ApiResponse<Vehicle>>(`${this.base}/vehicles`, req)); }
  updateVehicle(id: number, req: any): Observable<Vehicle> { return this.unwrap(this.http.put<ApiResponse<Vehicle>>(`${this.base}/vehicles/${id}`, req)); }
  deleteVehicle(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/vehicles/${id}`)); }
  setVehicleActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/vehicles/${id}/active?active=${active}`, {})); }
  listAllocations(from?: string, to?: string): Observable<VehicleAllocation[]> {
    return this.unwrap(this.http.get<ApiResponse<VehicleAllocation[]>>(`${this.base}/vehicles/allocations`, { params: this.toParams({ from, to }) }));
  }
  allocateVehicle(req: any): Observable<VehicleAllocation> {
    return this.unwrap(this.http.post<ApiResponse<VehicleAllocation>>(`${this.base}/vehicles/allocations`, req));
  }
  updateAllocation(id: number, req: any): Observable<VehicleAllocation> {
    return this.unwrap(this.http.put<ApiResponse<VehicleAllocation>>(`${this.base}/vehicles/allocations/${id}`, req));
  }
  deleteAllocation(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/vehicles/allocations/${id}`)); }
  getAvailableVehicles(from: string, to: string): Observable<Vehicle[]> {
    return this.unwrap(this.http.get<ApiResponse<Vehicle[]>>(`${this.base}/vehicles/available`, { params: this.toParams({ from, to }) }));
  }

  listDrivers(): Observable<Driver[]> { return this.unwrap(this.http.get<ApiResponse<Driver[]>>(`${this.base}/drivers`)); }
  createDriver(req: any): Observable<Driver> { return this.unwrap(this.http.post<ApiResponse<Driver>>(`${this.base}/drivers`, req)); }
  updateDriver(id: number, req: any): Observable<Driver> { return this.unwrap(this.http.put<ApiResponse<Driver>>(`${this.base}/drivers/${id}`, req)); }
  deleteDriver(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/drivers/${id}`)); }
  setDriverActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/drivers/${id}/active?active=${active}`, {})); }

  listSchedules(from?: string, to?: string): Observable<TourSchedule[]> {
    return this.unwrap(this.http.get<ApiResponse<TourSchedule[]>>(`${this.base}/schedules`, { params: this.toParams({ from, to }) }));
  }
  createSchedule(req: any): Observable<TourSchedule> { return this.unwrap(this.http.post<ApiResponse<TourSchedule>>(`${this.base}/schedules`, req)); }
  updateSchedule(id: number, req: any): Observable<TourSchedule> { return this.unwrap(this.http.put<ApiResponse<TourSchedule>>(`${this.base}/schedules/${id}`, req)); }
  deleteSchedule(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/schedules/${id}`)); }

  listBookings(): Observable<Booking[]> { return this.unwrap(this.http.get<ApiResponse<Booking[]>>(`${this.base}/bookings`)); }
  getBooking(id: number): Observable<Booking> { return this.unwrap(this.http.get<ApiResponse<Booking>>(`${this.base}/bookings/${id}`)); }
  createBooking(req: BookingCreateRequest): Observable<Booking> { return this.unwrap(this.http.post<ApiResponse<Booking>>(`${this.base}/bookings`, req)); }
  updateBookingStatus(id: number, status: string, note?: string): Observable<Booking> {
    return this.unwrap(this.http.post<ApiResponse<Booking>>(`${this.base}/bookings/${id}/status`, { status, note }));
  }
  cancelBooking(id: number, note: string): Observable<Booking> {
    return this.unwrap(this.http.post<ApiResponse<Booking>>(`${this.base}/bookings/${id}/cancel`, { note }));
  }

  listCustomers(): Observable<Customer[]> { return this.unwrap(this.http.get<ApiResponse<Customer[]>>(`${this.base}/customers`)); }
  getCustomer(id: number): Observable<Customer> { return this.unwrap(this.http.get<ApiResponse<Customer>>(`${this.base}/customers/${id}`)); }
  getMyProfile(): Observable<Customer> { return this.unwrap(this.http.get<ApiResponse<Customer>>(`${this.base}/customers/me`)); }
  updateMyProfile(req: any): Observable<Customer> { return this.unwrap(this.http.put<ApiResponse<Customer>>(`${this.base}/customers/me`, req)); }
  createCustomer(req: any): Observable<Customer> { return this.unwrap(this.http.post<ApiResponse<Customer>>(`${this.base}/customers`, req)); }
  updateCustomer(id: number, req: any): Observable<Customer> { return this.unwrap(this.http.put<ApiResponse<Customer>>(`${this.base}/customers/${id}`, req)); }
  deleteCustomer(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/customers/${id}`)); }
  setCustomerActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/customers/${id}/active?active=${active}`, {})); }

  listStaff(): Observable<Staff[]> { return this.unwrap(this.http.get<ApiResponse<Staff[]>>(`${this.base}/staff`)); }
  createStaff(req: any): Observable<Staff> { return this.unwrap(this.http.post<ApiResponse<Staff>>(`${this.base}/staff`, req)); }
  updateStaff(id: number, req: any): Observable<Staff> { return this.unwrap(this.http.put<ApiResponse<Staff>>(`${this.base}/staff/${id}`, req)); }
  deleteStaff(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/staff/${id}`)); }
  listPermissionCatalog(): Observable<string[]> { return this.unwrap(this.http.get<ApiResponse<string[]>>(`${this.base}/staff/permissions/catalog`)); }
  getStaffPermissions(id: number): Observable<string[]> { return this.unwrap(this.http.get<ApiResponse<string[]>>(`${this.base}/staff/${id}/permissions`)); }
  setStaffPermissions(id: number, permissions: string[]): Observable<unknown> { return this.unwrap(this.http.put<ApiResponse<unknown>>(`${this.base}/staff/${id}/permissions`, { permissions })); }

  initiatePayment(req: any): Observable<PaymentInitiateResponse> {
    return this.unwrap(this.http.post<ApiResponse<PaymentInitiateResponse>>(`${this.base}/payments/initiate`, req));
  }
  confirmPayment(req: any): Observable<Payment> {
    return this.unwrap(this.http.post<ApiResponse<Payment>>(`${this.base}/payments/callback`, req));
  }
  listPayments(bookingId?: number): Observable<Payment[]> {
    return this.unwrap(this.http.get<ApiResponse<Payment[]>>(`${this.base}/payments`, { params: this.toParams({ bookingId }) }));
  }

  listExpenses(bookingId?: number, from?: string, to?: string): Observable<Expense[]> {
    return this.unwrap(this.http.get<ApiResponse<Expense[]>>(`${this.base}/expenses`, { params: this.toParams({ bookingId, from, to }) }));
  }
  createExpense(req: any): Observable<Expense> { return this.unwrap(this.http.post<ApiResponse<Expense>>(`${this.base}/expenses`, req)); }
  updateExpense(id: number, req: any): Observable<Expense> { return this.unwrap(this.http.put<ApiResponse<Expense>>(`${this.base}/expenses/${id}`, req)); }
  deleteExpense(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/expenses/${id}`)); }

  listRefunds(): Observable<Refund[]> { return this.unwrap(this.http.get<ApiResponse<Refund[]>>(`${this.base}/refunds`)); }
  requestRefund(req: any): Observable<Refund> { return this.unwrap(this.http.post<ApiResponse<Refund>>(`${this.base}/refunds`, req)); }
  processRefund(id: number, req: any): Observable<Refund> { return this.unwrap(this.http.post<ApiResponse<Refund>>(`${this.base}/refunds/${id}/process`, req)); }

  listReviews(): Observable<Review[]> { return this.unwrap(this.http.get<ApiResponse<Review[]>>(`${this.base}/reviews`)); }
  listFeaturedReviews(take: number = 6): Observable<Review[]> { return this.unwrap(this.http.get<ApiResponse<Review[]>>(`${this.base}/reviews/featured`, { params: this.toParams({ take }) })); }
  listMyReviews(): Observable<Review[]> { return this.unwrap(this.http.get<ApiResponse<Review[]>>(`${this.base}/reviews/mine`)); }
  createReview(req: any): Observable<Review> { return this.unwrap(this.http.post<ApiResponse<Review>>(`${this.base}/reviews`, req)); }
  approveReview(id: number, approved: boolean): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/reviews/${id}/approve?approved=${approved}`, {}));
  }
  deleteReview(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/reviews/${id}`)); }
  deleteMyReview(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/reviews/mine/${id}`)); }

  listNotifications(onlyUnread = false): Observable<Notification[]> {
    return this.unwrap(this.http.get<ApiResponse<Notification[]>>(`${this.base}/notifications`, { params: this.toParams({ onlyUnread }) }));
  }
  markNotificationRead(id: number): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/notifications/${id}/read`, {})); }
  markAllNotificationsRead(): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/notifications/read-all`, {})); }
  deleteNotification(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/notifications/${id}`)); }

  getDashboard(): Observable<DashboardStats> { return this.unwrap(this.http.get<ApiResponse<DashboardStats>>(`${this.base}/reports/dashboard`)); }
  getTripProfits(filter: any = {}): Observable<TripProfit[]> {
    return this.unwrap(this.http.get<ApiResponse<TripProfit[]>>(`${this.base}/reports/trip-profits`, { params: this.toParams(filter) }));
  }

  uploadImage(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.unwrap(this.http.post<ApiResponse<{ url: string }>>(`${this.base}/uploads/image`, form))
      .pipe(map(r => r.url));
  }

  updateMyAuthProfile(req: { fullName: string; email: string; phone?: string | null }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.base}/auth/me`, req);
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/auth/forgot-password`, { email }));
  }

  verifyForgotPasswordOtp(email: string, otp: string): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/auth/verify-forgot-password-otp`, { email, otp }));
  }

  sendChangePasswordOtp(currentPassword: string): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/auth/send-change-password-otp`, { currentPassword }));
  }

  changePasswordWithOtp(currentPassword: string, newPassword: string, otp: string): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/auth/change-password`, { currentPassword, newPassword, otp }));
  }

  sendTestEmail(to?: string): Observable<string> {
    return this.unwrap(this.http.post<ApiResponse<string>>(`${this.base}/settings/test-email`, { to }));
  }

  listCountries(activeOnly?: boolean): Observable<Country[]> {
    return this.unwrap(this.http.get<ApiResponse<Country[]>>(`${this.base}/countries`, { params: this.toParams({ activeOnly }) }));
  }
  createCountry(req: any): Observable<Country> { return this.unwrap(this.http.post<ApiResponse<Country>>(`${this.base}/countries`, req)); }
  updateCountry(id: number, req: any): Observable<Country> { return this.unwrap(this.http.put<ApiResponse<Country>>(`${this.base}/countries/${id}`, req)); }
  setCountryActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/countries/${id}/active?active=${active}`, {})); }

  listStates(countryId?: number, activeOnly?: boolean): Observable<GeoState[]> {
    return this.unwrap(this.http.get<ApiResponse<GeoState[]>>(`${this.base}/states`, { params: this.toParams({ countryId, activeOnly }) }));
  }
  createState(req: any): Observable<GeoState> { return this.unwrap(this.http.post<ApiResponse<GeoState>>(`${this.base}/states`, req)); }
  updateState(id: number, req: any): Observable<GeoState> { return this.unwrap(this.http.put<ApiResponse<GeoState>>(`${this.base}/states/${id}`, req)); }
  setStateActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/states/${id}/active?active=${active}`, {})); }

  listCities(stateId?: number, countryId?: number, activeOnly?: boolean): Observable<City[]> {
    return this.unwrap(this.http.get<ApiResponse<City[]>>(`${this.base}/cities`, { params: this.toParams({ stateId, countryId, activeOnly }) }));
  }
  createCity(req: any): Observable<City> { return this.unwrap(this.http.post<ApiResponse<City>>(`${this.base}/cities`, req)); }
  updateCity(id: number, req: any): Observable<City> { return this.unwrap(this.http.put<ApiResponse<City>>(`${this.base}/cities/${id}`, req)); }
  setCityActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/cities/${id}/active?active=${active}`, {})); }

  listDepartments(activeOnly?: boolean): Observable<Department[]> {
    return this.unwrap(this.http.get<ApiResponse<Department[]>>(`${this.base}/departments`, { params: this.toParams({ activeOnly }) }));
  }
  createDepartment(req: any): Observable<Department> { return this.unwrap(this.http.post<ApiResponse<Department>>(`${this.base}/departments`, req)); }
  updateDepartment(id: number, req: any): Observable<Department> { return this.unwrap(this.http.put<ApiResponse<Department>>(`${this.base}/departments/${id}`, req)); }
  setDepartmentActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/departments/${id}/active?active=${active}`, {})); }

  listDesignations(departmentId?: number, activeOnly?: boolean): Observable<Designation[]> {
    return this.unwrap(this.http.get<ApiResponse<Designation[]>>(`${this.base}/designations`, { params: this.toParams({ departmentId, activeOnly }) }));
  }
  createDesignation(req: any): Observable<Designation> { return this.unwrap(this.http.post<ApiResponse<Designation>>(`${this.base}/designations`, req)); }
  updateDesignation(id: number, req: any): Observable<Designation> { return this.unwrap(this.http.put<ApiResponse<Designation>>(`${this.base}/designations/${id}`, req)); }
  setDesignationActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/designations/${id}/active?active=${active}`, {})); }

  listRoles(activeOnly?: boolean): Observable<AppRole[]> {
    return this.unwrap(this.http.get<ApiResponse<AppRole[]>>(`${this.base}/roles`, { params: this.toParams({ activeOnly }) }));
  }
  getRole(id: number): Observable<AppRole> { return this.unwrap(this.http.get<ApiResponse<AppRole>>(`${this.base}/roles/${id}`)); }
  createRole(req: any): Observable<AppRole> { return this.unwrap(this.http.post<ApiResponse<AppRole>>(`${this.base}/roles`, req)); }
  updateRole(id: number, req: any): Observable<AppRole> { return this.unwrap(this.http.put<ApiResponse<AppRole>>(`${this.base}/roles/${id}`, req)); }
  deleteRole(id: number): Observable<unknown> { return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/roles/${id}`)); }
  setRoleActive(id: number, active: boolean): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/roles/${id}/active?active=${active}`, {})); }

  listCustomPermissions(): Observable<CustomPermission[]> {
    return this.unwrap(this.http.get<ApiResponse<CustomPermission[]>>(`${this.base}/custom-permissions`));
  }
  createCustomPermission(req: CustomPermissionCreateRequest): Observable<CustomPermission> {
    return this.unwrap(this.http.post<ApiResponse<CustomPermission>>(`${this.base}/custom-permissions`, req));
  }
  updateCustomPermission(id: number, req: CustomPermissionUpdateRequest): Observable<CustomPermission> {
    return this.unwrap(this.http.put<ApiResponse<CustomPermission>>(`${this.base}/custom-permissions/${id}`, req));
  }
  deleteCustomPermission(id: number): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.base}/custom-permissions/${id}`));
  }

  listHomeDestinations(activeOnly: boolean = true, assignedToMe?: boolean): Observable<HomeDestination[]> {
    return this.unwrap(this.http.get<ApiResponse<HomeDestination[]>>(`${this.base}/home-destinations`, { params: this.toParams({ activeOnly, assignedToMe }) }));
  }
  createHomeDestination(req: Partial<HomeDestination>): Observable<HomeDestination> {
    return this.unwrap(this.http.post<ApiResponse<HomeDestination>>(`${this.base}/home-destinations`, req));
  }
  updateHomeDestination(id: number, req: Partial<HomeDestination>): Observable<HomeDestination> {
    return this.unwrap(this.http.put<ApiResponse<HomeDestination>>(`${this.base}/home-destinations/${id}`, req));
  }
  deleteHomeDestination(id: number): Observable<unknown> {
    return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/home-destinations/${id}`));
  }
}
