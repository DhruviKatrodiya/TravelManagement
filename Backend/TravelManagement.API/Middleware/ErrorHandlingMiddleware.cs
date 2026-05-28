using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.DTOs.Common;

namespace TravelManagement.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            string message;
            HttpStatusCode status;

            if (ex is DbUpdateException dbEx && IsForeignKeyViolation(dbEx))
            {
                status  = HttpStatusCode.Conflict;
                message = "This record is in use, you can't delete this record.";
                _logger.LogWarning(dbEx, "FK constraint violation on delete");
            }
            else
            {
                status = ex switch
                {
                    UnauthorizedAccessException => HttpStatusCode.Unauthorized,
                    KeyNotFoundException        => HttpStatusCode.NotFound,
                    InvalidOperationException   => HttpStatusCode.BadRequest,
                    ArgumentException           => HttpStatusCode.BadRequest,
                    _                           => HttpStatusCode.InternalServerError
                };
                message = ex.Message;

                if (status == HttpStatusCode.InternalServerError)
                    _logger.LogError(ex, "Unhandled exception");
                else
                    _logger.LogWarning(ex, "Handled exception {Status}", status);
            }

            context.Response.StatusCode  = (int)status;
            context.Response.ContentType = "application/json";
            var payload = ApiResponse<object>.Fail(message);
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }
    }

    private static bool IsForeignKeyViolation(DbUpdateException ex)
    {
        var inner = ex.InnerException?.Message ?? string.Empty;
        return inner.Contains("FOREIGN KEY", StringComparison.OrdinalIgnoreCase)
            || inner.Contains("REFERENCE constraint", StringComparison.OrdinalIgnoreCase)
            || inner.Contains("foreign key constraint", StringComparison.OrdinalIgnoreCase);
    }
}
