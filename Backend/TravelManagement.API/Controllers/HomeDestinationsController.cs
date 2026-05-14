using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/home-destinations")]
public class HomeDestinationsController : ControllerBase
{
    private readonly IHomeDestinationService _svc;

    public HomeDestinationsController(IHomeDestinationService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<HomeDestinationDto>>>> List([FromQuery] bool? activeOnly = true)
        => Ok(ApiResponse<IEnumerable<HomeDestinationDto>>.Ok(await _svc.ListAsync(activeOnly)));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<HomeDestinationDto>>> Create(HomeDestinationRequest req)
        => Ok(ApiResponse<HomeDestinationDto>.Ok(await _svc.CreateAsync(req), "Destination created"));

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<HomeDestinationDto>>> Update(int id, HomeDestinationRequest req)
    {
        var d = await _svc.UpdateAsync(id, req);
        return d == null ? NotFound(ApiResponse<HomeDestinationDto>.Fail("Not found")) : Ok(ApiResponse<HomeDestinationDto>.Ok(d, "Destination updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Destination deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
