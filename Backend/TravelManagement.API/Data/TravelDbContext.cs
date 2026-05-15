using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;

namespace TravelManagement.API.Data;

public class TravelDbContext : DbContext
{
    public TravelDbContext(DbContextOptions<TravelDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Staff> StaffMembers => Set<Staff>();
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<TourPackage> TourPackages => Set<TourPackage>();
    public DbSet<Itinerary> Itineraries => Set<Itinerary>();
    public DbSet<Facility> Facilities => Set<Facility>();
    public DbSet<PackageFacility> PackageFacilities => Set<PackageFacility>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<VehicleAllocation> VehicleAllocations => Set<VehicleAllocation>();
    public DbSet<TourSchedule> TourSchedules => Set<TourSchedule>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<HomeDestination> HomeDestinations => Set<HomeDestination>();
    public DbSet<HomeDestinationTour> HomeDestinationTours => Set<HomeDestinationTour>();
    public DbSet<VehicleAllocationStaff> VehicleAllocationStaff => Set<VehicleAllocationStaff>();
    public DbSet<StaffPermission> StaffPermissions => Set<StaffPermission>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<User>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.HasOne(x => x.Customer).WithOne(c => c.User).HasForeignKey<Customer>(c => c.UserId);
            e.HasOne(x => x.Staff).WithOne(s => s.User).HasForeignKey<Staff>(s => s.UserId);
        });

        builder.Entity<Booking>(e =>
        {
            e.HasIndex(x => x.BookingReference).IsUnique();
            e.HasOne(x => x.Customer).WithMany(c => c.Bookings).HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.TourPackage).WithMany(p => p.Bookings).HasForeignKey(x => x.TourPackageId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.TourSchedule).WithMany(s => s.Bookings).HasForeignKey(x => x.TourScheduleId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Refund).WithOne(r => r.Booking).HasForeignKey<Refund>(r => r.BookingId);
            e.HasOne(x => x.Review).WithOne(r => r.Booking!).HasForeignKey<Review>(r => r.BookingId);
        });

        builder.Entity<Driver>(e =>
        {
            e.HasIndex(x => x.LicenseNumber).IsUnique();
        });

        builder.Entity<Vehicle>(e =>
        {
            e.HasIndex(x => x.RegistrationNumber).IsUnique();
        });

        builder.Entity<TourPackage>(e =>
        {
            e.HasOne(x => x.Tour).WithMany(t => t.Packages).HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Itinerary>(e =>
        {
            e.HasOne(x => x.TourPackage).WithMany(p => p.Itineraries).HasForeignKey(x => x.TourPackageId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PackageFacility>(e =>
        {
            e.HasOne(x => x.TourPackage).WithMany(p => p.PackageFacilities).HasForeignKey(x => x.TourPackageId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Facility).WithMany(f => f.PackageFacilities).HasForeignKey(x => x.FacilityId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TourSchedule>(e =>
        {
            e.HasOne(x => x.Tour).WithMany(t => t.Schedules).HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.TourPackage).WithMany(p => p.Schedules).HasForeignKey(x => x.TourPackageId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Payment>(e =>
        {
            e.HasIndex(x => x.TransactionReference).IsUnique();
            e.HasOne(x => x.Booking).WithMany(b => b.Payments).HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<VehicleAllocation>(e =>
        {
            e.HasOne(x => x.Vehicle).WithMany(v => v.Allocations).HasForeignKey(x => x.VehicleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Driver).WithMany(d => d.Allocations).HasForeignKey(x => x.DriverId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Booking).WithMany(b => b.VehicleAllocations).HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<VehicleAllocationStaff>(e =>
        {
            e.HasKey(x => new { x.VehicleAllocationId, x.StaffId });
            e.HasOne(x => x.VehicleAllocation).WithMany(a => a.StaffAssignments).HasForeignKey(x => x.VehicleAllocationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Staff).WithMany().HasForeignKey(x => x.StaffId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<StaffPermission>(e =>
        {
            e.HasKey(x => new { x.StaffId, x.Permission });
            e.HasOne(x => x.Staff).WithMany().HasForeignKey(x => x.StaffId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Review>(e =>
        {
            e.HasOne(x => x.Customer).WithMany(c => c.Reviews).HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tour).WithMany(t => t.Reviews).HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Expense>(e =>
        {
            e.HasOne(x => x.Booking).WithMany().HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.TourPackage).WithMany().HasForeignKey(x => x.TourPackageId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Notification>(e =>
        {
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<HomeDestinationTour>(e =>
        {
            e.HasKey(x => new { x.HomeDestinationId, x.TourId });
            e.HasOne(x => x.HomeDestination).WithMany(d => d.DestinationTours).HasForeignKey(x => x.HomeDestinationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tour).WithMany().HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Cascade);
        });

        SeedData(builder);
    }

    private static void SeedData(ModelBuilder builder)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        builder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                FullName = "Administrator",
                Email = "admin@travel.local",
                Phone = "+910000000001",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = seedDate
            },
            new User
            {
                Id = 2,
                FullName = "Staff One",
                Email = "staff@travel.local",
                Phone = "+910000000002",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
                Role = UserRole.Staff,
                IsActive = true,
                CreatedAt = seedDate
            },
            new User
            {
                Id = 3,
                FullName = "Demo Customer",
                Email = "customer@travel.local",
                Phone = "+910000000003",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                Role = UserRole.Customer,
                IsActive = true,
                CreatedAt = seedDate
            }
        );

        builder.Entity<Customer>().HasData(new Customer
        {
            Id = 1,
            UserId = 3,
            Address = "12 MG Road",
            City = "Bengaluru",
            State = "Karnataka",
            PostalCode = "560001",
            Country = "India"
        });

        builder.Entity<Staff>().HasData(new Staff
        {
            Id = 1,
            UserId = 2,
            Designation = "Tour Coordinator",
            Department = "Operations",
            JoinedAt = seedDate
        });

        builder.Entity<Tour>().HasData(
            new Tour { Id = 1, Name = "Golden Triangle Discovery", Destination = Destination.India, Region = "Delhi-Agra-Jaipur", Description = "Explore the iconic Golden Triangle covering Delhi, Agra and Jaipur.", Highlights = "Taj Mahal, Amber Fort, Qutub Minar", ImageUrl = "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 2, Name = "Kerala Backwaters Bliss", Destination = Destination.India, Region = "Kerala", Description = "A serene cruise through Kerala's famous backwaters and lush hills.", Highlights = "Alleppey houseboats, Munnar tea gardens, Kochi", ImageUrl = "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 3, Name = "Bhutan Cultural Trail", Destination = Destination.Bhutan, Region = "Paro-Thimphu-Punakha", Description = "Discover the kingdom of happiness with monasteries, dzongs and Himalayan views.", Highlights = "Tiger's Nest, Punakha Dzong, Dochula Pass", ImageUrl = "/bhutan.jpg", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 4, Name = "Nepal Himalayan Escape", Destination = Destination.Nepal, Region = "Kathmandu-Pokhara", Description = "Adventure through temples, lakes and Annapurna foothills.", Highlights = "Pashupatinath, Phewa Lake, Sarangkot sunrise", ImageUrl = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 5, Name = "Rajasthan Royal Escape", Destination = Destination.India, Region = "Jaipur-Udaipur-Jaisalmer", Description = "Forts, palaces and desert dunes across the heart of Rajasthan.", Highlights = "Amber Fort, City Palace, Sam Sand Dunes, Lake Pichola", ImageUrl = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 6, Name = "Ladakh High Altitude Adventure", Destination = Destination.India, Region = "Leh-Nubra-Pangong", Description = "High passes, alpine lakes and Buddhist monasteries in the Himalayas.", Highlights = "Pangong Lake, Khardung La, Nubra Valley, Thiksey Monastery", ImageUrl = "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 7, Name = "Goa Beach Holiday", Destination = Destination.India, Region = "North & South Goa", Description = "Sun, sand, seafood and Portuguese-era charm by the Arabian Sea.", Highlights = "Calangute, Anjuna, Old Goa churches, Dudhsagar Falls", ImageUrl = "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 8, Name = "Kashmir Paradise", Destination = Destination.India, Region = "Srinagar-Gulmarg-Pahalgam", Description = "Shikara rides on Dal Lake, Mughal gardens and snow-clad meadows.", Highlights = "Dal Lake, Gulmarg Gondola, Betaab Valley, Mughal Gardens", ImageUrl = "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 9, Name = "Sikkim & Darjeeling Charm", Destination = Destination.India, Region = "Gangtok-Darjeeling-Pelling", Description = "Tea gardens, toy train rides and Kanchenjunga sunrise vistas.", Highlights = "Tiger Hill sunrise, Tsomgo Lake, Nathula Pass, Pelling", ImageUrl = "https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 10, Name = "Andaman Island Escape", Destination = Destination.India, Region = "Port Blair-Havelock-Neil", Description = "Turquoise waters, coral reefs and pristine beaches in the Bay of Bengal.", Highlights = "Radhanagar Beach, Cellular Jail, scuba at Elephant Beach, Neil Island sunsets", ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 11, Name = "Meghalaya Cloud Trail", Destination = Destination.India, Region = "Shillong-Cherrapunji-Mawlynnong", Description = "Living root bridges, waterfalls and the cleanest village in Asia.", Highlights = "Nohkalikai Falls, Double Decker Root Bridge, Dawki river, Mawlynnong", ImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800", IsActive = true, CreatedAt = seedDate },
            new Tour { Id = 12, Name = "Hampi Heritage Circuit", Destination = Destination.India, Region = "Hampi-Hospet-Anegundi", Description = "Boulder-strewn ruins of the Vijayanagara Empire on the banks of the Tungabhadra.", Highlights = "Virupaksha Temple, Vittala Stone Chariot, Matanga Hill sunrise, Anegundi coracle ride", ImageUrl = "https://images.unsplash.com/photo-1582510003544-4eb04ad9636e?w=800", IsActive = true, CreatedAt = seedDate }
        );

        builder.Entity<TourPackage>().HasData(
            new TourPackage { Id = 1, TourId = 1, Name = "Golden Triangle 3D/2N", DurationDays = 3, DurationNights = 2, PricePerPerson = 14999m, ChildPrice = 9999m, MinPersons = 2, MaxPersons = 12, Description = "Quick 3-day getaway covering all highlights.", Inclusions = "Hotel, breakfast, transport, guide", Exclusions = "Flights, personal expenses", IsCustomizable = true, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 2, TourId = 1, Name = "Golden Triangle 5D/4N Deluxe", DurationDays = 5, DurationNights = 4, PricePerPerson = 24999m, ChildPrice = 16999m, MinPersons = 2, MaxPersons = 12, Description = "Extended deluxe experience with premium hotels.", Inclusions = "4* hotel, all meals, AC transport, guide", Exclusions = "Flights, tips", IsCustomizable = true, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 3, TourId = 2, Name = "Kerala 5D/4N Classic", DurationDays = 5, DurationNights = 4, PricePerPerson = 22999m, ChildPrice = 14999m, MinPersons = 2, MaxPersons = 10, Description = "Munnar, Thekkady, Alleppey and Kochi.", Inclusions = "Houseboat, hotel, breakfast & dinner", Exclusions = "Lunch, personal expenses", IsCustomizable = true, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 4, TourId = 3, Name = "Bhutan 6D/5N Discovery", DurationDays = 6, DurationNights = 5, PricePerPerson = 39999m, ChildPrice = 24999m, MinPersons = 2, MaxPersons = 10, Description = "Comprehensive Bhutan cultural circuit.", Inclusions = "Hotel, all meals, Bhutan visa, transport", Exclusions = "Air tickets, personal expenses", IsCustomizable = false, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 5, TourId = 4, Name = "Nepal 4D/3N Highlights", DurationDays = 4, DurationNights = 3, PricePerPerson = 18999m, ChildPrice = 11999m, MinPersons = 2, MaxPersons = 12, Description = "Kathmandu and Pokhara highlights.", Inclusions = "Hotel, breakfast, transport, guide", Exclusions = "Flights, lunch & dinner", IsCustomizable = true, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 6, TourId = 5, Name = "Rajasthan 6D/5N Royal", DurationDays = 6, DurationNights = 5, PricePerPerson = 28999m, ChildPrice = 18999m, MinPersons = 2, MaxPersons = 12, Description = "Jaipur, Pushkar, Udaipur and Jaisalmer dunes safari.", Inclusions = "Heritage hotel, breakfast, AC transport, guide", Exclusions = "Flights, lunch & dinner, monuments fees", IsCustomizable = true, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 7, TourId = 6, Name = "Ladakh 7D/6N Explorer", DurationDays = 7, DurationNights = 6, PricePerPerson = 34999m, ChildPrice = 22999m, MinPersons = 2, MaxPersons = 10, Description = "Leh acclimatisation, Nubra dune safari and Pangong overnight.", Inclusions = "Hotel/camp, all meals, permits, oxygen support", Exclusions = "Flights, insurance, personal expenses", IsCustomizable = false, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 8, TourId = 7, Name = "Goa 4D/3N Beach Break", DurationDays = 4, DurationNights = 3, PricePerPerson = 12999m, ChildPrice = 8999m, MinPersons = 2, MaxPersons = 10, Description = "Beachside resort, North + South Goa sightseeing, cruise.", Inclusions = "Beach hotel, breakfast, AC transport, sunset cruise", Exclusions = "Flights, lunch & dinner, water sports", IsCustomizable = true, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 9, TourId = 8, Name = "Kashmir 5D/4N Paradise", DurationDays = 5, DurationNights = 4, PricePerPerson = 19999m, ChildPrice = 13999m, MinPersons = 2, MaxPersons = 10, Description = "Srinagar houseboat night, Gulmarg gondola and Pahalgam.", Inclusions = "Houseboat + hotel, breakfast & dinner, transport", Exclusions = "Flights, lunch, gondola tickets", IsCustomizable = true, IsActive = true, CreatedAt = seedDate },
            new TourPackage { Id = 10, TourId = 9, Name = "Sikkim & Darjeeling 6D/5N", DurationDays = 6, DurationNights = 5, PricePerPerson = 21999m, ChildPrice = 14999m, MinPersons = 2, MaxPersons = 12, Description = "Gangtok, Tsomgo Lake, Darjeeling tea gardens and Tiger Hill.", Inclusions = "Hotel, breakfast, transport, permits", Exclusions = "Flights, lunch & dinner, Nathula extra", IsCustomizable = true, IsActive = true, CreatedAt = seedDate }
        );

        builder.Entity<Itinerary>().HasData(
            new Itinerary { Id = 1, TourPackageId = 1, DayNumber = 1, Title = "Arrive Delhi", Description = "Arrival, city tour of Old & New Delhi.", Location = "Delhi", Activities = "Red Fort, India Gate, Qutub Minar", Accommodation = "3* Hotel, Delhi", Meals = "Breakfast" },
            new Itinerary { Id = 2, TourPackageId = 1, DayNumber = 2, Title = "Delhi-Agra-Jaipur", Description = "Visit Taj Mahal & Agra Fort, drive to Jaipur.", Location = "Agra/Jaipur", Activities = "Taj Mahal, Agra Fort", Accommodation = "3* Hotel, Jaipur", Meals = "Breakfast" },
            new Itinerary { Id = 3, TourPackageId = 1, DayNumber = 3, Title = "Jaipur city tour & departure", Description = "Amber Fort, City Palace, departure.", Location = "Jaipur", Activities = "Amber Fort, Hawa Mahal", Accommodation = "-", Meals = "Breakfast" }
        );

        builder.Entity<Facility>().HasData(
            new Facility { Id = 1, Name = "Breakfast", Type = FacilityType.Breakfast, Cost = 300m, IsActive = true },
            new Facility { Id = 2, Name = "Lunch", Type = FacilityType.Lunch, Cost = 500m, IsActive = true },
            new Facility { Id = 3, Name = "Dinner", Type = FacilityType.Dinner, Cost = 600m, IsActive = true },
            new Facility { Id = 4, Name = "3-Star Hotel Stay", Type = FacilityType.Hotel, Cost = 2500m, IsActive = true },
            new Facility { Id = 5, Name = "AC Transportation", Type = FacilityType.Transportation, Cost = 1500m, IsActive = true },
            new Facility { Id = 6, Name = "Local Guide", Type = FacilityType.Guide, Cost = 1200m, IsActive = true }
        );

        builder.Entity<Vehicle>().HasData(
            new Vehicle { Id = 1, Name = "Toyota Innova", RegistrationNumber = "KA01AB1234", Type = VehicleType.Car, Capacity = 6, Make = "Toyota", Model = "Innova Crysta", Year = 2022, CostPerDay = 3500m, IsAvailable = true, CreatedAt = seedDate },
            new Vehicle { Id = 2, Name = "Force Traveller 17", RegistrationNumber = "KA01CD5678", Type = VehicleType.MiniBus, Capacity = 17, Make = "Force", Model = "Traveller", Year = 2021, CostPerDay = 6500m, IsAvailable = true, CreatedAt = seedDate },
            new Vehicle { Id = 3, Name = "Volvo 45-seater", RegistrationNumber = "KA01EF9012", Type = VehicleType.Bus, Capacity = 45, Make = "Volvo", Model = "9400", Year = 2020, CostPerDay = 12000m, IsAvailable = true, CreatedAt = seedDate }
        );

        builder.Entity<Driver>().HasData(
            new Driver { Id = 1, FullName = "Ravi Kumar", Phone = "+919000000001", LicenseNumber = "KA0120240001", LicenseExpiry = new DateTime(2028, 1, 1, 0, 0, 0, DateTimeKind.Utc), ExperienceYears = 8, IsAvailable = true, CreatedAt = seedDate },
            new Driver { Id = 2, FullName = "Suresh Patel", Phone = "+919000000002", LicenseNumber = "KA0120240002", LicenseExpiry = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc), ExperienceYears = 12, IsAvailable = true, CreatedAt = seedDate }
        );
    }
}
