using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class Itinerary
{
    public int Id { get; set; }

    public int TourPackageId { get; set; }
    public TourPackage TourPackage { get; set; } = null!;

    public int DayNumber { get; set; }

    [Required, MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(150)]
    public string? Location { get; set; }

    [MaxLength(300)]
    public string? Activities { get; set; }

    [MaxLength(150)]
    public string? Accommodation { get; set; }

    [MaxLength(150)]
    public string? Meals { get; set; }
}
