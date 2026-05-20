using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;

namespace TravelManagement.API.Middleware;

public class SessionValidationMiddleware
{
    private readonly RequestDelegate _next;

    public SessionValidationMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, TravelDbContext db)
    {
        // Allow logout to pass through so a stale-session tab can still invalidate the global token
        if (context.Request.Path.StartsWithSegments("/api/auth/logout", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sessionClaim = context.User.FindFirst("gsession")?.Value;

            if (!string.IsNullOrEmpty(sessionClaim))
            {
                var activeToken = await db.AppSettings
                    .AsNoTracking()
                    .Where(a => a.Id == 1)
                    .Select(a => a.ActiveSessionToken)
                    .FirstOrDefaultAsync();

                if (activeToken != sessionClaim)
                {
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(
                        "{\"success\":false,\"message\":\"Another session is active. You have been logged out.\"}");
                    return;
                }
            }
        }

        await _next(context);
    }
}
