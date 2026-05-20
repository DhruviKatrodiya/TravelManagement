using System.ComponentModel.DataAnnotations;

namespace TravelManagement.API.DTOs.Geo;

public record CountryDto(int Id, string Name, string? Code, bool IsActive);
public record CountryRequest([Required, MaxLength(100)] string Name, [MaxLength(10)] string? Code);

public record StateDto(int Id, string Name, int CountryId, string CountryName, bool IsActive);
public record StateRequest([Required, MaxLength(100)] string Name, int CountryId);

public record CityDto(int Id, string Name, int StateId, string StateName, int CountryId, string CountryName, bool IsActive);
public record CityRequest([Required, MaxLength(100)] string Name, int StateId);

public record DepartmentDto(int Id, string Name, bool IsActive);
public record DepartmentRequest([Required, MaxLength(100)] string Name);

public record DesignationDto(int Id, string Name, int DepartmentId, string DepartmentName, bool IsActive);
public record DesignationRequest([Required, MaxLength(100)] string Name, int DepartmentId);
