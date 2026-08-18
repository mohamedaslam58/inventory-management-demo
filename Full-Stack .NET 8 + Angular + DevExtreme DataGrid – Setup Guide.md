# Full-Stack .NET 8 + Angular + DevExtreme DataGrid

A simple full-stack application demonstrating how to build an **Angular frontend** with a **.NET 8 Web API backend**, **Entity Framework Core**, **SQL Server**, and **DevExtreme DataGrid**.

The application supports:

- Server-side pagination
- Searching
- Filtering
- Sorting
- Adding records
- Updating records
- Deleting records
- SQL Server database integration
- Angular and .NET CORS configuration

---

## 📋 Technology Stack

| Technology | Version / Package |
|---|---|
| Node.js | LTS |
| Angular | Latest compatible version |
| Angular CLI | Latest |
| .NET | 8 |
| Entity Framework Core | 8 |
| SQL Server | Express / LocalDB |
| DevExtreme | Latest |
| TypeScript | Angular-compatible version |
| Visual Studio Code | Latest |

---

# 1. Prerequisites

Make sure the following tools are installed.

### Node.js

Download and install the LTS version:

- https://nodejs.org/

Verify the installation:

```bash
node --version
npm --version
```

### .NET 8 SDK

Download and install:

- https://dotnet.microsoft.com/download/dotnet/8.0

Verify:

```bash
dotnet --version
```

### SQL Server

Install either:

- SQL Server Express
- SQL Server LocalDB

You can manage the database using:

- SQL Server Management Studio (SSMS)
- VS Code with the SQL Server (`mssql`) extension

### Angular CLI

Install Angular CLI globally:

```bash
npm install -g @angular/cli
```

Verify:

```bash
ng version
```

---

# 2. VS Code Extensions

Open VS Code and install the following extensions:

### Required

- **C# Dev Kit** – Microsoft
- **Angular Language Service** – Angular

### Recommended

- **SQL Server (mssql)** – Microsoft
- **ESLint**
- **Prettier - Code formatter**

---

# 3. Create the Solution Folder

Create a root folder for the project.

```bash
mkdir MyFullStackProject
cd MyFullStackProject
```

The final project structure will look like:

```text
MyFullStackProject/
│
├── Backend/
│   ├── Controllers/
│   ├── Data/
│   ├── Models/
│   ├── Program.cs
│   └── appsettings.json
│
└── Frontend/
    ├── src/
    ├── angular.json
    ├── package.json
    └── ...
```

---

# 4. Create the .NET 8 Web API

From the root folder:

```bash
dotnet new webapi -n Backend
cd Backend
```

Install the required NuGet packages:

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package DevExtreme.AspNet.Data
dotnet add package Newtonsoft.Json
```

Install the Entity Framework Core CLI tool if it is not already installed:

```bash
dotnet tool install --global dotnet-ef
```

Verify:

```bash
dotnet ef
```

---

# 5. Create the Data Model

Create the following file:

```text
Backend/Models/Item.cs
```

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Item
    {
        [Key]
        public int Id { get; set; }
        
        public string? Name { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Price { get; set; }
    }
}
```

The `Item` entity represents the records displayed in the DevExtreme DataGrid.

---

# 6. Create the Entity Framework DbContext

Create:

```text
Backend/Data/AppDbContext.cs
```

```csharp
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Item> Items => Set<Item>();
    }
}
```

---

# 7. Configure SQL Server Connection

Open:

```text
Backend/appsettings.json
```

Add the connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SimpleDemoDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

> If you are using SQL Server Express instead of LocalDB, change the `Server` value according to your SQL Server instance.

For example:

```text
Server=localhost\\SQLEXPRESS
```

---

# 8. Configure Program.cs

Replace `Program.cs` with:

```csharp
using Backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services
    .AddControllers()
    .AddNewtonsoftJson();

var app = builder.Build();

app.UseCors("AllowAngular");

app.UseAuthorization();

app.MapControllers();

app.Run();
```

The CORS policy allows the Angular application running on:

```text
http://localhost:4200
```

to communicate with the API.

---

# 9. Create the Items API Controller

Create:

```text
Backend/Controllers/ItemsController.cs
```

```csharp
using Backend.Data;
using Backend.Models;
using DevExtreme.AspNet.Data;
using DevExtreme.AspNet.Mvc;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ItemsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/items
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DataSourceLoadOptions loadOptions)
        {
            var source = _context.Items.AsQueryable();
            return Ok(await DataSourceLoader.LoadAsync(source, loadOptions));
        }

        // POST: api/items
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Item item)
        {
            _context.Items.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        // PUT: api/items/5 OR api/items (DevExtreme passes key in URL or body)
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Item updatedItem)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return NotFound();

            if (updatedItem.Name != null)
                item.Name = updatedItem.Name;

            if (updatedItem.Price.HasValue)
                item.Price = updatedItem.Price.Value;

            await _context.SaveChangesAsync();

            return Ok(item);
        }

        // DELETE: api/items/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return NotFound();

            _context.Items.Remove(item);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
```

