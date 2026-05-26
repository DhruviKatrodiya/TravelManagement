using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TravelManagement.API.Data;
using TravelManagement.API.Helpers;
using TravelManagement.API.Mapping;
using TravelManagement.API.Middleware;
using TravelManagement.API.Services;
using TravelManagement.API.Services.Interfaces;
using TravelManagement.API.Services.PaymentGateways;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Travel Management API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter the JWT bearer token without 'Bearer ' prefix."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

/*connection for mysql*/
// builder.Services.AddDbContext<TravelDbContext>(options =>
// options.UseMySql(
//         builder.Configuration.GetConnectionString("DefaultConnection"),
// ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
//     ));

/*connection for sql server*/

builder.Services.AddDbContext<TravelDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
    sqlOptions => { sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null); }
));

// "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=TravelManagementDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;"

// "DefaultConnection": "server=localhost;database=TravelManagementDb;user=root_dhruvi;password=root@dhruvi;"

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<PaymentSettings>(builder.Configuration.GetSection("Payment"));

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.RequireHttpsMetadata = false;
        opt.SaveToken = true;
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddSingleton<IAuthorizationHandler, MinimumLevelHandler>();
builder.Services.AddAuthorization(options =>
{
    var staffMin = builder.Configuration.GetValue<int>("SystemThresholds:StaffMinLevel", 1);
    var adminMin = builder.Configuration.GetValue<int>("SystemThresholds:AdminMinLevel", 2);
    var superMin = builder.Configuration.GetValue<int>("SystemThresholds:SuperAdminMinLevel", 3);
    options.AddPolicy(RolePolicies.StaffOrAbove, p => p.AddRequirements(new MinimumLevelRequirement(staffMin)));
    options.AddPolicy(RolePolicies.AdminOrAbove, p => p.AddRequirements(new MinimumLevelRequirement(adminMin)));
    options.AddPolicy(RolePolicies.SuperAdminOnly, p => p.AddRequirements(new MinimumLevelRequirement(superMin)));
});

builder.Services.AddAutoMapper(typeof(MappingProfile));

//builder.Services.AddCors(o => o.AddPolicy("AngularApp", p =>
//    p.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
//                  ?? new[] { "http://localhost:4200", "https://localhost:4200" })
//     .AllowAnyHeader()
//     .AllowAnyMethod()
//     .AllowCredentials()));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<IPackageService, PackageService>();
builder.Services.AddScoped<IFacilityService, FacilityService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IDriverService, DriverService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<IRefundService, RefundService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IAppSettingsService, AppSettingsService>();
builder.Services.AddScoped<IHomeDestinationService, HomeDestinationService>();
builder.Services.AddScoped<ICountryService, CountryService>();
builder.Services.AddScoped<IStateService, StateService>();
builder.Services.AddScoped<ICityService, CityService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IDesignationService, DesignationService>();
builder.Services.AddScoped<IPaymentGateway, PaytmGateway>();
builder.Services.AddScoped<IPaymentGateway, GooglePayGateway>();
builder.Services.AddScoped<IRoleService, RoleService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TravelDbContext>();
    try
    {
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to apply migrations on startup");
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID('AppSettings', 'U') IS NULL
BEGIN
    CREATE TABLE AppSettings (
        Id INT NOT NULL PRIMARY KEY,
        LogoUrl NVARCHAR(500) NULL,
        BrandName NVARCHAR(100) NULL,
        ThemeMode NVARCHAR(20) NULL
    );
    INSERT INTO AppSettings (Id) VALUES (1);
END");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to ensure AppSettings table on startup");
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID('HomeDestinations', 'U') IS NULL
BEGIN
    CREATE TABLE HomeDestinations (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(120) NOT NULL,
        Country NVARCHAR(60) NOT NULL,
        ImageUrl NVARCHAR(500) NOT NULL,
        Blurb NVARCHAR(200) NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        TourId INT NULL,
        Keyword NVARCHAR(60) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'TourId' AND Object_ID = Object_ID(N'HomeDestinations'))
        ALTER TABLE HomeDestinations ADD TourId INT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'Keyword' AND Object_ID = Object_ID(N'HomeDestinations'))
        ALTER TABLE HomeDestinations ADD Keyword NVARCHAR(60) NULL;
END");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to ensure HomeDestinations table on startup");
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID('HomeDestinationTours', 'U') IS NULL
BEGIN
    CREATE TABLE HomeDestinationTours (
        HomeDestinationId INT NOT NULL,
        TourId INT NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        CONSTRAINT PK_HomeDestinationTours PRIMARY KEY (HomeDestinationId, TourId),
        CONSTRAINT FK_HomeDestinationTours_HomeDestinations
            FOREIGN KEY (HomeDestinationId) REFERENCES HomeDestinations(Id) ON DELETE CASCADE,
        CONSTRAINT FK_HomeDestinationTours_Tours
            FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE
    );
END;");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to ensure HomeDestinationTours table on startup");
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'IsActive' AND Object_ID = Object_ID(N'Expenses'))
BEGIN
    ALTER TABLE Expenses ADD IsActive BIT NOT NULL CONSTRAINT DF_Expenses_IsActive DEFAULT 1;
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'IsActive' AND Object_ID = Object_ID(N'Vehicles'))
BEGIN
    ALTER TABLE Vehicles ADD IsActive BIT NOT NULL CONSTRAINT DF_Vehicles_IsActive DEFAULT 1;
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'IsActive' AND Object_ID = Object_ID(N'Drivers'))
BEGIN
    ALTER TABLE Drivers ADD IsActive BIT NOT NULL CONSTRAINT DF_Drivers_IsActive DEFAULT 1;
