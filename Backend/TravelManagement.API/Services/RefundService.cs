using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class RefundService : IRefundService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;
    private readonly INotificationService _notify;
    private readonly IEmailService _email;

    public RefundService(TravelDbContext db, IMapper mapper, INotificationService notify, IEmailService email)
    {
        _db = db;
        _mapper = mapper;
        _notify = notify;
        _email = email;
    }

    public async Task<IEnumerable<RefundDto>> ListAsync()
    {
        var items = await _db.Refunds
            .Include(r => r.Booking).ThenInclude(b => b.Customer).ThenInclude(c => c.User)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
        return _mapper.Map<List<RefundDto>>(items);
    }

    public async Task<RefundDto> RequestAsync(int customerUserId, RefundCreateRequest req)
    {
        var booking = await _db.Bookings
            .Include(b => b.Customer).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(b => b.Id == req.BookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Customer.UserId != customerUserId)
            throw new UnauthorizedAccessException("Not your booking.");

        var existing = await _db.Refunds.FirstOrDefaultAsync(r => r.BookingId == req.BookingId);
        if (existing != null) throw new InvalidOperationException("A refund request already exists for this booking.");

        var refund = new Refund
        {
            BookingId = req.BookingId,
            Reason = req.Reason,
            RequestedAmount = req.RequestedAmount,
            Status = RefundStatus.Requested,
            RequestedAt = DateTime.UtcNow
        };
        _db.Refunds.Add(refund);
        await _db.SaveChangesAsync();

        var fresh = await _db.Refunds
            .Include(r => r.Booking).ThenInclude(b => b.Customer).ThenInclude(c => c.User)
            .FirstAsync(r => r.Id == refund.Id);
        return _mapper.Map<RefundDto>(fresh);
    }

    public async Task<RefundDto> AdminIssueAsync(AdminRefundIssueRequest req)
    {
        var booking = await _db.Bookings
            .Include(b => b.Customer).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(b => b.Id == req.BookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        var existing = await _db.Refunds.FirstOrDefaultAsync(r => r.BookingId == req.BookingId);
        if (existing != null) throw new InvalidOperationException("A refund already exists for this booking.");

        var refund = new Refund
        {
            BookingId = req.BookingId,
            Reason = req.Reason,
            RequestedAmount = req.RequestedAmount,
            ApprovedAmount = req.RequestedAmount,
            Status = RefundStatus.Processed,
            RefundMethod = req.RefundMethod,
            TransactionReference = req.TransactionReference,
            PaymentNotes = req.PaymentNotes,
            RequestedAt = DateTime.UtcNow,
            ProcessedAt = DateTime.UtcNow
        };
        _db.Refunds.Add(refund);

        booking.AmountPaid = Math.Max(0, booking.AmountPaid - req.RequestedAmount);
        booking.Status = BookingStatus.Refunded;

        await _db.SaveChangesAsync();

        await _notify.CreateAsync(booking.Customer.UserId, NotificationType.RefundProcessed,
            "Refund issued",
            $"A refund of ₹{req.RequestedAmount:N2} has been issued for booking {booking.BookingReference}.",
            $"/customer/bookings/{req.BookingId}");

        _ = _email.SendAsync(booking.Customer.User.Email, booking.Customer.User.FullName,
            $"Refund issued: {booking.BookingReference}",
            $"<h2>Refund Issued</h2><p>A refund of <b>₹{req.RequestedAmount:N2}</b> has been issued for booking <b>{booking.BookingReference}</b>.<br/>Reason: {req.Reason}</p>");

        var fresh = await _db.Refunds
            .Include(r => r.Booking).ThenInclude(b => b.Customer).ThenInclude(c => c.User)
            .FirstAsync(r => r.Id == refund.Id);
        return _mapper.Map<RefundDto>(fresh);
    }

    public async Task<RefundDto?> ProcessAsync(int id, RefundProcessRequest req)
    {
        var r = await _db.Refunds
            .Include(x => x.Booking).ThenInclude(b => b.Customer).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return null;

        r.Status = req.Status;
        r.ApprovedAmount = req.ApprovedAmount;
        r.AdminNotes = req.AdminNotes;
        if (req.Status is RefundStatus.Processed or RefundStatus.Approved or RefundStatus.Rejected)
            r.ProcessedAt = DateTime.UtcNow;

        if (req.Status == RefundStatus.Processed && req.ApprovedAmount.HasValue)
        {
            r.Booking.AmountPaid = Math.Max(0, r.Booking.AmountPaid - req.ApprovedAmount.Value);
            r.Booking.Status = BookingStatus.Refunded;
        }

        await _db.SaveChangesAsync();

        await _notify.CreateAsync(r.Booking.Customer.UserId, NotificationType.RefundProcessed,
            $"Refund {req.Status}",
            $"Refund for booking {r.Booking.BookingReference} is now {req.Status}.",
            $"/customer/bookings/{r.BookingId}");

        _ = _email.SendAsync(r.Booking.Customer.User.Email, r.Booking.Customer.User.FullName,
            $"Refund {req.Status}: {r.Booking.BookingReference}",
            $"<h2>Refund {req.Status}</h2><p>Booking <b>{r.Booking.BookingReference}</b>. Approved: ₹{req.ApprovedAmount:N2}.<br/>{req.AdminNotes}</p>");

        return _mapper.Map<RefundDto>(r);
    }
}
