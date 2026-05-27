using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;

namespace TravelManagement.API.Middleware;

public class SessionValidationMiddleware
{
    private readonly RequestDelegate _next;

    public SessionValidationMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, TravelDbContext db)
    {
        // Skip session validation for endpoints marked [AllowAnonymous].
        // Without this, a browser tab that still has a stale JWT in sessionStorage would
        // cause even anonymous requests (e.g. /api/system-roles fetched by APP_INITIALIZER)
        // to receive a 401, which triggers forceLogout() before the Angular router is ready
        // and leaves the frontend in a broken state.
        var endpoint = context.GetEndpoint();
        if (endpoint?.Metadata?.GetMetadata<IAllowAnonymous>() != null)
        {
            await _next(context);
            return;
        }

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sessionClaim = context.User.FindFirst("gsession")?.Value;

            if (!string.IsNullOrEmpty(sessionClaim))
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out var userId))
                {
                    var storedToken = await db.Users
                        .AsNoTracking()
                        .Where(u => u.Id == userId)
                        .Select(u => u.SessionToken)
                        .FirstOrDefaultAsync();

                    if (storedToken != sessionClaim)
                    {
                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(
                            "{\"success\":false,\"message\":\"Session expired. Please log in again.\"}");
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}
