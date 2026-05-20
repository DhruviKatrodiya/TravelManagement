using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Helpers;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tours;
    private readonly IReviewService _reviews;
    private readonly IStaffService _staff;

    public ToursController(ITourService tours, IReviewService reviews, IStaffService staff)
    {
        _tours = tours;
        _reviews = reviews;
        _staff = staff;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<TourDto>>>> List([FromQuery] Destination? destination, [FromQuery] string? q, [FromQuery] int? homeDestinationId, [FromQuery] bool? activeOnly = true, [FromQuery] bool? assignedToMe = null)
    {
        IReadOnlyCollection<int>? tourIdsFilter = null;
        if (assignedToMe == true && User.Identity?.IsAuthenticated == true && User.IsInRole("Staff"))
        {
            var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            tourIdsFilter = await _staff.GetAssignedTourIdsForUserAsync(uid);
        }
        return Ok(ApiResponse<IEnumerable<TourDto>>.Ok(await _tours.ListAsync(destination, q, homeDestinationId, activeOnly, tourIdsFilter)));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TourDto>>> Get(int id)
    {
        var t = await _tours.GetAsync(id);
        return t == null ? NotFound(ApiResponse<TourDto>.Fail("Tour not found")) : Ok(ApiResponse<TourDto>.Ok(t));
    }

    [HttpGet("{id}/reviews")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReviewDto>>>> Reviews(int id)
        => Ok(ApiResponse<IEnumerable<ReviewDto>>.Ok(await _reviews.ListByTourAsync(id)));

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.ToursCreate)]
    public async Task<ActionResult<ApiResponse<TourDto>>> Create(TourCreateRequest req)
        => Ok(ApiResponse<TourDto>.Ok(await _tours.CreateAsync(req), "Tour created"));

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.ToursEdit)]
    public async Task<ActionResult<ApiResponse<TourDto>>> Update(int id, TourUpdateRequest req)
    {
        var updated = await _tours.UpdateAsync(id, req);
        return updated == null ? NotFound(ApiResponse<TourDto>.Fail("Tour not found")) : Ok(ApiResponse<TourDto>.Ok(updated, "Tour updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.ToursDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _tours.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Tour deleted")) : NotFound(ApiResponse<object>.Fail("Tour not found"));
}
