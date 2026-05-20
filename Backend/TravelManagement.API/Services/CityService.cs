using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class CityService : ICityService
{
    private readonly TravelDbContext _db;
    public CityService(TravelDbContext db) => _db = db;

    public async Task<IEnumerable<CityDto>> ListAsync(int? stateId = null, int? countryId = null, bool? activeOnly = null)
    {
        var q = _db.Cities.Include(c => c.State).ThenInclude(s => s.Country).AsQueryable();
        if (stateId.HasValue) q = q.Where(c => c.StateId == stateId.Value);
        if (countryId.HasValue) q = q.Where(c => c.State.CountryId == countryId.Value);
        if (activeOnly == true) q = q.Where(c => c.IsActive);
        return await q.OrderBy(c => c.State.Name).ThenBy(c => c.Name)
            .Select(c => new CityDto(c.Id, c.Name, c.StateId, c.State.Name, c.State.CountryId, c.State.Country.Name, c.IsActive))
            .ToListAsync();
    }

    public async Task<CityDto?> GetAsync(int id)
    {
        var c = await _db.Cities.Include(x => x.State).ThenInclude(s => s.Country).FirstOrDefaultAsync(x => x.Id == id);
        return c == null ? null : new CityDto(c.Id, c.Name, c.StateId, c.State.Name, c.State.CountryId, c.State.Country.Name, c.IsActive);
    }

    public async Task<CityDto> CreateAsync(CityRequest req)
    {
        var c = new City { Name = req.Name.Trim(), StateId = req.StateId };
        _db.Cities.Add(c);
        await _db.SaveChangesAsync();
        await _db.Entry(c).Reference(x => x.State).LoadAsync();
        await _db.Entry(c.State).Reference(s => s.Country).LoadAsync();
        return new CityDto(c.Id, c.Name, c.StateId, c.State.Name, c.State.CountryId, c.State.Country.Name, c.IsActive);
    }

    public async Task<CityDto?> UpdateAsync(int id, CityRequest req)
    {
        var c = await _db.Cities.Include(x => x.State).ThenInclude(s => s.Country).FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return null;
        c.Name = req.Name.Trim();
        c.StateId = req.StateId;
        await _db.SaveChangesAsync();
        await _db.Entry(c).Reference(x => x.State).LoadAsync();
        await _db.Entry(c.State).Reference(s => s.Country).LoadAsync();
        return new CityDto(c.Id, c.Name, c.StateId, c.State.Name, c.State.CountryId, c.State.Country.Name, c.IsActive);
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var c = await _db.Cities.FindAsync(id);
        if (c == null) return false;
        c.IsActive = active;
        await _db.SaveChangesAsync();
        return true;
    }
}
