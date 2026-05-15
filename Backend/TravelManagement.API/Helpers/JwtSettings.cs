namespace TravelManagement.API.Helpers;

public class JwtSettings
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 60 * 8;
}

public class EmailSettings
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string SenderName { get; set; } = "Travel Management";
    public string SenderEmail { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    /// <summary>
    /// If set, every outgoing email is redirected to this address (the original recipient
    /// is preserved in the subject prefix). Useful for testing without spamming real users.
    /// </summary>
    public string? TestRecipientOverride { get; set; }
    /// <summary>
    /// Optional fixed admin notification address (used for "send to admin" emails).
    /// Falls back to SenderEmail when not set.
    /// </summary>
    public string? AdminNotificationEmail { get; set; }
}

public class PaymentSettings
{
    public PaytmConfig Paytm { get; set; } = new();
    public GooglePayConfig GooglePay { get; set; } = new();
    public string PublicCallbackBaseUrl { get; set; } = "http://localhost:4200";
}

public class PaytmConfig
{
    public string MerchantId { get; set; } = "TEST_MERCHANT";
    public string MerchantKey { get; set; } = "TEST_KEY";
    public string Website { get; set; } = "WEBSTAGING";
    public string Environment { get; set; } = "Sandbox";
    public string CallbackUrl { get; set; } = "/payments/paytm/callback";
}

public class GooglePayConfig
{
    public string MerchantId { get; set; } = "TEST_GPAY";
    public string MerchantName { get; set; } = "Travel Management";
    public string Environment { get; set; } = "TEST";
    public string CallbackUrl { get; set; } = "/payments/gpay/callback";
}
