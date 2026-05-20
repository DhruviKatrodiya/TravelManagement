using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class State
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    public int CountryId { get; set; }
    public Country Country { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    public ICollection<City> Cities { get; set; } = new List<City>();
}
