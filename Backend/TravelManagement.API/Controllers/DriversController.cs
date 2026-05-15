using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Staff")]
public class DriversController : ControllerBase
{
    private readonly IDriverService _svc;

    public DriversController(IDriverService svc) => _svc = svc;

    [HttpGet] public async Task<ActionResult<ApiResponse<IEnumerable<DriverDto>>>> List()
        => Ok(ApiResponse<IEnumerable<DriverDto>>.Ok(await _svc.ListAsync()));

    [HttpGet("{id}")] public async Task<ActionResult<ApiResponse<DriverDto>>> Get(int id)
    {
        var d = await _svc.GetAsync(id);
        return d == null ? NotFound(ApiResponse<DriverDto>.Fail("Not found")) : Ok(ApiResponse<DriverDto>.Ok(d));
    }

    [HttpPost]
    [RequirePermission(Permissions.DriversCreate)]
    public async Task<ActionResult<ApiResponse<DriverDto>>> Create(DriverCreateRequest req)
        => Ok(ApiResponse<DriverDto>.Ok(await _svc.CreateAsync(req), "Driver added"));

    [HttpPut("{id}")]
    [RequirePermission(Permissions.DriversEdit)]
    public async Task<ActionResult<ApiResponse<DriverDto>>> Update(int id, DriverCreateRequest req)
    {
        var d = await _svc.UpdateAsync(id, req);
        return d == null ? NotFound(ApiResponse<DriverDto>.Fail("Not found")) : Ok(ApiResponse<DriverDto>.Ok(d, "Updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.DriversDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deactivated")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpPost("{id}/active")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.DriversEdit)]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active = true)
        => await _svc.SetActiveAsync(id, active)
            ? Ok(ApiResponse<object>.Ok(new { }, active ? "Activated" : "Deactivated"))
            : NotFound(ApiResponse<object>.Fail("Not found"));
}
