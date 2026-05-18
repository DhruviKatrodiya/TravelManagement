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
    private readonly IConfiguration _config;

    public AuthService(TravelDbContext db, ITokenService tokens, IMapper mapper, IEmailService email, IStaffService staff, IConfiguration config)
    {
        _db = db;
        _tokens = tokens;
        _mapper = mapper;
        _email = email;
        _staff = staff;
        _config = config;
    }

    private async Task<UserDto> MapWithPermissionsAsync(User user)
    {
        var dto = _mapper.Map<UserDto>(user);
        if (user.Role == UserRole.Staff)
            dto.Permissions = await _staff.GetPermissionsByUserIdAsync(user.Id);
        return dto;
    }

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
            Country = request.Country
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _tokens.GenerateToken(user);
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
        await _db.SaveChangesAsync();

        var perms = user.Role == UserRole.Staff ? await _staff.GetPermissionsByUserIdAsync(user.Id) : null;
        var (token, expiresAt) = _tokens.GenerateToken(user, perms);

        if (user.Role == UserRole.Customer)
        {
            _ = _email.SendAsync(user.Email, user.FullName,
                "Successful sign-in to Travel Management",
                $@"<h2>You just signed in</h2>
                   <p>Hi {user.FullName},</p>
                   <p>Your Travel Management account was used to sign in on <b>{user.LastLoginAt:dd MMM yyyy HH:mm} UTC</b>.</p>
                   <p>If this wasn't you, please change your password immediately.</p>");
        }

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

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();

        _ = _email.SendAsync(user.Email, user.FullName,
            "Your password was changed",
            $@"<h2>Password changed</h2>
               <p>Hi {user.FullName},</p>
               <p>The password for your Travel Management account was changed on <b>{DateTime.UtcNow:dd MMM yyyy HH:mm} UTC</b>.</p>
               <p>If you did not make this change, please contact support immediately.</p>");
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !user.IsActive)
            return; // Never reveal whether the email exists

        // Generate a readable 10-char temporary password (no ambiguous chars)
        const string chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
        var buf = new byte[10];
        RandomNumberGenerator.Fill(buf);
        var tempPassword = new string(buf.Select(b => chars[b % chars.Length]).ToArray());

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
        await _db.SaveChangesAsync();

        _ = _email.SendAsync(user.Email, user.FullName,
            "Your TravelHub temporary password",
            $@"<h2>Password reset</h2>
               <p>Hi {user.FullName},</p>
               <p>We received a request to reset your TravelHub password. Here is your temporary password:</p>
               <p style=""margin:20px 0;text-align:center;"">
                 <span style=""font-size:1.5rem;font-weight:bold;letter-spacing:4px;
                               background:#f5f5f0;padding:12px 24px;border-radius:6px;
                               border:1px solid #ddd;display:inline-block;"">
                   {tempPassword}
                 </span>
               </p>
               <p style=""background:#fffbe6;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                 <strong>Important:</strong> This is a temporary password. Once you change your password,
                 this temporary password will no longer work. Please log in using the temporary password
                 above and update your password from your <strong>Profile → Change Password</strong> settings.
               </p>
               <p style=""color:#888;font-size:0.9em;"">If you did not request this, please contact support immediately.</p>");
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

        return await MapWithPermissionsAsync(user);
    }
}
