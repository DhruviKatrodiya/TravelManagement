using System.ComponentModel.DataAnnotations;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.DTOs.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null) => new() { Success = true, Data = data, Message = message };
    public static ApiResponse<T> Fail(string message) => new() { Success = false, Message = message };
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class AppRoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public List<string> Permissions { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public List<MemberInfo> Members { get; set; } = new();
}

public class MemberInfo
{
    public int StaffId { get; set; }
    public int UserId  { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
}

public class AppRoleCreateRequest
{
    [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(500)] public string? Description { get; set; }
    public List<string> Permissions { get; set; } = new();
    public bool IsActive { get; set; } = true;
}

public class AppRoleUpdateRequest
{
    [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(500)] public string? Description { get; set; }
    public List<string> Permissions { get; set; } = new();
    public bool IsActive { get; set; }
}

public class CustomerDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? IdProofType { get; set; }
    public string? IdProofNumber { get; set; }
    public int TotalBookings { get; set; }
    public decimal TotalSpent { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? AppRoleId { get; set; }
    public string? AppRoleName { get; set; }
}

public class CustomerUpdateRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(150)] public string Email { get; set; } = string.Empty;
    [MaxLength(20)] public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? IdProofType { get; set; }
    public string? IdProofNumber { get; set; }
    public int? AppRoleId { get; set; }
}

public class CustomerCreateRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(150)] public string Email { get; set; } = string.Empty;
    [Required, MinLength(6), MaxLength(100)] public string Password { get; set; } = string.Empty;
    [MaxLength(20)] public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public int? AppRoleId { get; set; }
}

public class StaffDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Designation { get; set; }
    public string? Department { get; set; }
    public DateTime JoinedAt { get; set; }
    public decimal? Salary { get; set; }
    public bool IsActive { get; set; }
    public int? AppRoleId { get; set; }
    public string? AppRoleName { get; set; }
    public string SystemRole { get; set; } = "Staff";
}

public class StaffCreateRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
    [MaxLength(20)] public string? Phone { get; set; }
    public string? Designation { get; set; }
    public string? Department { get; set; }
    public decimal? Salary { get; set; }
    public int? AppRoleId { get; set; }
    /// <summary>Accepted values: "Staff" (default), "Admin". SuperAdmin-only.</summary>
    public string? SystemRole { get; set; }
}

public class StaffPermissionsUpdateRequest
{
    public List<string> Permissions { get; set; } = new();
}

public class StaffUpdateRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(150)] public string Email { get; set; } = string.Empty;
    [MaxLength(20)] public string? Phone { get; set; }
    public string? Designation { get; set; }
    public string? Department { get; set; }
    public decimal? Salary { get; set; }
    public bool IsActive { get; set; }
    public int? AppRoleId { get; set; }
    /// <summary>Optional system-level promotion/demotion. Accepted values: "Staff", "Admin". SuperAdmin-only.</summary>
    public string? SystemRole { get; set; }
}

public class DriverDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string LicenseNumber { get; set; } = string.Empty;
    public DateTime? LicenseExpiry { get; set; }
    public string? Address { get; set; }
    public int ExperienceYears { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsActive { get; set; }
}

public class DriverCreateRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string Phone { get; set; } = string.Empty;
    [MaxLength(150)] public string? Email { get; set; }
    [Required, MaxLength(40)] public string LicenseNumber { get; set; } = string.Empty;
    public DateTime? LicenseExpiry { get; set; }
    public string? Address { get; set; }
    public int ExperienceYears { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsActive { get; set; } = true;
}

