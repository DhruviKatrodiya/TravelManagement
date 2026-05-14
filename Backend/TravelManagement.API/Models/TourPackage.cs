using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TravelManagement.API.Models;

public class TourPackage
{
    public int Id { get; set; }

    public int TourId { get; set; }
    public Tour Tour { get; set; } = null!;

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public int DurationDays { get; set; }
    public int DurationNights { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PricePerPerson { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? ChildPrice { get; set; }

    public int MinPersons { get; set; } = 1;
    public int MaxPersons { get; set; } = 30;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Inclusions { get; set; }

    [MaxLength(500)]
    public string? Exclusions { get; set; }

    public bool IsCustomizable { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Itinerary> Itineraries { get; set; } = new List<Itinerary>();
    public ICollection<PackageFacility> PackageFacilities { get; set; } = new List<PackageFacility>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<TourSchedule> Schedules { get; set; } = new List<TourSchedule>();
}
