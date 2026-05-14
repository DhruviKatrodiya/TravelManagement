using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class DriverService : IDriverService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public DriverService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<DriverDto>> ListAsync()
    {
        var items = await _db.Drivers.OrderBy(d => d.FullName).ToListAsync();
        return _mapper.Map<List<DriverDto>>(items);
    }

    public async Task<DriverDto?> GetAsync(int id)
    {
        var d = await _db.Drivers.FindAsync(id);
        return d == null ? null : _mapper.Map<DriverDto>(d);
    }

    public async Task<DriverDto> CreateAsync(DriverCreateRequest req)
    {
        var d = _mapper.Map<Driver>(req);
        _db.Drivers.Add(d);
        await _db.SaveChangesAsync();
        return _mapper.Map<DriverDto>(d);
    }

    public async Task<DriverDto?> UpdateAsync(int id, DriverCreateRequest req)
    {
        var d = await _db.Drivers.FindAsync(id);
        if (d == null) return null;
        _mapper.Map(req, d);
        await _db.SaveChangesAsync();
        return _mapper.Map<DriverDto>(d);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await SetActiveAsync(id, false);
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var d = await _db.Drivers.FindAsync(id);
        if (d == null) return false;
        d.IsActive = active;
        await _db.SaveChangesAsync();
        return true;
    }
}
