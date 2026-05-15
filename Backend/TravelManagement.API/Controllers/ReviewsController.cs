using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _svc;
    public ReviewsController(IReviewService svc) => _svc = svc;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReviewDto>>>> All()
        => Ok(ApiResponse<IEnumerable<ReviewDto>>.Ok(await _svc.ListAllAsync()));

    [HttpGet("featured")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReviewDto>>>> Featured([FromQuery] int take = 6)
        => Ok(ApiResponse<IEnumerable<ReviewDto>>.Ok(await _svc.ListFeaturedAsync(take)));

    [HttpGet("mine")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReviewDto>>>> Mine()
        => Ok(ApiResponse<IEnumerable<ReviewDto>>.Ok(await _svc.ListByCustomerUserAsync(CurrentUserId)));

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> Create(ReviewCreateRequest req)
        => Ok(ApiResponse<ReviewDto>.Ok(await _svc.CreateAsync(CurrentUserId, req), "Review posted"));

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.ReviewsEdit)]
    public async Task<ActionResult<ApiResponse<object>>> Approve(int id, [FromQuery] bool approved = true)
        => await _svc.ApproveAsync(id, approved) ? Ok(ApiResponse<object>.Ok(new { }, approved ? "Approved" : "Hidden")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    [RequirePermission(Permissions.ReviewsDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));

    [HttpDelete("mine/{id}")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteMine(int id)
        => await _svc.DeleteByCustomerAsync(id, CurrentUserId) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
