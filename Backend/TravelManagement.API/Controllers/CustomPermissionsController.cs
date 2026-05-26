using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Helpers;
using TravelManagement.API.Models;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/custom-permissions")]
[Authorize(Policy = "SuperAdminOnly")]
public class CustomPermissionsController : ControllerBase
{
    private readonly TravelDbContext _db;
    public CustomPermissionsController(TravelDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = "AdminOrAbove")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CustomPermissionDto>>>> List()
    {
        var items = await _db.CustomPermissions.OrderBy(p => p.Module).ThenBy(p => p.Key).ToListAsync();
        return Ok(ApiResponse<IEnumerable<CustomPermissionDto>>.Ok(items.Select(ToDto)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CustomPermissionDto>>> Create(CustomPermissionCreateRequest req)
    {
        var key = req.Key.Trim().ToLower();
        if (await _db.CustomPermissions.AnyAsync(p => p.Key == key))
            return BadRequest(ApiResponse<CustomPermissionDto>.Fail("A permission with this key already exists."));

        var perm = new CustomPermission
        {
            Key = key,
            DisplayName = req.DisplayName.Trim(),
            Module = req.Module.Trim().ToLower(),
            Description = req.Description?.Trim(),
            IsSystem = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.CustomPermissions.Add(perm);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<CustomPermissionDto>.Ok(ToDto(perm), "Permission created"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CustomPermissionDto>>> Update(int id, CustomPermissionUpdateRequest req)
    {
        var perm = await _db.CustomPermissions.FindAsync(id);
        if (perm == null) return NotFound(ApiResponse<CustomPermissionDto>.Fail("Not found"));
        if (perm.IsSystem) return BadRequest(ApiResponse<CustomPermissionDto>.Fail("System permissions cannot be modified."));

        perm.DisplayName = req.DisplayName.Trim();
        perm.Module = req.Module.Trim().ToLower();
        perm.Description = req.Description?.Trim();
        perm.IsActive = req.IsActive;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<CustomPermissionDto>.Ok(ToDto(perm), "Updated"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var perm = await _db.CustomPermissions.FindAsync(id);
        if (perm == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        if (perm.IsSystem) return BadRequest(ApiResponse<object>.Fail("System permissions cannot be deleted."));

        // Check if in use
        bool inUse = await _db.AppRolePermissions.AnyAsync(p => p.Permission == perm.Key)
                  || await _db.StaffPermissions.AnyAsync(p => p.Permission == perm.Key);
        if (inUse) return BadRequest(ApiResponse<object>.Fail("This permission is currently assigned to roles or users. Remove it from all assignments first."));

        _db.CustomPermissions.Remove(perm);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { }, "Deleted"));
    }

    private static CustomPermissionDto ToDto(CustomPermission p) => new()
    {
        Id = p.Id, Key = p.Key, DisplayName = p.DisplayName,
        Module = p.Module, Description = p.Description,
        IsSystem = p.IsSystem, IsActive = p.IsActive, CreatedAt = p.CreatedAt
    };
}
