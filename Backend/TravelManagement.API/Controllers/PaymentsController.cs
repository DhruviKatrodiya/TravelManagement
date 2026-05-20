using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.DTOs.Payment;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _svc;
    private readonly IBookingService _bookings;
    private readonly ICustomerService _customers;

    public PaymentsController(IPaymentService svc, IBookingService bookings, ICustomerService customers)
    {
        _svc = svc;
        _bookings = bookings;
        _customers = customers;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string? CurrentRole => User.FindFirstValue(ClaimTypes.Role);

    private int PrivilegeLevel
    {
        get
        {
            if (int.TryParse(User.FindFirstValue("lvl"), out var lvl)) return lvl;
            return CurrentRole switch { "SuperAdmin" => 3, "Admin" => 2, "Staff" => 1, _ => 0 };
        }
    }

    [HttpPost("initiate")]
    public async Task<ActionResult<ApiResponse<PaymentInitiateResponse>>> Initiate(PaymentInitiateRequest req)
        => Ok(ApiResponse<PaymentInitiateResponse>.Ok(await _svc.InitiateAsync(CurrentUserId, req), "Payment initiated"));

    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> Callback(PaymentCallbackRequest req)
    {
        var p = await _svc.ConfirmAsync(req);
        return p == null ? NotFound(ApiResponse<PaymentDto>.Fail("Payment not found")) : Ok(ApiResponse<PaymentDto>.Ok(p, "Payment processed"));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<PaymentDto>>>> List([FromQuery] int? bookingId)
    {
        if (PrivilegeLevel >= 1)
            return Ok(ApiResponse<IEnumerable<PaymentDto>>.Ok(await _svc.ListAsync(bookingId)));

        if (bookingId.HasValue)
        {
            var booking = await _bookings.GetAsync(bookingId.Value);
            if (booking == null) return NotFound(ApiResponse<IEnumerable<PaymentDto>>.Fail("Booking not found"));
            var profile = await _customers.GetByUserIdAsync(CurrentUserId);
            if (profile == null || profile.Id != booking.CustomerId) return Forbid();
            return Ok(ApiResponse<IEnumerable<PaymentDto>>.Ok(await _svc.ListAsync(bookingId)));
        }

        return Forbid();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> Get(int id)
    {
        var p = await _svc.GetAsync(id);
        return p == null ? NotFound(ApiResponse<PaymentDto>.Fail("Not found")) : Ok(ApiResponse<PaymentDto>.Ok(p));
    }
}
