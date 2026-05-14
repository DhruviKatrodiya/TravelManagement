using System.ComponentModel.DataAnnotations;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.Models;

public class Tour
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public Destination Destination { get; set; }

    [MaxLength(120)]
    public string? Region { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Highlights { get; set; }

    [MaxLength(300)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<TourPackage> Packages { get; set; } = new List<TourPackage>();
    public ICollection<TourSchedule> Schedules { get; set; } = new List<TourSchedule>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
