using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _svc;

    public SchedulesController(IScheduleService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<TourScheduleDto>>>> List([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(ApiResponse<IEnumerable<TourScheduleDto>>.Ok(await _svc.ListAsync(from, to)));

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.SchedulesCreate)]
    public async Task<ActionResult<ApiResponse<TourScheduleDto>>> Create(TourScheduleCreateRequest req)
        => Ok(ApiResponse<TourScheduleDto>.Ok(await _svc.CreateAsync(req), "Schedule created"));

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.SchedulesEdit)]
    public async Task<ActionResult<ApiResponse<TourScheduleDto>>> Update(int id, TourScheduleCreateRequest req)
    {
        var s = await _svc.UpdateAsync(id, req);
        return s == null ? NotFound(ApiResponse<TourScheduleDto>.Fail("Schedule not found")) : Ok(ApiResponse<TourScheduleDto>.Ok(s, "Schedule updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.SchedulesDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
