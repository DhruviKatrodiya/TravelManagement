using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.Models;

public class Facility
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    public FacilityType Type { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Cost { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<PackageFacility> PackageFacilities { get; set; } = new List<PackageFacility>();
}

public class PackageFacility
{
    public int Id { get; set; }

    public int TourPackageId { get; set; }
    public TourPackage TourPackage { get; set; } = null!;

    public int FacilityId { get; set; }
    public Facility Facility { get; set; } = null!;

    public bool Included { get; set; } = true;
}
