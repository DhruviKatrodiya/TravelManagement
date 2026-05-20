using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class Designation
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public bool IsActive { get; set; } = true;
}
