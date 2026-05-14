using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class ReviewService : IReviewService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public ReviewService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ReviewDto>> ListByTourAsync(int tourId)
    {
        var items = await _db.Reviews
            .Include(r => r.Customer).ThenInclude(c => c.User)
            .Include(r => r.Tour)
            .Where(r => r.TourId == tourId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return _mapper.Map<List<ReviewDto>>(items);
    }

    public async Task<IEnumerable<ReviewDto>> ListAllAsync()
    {
        var items = await _db.Reviews
            .Include(r => r.Customer).ThenInclude(c => c.User)
            .Include(r => r.Tour)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return _mapper.Map<List<ReviewDto>>(items);
    }

    public async Task<IEnumerable<ReviewDto>> ListFeaturedAsync(int take = 6)
    {
        if (take <= 0) take = 6;
        if (take > 24) take = 24;
        var items = await _db.Reviews
            .Include(r => r.Customer).ThenInclude(c => c.User)
            .Include(r => r.Tour)
            .Where(r => r.IsApproved && r.Rating >= 4)
            .OrderByDescending(r => r.Rating)
            .ThenByDescending(r => r.CreatedAt)
            .Take(take)
            .ToListAsync();
        return _mapper.Map<List<ReviewDto>>(items);
    }

    public async Task<ReviewDto> CreateAsync(int customerUserId, ReviewCreateRequest req)
    {
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.UserId == customerUserId)
            ?? throw new InvalidOperationException("Customer profile missing.");

        var tourId = req.TourId;

        if (req.BookingId.HasValue)
        {
            var booking = await _db.Bookings
                .Include(b => b.TourPackage)
                .FirstOrDefaultAsync(b => b.Id == req.BookingId.Value);
            if (booking == null)
                throw new KeyNotFoundException("Booking not found.");
            if (booking.CustomerId != customer.Id)
                throw new UnauthorizedAccessException("You can only review your own bookings.");

            if (tourId <= 0) tourId = booking.TourPackage.TourId;

            var alreadyReviewed = await _db.Reviews.AnyAsync(r => r.BookingId == booking.Id);
            if (alreadyReviewed)
                throw new InvalidOperationException("You have already reviewed this booking.");
        }

        if (tourId <= 0)
            throw new InvalidOperationException("Either tourId or bookingId is required.");

        var review = new Review
        {
            CustomerId = customer.Id,
            TourId = tourId,
            BookingId = req.BookingId,
            Rating = req.Rating,
            Title = req.Title,
            Comment = req.Comment,
            IsApproved = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();

        var fresh = await _db.Reviews
            .Include(r => r.Customer).ThenInclude(c => c.User)
            .Include(r => r.Tour)
            .FirstAsync(r => r.Id == review.Id);
        return _mapper.Map<ReviewDto>(fresh);
    }

    public async Task<bool> ApproveAsync(int id, bool approved)
    {
        var r = await _db.Reviews.FindAsync(id);
        if (r == null) return false;
        r.IsApproved = approved;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var r = await _db.Reviews.FindAsync(id);
        if (r == null) return false;
        _db.Reviews.Remove(r);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ReviewDto>> ListByCustomerUserAsync(int customerUserId)
    {
        var items = await _db.Reviews
            .Include(r => r.Customer).ThenInclude(c => c.User)
            .Include(r => r.Tour)
            .Where(r => r.Customer.UserId == customerUserId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return _mapper.Map<List<ReviewDto>>(items);
    }

    public async Task<bool> DeleteByCustomerAsync(int id, int customerUserId)
    {
        var r = await _db.Reviews
            .Include(x => x.Customer)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return false;
        if (r.Customer.UserId != customerUserId)
            throw new UnauthorizedAccessException("You can only delete your own reviews.");
        _db.Reviews.Remove(r);
        await _db.SaveChangesAsync();
        return true;
    }
}
