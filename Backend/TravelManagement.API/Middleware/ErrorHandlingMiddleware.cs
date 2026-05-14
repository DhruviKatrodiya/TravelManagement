using System.Net;
using System.Text.Json;
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
            var status = ex switch
            {
                UnauthorizedAccessException => HttpStatusCode.Unauthorized,
                KeyNotFoundException => HttpStatusCode.NotFound,
                InvalidOperationException => HttpStatusCode.BadRequest,
                ArgumentException => HttpStatusCode.BadRequest,
                _ => HttpStatusCode.InternalServerError
            };

            if (status == HttpStatusCode.InternalServerError)
                _logger.LogError(ex, "Unhandled exception");
            else
                _logger.LogWarning(ex, "Handled exception {Status}", status);

            context.Response.StatusCode = (int)status;
            context.Response.ContentType = "application/json";
            var payload = ApiResponse<object>.Fail(ex.Message);
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }
    }
}
