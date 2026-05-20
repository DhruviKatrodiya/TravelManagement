using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class City
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    public int StateId { get; set; }
    public State State { get; set; } = null!;

    public bool IsActive { get; set; } = true;
}
