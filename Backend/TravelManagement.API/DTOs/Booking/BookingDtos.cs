using System.ComponentModel.DataAnnotations;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.DTOs.Booking;

public class BookingDto
{
    public int Id { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public int TourPackageId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public string PackageName { get; set; } = string.Empty;
    public DateTime TripStartDate { get; set; }
    public DateTime TripEndDate { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }
    public decimal SubTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal AmountDue => TotalAmount - AmountPaid;
    public BookingStatus Status { get; set; }
    public string? SpecialRequests { get; set; }
    public string? CustomItinerary { get; set; }
    public DateTime BookedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public class BookingCreateRequest
{
    [Required] public int TourPackageId { get; set; }
    public int? TourScheduleId { get; set; }
    [Required] public DateTime TripStartDate { get; set; }
    [Required] public DateTime TripEndDate { get; set; }
    [Range(1, 100)] public int Adults { get; set; } = 1;
    [Range(0, 100)] public int Children { get; set; }
    public string? SpecialRequests { get; set; }
    public string? CustomItinerary { get; set; }
    public decimal Discount { get; set; }
}

public class BookingUpdateStatusRequest
{
    [Required, EnumDataType(typeof(BookingStatus))]
    public BookingStatus Status { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }
}

public class BookingCancelRequest
{
    [Required, MinLength(5), MaxLength(500)]
    public string Note { get; set; } = string.Empty;
}
