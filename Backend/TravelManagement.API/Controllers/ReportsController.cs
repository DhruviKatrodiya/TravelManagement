using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _svc;
    public ReportsController(IReportService svc) => _svc = svc;

    [HttpGet("dashboard")]
    [Authorize(Policy = "StaffOrAbove")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> Dashboard()
        => Ok(ApiResponse<DashboardStatsDto>.Ok(await _svc.GetDashboardAsync()));

    [HttpGet("trip-profits")]
    [Authorize(Policy = "AdminOrAbove")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TripProfitDto>>>> TripProfits([FromQuery] ReportFilter filter)
        => Ok(ApiResponse<IEnumerable<TripProfitDto>>.Ok(await _svc.GetTripProfitsAsync(filter)));
}
