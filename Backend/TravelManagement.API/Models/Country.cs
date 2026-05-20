using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class Country
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    [MaxLength(10)]
    public string? Code { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<State> States { get; set; } = new List<State>();
}
