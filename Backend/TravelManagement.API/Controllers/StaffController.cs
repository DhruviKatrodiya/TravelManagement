using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _svc;
    public StaffController(IStaffService svc) => _svc = svc;

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<IEnumerable<StaffDto>>>> List()
        => Ok(ApiResponse<IEnumerable<StaffDto>>.Ok(await _svc.ListAsync()));

    [HttpPost] 
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<StaffDto>>> Create(StaffCreateRequest req)
        => Ok(ApiResponse<StaffDto>.Ok(await _svc.CreateAsync(req), "Staff created"));

    [HttpPut("{id}")] 
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<StaffDto>>> Update(int id, StaffUpdateRequest req)
    {
        var s = await _svc.UpdateAsync(id, req);
        return s == null ? NotFound(ApiResponse<StaffDto>.Fail("Not found")) : Ok(ApiResponse<StaffDto>.Ok(s, "Updated"));
    }

    [HttpDelete("{id}")] 
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpGet("permissions/catalog")]
    [AllowAnonymous]
    [Authorize(Roles = "Admin")]
    public ActionResult<ApiResponse<IEnumerable<string>>> PermissionsCatalog()
        => Ok(ApiResponse<IEnumerable<string>>.Ok(Permissions.All));

    [HttpGet("{id}/permissions")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetPermissions(int id)
        => Ok(ApiResponse<IEnumerable<string>>.Ok(await _svc.GetPermissionsAsync(id)));

    [HttpPut("{id}/permissions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> SetPermissions(int id, StaffPermissionsUpdateRequest req)
    {
        var allowed = Permissions.All.ToHashSet();
        var sanitized = req.Permissions.Where(p => allowed.Contains(p)).ToList();
        var ok = await _svc.SetPermissionsAsync(id, sanitized);
        return ok ? Ok(ApiResponse<object>.Ok(new { }, "Permissions updated")) : NotFound(ApiResponse<object>.Fail("Staff not found"));
    }
}
