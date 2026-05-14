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

    public CustomerService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
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
        return true;
    }
}
