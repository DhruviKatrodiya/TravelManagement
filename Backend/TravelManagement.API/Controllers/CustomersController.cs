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
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _svc;
    private readonly IStaffService _staffSvc;
    private readonly IConfiguration _config;

    public CustomersController(ICustomerService svc, IStaffService staffSvc, IConfiguration config)
    {
        _svc      = svc;
        _staffSvc = staffSvc;
        _config   = config;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpGet]
    [Authorize(Policy = "StaffOrAbove")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CustomerDto>>>> List()
        => Ok(ApiResponse<IEnumerable<CustomerDto>>.Ok(await _svc.ListAsync()));

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> Me()
    {
        var me = await _svc.GetByUserIdAsync(CurrentUserId);
        return me == null ? NotFound(ApiResponse<CustomerDto>.Fail("Customer profile not found")) : Ok(ApiResponse<CustomerDto>.Ok(me));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> Get(int id)
    {
        var c = await _svc.GetAsync(id);
        return c == null ? NotFound(ApiResponse<CustomerDto>.Fail("Not found")) : Ok(ApiResponse<CustomerDto>.Ok(c));
    }

    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> UpdateMe(CustomerUpdateRequest req)
    {
        var me = await _svc.GetByUserIdAsync(CurrentUserId);
        if (me == null) return NotFound(ApiResponse<CustomerDto>.Fail("Customer profile not found"));
        var updated = await _svc.UpdateAsync(me.Id, req);
        return Ok(ApiResponse<CustomerDto>.Ok(updated!, "Profile updated"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CustomersEdit)]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> Update(int id, CustomerUpdateRequest req)
    {
        var existing = await _svc.GetAsync(id);
        if (existing == null) return NotFound(ApiResponse<CustomerDto>.Fail("Not found"));

        if (existing.Phone != req.Phone &&
            !await PermissionHelper.HasPermissionAsync(User, _config, _staffSvc, Permissions.CustomersUpdateMobile))
            return StatusCode(403, ApiResponse<object>.Fail("You do not have permission to update the mobile number."));

        if (existing.Email != req.Email &&
            !await PermissionHelper.HasPermissionAsync(User, _config, _staffSvc, Permissions.CustomersUpdateEmail))
            return StatusCode(403, ApiResponse<object>.Fail("You do not have permission to update the email address."));

        var updated = await _svc.UpdateAsync(id, req);
        return Ok(ApiResponse<CustomerDto>.Ok(updated!, "Updated"));
    }

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CustomersCreate)]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> Create(CustomerCreateRequest req)
        => Ok(ApiResponse<CustomerDto>.Ok(await _svc.CreateAsync(req), "Customer created"));

    [HttpDelete("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CustomersDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deactivated")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpPost("{id}/active")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CustomersEdit)]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active = true)
        => await _svc.SetActiveAsync(id, active)
            ? Ok(ApiResponse<object>.Ok(new { }, active ? "Activated" : "Deactivated"))
            : NotFound(ApiResponse<object>.Fail("Not found"));
}
