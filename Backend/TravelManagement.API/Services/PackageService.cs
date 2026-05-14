using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class PackageService : IPackageService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public PackageService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    private IQueryable<TourPackage> Query() =>
        _db.TourPackages
            .Include(p => p.Itineraries)
            .Include(p => p.PackageFacilities).ThenInclude(pf => pf.Facility);

    public async Task<IEnumerable<TourPackageDto>> ListAsync(int? tourId = null)
    {
        var q = Query();
        if (tourId.HasValue) q = q.Where(p => p.TourId == tourId.Value);
        var items = await q.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return _mapper.Map<List<TourPackageDto>>(items);
    }

    public async Task<TourPackageDto?> GetAsync(int id)
    {
        var p = await Query().FirstOrDefaultAsync(x => x.Id == id);
        return p == null ? null : _mapper.Map<TourPackageDto>(p);
    }

    public async Task<TourPackageDto> CreateAsync(TourPackageCreateRequest req)
    {
        var pkg = _mapper.Map<TourPackage>(req);
        pkg.CreatedAt = DateTime.UtcNow;
        _db.TourPackages.Add(pkg);
        await _db.SaveChangesAsync();

        foreach (var fid in req.FacilityIds.Distinct())
        {
            _db.PackageFacilities.Add(new PackageFacility { TourPackageId = pkg.Id, FacilityId = fid, Included = true });
        }
        await _db.SaveChangesAsync();
        return (await GetAsync(pkg.Id))!;
    }

    public async Task<TourPackageDto?> UpdateAsync(int id, TourPackageUpdateRequest req)
    {
        var pkg = await _db.TourPackages.Include(p => p.PackageFacilities).FirstOrDefaultAsync(p => p.Id == id);
        if (pkg == null) return null;

        _mapper.Map(req, pkg);

        _db.PackageFacilities.RemoveRange(pkg.PackageFacilities);
        foreach (var fid in req.FacilityIds.Distinct())
        {
            _db.PackageFacilities.Add(new PackageFacility { TourPackageId = pkg.Id, FacilityId = fid, Included = true });
        }

        await _db.SaveChangesAsync();
        return await GetAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var pkg = await _db.TourPackages.FindAsync(id);
        if (pkg == null) return false;
        _db.TourPackages.Remove(pkg);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ItineraryDto>> ListItinerariesAsync(int packageId)
    {
        var items = await _db.Itineraries.Where(i => i.TourPackageId == packageId)
            .OrderBy(i => i.DayNumber).ToListAsync();
        return _mapper.Map<List<ItineraryDto>>(items);
    }

    public async Task<ItineraryDto> AddItineraryAsync(ItineraryCreateRequest req)
    {
        var i = _mapper.Map<Itinerary>(req);
        _db.Itineraries.Add(i);
        await _db.SaveChangesAsync();
        return _mapper.Map<ItineraryDto>(i);
    }

    public async Task<bool> DeleteItineraryAsync(int id)
    {
        var i = await _db.Itineraries.FindAsync(id);
        if (i == null) return false;
        _db.Itineraries.Remove(i);
        await _db.SaveChangesAsync();
        return true;
    }
}
