using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelManagement.API.Migrations
{
    public partial class AddRefundPaymentDetails : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentNotes",
                table: "Refunds",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundMethod",
                table: "Refunds",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionReference",
                table: "Refunds",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentNotes",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "RefundMethod",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "TransactionReference",
                table: "Refunds");
        }
    }
}
