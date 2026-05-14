using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FacilitiesController : ControllerBase
{
    private readonly IFacilityService _svc;

    public FacilitiesController(IFacilityService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<FacilityDto>>>> List()
        => Ok(ApiResponse<IEnumerable<FacilityDto>>.Ok(await _svc.ListAsync()));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<FacilityDto>>> Create(FacilityCreateRequest req)
        => Ok(ApiResponse<FacilityDto>.Ok(await _svc.CreateAsync(req), "Facility created"));

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<FacilityDto>>> Update(int id, FacilityCreateRequest req)
    {
        var f = await _svc.UpdateAsync(id, req);
        return f == null ? NotFound(ApiResponse<FacilityDto>.Fail("Facility not found")) : Ok(ApiResponse<FacilityDto>.Ok(f, "Facility updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
