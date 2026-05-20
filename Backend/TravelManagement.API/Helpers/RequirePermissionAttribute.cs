using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Helpers;

/// <summary>
/// Allows the request when the caller is Admin OR has the explicit permission claim
/// (or, as a fallback, the permission is currently stored for the staff in the DB).
/// The DB fallback means newly-granted permissions take effect without re-login.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _permission;
    public RequirePermissionAttribute(string permission) => _permission = permission;

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (user?.Identity == null || !user.Identity.IsAuthenticated)
        {
            context.Result = new UnauthorizedResult();
            return;
        }
        // Users at admin level or above bypass individual permission checks
        var config   = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var adminMin = config.GetValue<int>("SystemThresholds:AdminMinLevel",      2);
        var superMin = config.GetValue<int>("SystemThresholds:SuperAdminMinLevel", 3);
        var restricted = config.GetSection("SystemThresholds:AdminRestrictedPermissions")
                               .Get<List<string>>() ?? new();

        var userLevel = ResolveLevel(user, config);

        // SuperAdmin bypasses ALL permissions (including restricted ones)
        if (userLevel >= superMin) return;

        // Admin bypasses non-restricted permissions only
        if (userLevel >= adminMin && !restricted.Contains(_permission)) return;

        // Fast path: explicit claim from JWT.
        if (user.Claims.Any(c => c.Type == "perm" && c.Value == _permission)) return;

        // Slow path: look up current permissions in DB so newly-granted permissions work immediately.
        var uidStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(uidStr, out var uid))
        {
            context.Result = new ForbidResult();
            return;
        }
        var staffSvc = context.HttpContext.RequestServices.GetService(typeof(IStaffService)) as IStaffService;
        if (staffSvc == null)
        {
            context.Result = new ForbidResult();
            return;
        }
        var perms = await staffSvc.GetPermissionsByUserIdAsync(uid);
        if (!perms.Contains(_permission))
            context.Result = new ForbidResult();
    }

    private static int ResolveLevel(System.Security.Claims.ClaimsPrincipal user, IConfiguration config)
    {
        var lvlClaim = user.FindFirst("lvl")?.Value;
        if (int.TryParse(lvlClaim, out var lvl)) return lvl;

        // Fallback for tokens issued before the lvl claim was added
        var roleName = user.FindFirst(ClaimTypes.Role)?.Value;
        if (roleName != null)
        {
            var sysRoles = config.GetSection("SystemRoles").Get<List<RoleEntry>>() ?? new();
            var match    = sysRoles.FirstOrDefault(r => r.Name == roleName);
            if (match != null) return match.Level;
        }
        return -1;
    }

    private class RoleEntry
    {
        public int    Level { get; init; }
        public string Name  { get; init; } = string.Empty;
    }
}
