using TravelManagement.API.DTOs.Auth;
using TravelManagement.API.DTOs.Booking;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.DTOs.Payment;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterCustomerAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<UserDto> GetCurrentUserAsync(int userId);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request);
}

public interface IAppSettingsService
{
    Task<DTOs.Common.AppSettingsDto> GetAsync();
    Task<DTOs.Common.AppSettingsDto> UpdateAsync(DTOs.Common.AppSettingsUpdateRequest req);
}

public interface IHomeDestinationService
{
    Task<IEnumerable<DTOs.Common.HomeDestinationDto>> ListAsync(bool? activeOnly = true);
    Task<DTOs.Common.HomeDestinationDto> CreateAsync(DTOs.Common.HomeDestinationRequest req);
    Task<DTOs.Common.HomeDestinationDto?> UpdateAsync(int id, DTOs.Common.HomeDestinationRequest req);
    Task<bool> DeleteAsync(int id);
}

public interface ITokenService
{
    (string token, DateTime expiresAt) GenerateToken(User user);
}

public interface IEmailService
{
    Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default);
}

public interface INotificationService
{
    Task CreateAsync(int userId, NotificationType type, string title, string message, string? link = null);
    Task<IEnumerable<NotificationDto>> GetForUserAsync(int userId, bool onlyUnread = false);
    Task MarkReadAsync(int userId, int notificationId);
    Task MarkAllReadAsync(int userId);
    Task<bool> DeleteAsync(int userId, int notificationId);
}

public interface ITourService
{
    Task<IEnumerable<TourDto>> ListAsync(Destination? destination = null, string? q = null, int? homeDestinationId = null, bool? activeOnly = true);
    Task<TourDto?> GetAsync(int id);
    Task<TourDto> CreateAsync(TourCreateRequest req);
    Task<TourDto?> UpdateAsync(int id, TourUpdateRequest req);
    Task<bool> DeleteAsync(int id);
}

public interface IPackageService
{
    Task<IEnumerable<TourPackageDto>> ListAsync(int? tourId = null);
    Task<TourPackageDto?> GetAsync(int id);
    Task<TourPackageDto> CreateAsync(TourPackageCreateRequest req);
    Task<TourPackageDto?> UpdateAsync(int id, TourPackageUpdateRequest req);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<ItineraryDto>> ListItinerariesAsync(int packageId);
    Task<ItineraryDto> AddItineraryAsync(ItineraryCreateRequest req);
    Task<bool> DeleteItineraryAsync(int id);
}

public interface IFacilityService
{
    Task<IEnumerable<FacilityDto>> ListAsync();
    Task<FacilityDto> CreateAsync(FacilityCreateRequest req);
    Task<FacilityDto?> UpdateAsync(int id, FacilityCreateRequest req);
    Task<bool> DeleteAsync(int id);
}

public interface IVehicleService
{
    Task<IEnumerable<VehicleDto>> ListAsync(bool? availableOnly = null);
    Task<VehicleDto?> GetAsync(int id);
    Task<VehicleDto> CreateAsync(VehicleCreateRequest req);
    Task<VehicleDto?> UpdateAsync(int id, VehicleCreateRequest req);
    Task<bool> DeleteAsync(int id);
    Task<bool> SetActiveAsync(int id, bool active);
    Task<IEnumerable<VehicleAllocationDto>> ListAllocationsAsync(DateTime? from = null, DateTime? to = null);
    Task<VehicleAllocationDto> AllocateAsync(VehicleAllocationCreateRequest req);
    Task<VehicleAllocationDto?> UpdateAllocationAsync(int id, VehicleAllocationCreateRequest req);
    Task<bool> DeleteAllocationAsync(int id);
    Task<IEnumerable<VehicleDto>> GetAvailableAsync(DateTime from, DateTime to);
}

public interface IDriverService
{
    Task<IEnumerable<DriverDto>> ListAsync();
    Task<DriverDto?> GetAsync(int id);
    Task<DriverDto> CreateAsync(DriverCreateRequest req);
    Task<DriverDto?> UpdateAsync(int id, DriverCreateRequest req);
    Task<bool> DeleteAsync(int id);
    Task<bool> SetActiveAsync(int id, bool active);
}

