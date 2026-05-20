using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DesignationsController : ControllerBase
{
    private readonly IDesignationService _svc;
    public DesignationsController(IDesignationService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<DesignationDto>>>> List([FromQuery] int? departmentId = null, [FromQuery] bool? activeOnly = null)
        => Ok(ApiResponse<IEnumerable<DesignationDto>>.Ok(await _svc.ListAsync(departmentId, activeOnly)));

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DesignationDto>>> Get(int id)
    {
        var d = await _svc.GetAsync(id);
        return d == null ? NotFound(ApiResponse<DesignationDto>.Fail("Not found")) : Ok(ApiResponse<DesignationDto>.Ok(d));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<DesignationDto>>> Create(DesignationRequest req)
        => Ok(ApiResponse<DesignationDto>.Ok(await _svc.CreateAsync(req), "Designation added"));

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<DesignationDto>>> Update(int id, DesignationRequest req)
    {
        var d = await _svc.UpdateAsync(id, req);
        return d == null ? NotFound(ApiResponse<DesignationDto>.Fail("Not found")) : Ok(ApiResponse<DesignationDto>.Ok(d, "Updated"));
    }

    [HttpPost("{id}/active")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active = true)
        => await _svc.SetActiveAsync(id, active)
            ? Ok(ApiResponse<object>.Ok(new { }, active ? "Activated" : "Deactivated"))
            : NotFound(ApiResponse<object>.Fail("Not found"));
}
