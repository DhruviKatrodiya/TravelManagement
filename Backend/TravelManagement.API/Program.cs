using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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

builder.Services.AddDbContext<TravelDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

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

builder.Services.AddAuthorization();

builder.Services.AddAutoMapper(typeof(MappingProfile));

builder.Services.AddCors(o => o.AddPolicy("AngularApp", p =>
    p.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                  ?? new[] { "http://localhost:4200", "https://localhost:4200" })
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));

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
builder.Services.AddScoped<IPaymentGateway, PaytmGateway>();
builder.Services.AddScoped<IPaymentGateway, GooglePayGateway>();

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

    EXEC sp_executesql N'
        INSERT INTO HomeDestinations (Name, Country, ImageUrl, Blurb, SortOrder, TourId, Keyword, IsActive) VALUES
        (N''Taj Mahal'', N''India'', N''https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200'', N''Agra • Wonder of the world'', 1, 1, N''Agra'', 1),
        (N''Kerala Backwaters'', N''India'', N''https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200'', N''Alleppey • Houseboats & canals'', 2, 2, N''Kerala'', 1),
        (N''Jaipur — Pink City'', N''India'', N''https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200'', N''Rajasthan • Forts & palaces'', 3, 5, N''Jaipur'', 1),
        (N''Tiger''''s Nest Monastery'', N''Bhutan'', N''/bhutan.jpg'', N''Paro • Cliff-side monastery'', 4, 3, N''Bhutan'', 1),
        (N''Pokhara & Annapurna'', N''Nepal'', N''https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200'', N''Phewa Lake & sunrise treks'', 5, 4, N''Nepal'', 1),
        (N''Ladakh'', N''India'', N''https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1600'', N''High-altitude lakes & monasteries'', 6, 6, N''Ladakh'', 1),
        (N''Goa Beaches'', N''India'', N''https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=1200'', N''Sun, sand & seafood'', 7, 7, N''Goa'', 1),
        (N''Kashmir Valley'', N''India'', N''https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200'', N''Srinagar • Shikara rides on Dal Lake'', 8, 8, N''Kashmir'', 1);';
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'TourId' AND Object_ID = Object_ID(N'HomeDestinations'))
        ALTER TABLE HomeDestinations ADD TourId INT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'Keyword' AND Object_ID = Object_ID(N'HomeDestinations'))
        ALTER TABLE HomeDestinations ADD Keyword NVARCHAR(60) NULL;

    EXEC sp_executesql N'
        UPDATE HomeDestinations SET TourId = 1 WHERE Name = N''Taj Mahal'' AND TourId IS NULL;
        UPDATE HomeDestinations SET TourId = 2 WHERE Name = N''Kerala Backwaters'' AND TourId IS NULL;
        UPDATE HomeDestinations SET TourId = 5 WHERE Name = N''Jaipur — Pink City'' AND TourId IS NULL;
        UPDATE HomeDestinations SET TourId = 3 WHERE Name = N''Tiger''''s Nest Monastery'' AND TourId IS NULL;
        UPDATE HomeDestinations SET TourId = 4 WHERE Name = N''Pokhara & Annapurna'' AND TourId IS NULL;
        UPDATE HomeDestinations SET TourId = 6 WHERE Name = N''Ladakh'' AND TourId IS NULL;
        UPDATE HomeDestinations SET TourId = 7 WHERE Name = N''Goa Beaches'' AND TourId IS NULL;
        UPDATE HomeDestinations SET TourId = 8 WHERE Name = N''Kashmir Valley'' AND TourId IS NULL;

        UPDATE HomeDestinations SET Keyword = N''Agra''    WHERE Name = N''Taj Mahal'' AND Keyword IS NULL;
        UPDATE HomeDestinations SET Keyword = N''Kerala''  WHERE Name = N''Kerala Backwaters'' AND Keyword IS NULL;
        UPDATE HomeDestinations SET Keyword = N''Jaipur''  WHERE Name = N''Jaipur — Pink City'' AND Keyword IS NULL;
        UPDATE HomeDestinations SET Keyword = N''Bhutan''  WHERE Name = N''Tiger''''s Nest Monastery'' AND Keyword IS NULL;
        UPDATE HomeDestinations SET Keyword = N''Nepal''   WHERE Name = N''Pokhara & Annapurna'' AND Keyword IS NULL;
        UPDATE HomeDestinations SET Keyword = N''Ladakh''  WHERE Name = N''Ladakh'' AND Keyword IS NULL;
        UPDATE HomeDestinations SET Keyword = N''Goa''     WHERE Name = N''Goa Beaches'' AND Keyword IS NULL;
        UPDATE HomeDestinations SET Keyword = N''Kashmir'' WHERE Name = N''Kashmir Valley'' AND Keyword IS NULL;';
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
END;

INSERT INTO HomeDestinationTours (HomeDestinationId, TourId, SortOrder)
SELECT hd.Id, t.Id, m.SortOrder
FROM (VALUES
    (N'Taj Mahal',              1, 1),
    (N'Kerala Backwaters',      2, 1),
    (N'Jaipur — Pink City',     1, 1),
    (N'Jaipur — Pink City',     5, 2),
    (N'Tiger''s Nest Monastery', 3, 1),
    (N'Pokhara & Annapurna',    4, 1),
    (N'Ladakh',                 6, 1),
    (N'Goa Beaches',            7, 1),
    (N'Kashmir Valley',         8, 1)
) AS m(DestName, TourId, SortOrder)
JOIN HomeDestinations hd ON hd.Name = m.DestName
JOIN Tours t ON t.Id = m.TourId
WHERE NOT EXISTS (
    SELECT 1 FROM HomeDestinationTours x
    WHERE x.HomeDestinationId = hd.Id AND x.TourId = t.Id
);");
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
IF NOT EXISTS (SELECT 1 FROM Tours WHERE Id = 10)
BEGIN
    SET IDENTITY_INSERT Tours ON;
    INSERT INTO Tours (Id, Name, Destination, Region, Description, Highlights, ImageUrl, IsActive, CreatedAt) VALUES
    (10, N'Andaman Island Escape', 0, N'Port Blair-Havelock-Neil', N'Turquoise waters, coral reefs and pristine beaches in the Bay of Bengal.', N'Radhanagar Beach, Cellular Jail, scuba at Elephant Beach, Neil Island sunsets', N'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 1, '2026-01-01T00:00:00'),
    (11, N'Meghalaya Cloud Trail', 0, N'Shillong-Cherrapunji-Mawlynnong', N'Living root bridges, waterfalls and the cleanest village in Asia.', N'Nohkalikai Falls, Double Decker Root Bridge, Dawki river, Mawlynnong', N'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800', 1, '2026-01-01T00:00:00'),
    (12, N'Hampi Heritage Circuit', 0, N'Hampi-Hospet-Anegundi', N'Boulder-strewn ruins of the Vijayanagara Empire on the banks of the Tungabhadra.', N'Virupaksha Temple, Vittala Stone Chariot, Matanga Hill sunrise, Anegundi coracle ride', N'https://images.unsplash.com/photo-1582510003544-4eb04ad9636e?w=800', 1, '2026-01-01T00:00:00');
    SET IDENTITY_INSERT Tours OFF;
END");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to seed additional tours on startup");
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors("AngularApp");

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
