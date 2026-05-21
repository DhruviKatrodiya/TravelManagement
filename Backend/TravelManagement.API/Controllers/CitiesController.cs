using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CitiesController : ControllerBase
{
    private readonly ICityService _svc;
    public CitiesController(ICityService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<CityDto>>>> List([FromQuery] int? stateId = null, [FromQuery] int? countryId = null, [FromQuery] bool? activeOnly = null)
        => Ok(ApiResponse<IEnumerable<CityDto>>.Ok(await _svc.ListAsync(stateId, countryId, activeOnly)));

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<CityDto>>> Get(int id)
    {
        var c = await _svc.GetAsync(id);
        return c == null ? NotFound(ApiResponse<CityDto>.Fail("Not found")) : Ok(ApiResponse<CityDto>.Ok(c));
    }

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CitiesCreate)]
    public async Task<ActionResult<ApiResponse<CityDto>>> Create(CityRequest req)
        => Ok(ApiResponse<CityDto>.Ok(await _svc.CreateAsync(req), "City added"));

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CitiesEdit)]
    public async Task<ActionResult<ApiResponse<CityDto>>> Update(int id, CityRequest req)
    {
        var c = await _svc.UpdateAsync(id, req);
        return c == null ? NotFound(ApiResponse<CityDto>.Fail("Not found")) : Ok(ApiResponse<CityDto>.Ok(c, "Updated"));
    }

    [HttpPost("{id}/active")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CitiesToggle)]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active = true)
        => await _svc.SetActiveAsync(id, active)
            ? Ok(ApiResponse<object>.Ok(new { }, active ? "Activated" : "Deactivated"))
            : NotFound(ApiResponse<object>.Fail("Not found"));
}
