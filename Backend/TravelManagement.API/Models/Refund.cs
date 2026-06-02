using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.Models;

public class Refund
{
    public int Id { get; set; }

    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal RequestedAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? ApprovedAmount { get; set; }

    public RefundStatus Status { get; set; } = RefundStatus.Requested;

    [MaxLength(500)]
    public string? AdminNotes { get; set; }

    [MaxLength(50)]
    public string? RefundMethod { get; set; }

    [MaxLength(200)]
    public string? TransactionReference { get; set; }

    [MaxLength(500)]
    public string? PaymentNotes { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
}
