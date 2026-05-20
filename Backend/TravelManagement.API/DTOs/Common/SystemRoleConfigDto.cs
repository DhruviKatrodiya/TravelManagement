namespace TravelManagement.API.DTOs.Common;

/// <summary>
/// System role metadata served to the frontend via GET /api/system-roles.
/// Add new system roles in appsettings.json under the "SystemRoles" array —
/// no backend code changes required.
/// Uses init-only properties so IConfiguration.Get&lt;&gt;() can bind it.
/// </summary>
public class SystemRoleConfigDto
{
    public int    Level                { get; init; }
    public string Name                 { get; init; } = string.Empty;
    public string RoutePrefix          { get; init; } = string.Empty;
    public string DefaultRoute         { get; init; } = string.Empty;
    public string DisplayName          { get; init; } = string.Empty;
    public bool   CanBypassPermissions { get; init; }
}

public class SystemRolesResponse
{
    public IEnumerable<SystemRoleConfigDto> Roles                      { get; init; } = Enumerable.Empty<SystemRoleConfigDto>();
    public int                              StaffMinLevel               { get; init; }
    public int                              AdminMinLevel               { get; init; }
    public int                              SuperAdminMinLevel          { get; init; }
    /// <summary>
    /// Permissions that Admin-tier users do NOT auto-bypass — they must be explicitly
    /// assigned by a SuperAdmin. SuperAdmin always bypasses these.
    /// </summary>
    public IEnumerable<string>             AdminRestrictedPermissions  { get; init; } = Enumerable.Empty<string>();
}