---

# 10. Create the Database

From the `Backend` directory:

```bash
dotnet build
```

```bash
dotnet ef migrations add InitialCreate
```

Then apply the migration:

```bash
dotnet ef database update
```

This will create the `SimpleDemoDb` database and the `Items` table.

---

# 11. Run the Backend

Start the API:

```bash
dotnet run
```

The console will display the URLs where the API is running.

For example:

```text
http://localhost:5000
https://localhost:7000
```

> The actual ports can vary depending on the generated ASP.NET Core configuration. Use the URL shown in your terminal.

The API endpoint will be:

```text
/api/items
```

For example:

```text
https://localhost:7000/api/items
```

---

# 12. Create the Angular Application

Open a **new terminal**.

Navigate back to the root project folder:

```bash
cd ..
```

Create the Angular application:

```bash
ng new Frontend --defaults
```

Navigate into the frontend:

```bash
cd Frontend
```

---

# 13. Install DevExtreme

Install the required packages:

```bash
npm install devextreme devextreme-angular devextreme-aspnet-data-nojquery
```

---

# 14. Configure DevExtreme Styles

Open:

```text
Frontend/angular.json
```

Find the `styles` section under the build configuration and add:

```json
"styles": [
  "node_modules/devextreme/dist/css/dx.light.css",
  "src/styles.css"
]
```

---

# 15. Configure HttpClient

For a standalone Angular application, open:

```text
src/app/app.config.ts
```

Configure `HttpClient`:

```typescript
import {
  ApplicationConfig,
  provideZoneChangeDetection
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true
    }),
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

---

# 16. Configure the DataGrid Component

Open:

```text
src/app/app.component.ts
```

Replace the contents with:

```typescript
import { Component } from '@angular/core';
import { DxDataGridModule } from 'devextreme-angular';
import { createStore } from 'devextreme-aspnet-data-nojquery';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DxDataGridModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  dataSource: any;

  private apiUrl = 'http://localhost:7000/api/items';

  constructor() {
    this.dataSource = createStore({
      key: 'id',

      loadUrl: this.apiUrl,
      insertUrl: this.apiUrl,
      updateUrl: this.apiUrl,
      deleteUrl: this.apiUrl,

      onBeforeSend: (method, ajaxOptions) => {
        ajaxOptions.contentType = 'application/json';

        if (method === 'insert') {
          ajaxOptions.data = ajaxOptions.data.values;
        }

        if (method === 'update') {
          // Append ID to URL
          ajaxOptions.url += '/' + encodeURIComponent(ajaxOptions.data.key);

          // Send only the changed values
          ajaxOptions.data = ajaxOptions.data.values;
        }

        if (method === 'delete') {
          // Append ID to URL
          ajaxOptions.url += '/' + encodeURIComponent(ajaxOptions.data.key);
        }
      },
    });
  }
}
```

> Update `apiUrl` to match the actual URL displayed when you run the .NET API.

---

# 17. Configure the DataGrid HTML

Open:

```text
src/app/app.component.html
```

Replace the contents with:

```html
<div style="padding: 30px;">

  <h2>Simple Inventory Assessment Demo</h2>

  <dx-data-grid
    [dataSource]="dataSource"
    [showBorders]="true"
    [columnAutoWidth]="true"
    [remoteOperations]="true"
    [rowAlternationEnabled]="true">

    <!-- Global Search Bar -->
    <dxo-search-panel
      [visible]="true"
      [width]="240"
      placeholder="Search items...">
    </dxo-search-panel>

    <!-- Paging and Pager Options -->
    <dxo-paging [pageSize]="5"></dxo-paging>
    <dxo-pager
      [showPageSizeSelector]="true"
      [allowedPageSizes]="[5, 10, 20]"
      [showInfo]="true">
    </dxo-pager>

    <!-- Inline Row Editing Configuration -->
    <dxo-editing
      mode="row"
      [allowAdding]="true"
      [allowUpdating]="true"
      [allowDeleting]="true"
      [useIcons]="true">
    </dxo-editing>

    <!-- Column Definitions -->
    <dxi-column
      dataField="id"
      caption="ID"
      [allowEditing]="false"
      [width]="80"
      alignment="center">
    </dxi-column>

    <dxi-column
      dataField="name"
      caption="Item Name">
      <dxi-validation-rule type="required" message="Item Name is required"></dxi-validation-rule>
    </dxi-column>

    <dxi-column
      dataField="price"
      caption="Price"
      dataType="number"
      format="$#,##0.00"
      alignment="right">
      <dxi-validation-rule type="required" message="Price is required"></dxi-validation-rule>
      <dxi-validation-rule type="range" [min]="0" message="Price must be non-negative"></dxi-validation-rule>
    </dxi-column>

  </dx-data-grid>

