namespace TravelManagement.API.Helpers;

/// <summary>
/// Policy names for authorization. Policies are registered in Program.cs using
/// MinimumLevelRequirement, so adding a new system role level in appsettings.json
/// automatically grants it the correct access without changing controller code.
/// </summary>
public static class RolePolicies
{
    public const string StaffOrAbove    = "StaffOrAbove";
    public const string AdminOrAbove    = "AdminOrAbove";
    public const string SuperAdminOnly  = "SuperAdminOnly";
}
