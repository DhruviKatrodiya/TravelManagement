using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tours;
    private readonly IReviewService _reviews;

    public ToursController(ITourService tours, IReviewService reviews)
    {
        _tours = tours;
        _reviews = reviews;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<TourDto>>>> List([FromQuery] Destination? destination, [FromQuery] string? q, [FromQuery] int? homeDestinationId, [FromQuery] bool? activeOnly = true)
        => Ok(ApiResponse<IEnumerable<TourDto>>.Ok(await _tours.ListAsync(destination, q, homeDestinationId, activeOnly)));

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TourDto>>> Get(int id)
    {
        var t = await _tours.GetAsync(id);
        return t == null ? NotFound(ApiResponse<TourDto>.Fail("Tour not found")) : Ok(ApiResponse<TourDto>.Ok(t));
    }

    [HttpGet("{id}/reviews")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReviewDto>>>> Reviews(int id)
        => Ok(ApiResponse<IEnumerable<ReviewDto>>.Ok(await _reviews.ListByTourAsync(id)));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<TourDto>>> Create(TourCreateRequest req)
        => Ok(ApiResponse<TourDto>.Ok(await _tours.CreateAsync(req), "Tour created"));

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<TourDto>>> Update(int id, TourUpdateRequest req)
    {
        var updated = await _tours.UpdateAsync(id, req);
        return updated == null ? NotFound(ApiResponse<TourDto>.Fail("Tour not found")) : Ok(ApiResponse<TourDto>.Ok(updated, "Tour updated"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _tours.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Tour deleted")) : NotFound(ApiResponse<object>.Fail("Tour not found"));
}
