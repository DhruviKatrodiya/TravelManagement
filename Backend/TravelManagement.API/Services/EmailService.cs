using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default)
    {
        var actualToEmail = toEmail;
        var actualToName = toName;
        var actualSubject = subject;
        if (!string.IsNullOrWhiteSpace(_settings.TestRecipientOverride))
        {
            actualToEmail = _settings.TestRecipientOverride!;
            actualToName = "Test Inbox";
            actualSubject = $"[TEST → {toEmail}] {subject}";
        }

        if (!_settings.Enabled)
        {
            _logger.LogInformation("[Email DISABLED] Would send to: {Email} | Subject: {Subject}", actualToEmail, actualSubject);
            return;
        }

        if (string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            _logger.LogWarning("[Email] SmtpHost is not configured. Email not sent to {Email}.", actualToEmail);
            return;
        }

        if (string.IsNullOrWhiteSpace(_settings.SenderEmail))
        {
            _logger.LogWarning("[Email] SenderEmail is not configured. Email not sent.");
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
        message.To.Add(new MailboxAddress(actualToName, actualToEmail));
        message.Subject = actualSubject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        try
        {
            using var client = new SmtpClient();

            var secureOption = _settings.SmtpPort == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, secureOption, ct);

            if (!string.IsNullOrWhiteSpace(_settings.Username))
                await client.AuthenticateAsync(_settings.Username, _settings.Password, ct);

            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("[Email] Sent to {Email} | Subject: {Subject}", actualToEmail, actualSubject);
        }
        catch (MailKit.Security.AuthenticationException ex)
        {
            _logger.LogError(ex,
                "[Email] Authentication failed for {Host}:{Port} with username '{User}'. " +
                "If using Gmail: regular account passwords are blocked since May 2022. " +
                "Go to myaccount.google.com → Security → 2-Step Verification (enable it) → App Passwords → create one for Mail → paste the 16-char code into appsettings.json Password field.",
                _settings.SmtpHost, _settings.SmtpPort, _settings.Username);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Email] Failed to send email to {Email} via {Host}:{Port}",
                actualToEmail, _settings.SmtpHost, _settings.SmtpPort);
        }
    }

    public Task SendToAdminAsync(string subject, string htmlBody, CancellationToken ct = default)
    {
        var to = !string.IsNullOrWhiteSpace(_settings.AdminNotificationEmail)
            ? _settings.AdminNotificationEmail!
            : _settings.SenderEmail;
        return SendAsync(to, "Travel Admin", subject, htmlBody, ct);
    }

    public async Task<(bool success, string message)> SendTestAsync(string toEmail, CancellationToken ct = default)
    {
        if (!_settings.Enabled)
            return (false, "Email is disabled (Enabled=false in appsettings.json).");

        if (string.IsNullOrWhiteSpace(_settings.SmtpHost))
            return (false, "SmtpHost is not configured.");

        if (string.IsNullOrWhiteSpace(_settings.SenderEmail))
            return (false, "SenderEmail is not configured.");

        var html = $@"
            <h2>Test email from Travel Management</h2>
            <p>This is a test email to verify your SMTP configuration is working correctly.</p>
            <table>
              <tr><td><b>SMTP Host:</b></td><td>{_settings.SmtpHost}:{_settings.SmtpPort}</td></tr>
              <tr><td><b>Sender:</b></td><td>{_settings.SenderEmail}</td></tr>
              <tr><td><b>Sent at:</b></td><td>{DateTime.UtcNow:R}</td></tr>
            </table>
            <p>If you received this, email is configured correctly.</p>";

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
            message.To.Add(new MailboxAddress("Test Recipient", toEmail));
            message.Subject = "[Travel Management] Email configuration test";
            message.Body = new BodyBuilder { HtmlBody = html }.ToMessageBody();

            using var client = new SmtpClient();
            var secureOption = _settings.SmtpPort == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, secureOption, ct);

            if (!string.IsNullOrWhiteSpace(_settings.Username))
                await client.AuthenticateAsync(_settings.Username, _settings.Password, ct);

            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("[Email] Test email sent successfully to {Email}", toEmail);
            return (true, $"Test email sent successfully to {toEmail}.");
        }
        catch (MailKit.Security.AuthenticationException ex)
        {
            var hint = _settings.SmtpHost.Contains("gmail", StringComparison.OrdinalIgnoreCase)
                ? " Gmail fix: enable 2-Step Verification at myaccount.google.com/security, then create an App Password (Security → App Passwords) and paste the 16-char code into appsettings.json Password field."
                : string.Empty;
            _logger.LogError(ex, "[Email] Authentication failed.{Hint}", hint);
            return (false, $"Authentication failed: {ex.Message}.{hint}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Email] Test email failed");
            return (false, $"Failed: {ex.Message}");
        }
    }
}
