using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class CustomerService : ICustomerService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;
    private readonly IEmailService _email;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(TravelDbContext db, IMapper mapper, IEmailService email, ILogger<CustomerService> logger)
    {
        _db = db;
        _mapper = mapper;
        _email = email;
        _logger = logger;
    }

    private void FireEmail(string toEmail, string toName, string subject, string htmlBody)
    {
        _ = _email.SendAsync(toEmail, toName, subject, htmlBody)
            .ContinueWith(
                t => _logger.LogError(t.Exception?.InnerException ?? t.Exception,
                    "[Email] Background send to {Email} | Subject: {Subject} failed", toEmail, subject),
                TaskContinuationOptions.OnlyOnFaulted);
    }

    public async Task<IEnumerable<CustomerDto>> ListAsync()
    {
        var items = await _db.Customers
            .Include(c => c.User)
            .Include(c => c.Bookings)
            .Include(c => c.AppRole)
            .OrderByDescending(c => c.User.CreatedAt)
            .ToListAsync();
        return _mapper.Map<List<CustomerDto>>(items);
    }

    public async Task<CustomerDto?> GetAsync(int id)
    {
        var c = await _db.Customers
            .Include(c => c.User)
            .Include(c => c.Bookings)
            .Include(c => c.AppRole)
            .FirstOrDefaultAsync(x => x.Id == id);
        return c == null ? null : _mapper.Map<CustomerDto>(c);
    }

    public async Task<CustomerDto?> GetByUserIdAsync(int userId)
    {
        var c = await _db.Customers
            .Include(c => c.User)
            .Include(c => c.Bookings)
            .Include(c => c.AppRole)
            .FirstOrDefaultAsync(x => x.UserId == userId);
        return c == null ? null : _mapper.Map<CustomerDto>(c);
    }

    public async Task<CustomerDto?> UpdateAsync(int customerId, CustomerUpdateRequest req)
    {
        var c = await _db.Customers.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == customerId);
        if (c == null) return null;

        if (!string.Equals(c.User.Email, req.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await _db.Users.AnyAsync(u => u.Id != c.User.Id && u.Email == req.Email))
                throw new InvalidOperationException("A user with this email already exists.");
            c.User.Email = req.Email;
        }

        c.User.FullName = req.FullName;
        c.User.Phone = req.Phone;
        c.Address = req.Address;
        c.City = req.City;
        c.State = req.State;
        c.PostalCode = req.PostalCode;
        c.Country = req.Country;
        c.DateOfBirth = req.DateOfBirth;
        c.Gender = req.Gender;
        c.IdProofType = req.IdProofType;
        c.IdProofNumber = req.IdProofNumber;
        c.AppRoleId = req.AppRoleId;

        await _db.SaveChangesAsync();

        FireEmail(c.User.Email, c.User.FullName,
            "Your profile was updated",
            $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                 <h2>Profile Updated</h2>
                 <p>Hi {c.User.FullName},</p>
                 <p>Your Travel Management account details were updated on <b>{DateTime.UtcNow:dd MMM yyyy HH:mm} UTC</b>.</p>
                 <p style=""background:#fff3cd;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                   If you did not request this change, please contact support immediately.
                 </p>
               </div>");

        return await GetAsync(customerId);
    }

    public async Task<CustomerDto> CreateAsync(CustomerCreateRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            throw new InvalidOperationException("A user with this email already exists.");

        var customer = new Models.Customer
        {
            Address = req.Address,
            City = req.City,
            State = req.State,
            PostalCode = req.PostalCode,
            Country = req.Country,
            DateOfBirth = req.DateOfBirth,
            Gender = req.Gender,
            AppRoleId = req.AppRoleId,
            User = new Models.User
            {
                FullName = req.FullName,
                Email = req.Email,
                Phone = req.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role = Models.Enums.UserRole.Customer,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        FireEmail(customer.User.Email, customer.User.FullName,
            "Welcome to Travel Management",
            $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                 <h2 style=""color:#2d6a4f;"">Welcome, {customer.User.FullName}!</h2>
                 <p>An account has been created for you on Travel Management.</p>
                 <table style=""width:100%;background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;border-collapse:collapse;"">
                   <tr><td style=""padding:6px 0;color:#555;"">Email</td><td style=""padding:6px 0;font-weight:bold;"">{customer.User.Email}</td></tr>
                   <tr><td style=""padding:6px 0;color:#555;"">Temporary password</td><td style=""padding:6px 0;font-weight:bold;"">{req.Password}</td></tr>
                 </table>
                 <p style=""background:#fffbe6;border-left:4px solid #f0a500;padding:12px 16px;border-radius:4px;"">
                   Please sign in and change your password as soon as possible.
                 </p>
               </div>");

        return (await GetAsync(customer.Id))!;
    }

    public async Task<bool> DeleteAsync(int customerId)
    {
        return await SetActiveAsync(customerId, false);
    }

    public async Task<bool> SetActiveAsync(int customerId, bool active)
    {
        var c = await _db.Customers
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == customerId);
        if (c == null) return false;

        c.User.IsActive = active;
        await _db.SaveChangesAsync();

        var subject = active ? "Your account has been reactivated" : "Your account has been deactivated";
        var body = active
            ? $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                   <h2 style=""color:#2d6a4f;"">Account Reactivated</h2>
                   <p>Hi {c.User.FullName},</p>
                   <p>Your Travel Management account is active again. You can sign in normally.</p>
                 </div>"
            : $@"<div style=""font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"">
                   <h2 style=""color:#c0392b;"">Account Deactivated</h2>
                   <p>Hi {c.User.FullName},</p>
                   <p>Your Travel Management account has been deactivated. You will not be able to sign in.</p>
                   <p>Please contact support if you believe this is a mistake.</p>
                 </div>";

        FireEmail(c.User.Email, c.User.FullName, subject, body);
        return true;
    }
}
