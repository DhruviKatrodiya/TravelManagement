using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class TourService : ITourService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public TourService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TourDto>> ListAsync(Destination? destination = null, string? q = null, int? homeDestinationId = null, bool? activeOnly = true)
    {
        var query = _db.Tours
            .Include(t => t.Packages)
                .ThenInclude(p => p.Itineraries)
            .Include(t => t.Packages)
                .ThenInclude(p => p.PackageFacilities)
                    .ThenInclude(pf => pf.Facility)
            .Include(t => t.Reviews)
            .AsQueryable();

        if (destination.HasValue) query = query.Where(t => t.Destination == destination.Value);
        if (activeOnly == true) query = query.Where(t => t.IsActive);
        if (homeDestinationId.HasValue)
        {
            var did = homeDestinationId.Value;
            query = query.Where(t => _db.HomeDestinationTours.Any(l => l.HomeDestinationId == did && l.TourId == t.Id));
        }
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(t => EF.Functions.Like(t.Name, $"%{term}%")
                                  || (t.Region != null && EF.Functions.Like(t.Region, $"%{term}%"))
                                  || (t.Highlights != null && EF.Functions.Like(t.Highlights, $"%{term}%")));
        }

        var tours = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return _mapper.Map<List<TourDto>>(tours);
    }

    public async Task<TourDto?> GetAsync(int id)
    {
        var tour = await _db.Tours
            .Include(t => t.Packages)
                .ThenInclude(p => p.Itineraries)
            .Include(t => t.Packages)
                .ThenInclude(p => p.PackageFacilities)
                    .ThenInclude(pf => pf.Facility)
            .Include(t => t.Reviews)
            .FirstOrDefaultAsync(t => t.Id == id);

        return tour == null ? null : _mapper.Map<TourDto>(tour);
    }

    public async Task<TourDto> CreateAsync(TourCreateRequest req)
    {
        var tour = _mapper.Map<Models.Tour>(req);
        tour.CreatedAt = DateTime.UtcNow;
        _db.Tours.Add(tour);
        await _db.SaveChangesAsync();
        return (await GetAsync(tour.Id))!;
    }

    public async Task<TourDto?> UpdateAsync(int id, TourUpdateRequest req)
    {
        var tour = await _db.Tours.FindAsync(id);
        if (tour == null) return null;
        _mapper.Map(req, tour);
        tour.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await GetAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tour = await _db.Tours.FindAsync(id);
        if (tour == null) return false;
        _db.Tours.Remove(tour);
        await _db.SaveChangesAsync();
        return true;
    }
}
