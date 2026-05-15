using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class StaffPermission
{
    public int StaffId { get; set; }
    public Staff? Staff { get; set; }

    [Required]
    [MaxLength(80)]
    public string Permission { get; set; } = string.Empty;
}
