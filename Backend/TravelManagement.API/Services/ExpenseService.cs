using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class ExpenseService : IExpenseService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public ExpenseService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ExpenseDto>> ListAsync(int? bookingId = null, DateTime? from = null, DateTime? to = null)
    {
        var q = _db.Expenses.Include(e => e.Booking).Include(e => e.TourPackage).AsQueryable();
        if (bookingId.HasValue) q = q.Where(e => e.BookingId == bookingId.Value);
        if (from.HasValue) q = q.Where(e => e.ExpenseDate >= from.Value);
        if (to.HasValue) q = q.Where(e => e.ExpenseDate <= to.Value);
        var items = await q.OrderByDescending(e => e.ExpenseDate).ToListAsync();
        return _mapper.Map<List<ExpenseDto>>(items);
    }

    public async Task<ExpenseDto> CreateAsync(ExpenseCreateRequest req)
    {
        var e = _mapper.Map<Expense>(req);
        _db.Expenses.Add(e);
        await _db.SaveChangesAsync();
        var fresh = await _db.Expenses.Include(x => x.Booking).Include(x => x.TourPackage).FirstAsync(x => x.Id == e.Id);
        return _mapper.Map<ExpenseDto>(fresh);
    }

    public async Task<ExpenseDto?> UpdateAsync(int id, ExpenseCreateRequest req)
    {
        var e = await _db.Expenses.FindAsync(id);
        if (e == null) return null;
        _mapper.Map(req, e);
        await _db.SaveChangesAsync();
        return _mapper.Map<ExpenseDto>(e);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var e = await _db.Expenses.FindAsync(id);
        if (e == null) return false;
        _db.Expenses.Remove(e);
        await _db.SaveChangesAsync();
        return true;
    }
}
