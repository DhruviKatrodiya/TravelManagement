using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly IAppSettingsService _settings;

    public SettingsController(IAppSettingsService settings) => _settings = settings;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AppSettingsDto>>> Get()
        => Ok(ApiResponse<AppSettingsDto>.Ok(await _settings.GetAsync()));

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<AppSettingsDto>>> Update(AppSettingsUpdateRequest req)
        => Ok(ApiResponse<AppSettingsDto>.Ok(await _settings.UpdateAsync(req), "Settings updated"));
}
