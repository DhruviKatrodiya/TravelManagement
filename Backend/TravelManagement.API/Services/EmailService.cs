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
        if (!_settings.Enabled || string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            _logger.LogInformation("[Email DISABLED] To: {Email} | Subject: {Subject}\n{Body}", toEmail, subject, htmlBody);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
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
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
