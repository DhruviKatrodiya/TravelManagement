export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface HomeDestination {
  id: number;
  name: string;
  country: string;
  imageUrl: string;
  blurb?: string;
  sortOrder: number;
  tourId?: number;
  keyword?: string;
  averageRating?: number;
  reviewCount?: number;
  tourCount?: number;
  isActive: boolean;
}

export type UserRole = 'Customer' | 'Staff' | 'Admin';
export type Destination = 'India' | 'Bhutan' | 'Nepal';
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Refunded';
export type PaymentStatus = 'Pending' | 'Initiated' | 'Success' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Paytm' | 'GooglePay' | 'Cash' | 'BankTransfer';
export type FacilityType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Hotel' | 'Transportation' | 'Guide' | 'Other';
export type VehicleType = 'Car' | 'SUV' | 'MiniBus' | 'Bus' | 'Tempo' | 'Other';
export type RefundStatus = 'Requested' | 'Approved' | 'Rejected' | 'Processed';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  permissions?: string[];
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface Tour {
  id: number;
  name: string;
  destination: Destination;
  region?: string;
  description?: string;
  highlights?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  packages: TourPackage[];
  averageRating: number;
  reviewCount: number;
}

export interface TourPackage {
  id: number;
  tourId: number;
  name: string;
  durationDays: number;
  durationNights: number;
  pricePerPerson: number;
  childPrice?: number;
  minPersons: number;
  maxPersons: number;
  description?: string;
  inclusions?: string;
  exclusions?: string;
  isCustomizable: boolean;
  isActive: boolean;
  itineraries: Itinerary[];
  facilities: PackageFacility[];
}

export interface Itinerary {
  id: number;
  tourPackageId: number;
  dayNumber: number;
  title: string;
  description?: string;
  location?: string;
  activities?: string;
  accommodation?: string;
  meals?: string;
}

export interface Facility {
  id: number;
  name: string;
  type: FacilityType;
  description?: string;
  cost: number;
  isActive: boolean;
}

export interface PackageFacility {
  id: number;
  facilityId: number;
  facilityName: string;
  type: FacilityType;
  cost: number;
  included: boolean;
}

export interface Vehicle {
  id: number;
  name: string;
  registrationNumber: string;
  type: VehicleType;
  capacity: number;
  make?: string;
  model?: string;
  year?: number;
  costPerDay?: number;
  isAvailable: boolean;
  isActive: boolean;
  notes?: string;
}

export interface VehicleAllocation {
  id: number;
  vehicleId: number;
  vehicleName: string;
  driverId?: number;
  driverName?: string;
  staffIds: number[];
  staffNames: string[];
  bookingId?: number;
  bookingReference?: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface Driver {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry?: string;
  address?: string;
  experienceYears: number;
  isAvailable: boolean;
  isActive: boolean;
}

export interface TourSchedule {
  id: number;
  tourId: number;
  tourName: string;
  tourPackageId: number;
  packageName: string;
  startDate: string;
  endDate: string;
  availableSeats: number;
  bookedSeats: number;
  isActive: boolean;
}

export interface Booking {
  id: number;
  bookingReference: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  tourPackageId: number;
  tourName: string;
  packageName: string;
  tripStartDate: string;
  tripEndDate: string;
  adults: number;
  children: number;
  subTotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: BookingStatus;
  specialRequests?: string;
  customItinerary?: string;
  bookedAt: string;
  cancelledAt?: string;
}

export interface BookingCreateRequest {
  tourPackageId: number;
  tourScheduleId?: number;
  tripStartDate: string;
  tripEndDate: string;
  adults: number;
  children: number;
  specialRequests?: string;
  customItinerary?: string;
  discount?: number;
}

export interface Payment {
  id: number;
  bookingId: number;
  bookingReference: string;
  transactionReference: string;
  gatewayTransactionId?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  notes?: string;
  initiatedAt: string;
  completedAt?: string;
}

export interface PaymentInitiateResponse {
  paymentId: number;
  transactionReference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  redirectUrl?: string;
  gatewayOrderId?: string;
  gatewayParams?: Record<string, string>;
}

export interface Customer {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: string;
  gender?: string;
  idProofType?: string;
  idProofNumber?: string;
  totalBookings: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
}

export interface Staff {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  joinedAt: string;
  salary?: number;
  isActive: boolean;
}

export interface Expense {
  id: number;
  bookingId?: number;
  bookingReference?: string;
  tourPackageId?: number;
  packageName?: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  paidBy?: string;
  notes?: string;
  isActive: boolean;
}

export interface Refund {
  id: number;
  bookingId: number;
  bookingReference: string;
  customerName: string;
  reason: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: RefundStatus;
  adminNotes?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface Review {
  id: number;
  customerId: number;
  customerName: string;
  tourId: number;
  tourName: string;
  bookingId?: number;
  rating: number;
  title?: string;
  comment?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  activeTours: number;
  activePackages: number;
  vehiclesAvailable: number;
  driversAvailable: number;
  monthlyRevenue: { month: string; value: number }[];
  monthlyBookings: { month: string; value: number }[];
  bookingsByDestination: { destination: string; count: number; revenue: number }[];
  topTours: { tourId: number; name: string; bookings: number; revenue: number }[];
}

export interface TripProfit {
  bookingId: number;
  bookingReference: string;
  tourName: string;
  tripStartDate: string;
  revenue: number;
  expenses: number;
  profit: number;
}
