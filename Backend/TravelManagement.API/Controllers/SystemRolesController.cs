using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;

namespace TravelManagement.API.Controllers;

/// <summary>
/// Exposes system role configuration to the frontend.
/// Roles are defined in appsettings.json under "SystemRoles" — adding a new role
/// there is the only change needed to make it available throughout the entire system.
/// </summary>
[ApiController]
[Route("api/system-roles")]
public class SystemRolesController : ControllerBase
{
    private readonly IConfiguration _config;
    public SystemRolesController(IConfiguration config) => _config = config;

    [HttpGet]
    [AllowAnonymous]
    public ActionResult<ApiResponse<SystemRolesResponse>> Get()
    {
        var roles = _config.GetSection("SystemRoles").Get<List<SystemRoleConfigDto>>()
                    ?? new List<SystemRoleConfigDto>();

        var staffMin   = _config.GetValue<int>("SystemThresholds:StaffMinLevel",      1);
        var adminMin   = _config.GetValue<int>("SystemThresholds:AdminMinLevel",      2);
        var superMin   = _config.GetValue<int>("SystemThresholds:SuperAdminMinLevel", 3);
        var restricted = _config.GetSection("SystemThresholds:AdminRestrictedPermissions")
                                .Get<List<string>>() ?? new List<string>();

        return Ok(ApiResponse<SystemRolesResponse>.Ok(new SystemRolesResponse
        {
            Roles                     = roles.OrderBy(r => r.Level),
            StaffMinLevel             = staffMin,
            AdminMinLevel             = adminMin,
            SuperAdminMinLevel        = superMin,
            AdminRestrictedPermissions = restricted
        }));
    }
}
