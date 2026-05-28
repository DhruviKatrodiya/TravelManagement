using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class DesignationService : IDesignationService
{
    private readonly TravelDbContext _db;
    public DesignationService(TravelDbContext db) => _db = db;

    public async Task<IEnumerable<DesignationDto>> ListAsync(int? departmentId = null, bool? activeOnly = null)
    {
        var q = _db.Designations.Include(d => d.Department).AsQueryable();
        if (departmentId.HasValue) q = q.Where(d => d.DepartmentId == departmentId.Value);
        if (activeOnly == true) q = q.Where(d => d.IsActive);
        return await q.OrderBy(d => d.Department.Name).ThenBy(d => d.Name)
            .Select(d => new DesignationDto(d.Id, d.Name, d.DepartmentId, d.Department.Name, d.IsActive))
            .ToListAsync();
    }

    public async Task<DesignationDto?> GetAsync(int id)
    {
        var d = await _db.Designations.Include(x => x.Department).FirstOrDefaultAsync(x => x.Id == id);
        return d == null ? null : new DesignationDto(d.Id, d.Name, d.DepartmentId, d.Department.Name, d.IsActive);
    }

    public async Task<DesignationDto> CreateAsync(DesignationRequest req)
    {
        var d = new Designation { Name = req.Name.Trim(), DepartmentId = req.DepartmentId };
        _db.Designations.Add(d);
        await _db.SaveChangesAsync();
        await _db.Entry(d).Reference(x => x.Department).LoadAsync();
        return new DesignationDto(d.Id, d.Name, d.DepartmentId, d.Department.Name, d.IsActive);
    }

    public async Task<DesignationDto?> UpdateAsync(int id, DesignationRequest req)
    {
        var d = await _db.Designations.Include(x => x.Department).FirstOrDefaultAsync(x => x.Id == id);
        if (d == null) return null;
        d.Name = req.Name.Trim();
        d.DepartmentId = req.DepartmentId;
        await _db.SaveChangesAsync();
        await _db.Entry(d).Reference(x => x.Department).LoadAsync();
        return new DesignationDto(d.Id, d.Name, d.DepartmentId, d.Department.Name, d.IsActive);
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var d = await _db.Designations.FindAsync(id);
        if (d == null) return false;
        d.IsActive = active;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var d = await _db.Designations.FindAsync(id);
        if (d == null) return false;
        _db.Designations.Remove(d);
        await _db.SaveChangesAsync();
        return true;
    }
}
