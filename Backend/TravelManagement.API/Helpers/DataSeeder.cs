using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TravelManagement.API.Data;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using static TravelManagement.API.Helpers.Permissions;

namespace TravelManagement.API.Helpers;

public static class DataSeeder
{
    public static async Task SeedAsync(TravelDbContext db)
    {
        await SeedGeoAsync(db);
        await SeedOrgAsync(db);
    }

    // ── Super Admin ───────────────────────────────────────────────────────────

    public static async Task SeedSuperAdminAsync(TravelDbContext db, IConfiguration config)
    {
        var section = config.GetSection("DefaultSuperAdmin");
        var superAdminEmail = section["Email"] ?? "superadmin@travel.local";

        // Look up by email — role value in DB may be stale from an older enum ordering.
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == superAdminEmail)
                ?? await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.SuperAdmin);

        if (user == null)
        {
            user = new User
            {
                FullName     = section["FullName"] ?? "Super Administrator",
                Email        = superAdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(section["Password"] ?? "SuperAdmin@123"),
                Role         = UserRole.SuperAdmin,
                IsActive     = true,
                CreatedAt    = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }
        else if (user.Role != UserRole.SuperAdmin)
        {
            // Fix stale role value (e.g. DB was seeded with an older sequential enum)
            user.Role = UserRole.SuperAdmin;
            await db.SaveChangesAsync();
        }

        // Ensure the Executive role always has ALL permissions (covers the case where new permissions
        // were added to Permissions.All after the role was first seeded — SeedRolesAsync skips existing roles).
        var executiveRole = await db.AppRoles
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Name == "Executive");

        if (executiveRole != null)
        {
            var existing = executiveRole.Permissions.Select(p => p.Permission).ToHashSet();
            var missing  = All.Where(p => !existing.Contains(p)).ToList();
            if (missing.Count > 0)
            {
                db.AppRolePermissions.AddRange(
                    missing.Select(p => new AppRolePermission { AppRoleId = executiveRole.Id, Permission = p }));
                await db.SaveChangesAsync();
            }
        }

        // Ensure SuperAdmin has a StaffMember so individual StaffPermissions can be stored.
        var existingStaff = await db.StaffMembers.FirstOrDefaultAsync(s => s.UserId == user.Id);
        Staff staff;
        if (existingStaff == null)
        {
            staff = new Staff { UserId = user.Id, AppRoleId = executiveRole?.Id, JoinedAt = DateTime.UtcNow };
            db.StaffMembers.Add(staff);
            await db.SaveChangesAsync();
        }
        else
        {
            staff = existingStaff;
            if (staff.AppRoleId == null && executiveRole != null)
            {
                staff.AppRoleId = executiveRole.Id;
                await db.SaveChangesAsync();
            }
        }

        // Ensure SuperAdmin's individual StaffPermissions contain ALL permissions.
        var existingPermsList = await db.StaffPermissions
            .Where(p => p.StaffId == staff.Id)
            .Select(p => p.Permission)
            .ToListAsync();
        var existingPerms = existingPermsList.ToHashSet();
        var missingPerms = All.Where(p => !existingPerms.Contains(p)).ToList();
        if (missingPerms.Count > 0)
        {
            db.StaffPermissions.AddRange(
                missingPerms.Select(p => new StaffPermission { StaffId = staff.Id, Permission = p }));
            await db.SaveChangesAsync();
        }
    }

    // ── Stale role value migration ────────────────────────────────────────────
    // Handles DBs originally seeded with a sequential enum (Customer=0, Staff=1, Admin=2,
    // SuperAdmin=3) before explicit non-sequential values were introduced.
    public static async Task FixStaleRoleValuesAsync(TravelDbContext db, string? superAdminEmail = null)
    {
        var primaryRoles = new HashSet<int> { 1, 11, 12, 13 }; // SuperAdmin, Admin, Staff, Customer

        // Pass 1: users with a role integer that doesn't map to any primary role constant.
        var staleUsers = await db.Users
            .Where(u => !primaryRoles.Contains((int)u.Role))
            .ToListAsync();

        foreach (var user in staleUsers)
        {
            if (await db.Customers.AnyAsync(c => c.UserId == user.Id))
            {
                user.Role = UserRole.Customer;
                continue;
            }

            var staff = await db.StaffMembers
                .Include(s => s.AppRole)
                .FirstOrDefaultAsync(s => s.UserId == user.Id);

            if (staff == null) continue;

            user.Role = staff.AppRole?.Name == "Executive" ? UserRole.SuperAdmin :
                        staff.AppRole?.Name == "Admin"     ? UserRole.Admin :
                        UserRole.Staff;
        }

        // Pass 2: users who appear as SuperAdmin (role=1) but whose StaffMember record
        // belongs to a non-Executive role — these are old Staff users (role was 1 in the
        // sequential enum) that inadvertently now match the SuperAdmin constant.
        var falseAdmins = await db.Users
            .Where(u => u.Role == UserRole.SuperAdmin &&
                        (superAdminEmail == null || u.Email != superAdminEmail))
            .ToListAsync();

        foreach (var user in falseAdmins)
        {
            var staff = await db.StaffMembers
                .Include(s => s.AppRole)
                .FirstOrDefaultAsync(s => s.UserId == user.Id);

            if (staff?.AppRole == null || staff.AppRole.Name == "Executive") continue;

            user.Role = staff.AppRole.Name == "Admin" ? UserRole.Admin : UserRole.Staff;
        }

        await db.SaveChangesAsync();
    }

    // ── Admin StaffMember bootstrap ───────────────────────────────────────────
    // Admin users created outside the People page (e.g. directly in the DB) won't have a
    // StaffMember record. Without one, GetPermissionsByUserIdAsync always returns [].
    // This method ensures every UserRole.Admin user has a StaffMember linked to the "Admin" AppRole.
    public static async Task SeedAdminStaffMembersAsync(TravelDbContext db)
    {
        var adminRole = await db.AppRoles.FirstOrDefaultAsync(r => r.Name == "Admin");

        // Only ensure StaffMember records exist — permissions are granted individually by SuperAdmin.
        var adminsWithoutStaff = await db.Users
            .Where(u => u.Role == UserRole.Admin && !db.StaffMembers.Any(s => s.UserId == u.Id))
            .ToListAsync();

        if (adminsWithoutStaff.Count > 0)
        {
            foreach (var admin in adminsWithoutStaff)
            {
                db.StaffMembers.Add(new Staff
                {
                    UserId    = admin.Id,
                    AppRoleId = adminRole?.Id,
                    JoinedAt  = DateTime.UtcNow
                });
            }
            await db.SaveChangesAsync();
        }
    }

    // ── Custom Permissions ────────────────────────────────────────────────────

    public static async Task SeedCustomPermissionsAsync(TravelDbContext db)
    {
        var existing = (await db.CustomPermissions.Select(p => p.Key).ToListAsync()).ToHashSet();
        var toAdd = Permissions.All
            .Where(key => !existing.Contains(key))
            .Select(key =>
            {
                var parts = key.Split('.', 2);
                var module = parts[0];
                var action = parts.Length > 1 ? parts[1] : key;
                var displayName = action == "toggle" ? "Activate / Deactivate"
                    : action.Replace("_", " ").Replace(module + ".", "");
                displayName = char.ToUpper(displayName[0]) + displayName[1..];
                return new Models.CustomPermission
                {
                    Key = key,
                    DisplayName = displayName,
                    Module = module,
                    IsSystem = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
            }).ToList();

        if (toAdd.Count > 0)
        {
            db.CustomPermissions.AddRange(toAdd);
            await db.SaveChangesAsync();
        }
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    public static async Task SeedRolesAsync(TravelDbContext db)
    {
        var existingNames = (await db.AppRoles.Select(r => r.Name).ToListAsync()).ToHashSet();

        var roleData = new (string Name, string Description, string[] Perms)[]
        {
            (
                "Executive",
                "Full access to all modules and features.",
                All.ToArray()
            ),
            (
                "Operations Manager",
                "Manages tours, schedules, packages, vehicles, drivers and allocations.",
                new[] {
                    ToursView, ToursCreate, ToursEdit, ToursDelete, ToursSearch,
                    DestinationsView, DestinationsCreate, DestinationsEdit, DestinationsDelete, DestinationsSearch,
                    PackagesView, PackagesCreate, PackagesEdit, PackagesDelete, PackagesSearch,
                    FacilitiesView, FacilitiesCreate, FacilitiesEdit, FacilitiesDelete, FacilitiesSearch,
                    SchedulesView, SchedulesCreate, SchedulesEdit, SchedulesDelete, SchedulesSearch,
                    VehiclesView, VehiclesCreate, VehiclesEdit, VehiclesDelete, VehiclesSearch,
                    DriversView, DriversCreate, DriversEdit, DriversDelete, DriversSearch,
                    AllocationsView, AllocationsCreate, AllocationsEdit, AllocationsDelete, AllocationsSearch,
                    BookingsView, BookingsEdit, BookingsSearch,
                    ReportsView
                }
            ),
            (
                "Sales Manager",
                "Manages customers, bookings, and packages with full contact-field access.",
                new[] {
                    CustomersView, CustomersCreate, CustomersEdit, CustomersSearch,
                    BookingsView, BookingsEdit, BookingsSearch,
                    PackagesView, PackagesSearch,
                    ToursView, ToursSearch,
                    ReviewsView, ReviewsSearch,
                    ReportsView
                }
            ),
            (
                "Tour Coordinator",
                "Plans and coordinates tour schedules and allocations.",
                new[] {
                    ToursView, ToursEdit, ToursSearch,
                    DestinationsView, DestinationsSearch,
                    FacilitiesView, FacilitiesSearch,
                    SchedulesView, SchedulesCreate, SchedulesEdit, SchedulesSearch,
                    AllocationsView, AllocationsCreate, AllocationsEdit, AllocationsSearch,
                    BookingsView, BookingsSearch,
                    CustomersView, CustomersSearch
                }
            ),
            (
                "Tour Guide",
                "View-only access to tours, schedules, and assigned customer info.",
                new[] {
                    ToursView, ToursSearch,
                    DestinationsView, DestinationsSearch,
                    SchedulesView, SchedulesSearch,
                    AllocationsView, AllocationsSearch,
                    BookingsView, BookingsSearch,
                    CustomersView, CustomersSearch
                }
            ),
            (
                "Driver Manager",
                "Full control over drivers, vehicles, and allocations.",
                new[] {
                    DriversView, DriversCreate, DriversEdit, DriversDelete, DriversSearch,
                    VehiclesView, VehiclesCreate, VehiclesEdit, VehiclesDelete, VehiclesSearch,
                    AllocationsView, AllocationsCreate, AllocationsEdit, AllocationsDelete, AllocationsSearch
                }
            ),
            (
                "Customer Support",
                "Handles customer queries, bookings, reviews, and refund requests.",
                new[] {
                    CustomersView, CustomersEdit, CustomersSearch,
                    BookingsView, BookingsSearch,
                    ReviewsView, ReviewsEdit, ReviewsDelete, ReviewsSearch,
                    RefundsView, RefundsEdit, RefundsSearch
                }
            ),
            (
                "Finance Officer",
                "Manages payments, refunds, and expenses with full financial reporting.",
                new[] {
                    PaymentsView, PaymentsSearch,
                    RefundsView, RefundsEdit, RefundsSearch,
                    ExpensesView, ExpensesCreate, ExpensesEdit, ExpensesDelete, ExpensesSearch,
                    ReportsView,
                    BookingsView, BookingsSearch
                }
            ),
            (
                "Marketing Executive",
                "View access to tours, destinations, packages, and reviews for marketing campaigns.",
                new[] {
                    ToursView, ToursSearch,
                    DestinationsView, DestinationsSearch,
                    PackagesView, PackagesSearch,
                    FacilitiesView, FacilitiesSearch,
                    ReviewsView, ReviewsSearch,
                    ReportsView
                }
            ),
            (
                "Field Agent",
                "On-ground agent with read access to tours, schedules, and customer bookings.",
                new[] {
                    ToursView, ToursSearch,
                    DestinationsView, DestinationsSearch,
                    SchedulesView, SchedulesSearch,
                    BookingsView, BookingsSearch,
                    CustomersView, CustomersSearch,
                    AllocationsView, AllocationsSearch
                }
            ),
            (
                "Admin",
                "System administrator with full access to all modules and settings.",
                All.ToArray()
            ),
            (
                "Staff",
                "General staff access for day-to-day operations — view and manage core modules.",
                new[] {
                    ToursView, ToursSearch,
                    DestinationsView, DestinationsSearch,
                    PackagesView, PackagesSearch,
                    FacilitiesView, FacilitiesSearch,
                    SchedulesView, SchedulesSearch,
                    CustomersView, CustomersSearch,
                    BookingsView, BookingsEdit, BookingsSearch,
                    PaymentsView, PaymentsSearch,
                    RefundsView, RefundsSearch,
                    VehiclesView, VehiclesSearch,
                    DriversView, DriversSearch,
                    AllocationsView, AllocationsSearch,
                    ReviewsView, ReviewsSearch,
                    ReportsView
                }
            ),
            (
                "Customer",
                "Customer-facing role with access to personal bookings, packages, and reviews.",
                new[] {
                    ToursView, ToursSearch,
                    DestinationsView, DestinationsSearch,
                    PackagesView, PackagesSearch,
                    BookingsView, BookingsSearch,
                    ReviewsView, ReviewsSearch
                }
            )
        };

        foreach (var (name, description, perms) in roleData)
        {
            if (existingNames.Contains(name)) continue;

            var role = new AppRole { Name = name, Description = description, IsActive = true };
            db.AppRoles.Add(role);
            await db.SaveChangesAsync();

            var rolePerms = perms
                .Distinct()
                .Select(p => new AppRolePermission { AppRoleId = role.Id, Permission = p })
                .ToList();
            db.AppRolePermissions.AddRange(rolePerms);
            await db.SaveChangesAsync();
        }
    }

    // ── Geo ──────────────────────────────────────────────────────────────────

    private static async Task SeedGeoAsync(TravelDbContext db)
    {
        // Countries — idempotent by Code
        var existingCodes = (await db.Countries.Select(c => c.Code).ToListAsync()).ToHashSet();

        var countryData = new[]
        {
            ("India", "IN"), ("United States", "US"), ("United Kingdom", "GB"),
            ("Canada", "CA"), ("Australia", "AU"), ("Germany", "DE"),
            ("France", "FR"), ("Japan", "JP"), ("Singapore", "SG"),
            ("United Arab Emirates", "AE"), ("Nepal", "NP"), ("Bhutan", "BT"),
            ("Thailand", "TH"), ("Maldives", "MV"), ("Sri Lanka", "LK")
        };

        var newCountries = countryData
            .Where(c => !existingCodes.Contains(c.Item2))
            .Select(c => new Country { Name = c.Item1, Code = c.Item2 })
            .ToList();

        if (newCountries.Count > 0)
        {
            db.Countries.AddRange(newCountries);
            await db.SaveChangesAsync();
        }

        // Load full country map: code → id
        var countryMap = await db.Countries
            .Where(c => c.Code != null)
            .ToDictionaryAsync(c => c.Code!, c => c.Id);

        // States — idempotent by (Name, CountryId)
        var existingStates = (await db.States
            .Select(s => s.Name + "|" + s.CountryId)
            .ToListAsync()).ToHashSet();

        var allStateData = new[]
        {
            // India
            ("Gujarat",            "IN"), ("Maharashtra",       "IN"),
            ("Rajasthan",          "IN"), ("Karnataka",         "IN"),
            ("Kerala",             "IN"),
            // USA
            ("California",         "US"), ("New York",          "US"),
            ("Florida",            "US"),
            // UK
            ("England",            "GB"), ("Scotland",          "GB"),
            // Canada
            ("Ontario",            "CA"), ("British Columbia",  "CA"),
            // Australia
            ("New South Wales",    "AU"), ("Victoria",          "AU"),
            // Germany
            ("Bavaria",            "DE"),
            // Nepal
            ("Bagmati Province",   "NP"), ("Gandaki Province",  "NP"),
            ("Lumbini Province",   "NP"),
            // Bhutan
            ("Thimphu District",   "BT"), ("Paro District",     "BT"),
            ("Punakha District",   "BT")
        };

        var newStates = allStateData
            .Where(s => countryMap.ContainsKey(s.Item2)
                     && !existingStates.Contains(s.Item1 + "|" + countryMap[s.Item2]))
            .Select(s => new State { Name = s.Item1, CountryId = countryMap[s.Item2] })
            .ToList();

        if (newStates.Count > 0)
        {
            db.States.AddRange(newStates);
            await db.SaveChangesAsync();
        }

        // Load full state map: (Name, CountryId) → State.Id
        var stateMap = await db.States
            .ToDictionaryAsync(s => s.Name + "|" + s.CountryId, s => s.Id);

        string StateId(string name, string countryCode) =>
            name + "|" + countryMap.GetValueOrDefault(countryCode);

        // Cities — idempotent by (Name, StateId)
        var existingCities = (await db.Cities
            .Select(c => c.Name + "|" + c.StateId)
            .ToListAsync()).ToHashSet();

        var allCityData = new[]
        {
            // India – Gujarat
            ("Ahmedabad",           "Gujarat",           "IN"),
            ("Surat",               "Gujarat",           "IN"),
            // India – Maharashtra
            ("Mumbai",              "Maharashtra",       "IN"),
            ("Pune",                "Maharashtra",       "IN"),
            // India – Rajasthan
            ("Jaipur",              "Rajasthan",         "IN"),
            // India – Karnataka
            ("Bengaluru",           "Karnataka",         "IN"),
            // India – Kerala
            ("Kochi",               "Kerala",            "IN"),
            ("Thiruvananthapuram",  "Kerala",            "IN"),
            // USA
            ("Los Angeles",         "California",        "US"),
            ("New York City",       "New York",          "US"),
            ("Miami",               "Florida",           "US"),
            // UK
            ("London",              "England",           "GB"),
            // Canada
            ("Toronto",             "Ontario",           "CA"),
            // Australia
            ("Sydney",              "New South Wales",   "AU"),
            // Germany
            ("Munich",              "Bavaria",           "DE"),
            // Nepal – Bagmati Province
            ("Kathmandu",           "Bagmati Province",  "NP"),
            ("Bhaktapur",           "Bagmati Province",  "NP"),
            // Nepal – Gandaki Province
            ("Pokhara",             "Gandaki Province",  "NP"),
            ("Jomsom",              "Gandaki Province",  "NP"),
            // Nepal – Lumbini Province
            ("Lumbini",             "Lumbini Province",  "NP"),
            ("Butwal",              "Lumbini Province",  "NP"),
            // Bhutan – Thimphu District
            ("Thimphu",             "Thimphu District",  "BT"),
            // Bhutan – Paro District
            ("Paro",                "Paro District",     "BT"),
            // Bhutan – Punakha District
            ("Punakha",             "Punakha District",  "BT"),
            ("Wangdue Phodrang",    "Punakha District",  "BT")
        };

        var newCities = allCityData
            .Where(c =>
            {
                var key = StateId(c.Item2, c.Item3);
                return stateMap.ContainsKey(key)
                    && !existingCities.Contains(c.Item1 + "|" + stateMap[key]);
            })
            .Select(c => new City { Name = c.Item1, StateId = stateMap[StateId(c.Item2, c.Item3)] })
            .ToList();

        if (newCities.Count > 0)
        {
            db.Cities.AddRange(newCities);
            await db.SaveChangesAsync();
        }
    }

    // ── Org ──────────────────────────────────────────────────────────────────

    private static async Task SeedOrgAsync(TravelDbContext db)
    {
        // Replace with tourism departments if the tourism seed hasn't run yet
        bool tourismAlreadySeeded = await db.Departments
            .AnyAsync(d => d.Name == "Tour Operations");

        if (!tourismAlreadySeeded)
        {
            // Remove old generic designations and departments (if any exist)
            var oldDesignations = await db.Designations.ToListAsync();
            if (oldDesignations.Count > 0) db.Designations.RemoveRange(oldDesignations);

            var oldDepartments = await db.Departments.ToListAsync();
            if (oldDepartments.Count > 0) db.Departments.RemoveRange(oldDepartments);

            if (oldDesignations.Count > 0 || oldDepartments.Count > 0)
                await db.SaveChangesAsync();

            // Tourism departments
            var deptNames = new[]
            {
                "Tour Operations", "Sales & Reservations", "Customer Experience",
                "Marketing & Promotions", "Finance & Accounts", "Human Resources",
                "Transport & Logistics", "Hotel & Accommodation", "Guide Services",
                "Travel Documentation & Visa", "IT & Digital Services", "Health & Safety",
                "Administration", "Business Development", "Quality Assurance"
            };

            var departments = deptNames.Select(n => new Department { Name = n }).ToList();
            db.Departments.AddRange(departments);
            await db.SaveChangesAsync();

            Department D(string name) => departments.First(d => d.Name == name);

            // Tourism designations — 15 across key departments
            var designationData = new[]
            {
                ("Tour Manager",                  "Tour Operations"),
                ("Tour Coordinator",              "Tour Operations"),
                ("Reservation Executive",         "Sales & Reservations"),
                ("Sales Manager",                 "Sales & Reservations"),
                ("Customer Relations Officer",    "Customer Experience"),
                ("Marketing Manager",             "Marketing & Promotions"),
                ("Digital Marketing Executive",   "Marketing & Promotions"),
                ("Finance Executive",             "Finance & Accounts"),
                ("Fleet Manager",                 "Transport & Logistics"),
                ("Accommodation Manager",         "Hotel & Accommodation"),
                ("Senior Tour Guide",             "Guide Services"),
                ("Tour Guide",                    "Guide Services"),
                ("Visa & Documentation Officer",  "Travel Documentation & Visa"),
                ("Safety Officer",                "Health & Safety"),
                ("Business Development Manager",  "Business Development")
            };

            var designations = designationData
                .Select(d => new Designation { Name = d.Item1, DepartmentId = D(d.Item2).Id })
                .ToList();

            db.Designations.AddRange(designations);
            await db.SaveChangesAsync();
        }
    }
}
