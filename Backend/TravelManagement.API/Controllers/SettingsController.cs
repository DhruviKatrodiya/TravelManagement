using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly IAppSettingsService _settings;
    private readonly IEmailService _email;

    public SettingsController(IAppSettingsService settings, IEmailService email)
    {
        _settings = settings;
        _email = email;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AppSettingsDto>>> Get()
        => Ok(ApiResponse<AppSettingsDto>.Ok(await _settings.GetAsync()));

    [HttpPut]
    [Authorize(Policy = "AdminOrAbove")]
    public async Task<ActionResult<ApiResponse<AppSettingsDto>>> Update(AppSettingsUpdateRequest req)
        => Ok(ApiResponse<AppSettingsDto>.Ok(await _settings.UpdateAsync(req), "Settings updated"));

    [HttpPost("test-email")]
    [Authorize(Policy = "AdminOrAbove")]
    [RequirePermission(Permissions.SettingsEmail)]
    public async Task<ActionResult<ApiResponse<string>>> TestEmail([FromBody] TestEmailRequest req)
    {
        var to = string.IsNullOrWhiteSpace(req.To)
            ? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? string.Empty
            : req.To;

        if (string.IsNullOrWhiteSpace(to))
            return BadRequest(ApiResponse<string>.Fail("No recipient email address provided."));

        var (success, message) = await _email.SendTestAsync(to);
        return success
            ? Ok(ApiResponse<string>.Ok(message))
            : BadRequest(ApiResponse<string>.Fail(message));
    }
}

public record TestEmailRequest(string? To);
