using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class ScheduleService : IScheduleService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public ScheduleService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TourScheduleDto>> ListAsync(DateTime? from = null, DateTime? to = null)
    {
        var q = _db.TourSchedules.Include(s => s.Tour).Include(s => s.TourPackage).AsQueryable();
        if (from.HasValue) q = q.Where(s => s.EndDate >= from.Value);
        if (to.HasValue) q = q.Where(s => s.StartDate <= to.Value);

        var items = await q.OrderBy(s => s.StartDate).ToListAsync();
        return _mapper.Map<List<TourScheduleDto>>(items);
    }

    public async Task<TourScheduleDto> CreateAsync(TourScheduleCreateRequest req)
    {
        var s = _mapper.Map<TourSchedule>(req);
        _db.TourSchedules.Add(s);
        await _db.SaveChangesAsync();

        var fresh = await _db.TourSchedules.Include(x => x.Tour).Include(x => x.TourPackage).FirstAsync(x => x.Id == s.Id);
        return _mapper.Map<TourScheduleDto>(fresh);
    }

    public async Task<TourScheduleDto?> UpdateAsync(int id, TourScheduleCreateRequest req)
    {
        var s = await _db.TourSchedules.FindAsync(id);
        if (s == null) return null;

        if (req.AvailableSeats < s.BookedSeats)
            throw new InvalidOperationException($"Available seats ({req.AvailableSeats}) cannot be less than already booked seats ({s.BookedSeats}).");

        s.TourId = req.TourId;
        s.TourPackageId = req.TourPackageId;
        s.StartDate = req.StartDate;
        s.EndDate = req.EndDate;
        s.AvailableSeats = req.AvailableSeats;
        s.IsActive = req.IsActive;
        await _db.SaveChangesAsync();

        var fresh = await _db.TourSchedules.Include(x => x.Tour).Include(x => x.TourPackage).FirstAsync(x => x.Id == s.Id);
        return _mapper.Map<TourScheduleDto>(fresh);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var s = await _db.TourSchedules.FindAsync(id);
        if (s == null) return false;

        bool inUse = await _db.Bookings.AnyAsync(b => b.TourScheduleId == id);
        if (inUse)
            throw new InvalidOperationException("This record is in use, you can't delete this record.");

        _db.TourSchedules.Remove(s);
        await _db.SaveChangesAsync();
        return true;
    }
}
