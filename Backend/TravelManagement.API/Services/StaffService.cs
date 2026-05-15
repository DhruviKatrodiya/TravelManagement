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
    private readonly IEmailService _email;

    public StaffService(TravelDbContext db, IMapper mapper, IEmailService email)
    {
        _db = db;
        _mapper = mapper;
        _email = email;
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

        _ = _email.SendAsync(fresh.User.Email, fresh.User.FullName,
            "Welcome to the Travel Management team",
            $@"<h2>Welcome, {fresh.User.FullName}!</h2>
               <p>A staff account has been created for you.</p>
               <p><b>Email:</b> {fresh.User.Email}</p>
               <p><b>Temporary password:</b> {req.Password}</p>
               <p><b>Designation:</b> {fresh.Designation}</p>
               <p><b>Department:</b> {fresh.Department}</p>
               <p>Please sign in and change your password as soon as possible.</p>");

        return _mapper.Map<StaffDto>(fresh);
    }

    public async Task<StaffDto?> UpdateAsync(int id, StaffUpdateRequest req)
    {
        var s = await _db.StaffMembers.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return null;

        if (!string.Equals(s.User.Email, req.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await _db.Users.AnyAsync(u => u.Id != s.User.Id && u.Email == req.Email))
                throw new InvalidOperationException("A user with this email already exists.");
            s.User.Email = req.Email;
        }

        var wasActive = s.User.IsActive;

        s.User.FullName = req.FullName;
        s.User.Phone = req.Phone;
        s.User.IsActive = req.IsActive;
        s.Designation = req.Designation;
        s.Department = req.Department;
        s.Salary = req.Salary;

        await _db.SaveChangesAsync();

        if (!wasActive && req.IsActive)
        {
            _ = _email.SendAsync(s.User.Email, s.User.FullName,
                "Your staff account has been reactivated",
                $@"<h2>Welcome back!</h2><p>Hi {s.User.FullName}, your staff account is active again. You can sign in normally.</p>");
        }
        else if (wasActive && !req.IsActive)
        {
            _ = _email.SendAsync(s.User.Email, s.User.FullName,
                "Your staff account has been deactivated",
                $@"<h2>Account deactivated</h2><p>Hi {s.User.FullName}, your staff account has been deactivated. You will not be able to sign in until reactivated.</p>");
        }
        else
        {
            _ = _email.SendAsync(s.User.Email, s.User.FullName,
                "Your staff profile was updated",
                $@"<h2>Profile updated</h2>
                   <p>Hi {s.User.FullName}, an administrator updated your staff profile.</p>
                   <p><b>Designation:</b> {s.Designation}</p>
                   <p><b>Department:</b> {s.Department}</p>
                   <p>If you did not request this change, please contact support.</p>");
        }

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

    public async Task<HashSet<int>> GetAssignedPackageIdsForUserAsync(int userId)
    {
        var staff = await _db.StaffMembers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (staff == null) return new HashSet<int>();
        var ids = await _db.VehicleAllocationStaff
            .Where(sa => sa.StaffId == staff.Id && sa.VehicleAllocation!.Booking != null)
            .Select(sa => sa.VehicleAllocation!.Booking!.TourPackageId)
            .Distinct()
            .ToListAsync();
        return ids.ToHashSet();
    }

    public async Task<HashSet<int>> GetAssignedTourIdsForUserAsync(int userId)
    {
        var packageIds = await GetAssignedPackageIdsForUserAsync(userId);
        if (packageIds.Count == 0) return new HashSet<int>();
        var tourIds = await _db.TourPackages
            .Where(p => packageIds.Contains(p.Id))
            .Select(p => p.TourId)
            .Distinct()
            .ToListAsync();
        return tourIds.ToHashSet();
    }

    public async Task<List<string>> GetPermissionsAsync(int staffId)
    {
        return await _db.StaffPermissions
            .Where(p => p.StaffId == staffId)
            .Select(p => p.Permission)
            .ToListAsync();
    }

    public async Task<List<string>> GetPermissionsByUserIdAsync(int userId)
    {
        var staff = await _db.StaffMembers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (staff == null) return new List<string>();
        return await GetPermissionsAsync(staff.Id);
    }

    public async Task<bool> SetPermissionsAsync(int staffId, IEnumerable<string> permissions)
    {
        var staff = await _db.StaffMembers.FindAsync(staffId);
        if (staff == null) return false;

        var desired = permissions.Distinct().ToHashSet();
        var current = await _db.StaffPermissions.Where(p => p.StaffId == staffId).ToListAsync();
        var currentSet = current.Select(p => p.Permission).ToHashSet();

        foreach (var p in current.Where(x => !desired.Contains(x.Permission)))
            _db.StaffPermissions.Remove(p);

        foreach (var p in desired.Where(x => !currentSet.Contains(x)))
            _db.StaffPermissions.Add(new StaffPermission { StaffId = staffId, Permission = p });

        await _db.SaveChangesAsync();
        return true;
    }
}
