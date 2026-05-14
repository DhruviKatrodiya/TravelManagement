using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class Customer
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [MaxLength(250)]
    public string? Address { get; set; }

    [MaxLength(80)]
    public string? City { get; set; }

    [MaxLength(80)]
    public string? State { get; set; }

    [MaxLength(20)]
    public string? PostalCode { get; set; }

    [MaxLength(80)]
    public string? Country { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(50)]
    public string? Gender { get; set; }

    [MaxLength(30)]
    public string? IdProofType { get; set; }

    [MaxLength(50)]
    public string? IdProofNumber { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
