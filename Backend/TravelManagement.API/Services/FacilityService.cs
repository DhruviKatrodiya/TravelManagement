using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class FacilityService : IFacilityService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public FacilityService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<FacilityDto>> ListAsync()
    {
        var items = await _db.Facilities.OrderBy(f => f.Type).ThenBy(f => f.Name).ToListAsync();
        return _mapper.Map<List<FacilityDto>>(items);
    }

    public async Task<FacilityDto> CreateAsync(FacilityCreateRequest req)
    {
        var f = _mapper.Map<Facility>(req);
        _db.Facilities.Add(f);
        await _db.SaveChangesAsync();
        return _mapper.Map<FacilityDto>(f);
    }

    public async Task<FacilityDto?> UpdateAsync(int id, FacilityCreateRequest req)
    {
        var f = await _db.Facilities.FindAsync(id);
        if (f == null) return null;
        _mapper.Map(req, f);
        await _db.SaveChangesAsync();
        return _mapper.Map<FacilityDto>(f);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var f = await _db.Facilities.FindAsync(id);
        if (f == null) return false;
        _db.Facilities.Remove(f);
        await _db.SaveChangesAsync();
        return true;
    }
}
