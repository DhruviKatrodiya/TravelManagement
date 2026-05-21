using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Geo;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CountriesController : ControllerBase
{
    private readonly ICountryService _svc;
    public CountriesController(ICountryService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<CountryDto>>>> List([FromQuery] bool? activeOnly = null)
        => Ok(ApiResponse<IEnumerable<CountryDto>>.Ok(await _svc.ListAsync(activeOnly)));

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<CountryDto>>> Get(int id)
    {
        var c = await _svc.GetAsync(id);
        return c == null ? NotFound(ApiResponse<CountryDto>.Fail("Not found")) : Ok(ApiResponse<CountryDto>.Ok(c));
    }

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CountriesCreate)]
    public async Task<ActionResult<ApiResponse<CountryDto>>> Create(CountryRequest req)
        => Ok(ApiResponse<CountryDto>.Ok(await _svc.CreateAsync(req), "Country added"));

    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CountriesEdit)]
    public async Task<ActionResult<ApiResponse<CountryDto>>> Update(int id, CountryRequest req)
    {
        var c = await _svc.UpdateAsync(id, req);
        return c == null ? NotFound(ApiResponse<CountryDto>.Fail("Not found")) : Ok(ApiResponse<CountryDto>.Ok(c, "Updated"));
    }

    [HttpPost("{id}/active")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.CountriesToggle)]
    public async Task<ActionResult<ApiResponse<object>>> SetActive(int id, [FromQuery] bool active = true)
        => await _svc.SetActiveAsync(id, active)
            ? Ok(ApiResponse<object>.Ok(new { }, active ? "Activated" : "Deactivated"))
            : NotFound(ApiResponse<object>.Fail("Not found"));
}
