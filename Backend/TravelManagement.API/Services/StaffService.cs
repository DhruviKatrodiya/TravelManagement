using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class StaffService : IStaffService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public StaffService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<StaffDto>> ListAsync()
    {
        var items = await _db.StaffMembers.Include(s => s.User).OrderBy(s => s.User.FullName).ToListAsync();
        return _mapper.Map<List<StaffDto>>(items);
    }

    public async Task<StaffDto> CreateAsync(StaffCreateRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            throw new InvalidOperationException("A user with this email already exists.");

        var staff = new Staff
        {
            Designation = req.Designation,
            Department = req.Department,
            Salary = req.Salary,
            JoinedAt = DateTime.UtcNow,
            User = new User
            {
                FullName = req.FullName,
                Email = req.Email,
                Phone = req.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role = UserRole.Staff,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        _db.StaffMembers.Add(staff);
        await _db.SaveChangesAsync();

        var fresh = await _db.StaffMembers.Include(s => s.User).FirstAsync(s => s.Id == staff.Id);
        return _mapper.Map<StaffDto>(fresh);
    }

    public async Task<StaffDto?> UpdateAsync(int id, StaffUpdateRequest req)
    {
        var s = await _db.StaffMembers.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return null;

        s.User.FullName = req.FullName;
        s.User.Phone = req.Phone;
        s.User.IsActive = req.IsActive;
        s.Designation = req.Designation;
        s.Department = req.Department;
        s.Salary = req.Salary;

        await _db.SaveChangesAsync();
        return _mapper.Map<StaffDto>(s);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var s = await _db.StaffMembers.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return false;
        _db.Users.Remove(s.User);
        _db.StaffMembers.Remove(s);
        await _db.SaveChangesAsync();
        return true;
    }
}
