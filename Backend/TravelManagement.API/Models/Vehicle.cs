using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.Models;

public class Vehicle
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string RegistrationNumber { get; set; } = string.Empty;

    public VehicleType Type { get; set; }

    public int Capacity { get; set; }

    [MaxLength(80)]
    public string? Make { get; set; }

    [MaxLength(80)]
    public string? Model { get; set; }

    public int? Year { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CostPerDay { get; set; }

    public bool IsAvailable { get; set; } = true;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<VehicleAllocation> Allocations { get; set; } = new List<VehicleAllocation>();
}

public class VehicleAllocation
{
    public int Id { get; set; }

    public int VehicleId { get; set; }
    public Vehicle Vehicle { get; set; } = null!;

    public int? DriverId { get; set; }
    public Driver? Driver { get; set; }

    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
