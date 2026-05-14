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

    public AuthService(TravelDbContext db, ITokenService tokens, IMapper mapper)
    {
        _db = db;
        _tokens = tokens;
        _mapper = mapper;
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
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _tokens.GenerateToken(user);
        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");
        return _mapper.Map<UserDto>(user);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        await _db.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }
}