public interface IScheduleService
{
    Task<IEnumerable<TourScheduleDto>> ListAsync(DateTime? from = null, DateTime? to = null);
    Task<TourScheduleDto> CreateAsync(TourScheduleCreateRequest req);
    Task<TourScheduleDto?> UpdateAsync(int id, TourScheduleCreateRequest req);
    Task<bool> DeleteAsync(int id);
}

public interface IBookingService
{
    Task<IEnumerable<BookingDto>> ListAsync(int? customerId = null);
    Task<BookingDto?> GetAsync(int id);
    Task<BookingDto?> GetByReferenceAsync(string reference);
    Task<BookingDto> CreateAsync(int customerUserId, BookingCreateRequest req);
    Task<BookingDto?> UpdateStatusAsync(int id, BookingUpdateStatusRequest req);
    Task<BookingDto?> CancelAsync(int bookingId, int customerUserId, string? reason);
}

public interface ICustomerService
{
    Task<IEnumerable<CustomerDto>> ListAsync();
    Task<CustomerDto?> GetAsync(int id);
    Task<CustomerDto?> GetByUserIdAsync(int userId);
    Task<CustomerDto> CreateAsync(CustomerCreateRequest req);
    Task<CustomerDto?> UpdateAsync(int customerId, CustomerUpdateRequest req);
    Task<bool> DeleteAsync(int customerId);
    Task<bool> SetActiveAsync(int customerId, bool active);
}

public interface IStaffService
{
    Task<IEnumerable<StaffDto>> ListAsync();
    Task<StaffDto> CreateAsync(StaffCreateRequest req);
    Task<StaffDto?> UpdateAsync(int id, StaffUpdateRequest req);
    Task<bool> DeleteAsync(int id);
}

public interface IPaymentService
{
    Task<PaymentInitiateResponse> InitiateAsync(int userId, PaymentInitiateRequest req);
    Task<PaymentDto?> ConfirmAsync(PaymentCallbackRequest req);
    Task<IEnumerable<PaymentDto>> ListAsync(int? bookingId = null);
    Task<PaymentDto?> GetAsync(int id);
}

public interface IPaymentGateway
{
    PaymentMethod Method { get; }
    Task<PaymentInitiateResponse> InitiateAsync(Payment payment, Models.Booking booking);
    Task<bool> VerifyAsync(PaymentCallbackRequest req);
}

public interface IExpenseService
{
    Task<IEnumerable<ExpenseDto>> ListAsync(int? bookingId = null, DateTime? from = null, DateTime? to = null);
    Task<ExpenseDto> CreateAsync(ExpenseCreateRequest req);
    Task<ExpenseDto?> UpdateAsync(int id, ExpenseCreateRequest req);
    Task<bool> DeleteAsync(int id);
}

public interface IRefundService
{
    Task<IEnumerable<RefundDto>> ListAsync();
    Task<RefundDto> RequestAsync(int customerUserId, RefundCreateRequest req);
    Task<RefundDto?> ProcessAsync(int id, RefundProcessRequest req);
}

public interface IReviewService
{
    Task<IEnumerable<ReviewDto>> ListByTourAsync(int tourId);
    Task<IEnumerable<ReviewDto>> ListAllAsync();
    Task<IEnumerable<ReviewDto>> ListFeaturedAsync(int take = 6);
    Task<IEnumerable<ReviewDto>> ListByCustomerUserAsync(int customerUserId);
    Task<ReviewDto> CreateAsync(int customerUserId, ReviewCreateRequest req);
    Task<bool> ApproveAsync(int id, bool approved);
    Task<bool> DeleteAsync(int id);
    Task<bool> DeleteByCustomerAsync(int id, int customerUserId);
}

public interface IReportService
{
    Task<DashboardStatsDto> GetDashboardAsync();
    Task<IEnumerable<TripProfitDto>> GetTripProfitsAsync(ReportFilter filter);
}
