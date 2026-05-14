using Microsoft.Extensions.Options;
using TravelManagement.API.DTOs.Payment;
using TravelManagement.API.Helpers;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services.PaymentGateways;

public class GooglePayGateway : IPaymentGateway
{
    private readonly PaymentSettings _settings;
    private readonly ILogger<GooglePayGateway> _logger;

    public GooglePayGateway(IOptions<PaymentSettings> settings, ILogger<GooglePayGateway> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public PaymentMethod Method => PaymentMethod.GooglePay;

    public Task<PaymentInitiateResponse> InitiateAsync(Payment payment, Models.Booking booking)
    {
        var cfg = _settings.GooglePay;
        var orderId = $"GPAY-{payment.Id}-{Guid.NewGuid().ToString()[..8]}";
        var callback = $"{_settings.PublicCallbackBaseUrl.TrimEnd('/')}{cfg.CallbackUrl}";

        _logger.LogInformation("[GPay STUB] Initiate order {OrderId} for {Amount}", orderId, payment.Amount);

        var resp = new PaymentInitiateResponse
        {
            PaymentId = payment.Id,
            TransactionReference = payment.TransactionReference,
            Method = Method,
            Status = PaymentStatus.Initiated,
            Amount = payment.Amount,
            GatewayOrderId = orderId,
            RedirectUrl = callback,
            GatewayParams = new Dictionary<string, string>
            {
                ["merchantId"] = cfg.MerchantId,
                ["merchantName"] = cfg.MerchantName,
                ["environment"] = cfg.Environment,
                ["orderId"] = orderId,
                ["totalPrice"] = payment.Amount.ToString("F2"),
                ["currencyCode"] = "INR",
                ["callbackUrl"] = callback
            }
        };

        return Task.FromResult(resp);
    }

    public Task<bool> VerifyAsync(PaymentCallbackRequest req)
    {
        _logger.LogInformation("[GPay STUB] Verify {Ref} -> {Success}", req.TransactionReference, req.Success);
        return Task.FromResult(req.Success);
    }
}
