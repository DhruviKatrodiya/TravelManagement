using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _svc;
    public StaffController(IStaffService svc) => _svc = svc;

    [HttpGet] public async Task<ActionResult<ApiResponse<IEnumerable<StaffDto>>>> List()
        => Ok(ApiResponse<IEnumerable<StaffDto>>.Ok(await _svc.ListAsync()));

    [HttpPost] public async Task<ActionResult<ApiResponse<StaffDto>>> Create(StaffCreateRequest req)
        => Ok(ApiResponse<StaffDto>.Ok(await _svc.CreateAsync(req), "Staff created"));

    [HttpPut("{id}")] public async Task<ActionResult<ApiResponse<StaffDto>>> Update(int id, StaffUpdateRequest req)
    {
        var s = await _svc.UpdateAsync(id, req);
        return s == null ? NotFound(ApiResponse<StaffDto>.Fail("Not found")) : Ok(ApiResponse<StaffDto>.Ok(s, "Updated"));
    }

    [HttpDelete("{id}")] public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
