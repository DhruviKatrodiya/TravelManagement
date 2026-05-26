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
    public DbSet<OtpRecord> OtpRecords => Set<OtpRecord>();
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<State> States => Set<State>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<AppRole> AppRoles => Set<AppRole>();
    public DbSet<AppRolePermission> AppRolePermissions => Set<AppRolePermission>();
    public DbSet<CustomPermission> CustomPermissions => Set<CustomPermission>();

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

        builder.Entity<State>(e =>
        {
            e.HasOne(x => x.Country).WithMany(c => c.States).HasForeignKey(x => x.CountryId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<City>(e =>
        {
            e.HasOne(x => x.State).WithMany(s => s.Cities).HasForeignKey(x => x.StateId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Designation>(e =>
        {
            e.HasOne(x => x.Department).WithMany(d => d.Designations).HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AppRolePermission>(e =>
        {
            e.HasKey(x => new { x.AppRoleId, x.Permission });
            e.HasOne(x => x.AppRole).WithMany(r => r.Permissions).HasForeignKey(x => x.AppRoleId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Staff>(e =>
        {
            e.HasOne(x => x.AppRole).WithMany().HasForeignKey(x => x.AppRoleId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<CustomPermission>(e =>
        {
            e.HasIndex(x => x.Key).IsUnique();
        });

        builder.Entity<Customer>(e =>
        {
            e.HasOne(x => x.AppRole).WithMany().HasForeignKey(x => x.AppRoleId).OnDelete(DeleteBehavior.SetNull);
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
            }
        );
    }
}
