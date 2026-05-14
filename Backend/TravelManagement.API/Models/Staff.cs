using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class Staff
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [MaxLength(80)]
    public string? Designation { get; set; }

    [MaxLength(80)]
    public string? Department { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "decimal(18,2)")]
    public decimal? Salary { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
