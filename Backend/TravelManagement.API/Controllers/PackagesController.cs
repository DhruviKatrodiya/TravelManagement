using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PackagesController : ControllerBase
{
    private readonly IPackageService _svc;
    private readonly IStaffService _staff;

    public PackagesController(IPackageService svc, IStaffService staff)
    {
        _svc = svc;
        _staff = staff;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<TourPackageDto>>>> List([FromQuery] int? tourId, [FromQuery] bool? assignedToMe = null)
    {
        IReadOnlyCollection<int>? packageIdsFilter = null;
        if (assignedToMe == true && User.Identity?.IsAuthenticated == true && User.IsInRole("Staff"))
        {
            var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            packageIdsFilter = await _staff.GetAssignedPackageIdsForUserAsync(uid);
        }
        return Ok(ApiResponse<IEnumerable<TourPackageDto>>.Ok(await _svc.ListAsync(tourId, packageIdsFilter)));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TourPackageDto>>> Get(int id)
    {
        var p = await _svc.GetAsync(id);
        return p == null ? NotFound(ApiResponse<TourPackageDto>.Fail("Package not found")) : Ok(ApiResponse<TourPackageDto>.Ok(p));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.PackagesCreate)]
    public async Task<ActionResult<ApiResponse<TourPackageDto>>> Create(TourPackageCreateRequest req)
        => Ok(ApiResponse<TourPackageDto>.Ok(await _svc.CreateAsync(req), "Package created"));

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.PackagesEdit)]
    public async Task<ActionResult<ApiResponse<TourPackageDto>>> Update(int id, TourPackageUpdateRequest req)
    {
        var p = await _svc.UpdateAsync(id, req);
        return p == null ? NotFound(ApiResponse<TourPackageDto>.Fail("Package not found")) : Ok(ApiResponse<TourPackageDto>.Ok(p, "Package updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.PackagesDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Package deleted")) : NotFound(ApiResponse<object>.Fail("Package not found"));

    [HttpGet("{id}/itineraries")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<ItineraryDto>>>> Itineraries(int id)
        => Ok(ApiResponse<IEnumerable<ItineraryDto>>.Ok(await _svc.ListItinerariesAsync(id)));

    [HttpPost("itineraries")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.PackagesEdit)]
    public async Task<ActionResult<ApiResponse<ItineraryDto>>> AddItinerary(ItineraryCreateRequest req)
        => Ok(ApiResponse<ItineraryDto>.Ok(await _svc.AddItineraryAsync(req), "Itinerary added"));

    [HttpDelete("itineraries/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.PackagesEdit)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteItinerary(int id)
        => await _svc.DeleteItineraryAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Removed")) : NotFound(ApiResponse<object>.Fail("Itinerary not found"));
}