</div>
```

---

# 18. Run the Angular Application

From the `Frontend` directory:

```bash
ng serve --open
```

Angular will start the development server.

Open:

```text
http://localhost:4200
```

---

# 19. Run Backend and Frontend Together

You need two terminals.

### Terminal 1 – Backend

```bash
cd MyFullStackProject/Backend
dotnet run
```

### Terminal 2 – Frontend

```bash
cd MyFullStackProject/Frontend
ng serve
```

Then open:

```text
http://localhost:4200
```

---

# 20. Application Architecture

```text
┌───────────────────────────────┐
│       Angular Frontend        │
│                               │
│       DevExtreme Grid         │
│                               │
│        localhost:4200         │
└───────────────┬───────────────┘
                │
                │ HTTP / REST API
                ▼
┌───────────────────────────────┐
│       ASP.NET Core API        │
│                               │
│      ItemsController          │
│                               │
│        .NET 8 Web API         │
└───────────────┬───────────────┘
                │
                │ Entity Framework Core
                ▼
┌───────────────────────────────┐
│          SQL Server           │
│                               │
│        SimpleDemoDb           │
│                               │
│           Items               │
└───────────────────────────────┘
```

---

# 21. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/items` | Get items |
| POST | `/api/items` | Create an item |
| PUT | `/api/items/{id}` | Update an item |
| DELETE | `/api/items/{id}` | Delete an item |

---

# 22. DevExtreme DataGrid Features

The DataGrid is configured with:

### Search

Users can search items using the search panel.

### Filtering

Column-level filtering is enabled.

### Pagination

The grid displays 5 records per page.

### Sorting

Sorting is handled through DevExtreme's remote operations.

### Add

Users can add new items directly from the grid.

### Edit

Existing items can be edited inline.

### Delete

Items can be deleted from the grid.

### Server-Side Processing

```html
[remoteOperations]="true"
```

allows operations such as filtering, sorting, searching, and paging to be processed by the backend.

The backend uses:

```csharp
DataSourceLoader.LoadAsync(...)
```

to process the DevExtreme data request.

---

# 23. Final Project Structure

```text
MyFullStackProject/
│
├── Backend/
│   │
│   ├── Controllers/
│   │   └── ItemsController.cs
│   │
│   ├── Data/
│   │   └── AppDbContext.cs
│   │
│   ├── Models/
│   │   └── Item.cs
│   │
│   ├── Migrations/
│   │
│   ├── appsettings.json
│   ├── Program.cs
│   └── Backend.csproj
│
└── Frontend/
    │
    ├── src/
    │   └── app/
    │       ├── app.component.ts
    │       ├── app.component.html
    │       ├── app.component.css
    │       ├── app.config.ts
    │       └── app.routes.ts
    │
    ├── angular.json
    ├── package.json
    └── tsconfig.json
```

---

# 24. Troubleshooting

## CORS Error

If the browser reports a CORS error, verify that the Angular URL matches the CORS configuration:

```csharp
policy.WithOrigins("http://localhost:4200")
```

Also make sure the Angular application is actually running on port `4200`.

---

## API Port Doesn't Match

Check the URL displayed after:

```bash
dotnet run
```

Then update:

```typescript
private apiUrl =
  'https://localhost:7000/api/items';
```

with the correct API URL.

---

## Entity Framework Command Not Found

If you see:

```text
dotnet ef: command not found
```

install the EF CLI:

```bash
dotnet tool install --global dotnet-ef
```

---

## Database Connection Error

Verify:

1. SQL Server/LocalDB is installed.
2. SQL Server is running.
3. The connection string is correct.
4. The database migration has been applied.

Run:

```bash
dotnet ef database update
```

---

## Angular Package Issues

If Angular dependencies are inconsistent, try:

```bash
rm -rf node_modules
npm install
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

# 25. Useful Commands

### Backend

```bash
dotnet restore
dotnet build
dotnet run
```

### Entity Framework

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet ef migrations remove
```

### Frontend

```bash
npm install
ng serve
ng build
```

### Check Angular Version