END
IF OBJECT_ID('StaffPermissions', 'U') IS NULL
BEGIN
    CREATE TABLE StaffPermissions (
        StaffId INT NOT NULL,
        Permission NVARCHAR(80) NOT NULL,
        CONSTRAINT PK_StaffPermissions PRIMARY KEY (StaffId, Permission),
        CONSTRAINT FK_StaffPermissions_StaffMembers
            FOREIGN KEY (StaffId) REFERENCES StaffMembers(Id) ON DELETE CASCADE
    );
END
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_VehicleAllocations_StaffMembers')
BEGIN
    ALTER TABLE VehicleAllocations DROP CONSTRAINT FK_VehicleAllocations_StaffMembers;
END
IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'StaffId' AND Object_ID = Object_ID(N'VehicleAllocations'))
BEGIN
    ALTER TABLE VehicleAllocations DROP COLUMN StaffId;
END
IF OBJECT_ID('VehicleAllocationStaff', 'U') IS NULL
BEGIN
    CREATE TABLE VehicleAllocationStaff (
        VehicleAllocationId INT NOT NULL,
        StaffId INT NOT NULL,
        CONSTRAINT PK_VehicleAllocationStaff PRIMARY KEY (VehicleAllocationId, StaffId),
        CONSTRAINT FK_VehicleAllocationStaff_VehicleAllocations
            FOREIGN KEY (VehicleAllocationId) REFERENCES VehicleAllocations(Id) ON DELETE CASCADE,
        CONSTRAINT FK_VehicleAllocationStaff_StaffMembers
            FOREIGN KEY (StaffId) REFERENCES StaffMembers(Id) ON DELETE CASCADE
    );
END");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to ensure Expenses.IsActive column on startup");
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID('Countries', 'U') IS NULL
BEGIN
    CREATE TABLE Countries (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Code NVARCHAR(10) NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );
END
IF OBJECT_ID('States', 'U') IS NULL
BEGIN
    CREATE TABLE States (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        CountryId INT NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_States_Countries FOREIGN KEY (CountryId) REFERENCES Countries(Id)
    );
END
IF OBJECT_ID('Cities', 'U') IS NULL
BEGIN
    CREATE TABLE Cities (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        StateId INT NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_Cities_States FOREIGN KEY (StateId) REFERENCES States(Id)
    );
END
IF OBJECT_ID('Departments', 'U') IS NULL
BEGIN
    CREATE TABLE Departments (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );
END
IF OBJECT_ID('Designations', 'U') IS NULL
BEGIN
    CREATE TABLE Designations (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        DepartmentId INT NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_Designations_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(Id)
    );
END");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to ensure Geo/Org tables on startup");
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID('AppRoles', 'U') IS NULL
BEGIN
    CREATE TABLE AppRoles (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
IF OBJECT_ID('AppRolePermissions', 'U') IS NULL
BEGIN
    CREATE TABLE AppRolePermissions (
        AppRoleId INT NOT NULL,
        Permission NVARCHAR(80) NOT NULL,
        CONSTRAINT PK_AppRolePermissions PRIMARY KEY (AppRoleId, Permission),
        CONSTRAINT FK_AppRolePermissions_AppRoles
            FOREIGN KEY (AppRoleId) REFERENCES AppRoles(Id) ON DELETE CASCADE
    );
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'AppRoleId' AND Object_ID = Object_ID(N'StaffMembers'))
BEGIN
    ALTER TABLE StaffMembers ADD AppRoleId INT NULL;
    ALTER TABLE StaffMembers ADD CONSTRAINT FK_StaffMembers_AppRoles
        FOREIGN KEY (AppRoleId) REFERENCES AppRoles(Id) ON DELETE SET NULL;
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'AppRoleId' AND Object_ID = Object_ID(N'Customers'))
BEGIN
    ALTER TABLE Customers ADD AppRoleId INT NULL;
    ALTER TABLE Customers ADD CONSTRAINT FK_Customers_AppRoles
        FOREIGN KEY (AppRoleId) REFERENCES AppRoles(Id) ON DELETE SET NULL;
END");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to ensure AppRoles tables on startup");
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'SessionToken' AND Object_ID = Object_ID(N'Users'))
BEGIN
    ALTER TABLE Users ADD SessionToken NVARCHAR(64) NULL;
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'ActiveSessionToken' AND Object_ID = Object_ID(N'AppSettings'))
BEGIN
    ALTER TABLE AppSettings ADD ActiveSessionToken NVARCHAR(64) NULL;
END");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to ensure session token columns on startup");
    }

    try
    {
        await DataSeeder.SeedAsync(db);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to seed geo/org data on startup");
    }

    try
    {
        await DataSeeder.SeedRolesAsync(db);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to seed default roles on startup");
    }

    try
    {
        await DataSeeder.SeedCustomPermissionsAsync(db);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to seed custom permissions on startup");
    }

    try
    {
        await DataSeeder.SeedSuperAdminAsync(db, app.Configuration);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to seed super admin on startup");
    }

    try
    {
        var saEmail = app.Configuration["DefaultSuperAdmin:Email"];
        await DataSeeder.FixStaleRoleValuesAsync(db, saEmail);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to fix stale role values on startup");
    }

    try
    {
        await DataSeeder.SeedAdminStaffMembersAsync(db);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to create StaffMember records for Admin users");
    }

}
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ErrorHandlingMiddleware>();
//app.UseCors("AngularApp");
app.UseCors("AllowAngular");

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseMiddleware<SessionValidationMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();
