using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace TravelManagement.API.Helpers;

/// <summary>
/// Authorization requirement that passes when the user's privilege level >= MinimumLevel.
/// Primary source: "lvl" JWT claim (set on all new tokens).
/// Fallback: derives level from the role name claim via SystemRoles config,
/// so tokens issued before the lvl claim was introduced continue to work.
/// </summary>
public class MinimumLevelRequirement : IAuthorizationRequirement
{
    public int MinimumLevel { get; }
    public MinimumLevelRequirement(int minimumLevel) => MinimumLevel = minimumLevel;
}

public class MinimumLevelHandler : AuthorizationHandler<MinimumLevelRequirement>
{
    private readonly IConfiguration _config;
    public MinimumLevelHandler(IConfiguration config) => _config = config;

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumLevelRequirement requirement)
    {
        var user = context.User;

        // Primary path — all tokens issued after the lvl claim was added
        var lvlClaim = user.FindFirst("lvl")?.Value;
        if (int.TryParse(lvlClaim, out var level))
        {
            if (level >= requirement.MinimumLevel) context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Fallback — tokens without the lvl claim (issued before this feature)
        // Derive level from the role name via the SystemRoles config
        var roleName = user.FindFirst(ClaimTypes.Role)?.Value;
        if (roleName != null)
        {
            var roles = _config.GetSection("SystemRoles").Get<List<FallbackRole>>() ?? new();
            var matched = roles.FirstOrDefault(r => r.Name == roleName);
            if (matched != null && matched.Level >= requirement.MinimumLevel)
                context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }

    private class FallbackRole
    {
        public int    Level { get; init; }
        public string Name  { get; init; } = string.Empty;
    }
}
