using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.DTOs.Common;

public class CustomPermissionDto
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CustomPermissionCreateRequest
{
    [Required] public string Key { get; set; } = string.Empty;
    [Required] public string DisplayName { get; set; } = string.Empty;
    [Required] public string Module { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class CustomPermissionUpdateRequest
{
    [Required] public string DisplayName { get; set; } = string.Empty;
    [Required] public string Module { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
