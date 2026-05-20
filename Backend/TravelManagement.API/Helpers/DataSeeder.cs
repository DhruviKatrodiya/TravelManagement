using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.Models;

namespace TravelManagement.API.Helpers;

public static class DataSeeder
{
    public static async Task SeedAsync(TravelDbContext db)
    {
        await SeedGeoAsync(db);
        await SeedOrgAsync(db);
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
