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
        // If a test-recipient override is configured, redirect the email to that address
        // but tag the subject with the original intended recipient for traceability.
        var actualToEmail = toEmail;
        var actualToName = toName;
        var actualSubject = subject;
        if (!string.IsNullOrWhiteSpace(_settings.TestRecipientOverride))
        {
            actualToEmail = _settings.TestRecipientOverride!;
            actualToName = "Test Inbox";
            actualSubject = $"[TEST → {toEmail}] {subject}";
        }

        if (!_settings.Enabled || string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            _logger.LogInformation("[Email DISABLED] To: {Email} | Subject: {Subject}\n{Body}", actualToEmail, actualSubject, htmlBody);
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
            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort,
                _settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None, ct);

            if (!string.IsNullOrWhiteSpace(_settings.Username))
                await client.AuthenticateAsync(_settings.Username, _settings.Password, ct);

            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", actualToEmail);
        }
    }

    public Task SendToAdminAsync(string subject, string htmlBody, CancellationToken ct = default)
    {
        var to = !string.IsNullOrWhiteSpace(_settings.AdminNotificationEmail)
            ? _settings.AdminNotificationEmail!
            : _settings.SenderEmail;
        return SendAsync(to, "Travel Admin", subject, htmlBody, ct);
    }
}
