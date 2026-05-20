using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class RoleService : IRoleService
{
    private readonly TravelDbContext _db;

    public RoleService(TravelDbContext db) => _db = db;

    public async Task<IEnumerable<AppRoleDto>> ListAsync(bool? activeOnly = null)
    {
        var q = _db.AppRoles.Include(r => r.Permissions).AsQueryable();
        if (activeOnly == true) q = q.Where(r => r.IsActive);
        var roles = await q.OrderBy(r => r.Name).ToListAsync();
        return roles.Select(ToDto);
    }

    public async Task<AppRoleDto?> GetAsync(int id)
    {
        var r = await _db.AppRoles.Include(x => x.Permissions).FirstOrDefaultAsync(x => x.Id == id);
        return r == null ? null : ToDto(r);
    }

    public async Task<AppRoleDto> CreateAsync(AppRoleCreateRequest req)
    {
        if (await _db.AppRoles.AnyAsync(r => r.Name == req.Name))
            throw new InvalidOperationException("A role with this name already exists.");

        var allowed = Permissions.All.ToHashSet();
        var role = new AppRole
        {
            Name = req.Name,
            Description = req.Description,
            IsActive = req.IsActive,
            CreatedAt = DateTime.UtcNow,
            Permissions = req.Permissions
                .Where(p => allowed.Contains(p))
                .Select(p => new AppRolePermission { Permission = p })
                .ToList()
        };

        _db.AppRoles.Add(role);
        await _db.SaveChangesAsync();
        return ToDto(role);
    }

    public async Task<AppRoleDto?> UpdateAsync(int id, AppRoleUpdateRequest req)
    {
        var role = await _db.AppRoles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Id == id);
        if (role == null) return null;

        if (!string.Equals(role.Name, req.Name, StringComparison.OrdinalIgnoreCase))
        {
            if (await _db.AppRoles.AnyAsync(r => r.Id != id && r.Name == req.Name))
                throw new InvalidOperationException("A role with this name already exists.");
        }

        var allowed = Permissions.All.ToHashSet();
        var desired = req.Permissions.Where(p => allowed.Contains(p)).ToHashSet();

        role.Name = req.Name;
        role.Description = req.Description;
        role.IsActive = req.IsActive;

        foreach (var p in role.Permissions.Where(x => !desired.Contains(x.Permission)).ToList())
            _db.AppRolePermissions.Remove(p);

        var currentSet = role.Permissions.Select(p => p.Permission).ToHashSet();
        foreach (var perm in desired.Where(p => !currentSet.Contains(p)))
            _db.AppRolePermissions.Add(new AppRolePermission { AppRoleId = id, Permission = perm });

        await _db.SaveChangesAsync();

        var fresh = await _db.AppRoles.Include(r => r.Permissions).FirstAsync(r => r.Id == id);
        return ToDto(fresh);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var role = await _db.AppRoles.FirstOrDefaultAsync(r => r.Id == id);
        if (role == null) return false;

        var staffWithRole = await _db.StaffMembers.Where(s => s.AppRoleId == id).ToListAsync();
        staffWithRole.ForEach(s => s.AppRoleId = null);

        var customersWithRole = await _db.Customers.Where(c => c.AppRoleId == id).ToListAsync();
        customersWithRole.ForEach(c => c.AppRoleId = null);

        _db.AppRoles.Remove(role);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var role = await _db.AppRoles.FindAsync(id);
        if (role == null) return false;
        role.IsActive = active;
        await _db.SaveChangesAsync();
        return true;
    }

    private static AppRoleDto ToDto(AppRole r) => new()
    {
        Id = r.Id,
        Name = r.Name,
        Description = r.Description,
        IsActive = r.IsActive,
        CreatedAt = r.CreatedAt,
        Permissions = r.Permissions.Select(p => p.Permission).OrderBy(p => p).ToList()
    };
}
