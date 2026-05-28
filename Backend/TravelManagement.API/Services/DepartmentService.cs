using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class DepartmentService : IDepartmentService
{
    private readonly TravelDbContext _db;
    public DepartmentService(TravelDbContext db) => _db = db;

    public async Task<IEnumerable<DepartmentDto>> ListAsync(bool? activeOnly = null)
    {
        var q = _db.Departments.AsQueryable();
        if (activeOnly == true) q = q.Where(d => d.IsActive);
        return await q.OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Name, d.IsActive))
            .ToListAsync();
    }

    public async Task<DepartmentDto?> GetAsync(int id)
    {
        var d = await _db.Departments.FindAsync(id);
        return d == null ? null : new DepartmentDto(d.Id, d.Name, d.IsActive);
    }

    public async Task<DepartmentDto> CreateAsync(DepartmentRequest req)
    {
        var d = new Department { Name = req.Name.Trim() };
        _db.Departments.Add(d);
        await _db.SaveChangesAsync();
        return new DepartmentDto(d.Id, d.Name, d.IsActive);
    }

    public async Task<DepartmentDto?> UpdateAsync(int id, DepartmentRequest req)
    {
        var d = await _db.Departments.FindAsync(id);
        if (d == null) return null;
        d.Name = req.Name.Trim();
        await _db.SaveChangesAsync();
        return new DepartmentDto(d.Id, d.Name, d.IsActive);
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var d = await _db.Departments.FindAsync(id);
        if (d == null) return false;
        d.IsActive = active;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var d = await _db.Departments.FindAsync(id);
        if (d == null) return false;
        _db.Departments.Remove(d);
        await _db.SaveChangesAsync();
        return true;
    }
}
