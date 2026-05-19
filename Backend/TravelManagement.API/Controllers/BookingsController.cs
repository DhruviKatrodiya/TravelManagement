using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Booking;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _svc;
    private readonly ICustomerService _customers;

    public BookingsController(IBookingService svc, ICustomerService customers)
    {
        _svc = svc;
        _customers = customers;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<BookingDto>>>> List()
    {
        if (CurrentRole is "Admin" or "Staff")
            return Ok(ApiResponse<IEnumerable<BookingDto>>.Ok(await _svc.ListAsync()));

        var profile = await _customers.GetByUserIdAsync(CurrentUserId);
        if (profile == null) return Ok(ApiResponse<IEnumerable<BookingDto>>.Ok(Array.Empty<BookingDto>()));
        return Ok(ApiResponse<IEnumerable<BookingDto>>.Ok(await _svc.ListAsync(profile.Id)));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Get(int id)
    {
        var b = await _svc.GetAsync(id);
        if (b == null) return NotFound(ApiResponse<BookingDto>.Fail("Booking not found"));
        if (CurrentRole == "Customer")
        {
            var profile = await _customers.GetByUserIdAsync(CurrentUserId);
            if (profile == null || profile.Id != b.CustomerId) return Forbid();
        }
        return Ok(ApiResponse<BookingDto>.Ok(b));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Create(BookingCreateRequest req)
    {
        var b = await _svc.CreateAsync(CurrentUserId, req);
        return Ok(ApiResponse<BookingDto>.Ok(b, "Booking created"));
    }

    [HttpPost("{id}/status")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.BookingsEdit)]
    public async Task<ActionResult<ApiResponse<BookingDto>>> UpdateStatus(int id, BookingUpdateStatusRequest req)
    {
        var b = await _svc.UpdateStatusAsync(id, req);
        return b == null ? NotFound(ApiResponse<BookingDto>.Fail("Booking not found")) : Ok(ApiResponse<BookingDto>.Ok(b, "Status updated"));
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Cancel(int id, [FromBody] BookingCancelRequest req)
    {
        var b = await _svc.CancelAsync(id, CurrentUserId, req.Note);
        return b == null ? NotFound(ApiResponse<BookingDto>.Fail("Booking not found")) : Ok(ApiResponse<BookingDto>.Ok(b, "Booking cancelled"));
    }
}
