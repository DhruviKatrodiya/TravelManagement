using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Helpers;

public static class PermissionHelper
{
    public static int ResolveLevel(ClaimsPrincipal user, IConfiguration config)
    {
        var lvlClaim = user.FindFirst("lvl")?.Value;
        if (int.TryParse(lvlClaim, out var lvl)) return lvl;

        var roleName = user.FindFirst(ClaimTypes.Role)?.Value;
        if (roleName != null)
        {
            var sysRoles = config.GetSection("SystemRoles").Get<List<RoleEntry>>() ?? new();
            var match    = sysRoles.FirstOrDefault(r => r.Name == roleName);
            if (match != null) return match.Level;
        }
        return -1;
    }

    public static async Task<bool> HasPermissionAsync(
        ClaimsPrincipal user,
        IConfiguration config,
        IStaffService staffSvc,
        string permission)
    {
        // Check JWT claims first (fast path — populated at login)
        if (user.Claims.Any(c => c.Type == "perm" && c.Value == permission)) return true;

        // DB fallback: covers permission changes that took effect after the token was issued
        var uidStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(uidStr, out var uid)) return false;
        var perms = await staffSvc.GetPermissionsByUserIdAsync(uid);
        return perms.Contains(permission);
    }

    private class RoleEntry
    {
        public int    Level { get; init; }
        public string Name  { get; init; } = string.Empty;
    }
}
