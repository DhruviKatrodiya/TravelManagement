using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class AppRole
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AppRolePermission> Permissions { get; set; } = new List<AppRolePermission>();
}
