using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Booking;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class BookingService : IBookingService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;
    private readonly INotificationService _notify;
    private readonly IEmailService _email;

    public BookingService(TravelDbContext db, IMapper mapper, INotificationService notify, IEmailService email)
    {
        _db = db;
        _mapper = mapper;
        _notify = notify;
        _email = email;
    }

    private IQueryable<Models.Booking> Query() =>
        _db.Bookings
            .Include(b => b.Customer).ThenInclude(c => c.User)
            .Include(b => b.TourPackage).ThenInclude(p => p.Tour)
            .Include(b => b.Payments);

    public async Task<IEnumerable<BookingDto>> ListAsync(int? customerId = null)
    {
        var q = Query();
        if (customerId.HasValue) q = q.Where(b => b.CustomerId == customerId.Value);
        var items = await q.OrderByDescending(b => b.BookedAt).ToListAsync();
        return _mapper.Map<List<BookingDto>>(items);
    }

    public async Task<BookingDto?> GetAsync(int id)
    {
        var b = await Query().FirstOrDefaultAsync(x => x.Id == id);
        return b == null ? null : _mapper.Map<BookingDto>(b);
    }

    public async Task<BookingDto?> GetByReferenceAsync(string reference)
    {
        var b = await Query().FirstOrDefaultAsync(x => x.BookingReference == reference);
        return b == null ? null : _mapper.Map<BookingDto>(b);
    }

    public async Task<BookingDto> CreateAsync(int customerUserId, BookingCreateRequest req)
    {
        var customer = await _db.Customers.Include(c => c.User)
            .FirstOrDefaultAsync(c => c.UserId == customerUserId)
            ?? throw new InvalidOperationException("Customer profile missing.");

        var pkg = await _db.TourPackages.Include(p => p.Tour).FirstOrDefaultAsync(p => p.Id == req.TourPackageId)
            ?? throw new KeyNotFoundException("Package not found.");

        if (!pkg.IsActive) throw new InvalidOperationException("Selected package is not active.");

        var totalGuests = req.Adults + req.Children;
        if (totalGuests < pkg.MinPersons || totalGuests > pkg.MaxPersons)
            throw new InvalidOperationException($"Guest count must be between {pkg.MinPersons} and {pkg.MaxPersons}.");

        if (req.TripEndDate < req.TripStartDate)
            throw new InvalidOperationException("Trip end date cannot be earlier than start date.");

        var subTotal = (pkg.PricePerPerson * req.Adults) + ((pkg.ChildPrice ?? pkg.PricePerPerson * 0.6m) * req.Children);
        var discount = Math.Min(req.Discount, subTotal);
        var taxable = subTotal - discount;
        var tax = Math.Round(taxable * 0.05m, 2);
        var total = taxable + tax;

        var booking = new Models.Booking
        {
            BookingReference = $"TMB-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            CustomerId = customer.Id,
            TourPackageId = pkg.Id,
            TourScheduleId = req.TourScheduleId,
            TripStartDate = req.TripStartDate,
            TripEndDate = req.TripEndDate,
            Adults = req.Adults,
            Children = req.Children,
            SubTotal = subTotal,
            Discount = discount,
            Tax = tax,
            TotalAmount = total,
            AmountPaid = 0,
            Status = BookingStatus.Pending,
            SpecialRequests = req.SpecialRequests,
            CustomItinerary = req.CustomItinerary,
            BookedAt = DateTime.UtcNow
        };

        _db.Bookings.Add(booking);

        if (req.TourScheduleId.HasValue)
        {
            var sched = await _db.TourSchedules.FindAsync(req.TourScheduleId.Value);
            if (sched != null)
            {
                if (sched.AvailableSeats - sched.BookedSeats < totalGuests)
                    throw new InvalidOperationException("Not enough seats on the selected schedule.");
                sched.BookedSeats += totalGuests;
            }
        }

        await _db.SaveChangesAsync();

        await _notify.CreateAsync(customer.UserId, NotificationType.BookingConfirmed,
            "Booking received",
            $"Your booking {booking.BookingReference} for {pkg.Tour.Name} - {pkg.Name} has been received. Please complete payment to confirm.",
            $"/customer/bookings/{booking.Id}");

        _ = _email.SendAsync(customer.User.Email, customer.User.FullName,
            $"Booking received: {booking.BookingReference}",
            BuildBookingEmail(booking, pkg.Tour.Name, pkg.Name, "received"));

        return (await GetAsync(booking.Id))!;
    }

    public async Task<BookingDto?> UpdateStatusAsync(int id, BookingUpdateStatusRequest req)
    {
        var b = await Query().FirstOrDefaultAsync(x => x.Id == id);
        if (b == null) return null;

        var previous = b.Status;
        b.Status = req.Status;
        if (req.Status == BookingStatus.Cancelled && previous != BookingStatus.Cancelled)
            b.CancelledAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var title = req.Status == BookingStatus.Confirmed ? "Trip booked successfully" :
                    req.Status == BookingStatus.Cancelled ? "Booking cancelled" :
                    req.Status == BookingStatus.Completed ? "Trip completed" : "Booking updated";

        await _notify.CreateAsync(b.Customer.UserId,
            req.Status == BookingStatus.Confirmed ? NotificationType.BookingConfirmed :
            req.Status == BookingStatus.Cancelled ? NotificationType.BookingCancelled :
            NotificationType.General,
            title,
            $"Booking {b.BookingReference} status: {req.Status}. {req.Note}",
            $"/customer/bookings/{b.Id}");

        _ = _email.SendAsync(b.Customer.User.Email, b.Customer.User.FullName,
            $"{title}: {b.BookingReference}",
            BuildBookingEmail(b, b.TourPackage.Tour.Name, b.TourPackage.Name, req.Status.ToString()));

        return _mapper.Map<BookingDto>(b);
    }

    public async Task<BookingDto?> CancelAsync(int bookingId, int customerUserId, string reason)
    {
        var b = await Query().FirstOrDefaultAsync(x => x.Id == bookingId);
        if (b == null || b.Customer.UserId != customerUserId) return null;
        if (b.Status is BookingStatus.Cancelled or BookingStatus.Completed)
            throw new InvalidOperationException("Booking cannot be cancelled in its current state.");

        var deadline = b.BookedAt.AddHours(24);
        if (DateTime.UtcNow > deadline)
            throw new InvalidOperationException(
                $"Cancellation window expired. Bookings can only be cancelled within 24 hours (until {deadline:dd MMM yyyy HH:mm} UTC).");

        b.Status = BookingStatus.Cancelled;
        b.CancelledAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notify.CreateAsync(b.Customer.UserId, NotificationType.BookingCancelled,
            "Booking cancelled",
            $"Booking {b.BookingReference} cancelled. {reason}",
            $"/customer/bookings/{b.Id}");

        return _mapper.Map<BookingDto>(b);
    }

    private static string BuildBookingEmail(Models.Booking b, string tourName, string packageName, string action) => $@"
        <h2>Booking {action}</h2>
        <p>Reference: <strong>{b.BookingReference}</strong></p>
        <p>Tour: {tourName} — {packageName}</p>
        <p>Trip: {b.TripStartDate:dd MMM yyyy} → {b.TripEndDate:dd MMM yyyy}</p>
        <p>Guests: {b.Adults} adult(s), {b.Children} child(ren)</p>
        <p>Total: ₹ {b.TotalAmount:N2}</p>
        <p>Paid: ₹ {b.AmountPaid:N2}</p>
        <p>Status: {b.Status}</p>
        <hr/>
        <p>Travel Management</p>";
}
