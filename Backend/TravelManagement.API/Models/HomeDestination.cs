using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class HomeDestination
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    public string Country { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Blurb { get; set; }

    public int SortOrder { get; set; }

    public int? TourId { get; set; }

    [MaxLength(60)]
    public string? Keyword { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<HomeDestinationTour> DestinationTours { get; set; } = new List<HomeDestinationTour>();
}