```bash
ng version
```

### Check .NET Version

```bash
dotnet --version
```

---

# 26. Expected Result

After completing the setup, the application should provide an inventory DataGrid similar to:

```text
---------------------------------------------------------
| Simple Inventory Assessment Demo                      |
---------------------------------------------------------
| Search items...                                       |
---------------------------------------------------------
| ID | Item Name             | Price       | Actions     |
---------------------------------------------------------
| 1  | Laptop               | $1,200      | Edit Delete |
| 2  | Keyboard             | $80         | Edit Delete |
| 3  | Monitor              | $300        | Edit Delete |
---------------------------------------------------------
|                    < 1 2 3 >                          |
---------------------------------------------------------
```

The Angular application communicates with the ASP.NET Core Web API, which uses Entity Framework Core to read and modify data in SQL Server.

---

# 27. Summary

This project demonstrates a basic full-stack architecture using:

```text
Angular
   ↓
DevExtreme DataGrid
   ↓
ASP.NET Core Web API (.NET 8)
   ↓
Entity Framework Core
   ↓
SQL Server
```

It can be used as a starting point for building larger enterprise applications with server-side data processing, CRUD operations, authentication, validation, logging, and additional business logic.




-------------------------------------------------------------------------------------
OTHERS

===============
dotnet add package Microsoft.AspNetCore.Mvc.NewtonsoftJson --version 9.0.0

==============
# 1. Install matching 9.x version of EF Core Design package
dotnet add package Microsoft.EntityFrameworkCore.Design --version 9.0.0

# 2. Ensure SQL Server package is also on matching 9.x version
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 9.0.0

# 3. Ensure EF Core Tools package is on matching 9.x version
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 9.0.0
=====================
Option B: Switch to SQL Server Express or Full SQL Server
If you already have SQL Server Express installed (e.g., .\SQLEXPRESS), update the connection string in Backend/appsettings.json:

JSON
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=AssessmentDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
Step 2: Fix the Decimal Precision Warning
Open Backend/Models/Item.cs and add the [Column] attribute to your Price property:

C#
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Item
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }
    }
}
Step 3: Run the Database Update Again
Once LocalDB is started (or your connection string is updated to SQLEXPRESS), run:

Bash
dotnet ef database update
It should apply the migration and report Done..
=============================================
main.ts
-------------
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
=================================================
Installing SQL Server LocalDBDownload and Run the InstallerDownload the official standalone installer (SqlLocalDB.msi) directly from Microsoft:  SQL Server 2022 LocalDB Direct Link  