public class VehicleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RegistrationNumber { get; set; } = string.Empty;
    public VehicleType Type { get; set; }
    public int Capacity { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public decimal? CostPerDay { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}

public class VehicleCreateRequest
{
    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string RegistrationNumber { get; set; } = string.Empty;
    public VehicleType Type { get; set; }
    [Range(1, 100)] public int Capacity { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public decimal? CostPerDay { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}

public class VehicleAllocationDto
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public int? DriverId { get; set; }
    public string? DriverName { get; set; }
    public List<int> StaffIds { get; set; } = new();
    public List<string> StaffNames { get; set; } = new();
    public int? BookingId { get; set; }
    public string? BookingReference { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Notes { get; set; }
}

public class VehicleAllocationCreateRequest
{
    [Required] public int VehicleId { get; set; }
    public int? DriverId { get; set; }
    [Required, MinLength(1)] public List<int> StaffIds { get; set; } = new();
    public int? BookingId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Notes { get; set; }
}

public class ExpenseDto
{
    public int Id { get; set; }
    public int? BookingId { get; set; }
    public string? BookingReference { get; set; }
    public int? TourPackageId { get; set; }
    public string? PackageName { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? Vendor { get; set; }
    public string? PaidBy { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ExpenseCreateRequest
{
    public int? BookingId { get; set; }
    public int? TourPackageId { get; set; }
    [Required, MaxLength(120)] public string Category { get; set; } = string.Empty;
    [Required, MaxLength(250)] public string Description { get; set; } = string.Empty;
    [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
    public string? Vendor { get; set; }
    public string? PaidBy { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}

public class RefundDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal RequestedAmount { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public RefundStatus Status { get; set; }
    public string? AdminNotes { get; set; }
    public string? RefundMethod { get; set; }
    public string? TransactionReference { get; set; }
    public string? PaymentNotes { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class RefundCreateRequest
{
    [Required] public int BookingId { get; set; }
    [Required, MaxLength(500)] public string Reason { get; set; } = string.Empty;
    [Range(0.01, double.MaxValue)] public decimal RequestedAmount { get; set; }
}

public class AdminRefundIssueRequest : RefundCreateRequest
{
    [MaxLength(50)] public string? RefundMethod { get; set; }
    [MaxLength(200)] public string? TransactionReference { get; set; }
    [MaxLength(500)] public string? PaymentNotes { get; set; }
}

public class RefundProcessRequest
{
    public RefundStatus Status { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public string? AdminNotes { get; set; }
}

public class ReviewDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int TourId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public int? BookingId { get; set; }
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string? Comment { get; set; }
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ReviewCreateRequest
{
    [Required] public int TourId { get; set; }
    public int? BookingId { get; set; }
    [Range(1, 5)] public int Rating { get; set; }
    [MaxLength(150)] public string? Title { get; set; }
    [MaxLength(2000)] public string? Comment { get; set; }
}

public class NotificationDto
{
    public int Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DashboardStatsDto
{
    public int TotalCustomers { get; set; }
    public int TotalBookings { get; set; }
    public int ConfirmedBookings { get; set; }
    public int PendingBookings { get; set; }
    public int CancelledBookings { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal Profit { get; set; }
    public int ActiveTours { get; set; }
    public int ActivePackages { get; set; }
    public int VehiclesAvailable { get; set; }
    public int DriversAvailable { get; set; }
    public List<MonthlyStat> MonthlyRevenue { get; set; } = new();
    public List<MonthlyStat> MonthlyBookings { get; set; } = new();
    public List<DestinationStat> BookingsByDestination { get; set; } = new();
    public List<TopTourStat> TopTours { get; set; } = new();
}

public class MonthlyStat
{
    public string Month { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class DestinationStat
{
    public string Destination { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Revenue { get; set; }
}

public class TopTourStat
{
    public int TourId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Bookings { get; set; }
    public decimal Revenue { get; set; }
}

public class TripProfitDto
{
    public int BookingId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string TourName { get; set; } = string.Empty;
    public DateTime TripStartDate { get; set; }
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
    public decimal Profit { get; set; }
}

public class ReportFilter
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int? TourId { get; set; }
    public int? CustomerId { get; set; }
}

public class AppSettingsDto
{
    public string? LogoUrl { get; set; }
    public string? BrandName { get; set; }
    public string? ThemeMode { get; set; }
}

public class AppSettingsUpdateRequest
{
    [MaxLength(500)] public string? LogoUrl { get; set; }
    [MaxLength(100)] public string? BrandName { get; set; }
    [MaxLength(20)] public string? ThemeMode { get; set; }
}

public class HomeDestinationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? Blurb { get; set; }
    public int SortOrder { get; set; }
    public int? TourId { get; set; }
    public string? Keyword { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int TourCount { get; set; }
    public bool IsActive { get; set; }
}

public class HomeDestinationRequest
{
    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [Required, MaxLength(60)] public string Country { get; set; } = string.Empty;
    [Required, MaxLength(500)] public string ImageUrl { get; set; } = string.Empty;
    [MaxLength(200)] public string? Blurb { get; set; }
    public int SortOrder { get; set; }
    public int? TourId { get; set; }
    [MaxLength(60)] public string? Keyword { get; set; }
    public bool IsActive { get; set; } = true;
}
