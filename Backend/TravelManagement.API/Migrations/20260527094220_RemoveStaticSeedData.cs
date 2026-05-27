using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelManagement.API.Migrations
{
    public partial class RemoveStaticSeedData : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "LastLoginAt", "PasswordHash", "PasswordResetToken", "PasswordResetTokenExpiry", "Phone", "Role", "SessionToken" },
                values: new object[] { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@travel.local", "Administrator", true, null, "$2a$11$lXPyDFuiadBvUfd9ALmmCOk152ZLLWDNfGszEseHlOFt/0n8fKeJ.", null, null, "+910000000001", 11, null });
        }
    }
}
