using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.Models;

public class Payment
{
    public int Id { get; set; }

    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    [Required, MaxLength(60)]
    public string TransactionReference { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? GatewayTransactionId { get; set; }

    public PaymentMethod Method { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [MaxLength(500)]
    public string? GatewayResponse { get; set; }

    [MaxLength(200)]
    public string? Notes { get; set; }

    public DateTime InitiatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
