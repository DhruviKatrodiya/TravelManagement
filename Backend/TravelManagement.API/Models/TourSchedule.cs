using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class TourSchedule
{
    public int Id { get; set; }

    public int TourId { get; set; }
    public Tour Tour { get; set; } = null!;

    public int TourPackageId { get; set; }
    public TourPackage TourPackage { get; set; } = null!;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public int AvailableSeats { get; set; }
    public int BookedSeats { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
