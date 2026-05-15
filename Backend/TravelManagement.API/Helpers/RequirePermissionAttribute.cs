using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
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
        if (user.IsInRole("Admin")) return;

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
}
