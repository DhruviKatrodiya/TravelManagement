using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Staff")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _svc;

    public VehiclesController(IVehicleService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<VehicleDto>>>> List([FromQuery] bool? availableOnly)
        => Ok(ApiResponse<IEnumerable<VehicleDto>>.Ok(await _svc.ListAsync(availableOnly)));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> Get(int id)
    {
        var v = await _svc.GetAsync(id);
        return v == null ? NotFound(ApiResponse<VehicleDto>.Fail("Not found")) : Ok(ApiResponse<VehicleDto>.Ok(v));
    }

    [HttpPost]
    [RequirePermission(Permissions.VehiclesCreate)]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> Create(VehicleCreateRequest req)
        => Ok(ApiResponse<VehicleDto>.Ok(await _svc.CreateAsync(req), "Vehicle created"));

    [HttpPut("{id}")]
    [RequirePermission(Permissions.VehiclesEdit)]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> Update(int id, VehicleCreateRequest req)
    {
        var v = await _svc.UpdateAsync(id, req);
        return v == null ? NotFound(ApiResponse<VehicleDto>.Fail("Not found")) : Ok(ApiResponse<VehicleDto>.Ok(v, "Vehicle updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.VehiclesDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deactivated")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpPost("{id}/active")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.VehiclesEdit)]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active = true)
        => await _svc.SetActiveAsync(id, active)
            ? Ok(ApiResponse<object>.Ok(new { }, active ? "Activated" : "Deactivated"))
            : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpGet("allocations")]
    public async Task<ActionResult<ApiResponse<IEnumerable<VehicleAllocationDto>>>> Allocations([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(ApiResponse<IEnumerable<VehicleAllocationDto>>.Ok(await _svc.ListAllocationsAsync(from, to)));

    [HttpPost("allocations")]
    [RequirePermission(Permissions.AllocationsCreate)]
    public async Task<ActionResult<ApiResponse<VehicleAllocationDto>>> Allocate(VehicleAllocationCreateRequest req)
        => Ok(ApiResponse<VehicleAllocationDto>.Ok(await _svc.AllocateAsync(req), "Vehicle allocated"));

    [HttpPut("allocations/{id}")]
    [RequirePermission(Permissions.AllocationsEdit)]
    public async Task<ActionResult<ApiResponse<VehicleAllocationDto>>> UpdateAllocation(int id, VehicleAllocationCreateRequest req)
    {
        var updated = await _svc.UpdateAllocationAsync(id, req);
        return updated == null
            ? NotFound(ApiResponse<VehicleAllocationDto>.Fail("Not found"))
            : Ok(ApiResponse<VehicleAllocationDto>.Ok(updated, "Allocation updated"));
    }

    [HttpDelete("allocations/{id}")]
    [RequirePermission(Permissions.AllocationsDelete)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteAllocation(int id)
        => await _svc.DeleteAllocationAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Removed")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpGet("available")]
    public async Task<ActionResult<ApiResponse<IEnumerable<VehicleDto>>>> Available([FromQuery] DateTime from, [FromQuery] DateTime to)
        => Ok(ApiResponse<IEnumerable<VehicleDto>>.Ok(await _svc.GetAvailableAsync(from, to)));
}
