using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.Models;

public class Booking
{
    public int Id { get; set; }

    [Required, MaxLength(40)]
    public string BookingReference { get; set; } = string.Empty;

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public int TourPackageId { get; set; }
    public TourPackage TourPackage { get; set; } = null!;

    public int? TourScheduleId { get; set; }
    public TourSchedule? TourSchedule { get; set; }

    public DateTime TripStartDate { get; set; }
    public DateTime TripEndDate { get; set; }

    public int Adults { get; set; }
    public int Children { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Discount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Tax { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AmountPaid { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    [MaxLength(1000)]
    public string? SpecialRequests { get; set; }

    [MaxLength(1000)]
    public string? CustomItinerary { get; set; }

    public DateTime BookedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<VehicleAllocation> VehicleAllocations { get; set; } = new List<VehicleAllocation>();
    public Refund? Refund { get; set; }
    public Review? Review { get; set; }
}
