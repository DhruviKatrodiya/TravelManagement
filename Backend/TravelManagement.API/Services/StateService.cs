using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class StateService : IStateService
{
    private readonly TravelDbContext _db;
    public StateService(TravelDbContext db) => _db = db;

    public async Task<IEnumerable<StateDto>> ListAsync(int? countryId = null, bool? activeOnly = null)
    {
        var q = _db.States.Include(s => s.Country).AsQueryable();
        if (countryId.HasValue) q = q.Where(s => s.CountryId == countryId.Value);
        if (activeOnly == true) q = q.Where(s => s.IsActive);
        return await q.OrderBy(s => s.Country.Name).ThenBy(s => s.Name)
            .Select(s => new StateDto(s.Id, s.Name, s.CountryId, s.Country.Name, s.IsActive))
            .ToListAsync();
    }

    public async Task<StateDto?> GetAsync(int id)
    {
        var s = await _db.States.Include(x => x.Country).FirstOrDefaultAsync(x => x.Id == id);
        return s == null ? null : new StateDto(s.Id, s.Name, s.CountryId, s.Country.Name, s.IsActive);
    }

    public async Task<StateDto> CreateAsync(StateRequest req)
    {
        var s = new State { Name = req.Name.Trim(), CountryId = req.CountryId };
        _db.States.Add(s);
        await _db.SaveChangesAsync();
        await _db.Entry(s).Reference(x => x.Country).LoadAsync();
        return new StateDto(s.Id, s.Name, s.CountryId, s.Country.Name, s.IsActive);
    }

    public async Task<StateDto?> UpdateAsync(int id, StateRequest req)
    {
        var s = await _db.States.Include(x => x.Country).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return null;
        s.Name = req.Name.Trim();
        s.CountryId = req.CountryId;
        await _db.SaveChangesAsync();
        await _db.Entry(s).Reference(x => x.Country).LoadAsync();
        return new StateDto(s.Id, s.Name, s.CountryId, s.Country.Name, s.IsActive);
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var s = await _db.States.FindAsync(id);
        if (s == null) return false;
        s.IsActive = active;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var s = await _db.States.FindAsync(id);
        if (s == null) return false;
        _db.States.Remove(s);
        await _db.SaveChangesAsync();
        return true;
    }
}
