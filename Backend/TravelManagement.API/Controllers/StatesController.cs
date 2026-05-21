using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatesController : ControllerBase
{
    private readonly IStateService _svc;
    public StatesController(IStateService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<StateDto>>>> List([FromQuery] int? countryId = null, [FromQuery] bool? activeOnly = null)
        => Ok(ApiResponse<IEnumerable<StateDto>>.Ok(await _svc.ListAsync(countryId, activeOnly)));

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<StateDto>>> Get(int id)
    {
        var s = await _svc.GetAsync(id);
        return s == null ? NotFound(ApiResponse<StateDto>.Fail("Not found")) : Ok(ApiResponse<StateDto>.Ok(s));
    }

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.StatesCreate)]
    public async Task<ActionResult<ApiResponse<StateDto>>> Create(StateRequest req)
        => Ok(ApiResponse<StateDto>.Ok(await _svc.CreateAsync(req), "State added"));

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.StatesEdit)]
    public async Task<ActionResult<ApiResponse<StateDto>>> Update(int id, StateRequest req)
    {
        var s = await _svc.UpdateAsync(id, req);
        return s == null ? NotFound(ApiResponse<StateDto>.Fail("Not found")) : Ok(ApiResponse<StateDto>.Ok(s, "Updated"));
    }

    [HttpPost("{id}/active")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.StatesToggle)]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active = true)
        => await _svc.SetActiveAsync(id, active)
            ? Ok(ApiResponse<object>.Ok(new { }, active ? "Activated" : "Deactivated"))
            : NotFound(ApiResponse<object>.Fail("Not found"));
}
