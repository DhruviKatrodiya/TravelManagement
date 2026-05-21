namespace TravelManagement.API.Helpers;

public static class Permissions
{
    public const string ToursView = "tours.view";
    public const string ToursCreate = "tours.create";
    public const string ToursEdit = "tours.edit";
    public const string ToursDelete = "tours.delete";

    public const string DestinationsView = "destinations.view";
    public const string DestinationsCreate = "destinations.create";
    public const string DestinationsEdit = "destinations.edit";
    public const string DestinationsDelete = "destinations.delete";

    public const string PackagesView = "packages.view";
    public const string PackagesCreate = "packages.create";
    public const string PackagesEdit = "packages.edit";
    public const string PackagesDelete = "packages.delete";

    public const string FacilitiesView = "facilities.view";
    public const string FacilitiesCreate = "facilities.create";
    public const string FacilitiesEdit = "facilities.edit";
    public const string FacilitiesDelete = "facilities.delete";

    public const string SchedulesView = "schedules.view";
    public const string SchedulesCreate = "schedules.create";
    public const string SchedulesEdit = "schedules.edit";
    public const string SchedulesDelete = "schedules.delete";

    public const string CustomersView         = "customers.view";
    public const string CustomersCreate       = "customers.create";
    public const string CustomersEdit         = "customers.edit";
    public const string CustomersDelete       = "customers.delete";
    public const string CustomersUpdateMobile = "customers.update_mobile";
    public const string CustomersUpdateEmail  = "customers.update_email";

    public const string ReviewsView = "reviews.view";
    public const string ReviewsEdit = "reviews.edit";
    public const string ReviewsDelete = "reviews.delete";

    public const string VehiclesView = "vehicles.view";
    public const string VehiclesCreate = "vehicles.create";
    public const string VehiclesEdit = "vehicles.edit";
    public const string VehiclesDelete = "vehicles.delete";

    public const string DriversView = "drivers.view";
    public const string DriversCreate = "drivers.create";
    public const string DriversEdit = "drivers.edit";
    public const string DriversDelete = "drivers.delete";

    public const string AllocationsView = "allocations.view";
    public const string AllocationsCreate = "allocations.create";
    public const string AllocationsEdit = "allocations.edit";
    public const string AllocationsDelete = "allocations.delete";

    public const string BookingsView = "bookings.view";
    public const string BookingsEdit = "bookings.edit";

    public const string PaymentsView = "payments.view";
    public const string RefundsView = "refunds.view";
    public const string RefundsEdit = "refunds.edit";

    public const string ExpensesView = "expenses.view";
    public const string ExpensesCreate = "expenses.create";
    public const string ExpensesEdit = "expenses.edit";
    public const string ExpensesDelete = "expenses.delete";

    public const string ReportsView = "reports.view";

    // Search permissions
    public const string ToursSearch       = "tours.search";
    public const string DestinationsSearch = "destinations.search";
    public const string PackagesSearch    = "packages.search";
    public const string FacilitiesSearch  = "facilities.search";
    public const string SchedulesSearch   = "schedules.search";
    public const string CustomersSearch   = "customers.search";
    public const string BookingsSearch    = "bookings.search";
    public const string PaymentsSearch    = "payments.search";
    public const string RefundsSearch     = "refunds.search";
    public const string ExpensesSearch    = "expenses.search";
    public const string VehiclesSearch    = "vehicles.search";
    public const string DriversSearch     = "drivers.search";
    public const string AllocationsSearch = "allocations.search";
    public const string ReviewsSearch     = "reviews.search";

    public const string CountriesView   = "countries.view";
    public const string CountriesCreate = "countries.create";
    public const string CountriesEdit   = "countries.edit";
    public const string CountriesToggle = "countries.toggle";

    public const string StatesView   = "states.view";
    public const string StatesCreate = "states.create";
    public const string StatesEdit   = "states.edit";
    public const string StatesToggle = "states.toggle";

    public const string CitiesView   = "cities.view";
    public const string CitiesCreate = "cities.create";
    public const string CitiesEdit   = "cities.edit";
    public const string CitiesToggle = "cities.toggle";

    public const string DepartmentsView   = "departments.view";
    public const string DepartmentsCreate = "departments.create";
    public const string DepartmentsEdit   = "departments.edit";
    public const string DepartmentsToggle = "departments.toggle";

    public const string DesignationsView   = "designations.view";
    public const string DesignationsCreate = "designations.create";
    public const string DesignationsEdit   = "designations.edit";
    public const string DesignationsToggle = "designations.toggle";

    // Role management — restricted: Admin-tier users need explicit SuperAdmin assignment
    public const string RolesView   = "roles.view";
    public const string RolesEdit   = "roles.edit";
    public const string RolesCreate = "roles.create";
    public const string RolesDelete = "roles.delete";

    public static readonly IReadOnlyList<string> All = new[]
    {
        ToursView, ToursCreate, ToursEdit, ToursDelete,
        DestinationsView, DestinationsCreate, DestinationsEdit, DestinationsDelete,
        PackagesView, PackagesCreate, PackagesEdit, PackagesDelete,
        FacilitiesView, FacilitiesCreate, FacilitiesEdit, FacilitiesDelete,
        SchedulesView, SchedulesCreate, SchedulesEdit, SchedulesDelete,
        CustomersView, CustomersCreate, CustomersEdit, CustomersDelete, CustomersUpdateMobile, CustomersUpdateEmail,
        ReviewsView, ReviewsEdit, ReviewsDelete,
        VehiclesView, VehiclesCreate, VehiclesEdit, VehiclesDelete,
        DriversView, DriversCreate, DriversEdit, DriversDelete,
        AllocationsView, AllocationsCreate, AllocationsEdit, AllocationsDelete,
        BookingsView, BookingsEdit,
        PaymentsView,
        RefundsView, RefundsEdit,
        ExpensesView, ExpensesCreate, ExpensesEdit, ExpensesDelete,
        ReportsView,
        ToursSearch, DestinationsSearch, PackagesSearch, FacilitiesSearch, SchedulesSearch,
        CustomersSearch, BookingsSearch, PaymentsSearch, RefundsSearch, ExpensesSearch,
        VehiclesSearch, DriversSearch, AllocationsSearch, ReviewsSearch,
        CountriesView, CountriesCreate, CountriesEdit, CountriesToggle,
        StatesView, StatesCreate, StatesEdit, StatesToggle,
        CitiesView, CitiesCreate, CitiesEdit, CitiesToggle,
        DepartmentsView, DepartmentsCreate, DepartmentsEdit, DepartmentsToggle,
        DesignationsView, DesignationsCreate, DesignationsEdit, DesignationsToggle,
        RolesView, RolesEdit, RolesCreate, RolesDelete
    };
}
