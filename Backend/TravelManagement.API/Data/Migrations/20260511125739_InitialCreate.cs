using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelManagement.API.Data.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Drivers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    LicenseNumber = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    LicenseExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    ExperienceYears = table.Column<int>(type: "int", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Drivers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Facilities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Cost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Facilities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Destination = table.Column<int>(type: "int", nullable: false),
                    Region = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Highlights = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tours", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    RegistrationNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    Make = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Model = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Year = table.Column<int>(type: "int", nullable: true),
                    CostPerDay = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TourPackages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TourId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    DurationDays = table.Column<int>(type: "int", nullable: false),
                    DurationNights = table.Column<int>(type: "int", nullable: false),
                    PricePerPerson = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ChildPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MinPersons = table.Column<int>(type: "int", nullable: false),
                    MaxPersons = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Inclusions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Exclusions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsCustomizable = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourPackages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourPackages_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    City = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    State = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IdProofType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    IdProofNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Customers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Link = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Designation = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Department = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Salary = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Itineraries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TourPackageId = table.Column<int>(type: "int", nullable: false),
                    DayNumber = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Activities = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Accommodation = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Meals = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Itineraries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Itineraries_TourPackages_TourPackageId",
                        column: x => x.TourPackageId,
                        principalTable: "TourPackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageFacilities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TourPackageId = table.Column<int>(type: "int", nullable: false),
                    FacilityId = table.Column<int>(type: "int", nullable: false),
                    Included = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageFacilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageFacilities_Facilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "Facilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PackageFacilities_TourPackages_TourPackageId",
                        column: x => x.TourPackageId,
                        principalTable: "TourPackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TourId = table.Column<int>(type: "int", nullable: false),
                    TourPackageId = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AvailableSeats = table.Column<int>(type: "int", nullable: false),
                    BookedSeats = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourSchedules_TourPackages_TourPackageId",
                        column: x => x.TourPackageId,
                        principalTable: "TourPackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourSchedules_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingReference = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    TourPackageId = table.Column<int>(type: "int", nullable: false),
                    TourScheduleId = table.Column<int>(type: "int", nullable: true),
                    TripStartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TripEndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Adults = table.Column<int>(type: "int", nullable: false),
                    Children = table.Column<int>(type: "int", nullable: false),
                    SubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Tax = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SpecialRequests = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CustomItinerary = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    BookedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_TourPackages_TourPackageId",
                        column: x => x.TourPackageId,
                        principalTable: "TourPackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_TourSchedules_TourScheduleId",
                        column: x => x.TourScheduleId,
                        principalTable: "TourSchedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingId = table.Column<int>(type: "int", nullable: true),
                    TourPackageId = table.Column<int>(type: "int", nullable: true),
                    Category = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ExpenseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Vendor = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    PaidBy = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Expenses_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Expenses_TourPackages_TourPackageId",
                        column: x => x.TourPackageId,
                        principalTable: "TourPackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    TransactionReference = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    GatewayTransactionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Method = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GatewayResponse = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    InitiatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Refunds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    RequestedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ApprovedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AdminNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Refunds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Refunds_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    TourId = table.Column<int>(type: "int", nullable: false),
                    BookingId = table.Column<int>(type: "int", nullable: true),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Comment = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Reviews_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VehicleAllocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VehicleId = table.Column<int>(type: "int", nullable: false),
                    DriverId = table.Column<int>(type: "int", nullable: true),
                    BookingId = table.Column<int>(type: "int", nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleAllocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VehicleAllocations_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VehicleAllocations_Drivers_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Drivers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VehicleAllocations_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Drivers",
                columns: new[] { "Id", "Address", "CreatedAt", "Email", "ExperienceYears", "FullName", "IsAvailable", "LicenseExpiry", "LicenseNumber", "Phone" },
                values: new object[,]
                {
                    { 1, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 8, "Ravi Kumar", true, new DateTime(2028, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "KA0120240001", "+919000000001" },
                    { 2, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 12, "Suresh Patel", true, new DateTime(2027, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "KA0120240002", "+919000000002" }
                });

            migrationBuilder.InsertData(
                table: "Facilities",
                columns: new[] { "Id", "Cost", "Description", "IsActive", "Name", "Type" },
                values: new object[,]
                {
                    { 1, 300m, null, true, "Breakfast", 0 },
                    { 2, 500m, null, true, "Lunch", 1 },
                    { 3, 600m, null, true, "Dinner", 2 },
                    { 4, 2500m, null, true, "3-Star Hotel Stay", 3 },
                    { 5, 1500m, null, true, "AC Transportation", 4 },
                    { 6, 1200m, null, true, "Local Guide", 5 }
                });

            migrationBuilder.InsertData(
                table: "Tours",
                columns: new[] { "Id", "CreatedAt", "Description", "Destination", "Highlights", "ImageUrl", "IsActive", "Name", "Region", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Explore the iconic Golden Triangle covering Delhi, Agra and Jaipur.", 0, "Taj Mahal, Amber Fort, Qutub Minar", "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800", true, "Golden Triangle Discovery", "Delhi-Agra-Jaipur", null },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A serene cruise through Kerala's famous backwaters and lush hills.", 0, "Alleppey houseboats, Munnar tea gardens, Kochi", "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", true, "Kerala Backwaters Bliss", "Kerala", null },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Discover the kingdom of happiness with monasteries, dzongs and Himalayan views.", 1, "Tiger's Nest, Punakha Dzong, Dochula Pass", "https://images.unsplash.com/photo-1580651315530-69c8e0903883?w=800", true, "Bhutan Cultural Trail", "Paro-Thimphu-Punakha", null },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Adventure through temples, lakes and Annapurna foothills.", 2, "Pashupatinath, Phewa Lake, Sarangkot sunrise", "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800", true, "Nepal Himalayan Escape", "Kathmandu-Pokhara", null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "LastLoginAt", "PasswordHash", "Phone", "Role" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@travel.local", "Administrator", true, null, "$2a$11$/s57prvPkHnOidcAK0ZNN.FFtewl81vKLlBf4tV1GeJK2zLzbYQBi", "+910000000001", 2 },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@travel.local", "Staff One", true, null, "$2a$11$7OWJaNRtLB9aREI1T7saXeeFR7GEhUbPZz6XAW4NDrQBgLXOPYKn6", "+910000000002", 1 },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "customer@travel.local", "Demo Customer", true, null, "$2a$11$ZyotDVLFjnsuXKduYn2wjeujOZJFLBzGs9CTTXbZNxdu9sGMBOFDm", "+910000000003", 0 }
                });

            migrationBuilder.InsertData(
                table: "Vehicles",
                columns: new[] { "Id", "Capacity", "CostPerDay", "CreatedAt", "IsAvailable", "Make", "Model", "Name", "Notes", "RegistrationNumber", "Type", "Year" },
                values: new object[,]
                {
                    { 1, 6, 3500m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Toyota", "Innova Crysta", "Toyota Innova", null, "KA01AB1234", 0, 2022 },
                    { 2, 17, 6500m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Force", "Traveller", "Force Traveller 17", null, "KA01CD5678", 2, 2021 },
                    { 3, 45, 12000m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Volvo", "9400", "Volvo 45-seater", null, "KA01EF9012", 3, 2020 }
                });

            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "Id", "Address", "City", "Country", "DateOfBirth", "Gender", "IdProofNumber", "IdProofType", "PostalCode", "State", "UserId" },
                values: new object[] { 1, "12 MG Road", "Bengaluru", "India", null, null, null, null, "560001", "Karnataka", 3 });

            migrationBuilder.InsertData(
                table: "StaffMembers",
                columns: new[] { "Id", "Department", "Designation", "JoinedAt", "Notes", "Salary", "UserId" },
                values: new object[] { 1, "Operations", "Tour Coordinator", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 2 });

            migrationBuilder.InsertData(
                table: "TourPackages",
                columns: new[] { "Id", "ChildPrice", "CreatedAt", "Description", "DurationDays", "DurationNights", "Exclusions", "Inclusions", "IsActive", "IsCustomizable", "MaxPersons", "MinPersons", "Name", "PricePerPerson", "TourId" },
                values: new object[,]
                {
                    { 1, 9999m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Quick 3-day getaway covering all highlights.", 3, 2, "Flights, personal expenses", "Hotel, breakfast, transport, guide", true, true, 12, 2, "Golden Triangle 3D/2N", 14999m, 1 },
                    { 2, 16999m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Extended deluxe experience with premium hotels.", 5, 4, "Flights, tips", "4* hotel, all meals, AC transport, guide", true, true, 12, 2, "Golden Triangle 5D/4N Deluxe", 24999m, 1 },
                    { 3, 14999m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Munnar, Thekkady, Alleppey and Kochi.", 5, 4, "Lunch, personal expenses", "Houseboat, hotel, breakfast & dinner", true, true, 10, 2, "Kerala 5D/4N Classic", 22999m, 2 },
                    { 4, 24999m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Comprehensive Bhutan cultural circuit.", 6, 5, "Air tickets, personal expenses", "Hotel, all meals, Bhutan visa, transport", true, false, 10, 2, "Bhutan 6D/5N Discovery", 39999m, 3 },
                    { 5, 11999m, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Kathmandu and Pokhara highlights.", 4, 3, "Flights, lunch & dinner", "Hotel, breakfast, transport, guide", true, true, 12, 2, "Nepal 4D/3N Highlights", 18999m, 4 }
                });

            migrationBuilder.InsertData(
                table: "Itineraries",
                columns: new[] { "Id", "Accommodation", "Activities", "DayNumber", "Description", "Location", "Meals", "Title", "TourPackageId" },
                values: new object[] { 1, "3* Hotel, Delhi", "Red Fort, India Gate, Qutub Minar", 1, "Arrival, city tour of Old & New Delhi.", "Delhi", "Breakfast", "Arrive Delhi", 1 });

            migrationBuilder.InsertData(
                table: "Itineraries",
                columns: new[] { "Id", "Accommodation", "Activities", "DayNumber", "Description", "Location", "Meals", "Title", "TourPackageId" },
                values: new object[] { 2, "3* Hotel, Jaipur", "Taj Mahal, Agra Fort", 2, "Visit Taj Mahal & Agra Fort, drive to Jaipur.", "Agra/Jaipur", "Breakfast", "Delhi-Agra-Jaipur", 1 });

            migrationBuilder.InsertData(
                table: "Itineraries",
                columns: new[] { "Id", "Accommodation", "Activities", "DayNumber", "Description", "Location", "Meals", "Title", "TourPackageId" },
                values: new object[] { 3, "-", "Amber Fort, Hawa Mahal", 3, "Amber Fort, City Palace, departure.", "Jaipur", "Breakfast", "Jaipur city tour & departure", 1 });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BookingReference",
                table: "Bookings",
                column: "BookingReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_CustomerId",
                table: "Bookings",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TourPackageId",
                table: "Bookings",
                column: "TourPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TourScheduleId",
                table: "Bookings",
                column: "TourScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_UserId",
                table: "Customers",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_LicenseNumber",
                table: "Drivers",
                column: "LicenseNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_BookingId",
                table: "Expenses",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_TourPackageId",
                table: "Expenses",
                column: "TourPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Itineraries_TourPackageId",
                table: "Itineraries",
                column: "TourPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageFacilities_FacilityId",
                table: "PackageFacilities",
                column: "FacilityId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageFacilities_TourPackageId",
                table: "PackageFacilities",
                column: "TourPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BookingId",
                table: "Payments",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TransactionReference",
                table: "Payments",
                column: "TransactionReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_BookingId",
                table: "Refunds",
                column: "BookingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingId",
                table: "Reviews",
                column: "BookingId",
                unique: true,
                filter: "[BookingId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_CustomerId",
                table: "Reviews",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_TourId",
                table: "Reviews",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffMembers_UserId",
                table: "StaffMembers",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourPackages_TourId",
                table: "TourPackages",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_TourSchedules_TourId",
                table: "TourSchedules",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_TourSchedules_TourPackageId",
                table: "TourSchedules",
                column: "TourPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleAllocations_BookingId",
                table: "VehicleAllocations",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleAllocations_DriverId",
                table: "VehicleAllocations",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleAllocations_VehicleId",
                table: "VehicleAllocations",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_RegistrationNumber",
                table: "Vehicles",
                column: "RegistrationNumber",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Expenses");

            migrationBuilder.DropTable(
                name: "Itineraries");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "PackageFacilities");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Refunds");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "StaffMembers");

            migrationBuilder.DropTable(
                name: "VehicleAllocations");

            migrationBuilder.DropTable(
                name: "Facilities");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "Drivers");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "TourSchedules");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "TourPackages");

            migrationBuilder.DropTable(
                name: "Tours");
        }
    }
}
