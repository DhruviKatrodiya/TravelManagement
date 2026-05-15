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

    public CustomerService(TravelDbContext db, IMapper mapper, IEmailService email)
    {
        _db = db;
        _mapper = mapper;
        _email = email;
    }

    public async Task<IEnumerable<CustomerDto>> ListAsync()
    {
        var items = await _db.Customers
            .Include(c => c.User)
            .Include(c => c.Bookings)
            .OrderByDescending(c => c.User.CreatedAt)
            .ToListAsync();
        return _mapper.Map<List<CustomerDto>>(items);
    }

    public async Task<CustomerDto?> GetAsync(int id)
    {
        var c = await _db.Customers
            .Include(c => c.User)
            .Include(c => c.Bookings)
            .FirstOrDefaultAsync(x => x.Id == id);
        return c == null ? null : _mapper.Map<CustomerDto>(c);
    }

    public async Task<CustomerDto?> GetByUserIdAsync(int userId)
    {
        var c = await _db.Customers
            .Include(c => c.User)
            .Include(c => c.Bookings)
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

        await _db.SaveChangesAsync();

        _ = _email.SendAsync(c.User.Email, c.User.FullName,
            "Your profile was updated",
            $@"<h2>Profile updated</h2>
               <p>Hi {c.User.FullName},</p>
               <p>An administrator updated your account details. If you did not request this, please contact support.</p>
               <p>Email on file: {c.User.Email}</p>");

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

        _ = _email.SendAsync(customer.User.Email, customer.User.FullName,
            "Welcome to Travel Management",
            $@"<h2>Welcome, {customer.User.FullName}!</h2>
               <p>An account has been created for you on Travel Management.</p>
               <p><b>Email:</b> {customer.User.Email}</p>
               <p><b>Temporary password:</b> {req.Password}</p>
               <p>Please sign in and change your password as soon as possible.</p>");

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
            ? $@"<h2>Account reactivated</h2><p>Hi {c.User.FullName},</p><p>Your Travel Management account is active again. You can sign in normally.</p>"
            : $@"<h2>Account deactivated</h2><p>Hi {c.User.FullName},</p><p>Your Travel Management account has been deactivated. You will not be able to sign in. Please contact support if you believe this is a mistake.</p>";
        _ = _email.SendAsync(c.User.Email, c.User.FullName, subject, body);
        return true;
    }
}
