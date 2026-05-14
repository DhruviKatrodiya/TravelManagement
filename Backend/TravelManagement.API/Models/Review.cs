using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class Review
{
    public int Id { get; set; }

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public int TourId { get; set; }
    public Tour Tour { get; set; } = null!;

    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(150)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }

    public bool IsApproved { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
