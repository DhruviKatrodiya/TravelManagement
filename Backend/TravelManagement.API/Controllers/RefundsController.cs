using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RefundsController : ControllerBase
{
    private readonly IRefundService _svc;
    public RefundsController(IRefundService svc) => _svc = svc;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Policy = "AdminOrAbove")]
    public async Task<ActionResult<ApiResponse<IEnumerable<RefundDto>>>> List()
        => Ok(ApiResponse<IEnumerable<RefundDto>>.Ok(await _svc.ListAsync()));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<RefundDto>>> RequestRefund(RefundCreateRequest req)
        => Ok(ApiResponse<RefundDto>.Ok(await _svc.RequestAsync(CurrentUserId, req), "Refund requested"));

    [HttpPost("{id}/process")]
    [Authorize(Policy = "StaffOrAbove")]
    [RequirePermission(Permissions.RefundsEdit)]
    public async Task<ActionResult<ApiResponse<RefundDto>>> Process(int id, RefundProcessRequest req)
    {
        var r = await _svc.ProcessAsync(id, req);
        return r == null ? NotFound(ApiResponse<RefundDto>.Fail("Not found")) : Ok(ApiResponse<RefundDto>.Ok(r, "Refund processed"));
    }
}
