using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class AppRolePermission
{
    public int AppRoleId { get; set; }
    public AppRole AppRole { get; set; } = null!;

    [Required, MaxLength(80)]
    public string Permission { get; set; } = string.Empty;
}
