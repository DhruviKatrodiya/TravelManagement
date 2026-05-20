using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/home-destinations")]
public class HomeDestinationsController : ControllerBase
{
    private readonly IHomeDestinationService _svc;
    private readonly IStaffService _staff;

    public HomeDestinationsController(IHomeDestinationService svc, IStaffService staff)
    {
        _svc = svc;
        _staff = staff;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<HomeDestinationDto>>>> List([FromQuery] bool? activeOnly = true, [FromQuery] bool? assignedToMe = null)
    {
        IReadOnlyCollection<int>? tourIdsFilter = null;
        if (assignedToMe == true && User.Identity?.IsAuthenticated == true && User.IsInRole("Staff"))
        {
            var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            tourIdsFilter = await _staff.GetAssignedTourIdsForUserAsync(uid);
        }
        return Ok(ApiResponse<IEnumerable<HomeDestinationDto>>.Ok(await _svc.ListAsync(activeOnly, tourIdsFilter)));
    }

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.DestinationsCreate)]
    public async Task<ActionResult<ApiResponse<HomeDestinationDto>>> Create(HomeDestinationRequest req)
        => Ok(ApiResponse<HomeDestinationDto>.Ok(await _svc.CreateAsync(req), "Destination created"));

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.DestinationsEdit)]
    public async Task<ActionResult<ApiResponse<HomeDestinationDto>>> Update(int id, HomeDestinationRequest req)
    {
        var d = await _svc.UpdateAsync(id, req);
        return d == null ? NotFound(ApiResponse<HomeDestinationDto>.Fail("Not found")) : Ok(ApiResponse<HomeDestinationDto>.Ok(d, "Destination updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.DestinationsDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Destination deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
