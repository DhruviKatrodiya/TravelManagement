using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _svc;
    public DepartmentsController(IDepartmentService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<DepartmentDto>>>> List([FromQuery] bool? activeOnly = null)
        => Ok(ApiResponse<IEnumerable<DepartmentDto>>.Ok(await _svc.ListAsync(activeOnly)));

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Get(int id)
    {
        var d = await _svc.GetAsync(id);
        return d == null ? NotFound(ApiResponse<DepartmentDto>.Fail("Not found")) : Ok(ApiResponse<DepartmentDto>.Ok(d));
    }

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.DepartmentsCreate)]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Create(DepartmentRequest req)
        => Ok(ApiResponse<DepartmentDto>.Ok(await _svc.CreateAsync(req), "Department added"));

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.DepartmentsEdit)]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Update(int id, DepartmentRequest req)
    {
        var d = await _svc.UpdateAsync(id, req);
        return d == null ? NotFound(ApiResponse<DepartmentDto>.Fail("Not found")) : Ok(ApiResponse<DepartmentDto>.Ok(d, "Updated"));
    }

    [HttpPost("{id}/active")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.DepartmentsToggle)]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active = true)
        => await _svc.SetActiveAsync(id, active)
            ? Ok(ApiResponse<object>.Ok(new { }, active ? "Activated" : "Deactivated"))
            : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpDelete("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.DepartmentsDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
