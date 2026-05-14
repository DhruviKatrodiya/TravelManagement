using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Payment;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class PaymentService : IPaymentService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;
    private readonly IEnumerable<IPaymentGateway> _gateways;
    private readonly INotificationService _notify;
    private readonly IEmailService _email;

    public PaymentService(TravelDbContext db, IMapper mapper,
        IEnumerable<IPaymentGateway> gateways, INotificationService notify, IEmailService email)
    {
        _db = db;
        _mapper = mapper;
        _gateways = gateways;
        _notify = notify;
        _email = email;
    }

    public async Task<PaymentInitiateResponse> InitiateAsync(int userId, PaymentInitiateRequest req)
    {
        var booking = await _db.Bookings
            .Include(b => b.Customer).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(b => b.Id == req.BookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Customer.UserId != userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null || (user.Role != UserRole.Admin && user.Role != UserRole.Staff))
                throw new UnauthorizedAccessException("Not allowed to pay for this booking.");
        }

        if (booking.Status == BookingStatus.Cancelled)
            throw new InvalidOperationException("Cannot pay for a cancelled booking.");

        var due = booking.TotalAmount - booking.AmountPaid;
        if (req.Amount > due + 0.01m)
            throw new InvalidOperationException($"Amount exceeds outstanding due of ₹{due:N2}.");

        var gateway = _gateways.FirstOrDefault(g => g.Method == req.Method);

        var payment = new Payment
        {
            BookingId = booking.Id,
            TransactionReference = $"TXN-{Guid.NewGuid().ToString("N")[..16].ToUpper()}",
            Method = req.Method,
            Amount = req.Amount,
            Status = PaymentStatus.Initiated,
            Notes = req.Notes,
            InitiatedAt = DateTime.UtcNow
        };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        if (gateway != null)
            return await gateway.InitiateAsync(payment, booking);

        return new PaymentInitiateResponse
        {
            PaymentId = payment.Id,
            TransactionReference = payment.TransactionReference,
            Method = payment.Method,
            Status = payment.Status,
            Amount = payment.Amount
        };
    }

    public async Task<PaymentDto?> ConfirmAsync(PaymentCallbackRequest req)
    {
        var payment = await _db.Payments
            .Include(p => p.Booking).ThenInclude(b => b.Customer).ThenInclude(c => c.User)
            .Include(p => p.Booking).ThenInclude(b => b.TourPackage).ThenInclude(tp => tp.Tour)
            .FirstOrDefaultAsync(p => p.TransactionReference == req.TransactionReference);

        if (payment == null) return null;

        var gateway = _gateways.FirstOrDefault(g => g.Method == payment.Method);
        var verified = gateway != null ? await gateway.VerifyAsync(req) : req.Success;

        payment.GatewayTransactionId = req.GatewayTransactionId;
        payment.GatewayResponse = req.ResponseMessage;
        payment.Status = verified ? PaymentStatus.Success : PaymentStatus.Failed;
        payment.CompletedAt = DateTime.UtcNow;

        if (verified)
        {
            payment.Booking.AmountPaid += payment.Amount;
            if (payment.Booking.AmountPaid >= payment.Booking.TotalAmount - 0.01m
                && payment.Booking.Status == BookingStatus.Pending)
            {
                payment.Booking.Status = BookingStatus.Confirmed;
            }
        }

        await _db.SaveChangesAsync();

        if (verified)
        {
            await _notify.CreateAsync(payment.Booking.Customer.UserId, NotificationType.PaymentReceived,
                "Payment received",
                $"₹ {payment.Amount:N2} received for booking {payment.Booking.BookingReference}.",
                $"/customer/bookings/{payment.BookingId}");

            if (payment.Booking.Status == BookingStatus.Confirmed)
            {
                await _notify.CreateAsync(payment.Booking.Customer.UserId, NotificationType.BookingConfirmed,
                    "Trip booked successfully",
                    $"Your trip {payment.Booking.TourPackage.Tour.Name} is confirmed. Reference: {payment.Booking.BookingReference}.",
                    $"/customer/bookings/{payment.BookingId}");

                _ = _email.SendAsync(payment.Booking.Customer.User.Email, payment.Booking.Customer.User.FullName,
                    $"Trip booked successfully: {payment.Booking.BookingReference}",
                    $"<h2>Trip booked successfully</h2><p>Your booking <b>{payment.Booking.BookingReference}</b> is confirmed. Total paid ₹{payment.Booking.AmountPaid:N2}. Have a great trip!</p>");
            }
        }

        var dto = _mapper.Map<PaymentDto>(payment);
        return dto;
    }

    public async Task<IEnumerable<PaymentDto>> ListAsync(int? bookingId = null)
    {
        var q = _db.Payments.Include(p => p.Booking).AsQueryable();
        if (bookingId.HasValue) q = q.Where(p => p.BookingId == bookingId.Value);
        var items = await q.OrderByDescending(p => p.InitiatedAt).ToListAsync();
        return _mapper.Map<List<PaymentDto>>(items);
    }

    public async Task<PaymentDto?> GetAsync(int id)
    {
        var p = await _db.Payments.Include(x => x.Booking).FirstOrDefaultAsync(x => x.Id == id);
        return p == null ? null : _mapper.Map<PaymentDto>(p);
    }
}
