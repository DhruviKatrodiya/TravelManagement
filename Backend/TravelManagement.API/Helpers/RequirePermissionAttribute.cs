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

        var staffSvc = context.HttpContext.RequestServices.GetService(typeof(IStaffService)) as IStaffService;
        if (staffSvc == null) { context.Result = new ForbidResult(); return; }

        var granted = await PermissionHelper.HasPermissionAsync(user, config, staffSvc, _permission);
        if (!granted) context.Result = new ForbidResult();
    }
}
