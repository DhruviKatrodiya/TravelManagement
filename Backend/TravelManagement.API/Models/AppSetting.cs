using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.Models;

public class AppSetting
{
    public int Id { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(100)]
    public string? BrandName { get; set; }

    [MaxLength(20)]
    public string? ThemeMode { get; set; }
}
