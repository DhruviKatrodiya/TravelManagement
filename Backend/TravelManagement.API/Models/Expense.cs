using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TravelManagement.API.Models;

public class Expense
{
    public int Id { get; set; }

    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }

    public int? TourPackageId { get; set; }
    public TourPackage? TourPackage { get; set; }

    [Required, MaxLength(120)]
    public string Category { get; set; } = string.Empty;

    [Required, MaxLength(250)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

    [MaxLength(120)]
    public string? Vendor { get; set; }

    [MaxLength(80)]
    public string? PaidBy { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
