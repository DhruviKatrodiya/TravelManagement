using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _svc;
    public NotificationsController(INotificationService svc) => _svc = svc;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet] public async Task<ActionResult<ApiResponse<IEnumerable<NotificationDto>>>> List([FromQuery] bool onlyUnread = false)
        => Ok(ApiResponse<IEnumerable<NotificationDto>>.Ok(await _svc.GetForUserAsync(CurrentUserId, onlyUnread)));

    [HttpPost("{id}/read")] public async Task<ActionResult<ApiResponse<object>>> MarkRead(int id)
    {
        await _svc.MarkReadAsync(CurrentUserId, id);
        return Ok(ApiResponse<object>.Ok(new { }, "Marked read"));
    }

    [HttpPost("read-all")] public async Task<ActionResult<ApiResponse<object>>> MarkAll()
    {
        await _svc.MarkAllReadAsync(CurrentUserId);
        return Ok(ApiResponse<object>.Ok(new { }, "All marked read"));
    }

    [HttpDelete("{id}")] public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var ok = await _svc.DeleteAsync(CurrentUserId, id);
        if (!ok) return NotFound(ApiResponse<object>.Fail("Notification not found"));
        return Ok(ApiResponse<object>.Ok(new { }, "Deleted"));
    }
}
