using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class VehicleService : IVehicleService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;
    private readonly IEmailService _email;

    public VehicleService(TravelDbContext db, IMapper mapper, IEmailService email)
    {
        _db = db;
        _mapper = mapper;
        _email = email;
    }

    public async Task<IEnumerable<VehicleDto>> ListAsync(bool? availableOnly = null)
    {
        var q = _db.Vehicles.AsQueryable();
        if (availableOnly == true) q = q.Where(v => v.IsAvailable);
        var items = await q.OrderBy(v => v.Name).ToListAsync();
        return _mapper.Map<List<VehicleDto>>(items);
    }

    public async Task<VehicleDto?> GetAsync(int id)
    {
        var v = await _db.Vehicles.FindAsync(id);
        return v == null ? null : _mapper.Map<VehicleDto>(v);
    }

    public async Task<VehicleDto> CreateAsync(VehicleCreateRequest req)
    {
        var v = _mapper.Map<Vehicle>(req);
        _db.Vehicles.Add(v);
        await _db.SaveChangesAsync();
        return _mapper.Map<VehicleDto>(v);
    }

    public async Task<VehicleDto?> UpdateAsync(int id, VehicleCreateRequest req)
    {
        var v = await _db.Vehicles.FindAsync(id);
        if (v == null) return null;
        _mapper.Map(req, v);
        await _db.SaveChangesAsync();
        return _mapper.Map<VehicleDto>(v);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await SetActiveAsync(id, false);
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var v = await _db.Vehicles.FindAsync(id);
        if (v == null) return false;
        v.IsActive = active;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<VehicleAllocationDto>> ListAllocationsAsync(DateTime? from = null, DateTime? to = null)
    {
        var q = _db.VehicleAllocations
            .Include(a => a.Vehicle)
            .Include(a => a.Driver)
            .Include(a => a.StaffAssignments).ThenInclude(sa => sa.Staff).ThenInclude(s => s!.User)
            .Include(a => a.Booking)
            .AsQueryable();

        if (from.HasValue) q = q.Where(a => a.EndDate >= from.Value);
        if (to.HasValue) q = q.Where(a => a.StartDate <= to.Value);

        var items = await q.OrderBy(a => a.StartDate).ToListAsync();
        return _mapper.Map<List<VehicleAllocationDto>>(items);
    }

    public async Task<VehicleAllocationDto> AllocateAsync(VehicleAllocationCreateRequest req)
    {
        var overlap = await _db.VehicleAllocations.AnyAsync(a =>
            a.VehicleId == req.VehicleId &&
            a.StartDate < req.EndDate && a.EndDate > req.StartDate);
        if (overlap)
            throw new InvalidOperationException("Vehicle is already allocated for the requested period.");

        if (req.DriverId.HasValue)
        {
            var driverOverlap = await _db.VehicleAllocations.AnyAsync(a =>
                a.DriverId == req.DriverId &&
                a.StartDate < req.EndDate && a.EndDate > req.StartDate);
            if (driverOverlap)
                throw new InvalidOperationException("Driver is already allocated for the requested period.");
        }

        if (req.StaffIds != null && req.StaffIds.Count > 0)
        {
            var staffIds = req.StaffIds.Distinct().ToList();
            var staffOverlap = await _db.VehicleAllocationStaff.AnyAsync(sa =>
                staffIds.Contains(sa.StaffId) &&
                sa.VehicleAllocation!.StartDate < req.EndDate &&
                sa.VehicleAllocation.EndDate > req.StartDate);
            if (staffOverlap)
                throw new InvalidOperationException("One or more staff members are already allocated for the requested period.");
        }

        var allocation = _mapper.Map<VehicleAllocation>(req);
        foreach (var sid in (req.StaffIds ?? new()).Distinct())
            allocation.StaffAssignments.Add(new VehicleAllocationStaff { StaffId = sid });
        _db.VehicleAllocations.Add(allocation);
        await _db.SaveChangesAsync();

        var fresh = await _db.VehicleAllocations
            .Include(a => a.Vehicle)
            .Include(a => a.Driver)
            .Include(a => a.StaffAssignments).ThenInclude(sa => sa.Staff).ThenInclude(s => s!.User)
            .Include(a => a.Booking)
            .FirstAsync(a => a.Id == allocation.Id);

        await NotifyAllocationParticipantsAsync(fresh, "assigned");

        return _mapper.Map<VehicleAllocationDto>(fresh);
    }

    public async Task<VehicleAllocationDto?> UpdateAllocationAsync(int id, VehicleAllocationCreateRequest req)
    {
        var existing = await _db.VehicleAllocations
            .Include(a => a.StaffAssignments)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (existing == null) return null;

        var overlap = await _db.VehicleAllocations.AnyAsync(a =>
            a.Id != id &&
            a.VehicleId == req.VehicleId &&
            a.StartDate < req.EndDate && a.EndDate > req.StartDate);
        if (overlap)
            throw new InvalidOperationException("Vehicle is already allocated for the requested period.");

        if (req.DriverId.HasValue)
        {
            var driverOverlap = await _db.VehicleAllocations.AnyAsync(a =>
                a.Id != id &&
                a.DriverId == req.DriverId &&
                a.StartDate < req.EndDate && a.EndDate > req.StartDate);
            if (driverOverlap)
                throw new InvalidOperationException("Driver is already allocated for the requested period.");
        }

        if (req.StaffIds != null && req.StaffIds.Count > 0)
        {
            var staffIds = req.StaffIds.Distinct().ToList();
            var staffOverlap = await _db.VehicleAllocationStaff.AnyAsync(sa =>
                sa.VehicleAllocationId != id &&
                staffIds.Contains(sa.StaffId) &&
                sa.VehicleAllocation!.StartDate < req.EndDate &&
                sa.VehicleAllocation.EndDate > req.StartDate);
            if (staffOverlap)
                throw new InvalidOperationException("One or more staff members are already allocated for the requested period.");
        }

        existing.VehicleId = req.VehicleId;
        existing.DriverId = req.DriverId;
        existing.BookingId = req.BookingId;
        existing.StartDate = req.StartDate;
        existing.EndDate = req.EndDate;
        existing.Notes = req.Notes;

        var desired = (req.StaffIds ?? new()).Distinct().ToHashSet();
        var current = existing.StaffAssignments.ToList();
        foreach (var sa in current.Where(x => !desired.Contains(x.StaffId)))
            _db.VehicleAllocationStaff.Remove(sa);
        var currentIds = current.Select(x => x.StaffId).ToHashSet();
        foreach (var sid in desired.Where(x => !currentIds.Contains(x)))
            existing.StaffAssignments.Add(new VehicleAllocationStaff { VehicleAllocationId = id, StaffId = sid });

        await _db.SaveChangesAsync();

        var fresh = await _db.VehicleAllocations
            .Include(a => a.Vehicle)
            .Include(a => a.Driver)
            .Include(a => a.StaffAssignments).ThenInclude(sa => sa.Staff).ThenInclude(s => s!.User)
            .Include(a => a.Booking)
            .FirstAsync(a => a.Id == existing.Id);

        await NotifyAllocationParticipantsAsync(fresh, "updated");

        return _mapper.Map<VehicleAllocationDto>(fresh);
    }

    private async Task NotifyAllocationParticipantsAsync(VehicleAllocation allocation, string action)
    {
        var body = $@"<h2>You have been {action} to a trip</h2>
                      <p><b>Vehicle:</b> {allocation.Vehicle?.Name} ({allocation.Vehicle?.RegistrationNumber})</p>
                      <p><b>Period:</b> {allocation.StartDate:dd MMM yyyy} → {allocation.EndDate:dd MMM yyyy}</p>
                      <p><b>Booking:</b> {(allocation.Booking != null ? allocation.Booking.BookingReference : "(none)")}</p>
                      <p><b>Notes:</b> {allocation.Notes}</p>";

        if (allocation.Driver != null && !string.IsNullOrWhiteSpace(allocation.Driver.Email))
        {
            _ = _email.SendAsync(allocation.Driver.Email, allocation.Driver.FullName,
                $"Trip {action}: {allocation.Vehicle?.Name}", body);
        }

        foreach (var sa in allocation.StaffAssignments)
        {
            if (sa.Staff?.User == null) continue;
            _ = _email.SendAsync(sa.Staff.User.Email, sa.Staff.User.FullName,
                $"Trip {action}: {allocation.Vehicle?.Name}", body);
        }

        await Task.CompletedTask;
    }

    public async Task<bool> DeleteAllocationAsync(int id)
    {
        var a = await _db.VehicleAllocations.FindAsync(id);
        if (a == null) return false;
        _db.VehicleAllocations.Remove(a);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<VehicleDto>> GetAvailableAsync(DateTime from, DateTime to)
    {
        var busyIds = await _db.VehicleAllocations
            .Where(a => a.StartDate < to && a.EndDate > from)
            .Select(a => a.VehicleId)
            .ToListAsync();

        var items = await _db.Vehicles
            .Where(v => v.IsAvailable && !busyIds.Contains(v.Id))
            .ToListAsync();
        return _mapper.Map<List<VehicleDto>>(items);
    }
}
