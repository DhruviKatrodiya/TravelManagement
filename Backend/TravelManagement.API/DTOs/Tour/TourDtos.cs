using System.ComponentModel.DataAnnotations;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.DTOs.Tour;

public class TourDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Destination Destination { get; set; }
    public string? Region { get; set; }
    public string? Description { get; set; }
    public string? Highlights { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<TourPackageDto> Packages { get; set; } = new();
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
}

public class TourCreateRequest
{
    [Required, MaxLength(150)] public string Name { get; set; } = string.Empty;
    public Destination Destination { get; set; }
    public string? Region { get; set; }
    public string? Description { get; set; }
    public string? Highlights { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

public class TourUpdateRequest : TourCreateRequest { }

public class TourPackageDto
{
    public int Id { get; set; }
    public int TourId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public int DurationNights { get; set; }
    public decimal PricePerPerson { get; set; }
    public decimal? ChildPrice { get; set; }
    public int MinPersons { get; set; }
    public int MaxPersons { get; set; }
    public string? Description { get; set; }
    public string? Inclusions { get; set; }
    public string? Exclusions { get; set; }
    public bool IsCustomizable { get; set; }
    public bool IsActive { get; set; }
    public List<ItineraryDto> Itineraries { get; set; } = new();
    public List<PackageFacilityDto> Facilities { get; set; } = new();
}

public class TourPackageCreateRequest
{
    [Required] public int TourId { get; set; }
    [Required, MaxLength(150)] public string Name { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public int DurationNights { get; set; }
    public decimal PricePerPerson { get; set; }
    public decimal? ChildPrice { get; set; }
    public int MinPersons { get; set; } = 1;
    public int MaxPersons { get; set; } = 30;
    public string? Description { get; set; }
    public string? Inclusions { get; set; }
    public string? Exclusions { get; set; }
    public bool IsCustomizable { get; set; }
    public bool IsActive { get; set; } = true;
    public List<int> FacilityIds { get; set; } = new();
}

public class TourPackageUpdateRequest : TourPackageCreateRequest { }

public class ItineraryDto
{
    public int Id { get; set; }
    public int TourPackageId { get; set; }
    public int DayNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? Activities { get; set; }
    public string? Accommodation { get; set; }
    public string? Meals { get; set; }
}

public class ItineraryCreateRequest
{
    [Required] public int TourPackageId { get; set; }
    public int DayNumber { get; set; }
    [Required, MaxLength(150)] public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? Activities { get; set; }
    public string? Accommodation { get; set; }
    public string? Meals { get; set; }
}

public class FacilityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public FacilityType Type { get; set; }
    public string? Description { get; set; }
    public decimal Cost { get; set; }
    public bool IsActive { get; set; }
}

public class FacilityCreateRequest
{
    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    public FacilityType Type { get; set; }
    public string? Description { get; set; }
    public decimal Cost { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PackageFacilityDto
{
    public int Id { get; set; }
    public int FacilityId { get; set; }
    public string FacilityName { get; set; } = string.Empty;
    public FacilityType Type { get; set; }
    public decimal Cost { get; set; }
    public bool Included { get; set; }
}

public class TourScheduleDto
{
    public int Id { get; set; }
    public int TourId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public int TourPackageId { get; set; }
    public string PackageName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int AvailableSeats { get; set; }
    public int BookedSeats { get; set; }
    public bool IsActive { get; set; }
}

public class TourScheduleCreateRequest
{
    [Required] public int TourId { get; set; }
    [Required] public int TourPackageId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int AvailableSeats { get; set; }
    public bool IsActive { get; set; } = true;
}
