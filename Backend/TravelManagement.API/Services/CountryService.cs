using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class CountryService : ICountryService
{
    private readonly TravelDbContext _db;
    public CountryService(TravelDbContext db) => _db = db;

    public async Task<IEnumerable<CountryDto>> ListAsync(bool? activeOnly = null)
    {
        var q = _db.Countries.AsQueryable();
        if (activeOnly == true) q = q.Where(c => c.IsActive);
        return await q.OrderBy(c => c.Name)
            .Select(c => new CountryDto(c.Id, c.Name, c.Code, c.IsActive))
            .ToListAsync();
    }

    public async Task<CountryDto?> GetAsync(int id)
    {
        var c = await _db.Countries.FindAsync(id);
        return c == null ? null : new CountryDto(c.Id, c.Name, c.Code, c.IsActive);
    }

    public async Task<CountryDto> CreateAsync(CountryRequest req)
    {
        var c = new Country { Name = req.Name.Trim(), Code = req.Code?.Trim().ToUpper() };
        _db.Countries.Add(c);
        await _db.SaveChangesAsync();
        return new CountryDto(c.Id, c.Name, c.Code, c.IsActive);
    }

    public async Task<CountryDto?> UpdateAsync(int id, CountryRequest req)
    {
        var c = await _db.Countries.FindAsync(id);
        if (c == null) return null;
        c.Name = req.Name.Trim();
        c.Code = req.Code?.Trim().ToUpper();
        await _db.SaveChangesAsync();
        return new CountryDto(c.Id, c.Name, c.Code, c.IsActive);
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var c = await _db.Countries.FindAsync(id);
        if (c == null) return false;
        c.IsActive = active;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var c = await _db.Countries.FindAsync(id);
        if (c == null) return false;
        _db.Countries.Remove(c);
        await _db.SaveChangesAsync();
        return true;
    }
}
