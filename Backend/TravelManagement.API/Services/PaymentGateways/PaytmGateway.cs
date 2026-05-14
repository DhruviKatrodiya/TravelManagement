using Microsoft.Extensions.Options;
using TravelManagement.API.DTOs.Payment;
using TravelManagement.API.Helpers;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services.PaymentGateways;

public class PaytmGateway : IPaymentGateway
{
    private readonly PaymentSettings _settings;
    private readonly ILogger<PaytmGateway> _logger;

    public PaytmGateway(IOptions<PaymentSettings> settings, ILogger<PaytmGateway> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public PaymentMethod Method => PaymentMethod.Paytm;

    public Task<PaymentInitiateResponse> InitiateAsync(Payment payment, Models.Booking booking)
    {
        var cfg = _settings.Paytm;
        var orderId = $"PAYTM-{payment.Id}-{Guid.NewGuid().ToString()[..8]}";
        var callback = $"{_settings.PublicCallbackBaseUrl.TrimEnd('/')}{cfg.CallbackUrl}";

        _logger.LogInformation("[Paytm STUB] Initiate order {OrderId} for {Amount}", orderId, payment.Amount);

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
                ["MID"] = cfg.MerchantId,
                ["ORDER_ID"] = orderId,
                ["CUST_ID"] = booking.CustomerId.ToString(),
                ["TXN_AMOUNT"] = payment.Amount.ToString("F2"),
                ["WEBSITE"] = cfg.Website,
                ["INDUSTRY_TYPE_ID"] = "Retail",
                ["CHANNEL_ID"] = "WEB",
                ["CALLBACK_URL"] = callback
            }
        };

        return Task.FromResult(resp);
    }

    public Task<bool> VerifyAsync(PaymentCallbackRequest req)
    {
        _logger.LogInformation("[Paytm STUB] Verify {Ref} -> {Success}", req.TransactionReference, req.Success);
        return Task.FromResult(req.Success);
    }
}
