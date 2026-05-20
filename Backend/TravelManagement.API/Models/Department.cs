using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class Department
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    public bool IsActive { get; set; } = true;

    public ICollection<Designation> Designations { get; set; } = new List<Designation>();
}
