using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class DriverService : IDriverService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;
    private readonly IEmailService _email;

    public DriverService(TravelDbContext db, IMapper mapper, IEmailService email)
    {
        _db = db;
        _mapper = mapper;
        _email = email;
    }

    public async Task<IEnumerable<DriverDto>> ListAsync()
    {
        var items = await _db.Drivers.OrderBy(d => d.FullName).ToListAsync();
        return _mapper.Map<List<DriverDto>>(items);
    }

    public async Task<DriverDto?> GetAsync(int id)
    {
        var d = await _db.Drivers.FindAsync(id);
        return d == null ? null : _mapper.Map<DriverDto>(d);
    }

    public async Task<DriverDto> CreateAsync(DriverCreateRequest req)
    {
        var d = _mapper.Map<Driver>(req);
        _db.Drivers.Add(d);
        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(d.Email))
        {
            _ = _email.SendAsync(d.Email, d.FullName,
                "You have been added as a driver",
                $@"<h2>Welcome, {d.FullName}!</h2>
                   <p>You have been added to the Travel Management driver roster.</p>
                   <p><b>License:</b> {d.LicenseNumber}</p>
                   <p><b>Experience:</b> {d.ExperienceYears} year(s)</p>");
        }

        return _mapper.Map<DriverDto>(d);
    }

    public async Task<DriverDto?> UpdateAsync(int id, DriverCreateRequest req)
    {
        var d = await _db.Drivers.FindAsync(id);
        if (d == null) return null;
        _mapper.Map(req, d);
        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(d.Email))
        {
            _ = _email.SendAsync(d.Email, d.FullName,
                "Your driver profile was updated",
                $@"<h2>Profile updated</h2>
                   <p>Hi {d.FullName}, an administrator updated your driver profile.</p>
                   <p><b>License:</b> {d.LicenseNumber}</p>
                   <p>If you did not expect this change, please contact support.</p>");
        }

        return _mapper.Map<DriverDto>(d);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await SetActiveAsync(id, false);
    }

    public async Task<bool> SetActiveAsync(int id, bool active)
    {
        var d = await _db.Drivers.FindAsync(id);
        if (d == null) return false;
        d.IsActive = active;
        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(d.Email))
        {
            var subject = active ? "You have been reactivated as a driver" : "You have been deactivated as a driver";
            var body = active
                ? $@"<h2>Welcome back!</h2><p>Hi {d.FullName}, your driver profile is active again.</p>"
                : $@"<h2>Driver profile deactivated</h2><p>Hi {d.FullName}, your driver profile has been deactivated and removed from the assignment pool. Please contact support if you have questions.</p>";
            _ = _email.SendAsync(d.Email, d.FullName, subject, body);
        }

        return true;
    }
}
