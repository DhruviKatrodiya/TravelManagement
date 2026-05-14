using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class HomeDestinationService : IHomeDestinationService
{
    private readonly TravelDbContext _db;

    public HomeDestinationService(TravelDbContext db) => _db = db;

    public async Task<IEnumerable<HomeDestinationDto>> ListAsync(bool? activeOnly = true)
    {
        var q = _db.HomeDestinations.AsQueryable();
        if (activeOnly == true) q = q.Where(d => d.IsActive);
        var rows = await q.OrderBy(d => d.SortOrder).ThenBy(d => d.Id).ToListAsync();

        var ids = rows.Select(r => r.Id).ToList();
        var stats = await _db.HomeDestinationTours
            .Where(l => ids.Contains(l.HomeDestinationId))
            .Select(l => new
            {
                l.HomeDestinationId,
                l.TourId,
                ReviewCount = l.Tour!.Reviews.Count(r => r.IsApproved),
                RatingSum = l.Tour!.Reviews.Where(r => r.IsApproved).Sum(r => (double?)r.Rating) ?? 0
            })
            .ToListAsync();

        var grouped = stats
            .GroupBy(s => s.HomeDestinationId)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    TourCount = g.Select(x => x.TourId).Distinct().Count(),
                    ReviewCount = g.Sum(x => x.ReviewCount),
                    RatingSum = g.Sum(x => x.RatingSum)
                });

        return rows.Select(d =>
        {
            var dto = Map(d);
            if (grouped.TryGetValue(d.Id, out var s))
            {
                dto.TourCount = s.TourCount;
                dto.ReviewCount = s.ReviewCount;
                dto.AverageRating = s.ReviewCount > 0 ? s.RatingSum / s.ReviewCount : 0;
            }
            return dto;
        });
    }

    public async Task<HomeDestinationDto> CreateAsync(HomeDestinationRequest req)
    {
        var row = new HomeDestination
        {
            Name = req.Name,
            Country = req.Country,
            ImageUrl = req.ImageUrl,
            Blurb = req.Blurb,
            SortOrder = req.SortOrder,
            TourId = req.TourId,
            Keyword = req.Keyword,
            IsActive = req.IsActive,
            CreatedAt = DateTime.UtcNow
        };
        _db.HomeDestinations.Add(row);
        await _db.SaveChangesAsync();
        return Map(row);
    }

    public async Task<HomeDestinationDto?> UpdateAsync(int id, HomeDestinationRequest req)
    {
        var row = await _db.HomeDestinations.FindAsync(id);
        if (row == null) return null;

        row.Name = req.Name;
        row.Country = req.Country;
        row.ImageUrl = req.ImageUrl;
        row.Blurb = req.Blurb;
        row.SortOrder = req.SortOrder;
        row.TourId = req.TourId;
        row.Keyword = req.Keyword;
        row.IsActive = req.IsActive;
        await _db.SaveChangesAsync();
        return Map(row);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var row = await _db.HomeDestinations.FindAsync(id);
        if (row == null) return false;
        _db.HomeDestinations.Remove(row);
        await _db.SaveChangesAsync();
        return true;
    }

    private static HomeDestinationDto Map(HomeDestination d) => new()
    {
        Id = d.Id,
        Name = d.Name,
        Country = d.Country,
        ImageUrl = d.ImageUrl,
        Blurb = d.Blurb,
        SortOrder = d.SortOrder,
        TourId = d.TourId,
        Keyword = d.Keyword,
        IsActive = d.IsActive
    };
}
