using System.ComponentModel.DataAnnotations;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.DTOs.Payment;

public class PaymentDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string TransactionReference { get; set; } = string.Empty;
    public string? GatewayTransactionId { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
    public DateTime InitiatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class PaymentInitiateRequest
{
    [Required] public int BookingId { get; set; }
    [Required] public PaymentMethod Method { get; set; }
    [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
    public string? Notes { get; set; }
}

public class PaymentInitiateResponse
{
    public int PaymentId { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public decimal Amount { get; set; }
    public string? RedirectUrl { get; set; }
    public string? GatewayOrderId { get; set; }
    public Dictionary<string, string>? GatewayParams { get; set; }
}

public class PaymentCallbackRequest
{
    [Required] public string TransactionReference { get; set; } = string.Empty;
    public string? GatewayTransactionId { get; set; }
    public bool Success { get; set; }
    public string? ResponseMessage { get; set; }
}
