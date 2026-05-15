using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Staff")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _svc;
    public ExpensesController(IExpenseService svc) => _svc = svc;

    [HttpGet] [RequirePermission(Permissions.ExpensesView)]
    public async Task<ActionResult<ApiResponse<IEnumerable<ExpenseDto>>>> List([FromQuery] int? bookingId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(ApiResponse<IEnumerable<ExpenseDto>>.Ok(await _svc.ListAsync(bookingId, from, to)));

    [HttpPost] [RequirePermission(Permissions.ExpensesCreate)]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Create(ExpenseCreateRequest req)
        => Ok(ApiResponse<ExpenseDto>.Ok(await _svc.CreateAsync(req), "Expense recorded"));

    [HttpPut("{id}")] [RequirePermission(Permissions.ExpensesEdit)]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Update(int id, ExpenseCreateRequest req)
    {
        var e = await _svc.UpdateAsync(id, req);
        return e == null ? NotFound(ApiResponse<ExpenseDto>.Fail("Not found")) : Ok(ApiResponse<ExpenseDto>.Ok(e, "Updated"));
    }

    [HttpDelete("{id}")] [RequirePermission(Permissions.ExpensesDelete)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        => await _svc.DeleteAsync(id) ? Ok(ApiResponse<object>.Ok(new { }, "Deleted")) : NotFound(ApiResponse<object>.Fail("Not found"));
}