https://download.microsoft.com/download/3/8/d/38de7036-2433-4207-8eae-06e247e17b25/SqlLocalDB.msi
=======================================================
INSERT INTO Items (Name, Price) VALUES
    ('Wireless Ergonomic Mouse', 29.99),
    ('Mechanical Gaming Keyboard', 89.99),
    ('27-inch 4K Monitor', 329.50),
    ('USB-C Dual HDMI Docking Station', 79.00),
    ('Noise-Canceling Bluetooth Headphones', 149.99),
    ('HD Pro Webcam 1080p', 59.95),
    ('Ultra-Fast Wi-Fi 6 Router', 119.99),
    ('Portable External Hard Drive 2TB', 69.99),
    ('NVMe M.2 SSD 1TB', 84.50),
    ('High-Speed HDMI 2.1 Cable 6ft', 12.99),
    ('USB-C to USB-A Adapter 2-Pack', 8.49),
    ('Smart Surge Protector Power Strip', 24.99),
    ('Vertical Monitor Desk Mount', 39.99),
    ('RGB Extended Mouse Pad', 19.99),
    ('Laptop Cooling Pad with Fans', 27.50),
    ('Bluetooth Conference Speakerphone', 99.00),
    ('100W USB-C GaN Wall Charger', 45.99),
    ('Uninterruptible Power Supply 1500VA', 189.99),
    ('Cat 8 Ethernet Cable 25ft', 14.99),
    ('Aluminum Laptop Stand Holder', 34.50),
    ('Wireless Trackball Mouse', 44.99),
    ('Compact Tenkeyless Keyboard', 64.99),
    ('34-inch Ultrawide Curved Monitor', 499.99),
    ('Thunderbolt 4 Cable 3ft', 29.99),
    ('Studio Condenser USB Microphone', 79.99),
    ('Adjustable Microphone Boom Arm', 24.99),
    ('Portable Monitor 15.6 Inch', 159.00),
    ('4TB Desktop External Hard Drive', 109.99),
    ('2TB High-Speed Internal SSD', 149.50),
    ('DisplayPort to HDMI Cable 10ft', 15.99),
    ('USB 3.0 Hub 7-Port', 22.99),
    ('Smart Plug Mini 4-Pack', 29.99),
    ('Dual Monitor Steel Arm Desk Mount', 54.99),
    ('Anti-Fatigue Standing Desk Mat', 42.50),
    ('Under-Desk Cable Management Tray', 18.99),
    ('Wireless Presenter Clicker', 16.50),
    ('65W Portable Laptop Power Bank', 59.99),
    ('Pure Sine Wave UPS 1000VA', 149.99),
    ('Flat Cat 7 Network Cable 50ft', 19.99),
    ('Foldable Tablet Desk Stand', 12.50),
    ('Silent Wireless Optical Mouse', 18.99),
    ('Wireless Ergonomic Split Keyboard', 109.99),
    ('24-inch FHD IPS Office Monitor', 129.99),
    ('USB-C Multiport Adapter 6-in-1', 35.00),
    ('Wireless In-Ear Earbuds', 49.99),
    ('4K Streaming Web Camera', 99.99),
    ('Dual-Band Wi-Fi USB Adapter', 19.50),
    ('Rugged Portable SSD 1TB', 109.99),
    ('SATA III Internal SSD 500GB', 39.99),
    ('USB-C Charging Cable 10ft 2-Pack', 11.99),
    ('SD Card Reader USB 3.0', 9.99),
    ('Heavy-Duty Surge Protector 12-Outlet', 32.99),
    ('Gas Spring Single Monitor Arm', 49.99),
    ('Microfiber Screen Cleaning Kit', 8.99),
    ('Desk Cable Clip Organizer 10-Pack', 6.99),
    ('USB Powered Desktop Speakers', 21.50),
    ('Wireless Charging Stand 15W', 19.99),
    ('Line-Interactive UPS 750VA', 89.99),
    ('Shielded Ethernet Cable 100ft', 29.99),
    ('MagSafe Compatible Desk Mount', 22.50),
    ('Multi-Device Bluetooth Mouse', 38.99),
    ('Low-Profile Mechanical Keyboard', 94.99),
    ('27-inch 165Hz Gaming Monitor', 219.99),
    ('Universal Laptop Docking Station', 139.99),
    ('Over-Ear Wired Headset with Mic', 39.99),
    ('Ring Light with Tripod Stand', 29.95),
    ('Mesh Wi-Fi System 3-Pack', 199.99),
    ('Enclosure Case for M.2 NVMe SSD', 21.99),
    ('MicroSDXC Memory Card 256GB', 24.99),
    ('Angled HDMI Adapter 2-Pack', 7.99),
    ('Powered USB 3.2 Hub 10-Port', 45.99),
    ('Smart LED Desk Lamp', 31.50),
    ('Triple Monitor Desk Mount', 79.99),
    ('Ergonomic Memory Foam Wrist Rest', 13.99),
    ('Self-Gripping Cable Ties 50-Pack', 9.50),
    ('Bluetooth Soundbar for PC', 36.99),
    ('Magnetic Wireless Power Bank 10000mAh', 39.99),
    ('Mini UPS Battery Backup', 49.99),
    ('Outdoor Waterproof Ethernet Cable 50ft', 23.99),
    ('Aluminum Tablet Arm Mount', 27.99),
    ('Rechargeable Slim Wireless Mouse', 15.99),
    ('Customizable RGB Gaming Keyboard', 74.99),
    ('15.6-inch Portable Touchscreen Monitor', 189.99),
    ('USB-C Travel Dock', 49.50),
    ('Active Noise-Canceling Earbuds', 79.99),
    ('HD Privacy Shutter Webcam', 34.99),
    ('Gigabit PCI-E Network Card', 17.99),
    ('Encrypted Hardware Flash Drive 64GB', 55.00),
    ('2.5-inch Hard Drive Enclosure', 11.99),
    ('Optical Audio Toslink Cable 10ft', 8.49),
    ('USB 3.0 Extension Cable 6ft', 6.99),
    ('Smart Power Strip with USB-C', 28.99),
    ('Wall Mount Monitor Arm', 32.50),
    ('Keyboard Wrist Rest Cushion', 11.99),
    ('Velcro Cable Management Sleeves 4-Pack', 12.99),
    ('Subwoofer Desktop Speaker Set', 59.99),
    ('Foldable 3-in-1 Wireless Charger', 29.99),
    ('Automatic Voltage Regulator 1200VA', 64.99),
    ('Slim Cat 6 Patch Cable 10-Pack', 16.99),
    ('Universal Phone Desk Holder', 9.99);
    =========================================================