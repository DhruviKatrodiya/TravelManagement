using System.Security.Cryptography;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Auth;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class AuthService : IAuthService
{
    private readonly TravelDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IMapper _mapper;
    private readonly IEmailService _email;
    private readonly IStaffService _staff;
    private readonly ILogger<AuthService> _logger;

    public AuthService(TravelDbContext db, ITokenService tokens, IMapper mapper, IEmailService email, IStaffService staff, ILogger<AuthService> logger)
    {
        _db = db;
        _tokens = tokens;
        _mapper = mapper;
        _email = email;
        _staff = staff;
        _logger = logger;
    }

    // Fire-and-forget helper — logs failures without crashing the request.
    private void FireEmail(string toEmail, string toName, string subject, string htmlBody)
    {
        _ = _email.SendAsync(toEmail, toName, subject, htmlBody)
            .ContinueWith(
                t => _logger.LogError(t.Exception?.InnerException ?? t.Exception,
                    "[Email] Background send to {Email} | Subject: {Subject} failed", toEmail, subject),
                TaskContinuationOptions.OnlyOnFaulted);
    }

    private async Task<UserDto> MapWithPermissionsAsync(User user)
    {
        var dto = _mapper.Map<UserDto>(user);
        if (user.Role is UserRole.Staff or UserRole.Admin or UserRole.SuperAdmin)
            dto.Permissions = await _staff.GetPermissionsByUserIdAsync(user.Id);
        return dto;
    }

    public async Task<bool> EmailExistsAsync(string email)
        => await _db.Users.AnyAsync(u => u.Email == email);

    public async Task<bool> PhoneExistsAsync(string phone)
        => await _db.Users.AnyAsync(u => u.Phone == phone);

    public async Task<AuthResponse> RegisterCustomerAsync(RegisterRequest request)
    {
        var emailExists = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (emailExists)
            throw new InvalidOperationException("An account with this email already exists.");

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Customer,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var customer = new Customer
        {
            User = user,
            Address = request.Address,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            Country = request.Country
        };

        _db.Customers.Add(customer);
        var sessionToken = AssignUserSession(user);
        await _db.SaveChangesAsync();

        FireEmail(user.Email, user.FullName,
            "Welcome to Travel Management!",
            $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                 <h2 style=""color:#2d6a4f;"">Welcome, {user.FullName}!</h2>
                 <p>Your Travel Management account has been created successfully.</p>
                 <table style=""width:100%;background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;border-collapse:collapse;"">
                   <tr><td style=""padding:6px 0;color:#555;"">Email</td><td style=""padding:6px 0;font-weight:bold;"">{user.Email}</td></tr>
                 </table>
                 <p>You can now log in and start exploring our travel packages.</p>
                 <p style=""color:#888;font-size:0.9em;"">If you did not create this account, please contact support immediately.</p>
               </div>");

        var (token, expiresAt) = _tokens.GenerateToken(user, sessionToken);
        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Your account has been deactivated. Please contact support to regain access.");

        user.LastLoginAt = DateTime.UtcNow;
        var sessionToken = AssignUserSession(user);
        await _db.SaveChangesAsync();

        var perms = user.Role is UserRole.Staff or UserRole.Admin or UserRole.SuperAdmin ? await _staff.GetPermissionsByUserIdAsync(user.Id) : null;
        var (token, expiresAt) = _tokens.GenerateToken(user, sessionToken, perms);

        FireEmail(user.Email, user.FullName,
            "Successful sign-in to Travel Management",
            $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                 <h2>You just signed in</h2>
                 <p>Hi {user.FullName},</p>
                 <p>Your Travel Management account was used to sign in on <b>{user.LastLoginAt:dd MMM yyyy HH:mm} UTC</b>.</p>
                 <p style=""background:#fff3cd;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                   If this wasn't you, please change your password immediately.
                 </p>
               </div>");

        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = await MapWithPermissionsAsync(user)
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");
        return await MapWithPermissionsAsync(user);
    }

    public async Task SendChangePasswordOtpAsync(int userId, SendChangePasswordOtpRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");

        var existing = _db.OtpRecords.Where(o => o.Email == user.Email);
        _db.OtpRecords.RemoveRange(existing);

        var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        _db.OtpRecords.Add(new OtpRecord
        {
            Email     = user.Email,
            OtpHash   = BCrypt.Net.BCrypt.HashPassword(otp),
            ExpiresAt = DateTime.UtcNow.AddSeconds(85)
        });
        await _db.SaveChangesAsync();

        try
        {
            await _email.SendAsync(user.Email, user.FullName,
                "Your password change OTP",
                $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                     <h2>Password Change Verification</h2>
                     <p>Hi {user.FullName},</p>
                     <p>Use the OTP below to confirm your password change. It expires in <strong>1 minute 25 seconds</strong>.</p>
                     <p style=""margin:24px 0;text-align:center;"">
                       <span style=""font-size:2rem;font-weight:bold;letter-spacing:8px;
                                     background:#f5f5f0;padding:14px 28px;border-radius:6px;
                                     border:1px solid #ddd;display:inline-block;"">
                         {otp}
                       </span>
                     </p>
                     <p style=""background:#fffbe6;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                       If you did not request this, your account may be compromised. Change your password immediately.
                     </p>
                   </div>");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Email] Failed to send OTP to {Email} — removing OTP record", user.Email);
            var record = await _db.OtpRecords.FirstOrDefaultAsync(o => o.Email == user.Email);
            if (record != null) _db.OtpRecords.Remove(record);
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("Failed to send the OTP email. Please check your email address and try again.");
        }
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");

        var record = await _db.OtpRecords.FirstOrDefaultAsync(o => o.Email == user.Email);
        if (record == null || record.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("OTP has expired. Please request a new one.");

        if (!BCrypt.Net.BCrypt.Verify(request.Otp, record.OtpHash))
            throw new InvalidOperationException("Invalid OTP. Please check the code sent to your email.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        _db.OtpRecords.Remove(record);
        await _db.SaveChangesAsync();

        var changedAt = DateTime.UtcNow;
        FireEmail(user.Email, user.FullName,
            "Your Travel Management password was changed",
            $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                 <h2 style=""color:#2d6a4f;"">Password Changed Successfully</h2>
                 <p>Hi <strong>{user.FullName}</strong>,</p>
                 <p>Your Travel Management account password was changed successfully.</p>
                 <table style=""width:100%;background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;border-collapse:collapse;"">
                   <tr><td style=""padding:6px 0;color:#555;"">Account</td><td style=""padding:6px 0;font-weight:bold;"">{user.Email}</td></tr>
                   <tr><td style=""padding:6px 0;color:#555;"">Changed on</td><td style=""padding:6px 0;font-weight:bold;"">{changedAt:dd MMM yyyy} at {changedAt:HH:mm} UTC</td></tr>
                   <tr><td style=""padding:6px 0;color:#555;"">Verified via</td><td style=""padding:6px 0;font-weight:bold;"">Email OTP</td></tr>
                 </table>
                 <div style=""background:#d4edda;border-left:4px solid #28a745;padding:12px 16px;border-radius:4px;margin-bottom:16px;"">
                   <strong>Action confirmed:</strong> Your password has been updated.
                 </div>
                 <div style=""background:#fff3cd;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                   <strong>Didn't make this change?</strong> Please contact support immediately.
                 </div>
                 <p style=""color:#aaa;font-size:0.85em;margin-top:24px;"">This is an automated security notification. Please do not reply.</p>
               </div>");
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !user.IsActive)
            throw new InvalidOperationException("No account found with this email address.");

        var existing = _db.OtpRecords.Where(o => o.Email == user.Email);
        _db.OtpRecords.RemoveRange(existing);

        var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        _db.OtpRecords.Add(new OtpRecord
        {
            Email     = user.Email,
            OtpHash   = BCrypt.Net.BCrypt.HashPassword(otp),
            ExpiresAt = DateTime.UtcNow.AddSeconds(85)
        });
        await _db.SaveChangesAsync();

        // Best-effort: can't surface SMTP errors here without revealing whether the email exists.
        FireEmail(user.Email, user.FullName,
            "Your Travel Management password reset OTP",
            $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                 <h2>Password Reset Verification</h2>
                 <p>Hi {user.FullName},</p>
                 <p>We received a request to reset your Travel Management password. Use the OTP below to verify it's you.</p>
                 <p style=""margin:24px 0;text-align:center;"">
                   <span style=""font-size:2rem;font-weight:bold;letter-spacing:8px;
                                 background:#f5f5f0;padding:14px 28px;border-radius:6px;
                                 border:1px solid #ddd;display:inline-block;"">
                     {otp}
                   </span>
                 </p>
                 <p style=""text-align:center;color:#888;font-size:0.9em;"">This OTP expires in <strong>1 minute 25 seconds</strong>.</p>
                 <p style=""background:#fffbe6;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                   If you did not request a password reset, please ignore this email.
                 </p>
               </div>");
    }

    public async Task VerifyForgotPasswordOtpAsync(VerifyForgotPasswordOtpRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !user.IsActive)
            throw new InvalidOperationException("Invalid request.");

        var record = await _db.OtpRecords.FirstOrDefaultAsync(o => o.Email == request.Email);
        if (record == null || record.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("OTP has expired. Please request a new one.");

        if (!BCrypt.Net.BCrypt.Verify(request.Otp, record.OtpHash))
            throw new InvalidOperationException("Invalid OTP. Please check the code sent to your email.");

        const string chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
        var buf = new byte[10];
        RandomNumberGenerator.Fill(buf);
        var tempPassword = new string(buf.Select(b => chars[b % chars.Length]).ToArray());

        // Save old hash so we can rollback if the email fails.
        var oldHash = user.PasswordHash;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
        _db.OtpRecords.Remove(record);
        await _db.SaveChangesAsync();

        try
        {
            await _email.SendAsync(user.Email, user.FullName,
                "Your Travel Management temporary password",
                $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                     <h2>Password Reset Successful</h2>
                     <p>Hi {user.FullName},</p>
                     <p>Your identity has been verified. Here is your temporary password:</p>
                     <p style=""margin:20px 0;text-align:center;"">
                       <span style=""font-size:1.5rem;font-weight:bold;letter-spacing:4px;
                                     background:#f5f5f0;padding:12px 24px;border-radius:6px;
                                     border:1px solid #ddd;display:inline-block;"">
                         {tempPassword}
                       </span>
                     </p>
                     <p style=""background:#fffbe6;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                       <strong>Important:</strong> Log in with this temporary password, then go to
                       <strong>Profile → Change Password</strong> to set a permanent one.
                     </p>
                     <p style=""color:#888;font-size:0.9em;"">If you did not request this, please contact support immediately.</p>
                   </div>");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Email] Failed to send temp password to {Email} — rolling back password change", user.Email);
            user.PasswordHash = oldHash;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("Failed to send the temporary password email. Please try again.");
        }
    }

    public async Task LogoutAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user != null)
        {
            user.SessionToken = null;
            await _db.SaveChangesAsync();
        }
    }

    private static string AssignUserSession(User user)
    {
        var newToken = Guid.NewGuid().ToString("N");
        user.SessionToken = newToken;
        return newToken;
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await _db.Users.AnyAsync(u => u.Id != userId && u.Email == request.Email))
                throw new InvalidOperationException("A user with this email already exists.");
            user.Email = request.Email;
        }

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        await _db.SaveChangesAsync();

        FireEmail(user.Email, user.FullName,
            "Your profile was updated",
            $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                 <h2>Profile Updated</h2>
                 <p>Hi {user.FullName},</p>
                 <p>Your Travel Management profile was updated successfully on <b>{DateTime.UtcNow:dd MMM yyyy HH:mm} UTC</b>.</p>
                 <p style=""background:#fff3cd;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                   If you did not make this change, please contact support immediately.
                 </p>
               </div>");

        return await MapWithPermissionsAsync(user);
    }
}
