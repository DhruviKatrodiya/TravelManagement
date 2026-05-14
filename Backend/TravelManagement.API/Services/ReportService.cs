using System.Globalization;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class ReportService : IReportService
{
    private readonly TravelDbContext _db;

    public ReportService(TravelDbContext db) => _db = db;

    public async Task<DashboardStatsDto> GetDashboardAsync()
    {
        var dto = new DashboardStatsDto
        {
            TotalCustomers = await _db.Customers.CountAsync(),
            TotalBookings = await _db.Bookings.CountAsync(),
            ConfirmedBookings = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Confirmed),
            PendingBookings = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Pending),
            CancelledBookings = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Cancelled),
            TotalRevenue = await _db.Bookings.Where(b => b.Status != BookingStatus.Cancelled).SumAsync(b => (decimal?)b.AmountPaid) ?? 0,
            TotalExpenses = await _db.Expenses.Where(e => e.IsActive).SumAsync(e => (decimal?)e.Amount) ?? 0,
            ActiveTours = await _db.Tours.CountAsync(t => t.IsActive),
            ActivePackages = await _db.TourPackages.CountAsync(p => p.IsActive),
            VehiclesAvailable = await _db.Vehicles.CountAsync(v => v.IsAvailable),
            DriversAvailable = await _db.Drivers.CountAsync(d => d.IsAvailable)
        };
        dto.Profit = dto.TotalRevenue - dto.TotalExpenses;

        var now = DateTime.UtcNow;
        var monthsRange = Enumerable.Range(0, 6).Select(i => new DateTime(now.Year, now.Month, 1).AddMonths(-5 + i)).ToList();
        var since = monthsRange.First();

        var revByMonth = await _db.Bookings
            .Where(b => b.BookedAt >= since && b.Status != BookingStatus.Cancelled)
            .GroupBy(b => new { b.BookedAt.Year, b.BookedAt.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Revenue = g.Sum(x => x.AmountPaid), Count = g.Count() })
            .ToListAsync();

        foreach (var m in monthsRange)
        {
            var hit = revByMonth.FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month);
            var label = m.ToString("MMM yy", CultureInfo.InvariantCulture);
            dto.MonthlyRevenue.Add(new MonthlyStat { Month = label, Value = hit?.Revenue ?? 0 });
            dto.MonthlyBookings.Add(new MonthlyStat { Month = label, Value = hit?.Count ?? 0 });
        }

        var byDest = await _db.Bookings
            .Include(b => b.TourPackage).ThenInclude(p => p.Tour)
            .Where(b => b.Status != BookingStatus.Cancelled)
            .GroupBy(b => b.TourPackage.Tour.Destination)
            .Select(g => new { Destination = g.Key, Count = g.Count(), Revenue = g.Sum(b => b.AmountPaid) })
            .ToListAsync();

        dto.BookingsByDestination = byDest.Select(x => new DestinationStat
        {
            Destination = x.Destination.ToString(),
            Count = x.Count,
            Revenue = x.Revenue
        }).ToList();

        dto.TopTours = await _db.Bookings
            .Include(b => b.TourPackage).ThenInclude(p => p.Tour)
            .Where(b => b.Status != BookingStatus.Cancelled)
            .GroupBy(b => new { b.TourPackage.TourId, b.TourPackage.Tour.Name })
            .Select(g => new TopTourStat
            {
                TourId = g.Key.TourId,
                Name = g.Key.Name,
                Bookings = g.Count(),
                Revenue = g.Sum(b => b.AmountPaid)
            })
            .OrderByDescending(x => x.Revenue)
            .Take(50)
            .ToListAsync();

        return dto;
    }

    public async Task<IEnumerable<TripProfitDto>> GetTripProfitsAsync(ReportFilter filter)
    {
        var bookingsQ = _db.Bookings
            .Include(b => b.TourPackage).ThenInclude(p => p.Tour)
            .AsQueryable();

        if (filter.From.HasValue) bookingsQ = bookingsQ.Where(b => b.TripStartDate >= filter.From.Value);
        if (filter.To.HasValue) bookingsQ = bookingsQ.Where(b => b.TripStartDate <= filter.To.Value);
        if (filter.TourId.HasValue) bookingsQ = bookingsQ.Where(b => b.TourPackage.TourId == filter.TourId.Value);
        if (filter.CustomerId.HasValue) bookingsQ = bookingsQ.Where(b => b.CustomerId == filter.CustomerId.Value);

        var bookings = await bookingsQ.ToListAsync();
        var ids = bookings.Select(b => b.Id).ToList();
        var expenses = await _db.Expenses.Where(e => e.BookingId != null && ids.Contains(e.BookingId!.Value))
            .GroupBy(e => e.BookingId!.Value)
            .Select(g => new { BookingId = g.Key, Amount = g.Sum(x => x.Amount) })
            .ToListAsync();

        return bookings.Select(b => new TripProfitDto
        {
            BookingId = b.Id,
            BookingReference = b.BookingReference,
            TourName = b.TourPackage.Tour.Name,
            TripStartDate = b.TripStartDate,
            Revenue = b.AmountPaid,
            Expenses = expenses.FirstOrDefault(e => e.BookingId == b.Id)?.Amount ?? 0,
            Profit = b.AmountPaid - (expenses.FirstOrDefault(e => e.BookingId == b.Id)?.Amount ?? 0)
        }).OrderByDescending(x => x.TripStartDate);
    }
}
