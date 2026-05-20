using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOrAbove")]
[RequirePermission(Permissions.RolesView)]
public class RolesController : ControllerBase
{
    private readonly IRoleService _svc;
    public RolesController(IRoleService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<AppRoleDto>>>> List([FromQuery] bool? activeOnly = null)
        => Ok(ApiResponse<IEnumerable<AppRoleDto>>.Ok(await _svc.ListAsync(activeOnly)));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AppRoleDto>>> Get(int id)
    {
        var r = await _svc.GetAsync(id);
        return r == null ? NotFound(ApiResponse<AppRoleDto>.Fail("Not found")) : Ok(ApiResponse<AppRoleDto>.Ok(r));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AppRoleDto>>> Create(AppRoleCreateRequest req)
        => Ok(ApiResponse<AppRoleDto>.Ok(await _svc.CreateAsync(req), "Role created"));

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<AppRoleDto>>> Update(int id, AppRoleUpdateRequest req)
    {
        var r = await _svc.UpdateAsync(id, req);
        return r == null ? NotFound(ApiResponse<AppRoleDto>.Fail("Not found")) : Ok(ApiResponse<AppRoleDto>.Ok(r, "Updated"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpPost("{id}/active")]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active)
        => await _svc.SetActiveAsync(id, active) ? Ok(ApiResponse<object>.Ok(new { }, "Updated")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
