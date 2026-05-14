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

    public VehicleService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
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
        var v = await _db.Vehicles.FindAsync(id);
        if (v == null) return false;
        _db.Vehicles.Remove(v);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<VehicleAllocationDto>> ListAllocationsAsync(DateTime? from = null, DateTime? to = null)
    {
        var q = _db.VehicleAllocations
            .Include(a => a.Vehicle)
            .Include(a => a.Driver)
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

        var allocation = _mapper.Map<VehicleAllocation>(req);
        _db.VehicleAllocations.Add(allocation);
        await _db.SaveChangesAsync();

        var fresh = await _db.VehicleAllocations
            .Include(a => a.Vehicle)
            .Include(a => a.Driver)
            .Include(a => a.Booking)
            .FirstAsync(a => a.Id == allocation.Id);
        return _mapper.Map<VehicleAllocationDto>(fresh);
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
