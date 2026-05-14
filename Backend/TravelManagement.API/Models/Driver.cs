using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class Driver
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Email { get; set; }

    [Required, MaxLength(40)]
    public string LicenseNumber { get; set; } = string.Empty;

    public DateTime? LicenseExpiry { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }

    public int ExperienceYears { get; set; }

    public bool IsAvailable { get; set; } = true;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<VehicleAllocation> Allocations { get; set; } = new List<VehicleAllocation>();
}
