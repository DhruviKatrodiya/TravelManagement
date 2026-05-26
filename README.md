# Travel Management Website

A full-stack tourism management system for trips across **India, Bhutan, and Nepal**.

- **Backend:** ASP.NET Core Web API on .NET 6, SQL Server (LocalDB), Entity Framework Core, JWT auth, AutoMapper, MailKit, BCrypt
- **Frontend:** Angular 20 + Bootstrap 5, Chart.js, RxJS
- **Payments:** Paytm & Google Pay integrations (stubbed — pluggable real keys later)

## Repository layout

```
Backend/
  TravelManagement.sln
  TravelManagement.API/        .NET 6 Web API
Frontend/
  travel-app/                  Angular 20 SPA
```

## Features

| Feature                                          | Status |
|--------------------------------------------------|--------|
| Tour management (India / Bhutan / Nepal)         | ✅ |
| Package management (3D / 5D / custom)            | ✅ |
| Facilities (breakfast, lunch, dinner, hotel, …)  | ✅ |
| Vehicle management by capacity (car/mini-bus/…)  | ✅ |
| Trip scheduling & calendar                       | ✅ |
| Customer register / login (JWT)                  | ✅ |
| Admin panel with seeded DB logins                | ✅ |
| Customer management with booking history         | ✅ |
| Payments (Paytm + Google Pay — stubbed)          | ✅ |
| Booking confirmation emails (MailKit)            | ✅ |
| Expense and income / profit reports              | ✅ |
| Reporting dashboard & analytics                  | ✅ |
| Vehicle allocation & availability                | ✅ |
| Itinerary management & customisation             | ✅ |
| Cancellation & refund management                 | ✅ |
| Staff & driver management                        | ✅ |
| Customer reviews & ratings                       | ✅ |
| Multi-role auth (Admin / Staff / Customer)       | ✅ |
| Responsive Bootstrap 5 UI                        | ✅ |

## Prerequisites

- Windows 10/11 with **SQL Server LocalDB** (ships with Visual Studio / SSMS, also available via the SQL Server Express installer)
- **.NET 6 SDK** (`dotnet --list-sdks` should show `6.0.x`)
- **Node.js 18+** and **npm 9+**
- **Angular CLI** (`npm install -g @angular/cli`)

## Backend — running the API

```powershell
cd Backend/TravelManagement.API
dotnet restore
dotnet run
```

On first run the API will:
1. Create the LocalDB database `TravelManagementDb`.
2. Apply the `InitialCreate` migration.
3. Seed sample tours, packages, facilities, vehicles, drivers, and three demo users.

API runs at:
- `https://localhost:7138`
- Swagger UI: `https://localhost:7138/swagger`

### Connection string

`appsettings.json` defaults to LocalDB:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=TravelManagementDb;Trusted_Connection=True;..."
}
```

Override with `appsettings.Development.json` or env vars if you need SQL Server proper.

### Demo logins (seeded)

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@travel.local     | Admin@123    |
| Staff    | staff@travel.local     | Staff@123    |
| Customer | customer@travel.local  | Customer@123 |

### Email / SMTP

Email is **disabled by default** (`Email.Enabled: false`) — outgoing messages are logged to the console. To enable real sending, set `Email:Enabled = true`, `SmtpHost`, `Username`, `Password`, `SenderEmail` in `appsettings.json` or via user secrets.

### Payments

Paytm and Google Pay gateways are stubbed (`Services/PaymentGateways/`). They generate the right shape of payload (order id, params dict, callback URL) but never call the real Paytm/GPay APIs. To wire real merchant keys, update `Payment:Paytm` / `Payment:GooglePay` config and implement the HTTP call in each gateway's `InitiateAsync`/`VerifyAsync`. The `IPaymentGateway` interface gives you a clean seam.

The Angular UI simulates a successful callback after payment initiation so you can validate the full flow end-to-end without a real gateway.

### Regenerating migrations

```powershell
cd Backend/TravelManagement.API
dotnet tool run dotnet-ef migrations add <Name> -o Data/Migrations
dotnet tool run dotnet-ef database update
```

## Frontend — running the Angular app

```powershell
cd Frontend/travel-app
npm install
npm start          # or: npx ng serve
```

App runs at `http://localhost:4200` and points to `https://localhost:7138/api` (see `src/environments/environment.ts`).

If your browser blocks the API's dev cert, run once:

```powershell
dotnet dev-certs https --trust
```

### Production build

```powershell
cd Frontend/travel-app
npx ng build --configuration=production
```

Output: `dist/travel-app/`.

## Quick walkthrough

1. Start the API (`dotnet run`) and the Angular app (`npm start`).
2. Visit `http://localhost:4200` — browse seeded tours.
3. Click **Sign up** to create a customer, or log in as `customer@travel.local` / `Customer@123`.
4. From a tour page, click **Book this package**, fill the form, confirm.
5. On the booking detail screen, click **Pay** (gateway is simulated) — booking flips to **Confirmed** and a confirmation notification is created.
6. Log in as `admin@travel.local` / `Admin@123` to access `/admin` — dashboard, CRUD, refunds, expenses, reports.

## Architecture notes

- **Auth:** Custom JWT (no ASP.NET Identity). `TokenService` issues HS256 tokens, role claims (`Customer` / `Staff` / `Admin`). Angular stores the token in `localStorage` and an HTTP interceptor attaches it as `Authorization: Bearer <token>`.
- **Authorization:** `[Authorize(Roles = "Admin,Staff")]` on the API; `authGuard` + `data.roles` on Angular routes.
- **Validation:** Server-side via DataAnnotations + `InvalidOperationException` rolled up by `ErrorHandlingMiddleware` to consistent `ApiResponse<T>` shape.
- **Payments:** Multi-gateway via `IPaymentGateway`. `PaymentService` resolves the right gateway by `PaymentMethod`. Confirmation updates `Booking.AmountPaid` and flips status to `Confirmed` when fully paid.
- **Notifications:** Persisted in DB (`Notification`) and pushed to email via `EmailService`.
- **Reporting:** `ReportService` aggregates monthly revenue/bookings, top tours, destination splits, and per-trip P&L.

## Customising

- Add a destination: extend `Destination` enum in both API (`Models/Enums/Enums.cs`) and Angular (`core/models/api.models.ts`), then regenerate the migration.
- Add a payment method: implement `IPaymentGateway`, register it in `Program.cs`. Add the method to the `PaymentMethod` enum on both sides.
- Customise the email template: see `BookingService.BuildBookingEmail` and `PaymentService` confirmation handler.

## Troubleshooting

- **Browser shows "cannot reach API"** — Trust the dev cert (`dotnet dev-certs https --trust`) or run the API on HTTP only (edit `Properties/launchSettings.json`).
- **CORS errors** — `Cors:AllowedOrigins` in `appsettings.json` must include the Angular origin (`http://localhost:4200`).
- **LocalDB missing** — Install via SSMS or the SQL Server Express installer, then verify with `sqllocaldb info`.
- **EF Core CLI errors** — Use the project-local tool: `dotnet tool run dotnet-ef …` (a `.config/dotnet-tools.json` pins it to v6.0.36).

# npx ng serve --host 0.0.0.0