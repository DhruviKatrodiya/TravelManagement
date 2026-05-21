using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _svc;
    private readonly IConfiguration _config;

    public StaffController(IStaffService svc, IConfiguration config)
    {
        _svc    = svc;
        _config = config;
    }

    [HttpGet]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CustomersView)]
    public async Task<ActionResult<ApiResponse<IEnumerable<StaffDto>>>> List()
        => Ok(ApiResponse<IEnumerable<StaffDto>>.Ok(await _svc.ListAsync()));

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CustomersCreate)]
    public async Task<ActionResult<ApiResponse<StaffDto>>> Create(StaffCreateRequest req)
        => Ok(ApiResponse<StaffDto>.Ok(await _svc.CreateAsync(req), "Staff created"));

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CustomersEdit)]
    public async Task<ActionResult<ApiResponse<StaffDto>>> Update(int id, StaffUpdateRequest req)
    {
        var existing = (await _svc.ListAsync()).FirstOrDefault(s => s.Id == id);
        if (existing == null) return NotFound(ApiResponse<StaffDto>.Fail("Not found"));

        if (existing.Phone != req.Phone &&
            !await PermissionHelper.HasPermissionAsync(User, _config, _svc, Permissions.CustomersUpdateMobile))
            return StatusCode(403, ApiResponse<object>.Fail("You do not have permission to update the mobile number."));

        if (existing.Email != req.Email &&
            !await PermissionHelper.HasPermissionAsync(User, _config, _svc, Permissions.CustomersUpdateEmail))
            return StatusCode(403, ApiResponse<object>.Fail("You do not have permission to update the email address."));

        var s = await _svc.UpdateAsync(id, req);
        return s == null ? NotFound(ApiResponse<StaffDto>.Fail("Not found")) : Ok(ApiResponse<StaffDto>.Ok(s, "Updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CustomersDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpGet("permissions/catalog")]
    [AllowAnonymous]
    [Authorize(Policy = "AdminOrAbove")]
    public ActionResult<ApiResponse<IEnumerable<string>>> PermissionsCatalog()
        => Ok(ApiResponse<IEnumerable<string>>.Ok(Permissions.All));

    [HttpGet("{id}/permissions")]
    [Authorize(Policy = "StaffOrAbove")]
    public async Task<ActionResult<ApiResponse<IEnumerable<string>>>> GetPermissions(int id)
        => Ok(ApiResponse<IEnumerable<string>>.Ok(await _svc.GetPermissionsAsync(id)));

    [HttpPut("{id}/permissions")]
    [Authorize(Policy = "AdminOrAbove")]
    public async Task<ActionResult<ApiResponse<object>>> SetPermissions(int id, StaffPermissionsUpdateRequest req)
    {
        var allowed = Permissions.All.ToHashSet();
        var sanitized = req.Permissions.Where(p => allowed.Contains(p)).ToList();
        var ok = await _svc.SetPermissionsAsync(id, sanitized);
        return ok ? Ok(ApiResponse<object>.Ok(new { }, "Permissions updated")) : NotFound(ApiResponse<object>.Fail("Staff not found"));
    }
}
