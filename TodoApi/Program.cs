using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TodoApi;

var MyAllowSpecificOrigins = "AllowClient";

var builder = WebApplication.CreateBuilder(args);

// ---------- DB ----------
var cs = builder.Configuration["ToDoDB"];
builder.Services.AddDbContext<ToDoDbContext>(o =>
    o.UseMySql(cs, ServerVersion.AutoDetect(cs)));

// ---------- CORS ----------
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins(
                "https://todolistclient-kpds.onrender.com")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// ---------- JWT Auth ----------
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]!;
var jwtIssuer = jwtSection["Issuer"];
var jwtAudience = jwtSection["Audience"];

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseCors("AllowClient");
app.UseAuthentication();
app.UseAuthorization();


// ---------- פונקציית עזר: יצירת JWT ----------
string CreateJwtToken(int userId, string userName)
{
    var claims = new[]
    {
        new Claim("id", userId.ToString()), // מזהה המשתמש
        new Claim(JwtRegisteredClaimNames.Sub, userName)
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSection["ExpireMinutes"] ?? "60"));

    var token = new JwtSecurityToken(
        issuer: jwtIssuer,
        audience: jwtAudience,
        claims: claims,
        expires: expires,
        signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(token);
}


// הרשמה
app.MapPost("/api/auth/register", async (ToDoDbContext db, User dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.PasswordHash))
        return Results.BadRequest("UserName and Password are required.");

    var exists = await db.Users.AnyAsync(u => u.UserName == dto.UserName);
    if (exists) return Results.Conflict("Username already exists.");

    var user = new User
    {
        UserName = dto.UserName,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordHash)
    };
    db.Users.Add(user);
    await db.SaveChangesAsync();

    var token = CreateJwtToken(user.Id, user.UserName);
    return Results.Ok(new { token, user = new { user.Id, user.UserName } });
});

// התחברות
app.MapPost("/api/auth/login", async (ToDoDbContext db, User dto) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == dto.UserName);
    if (user is null)
        return Results.Unauthorized();

    // שימי לב - כאן ההשוואה חייבת להיות ל- dto.PasswordHash
    var ok = BCrypt.Net.BCrypt.Verify(dto.PasswordHash, user.PasswordHash);
    if (!ok)
        return Results.Unauthorized();

    var token = CreateJwtToken(user.Id, user.UserName);
    return Results.Ok(new { token, user = new { user.Id, user.UserName } });
});


// ---------- קבוצת משימות ----------
var items = app.MapGroup("/api/items").RequireAuthorization();

// --- שליפה של כל המשימות של המשתמש המחובר ---
items.MapGet("/", async (ToDoDbContext db, HttpContext ctx) =>
{
    var userId = int.Parse(ctx.User.FindFirst("id")!.Value);
    return await db.Items.Where(i => i.UserId == userId).ToListAsync();
});

// --- שליפה לפי מזהה משימה ---
items.MapGet("/{id:int}", async (int id, ToDoDbContext db, HttpContext ctx) =>
{
    var userId = int.Parse(ctx.User.FindFirst("id")!.Value);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    return item is not null ? Results.Ok(item) : Results.NotFound();
});

// --- הוספת משימה ---
items.MapPost("/", async (Item input, ToDoDbContext db, HttpContext ctx) =>
{
    if (string.IsNullOrWhiteSpace(input.Name))
        return Results.BadRequest("Name is required.");

    var userId = int.Parse(ctx.User.FindFirst("id")!.Value);
    input.UserId = userId;

    db.Items.Add(input);
    await db.SaveChangesAsync();
    return Results.Created($"/api/items/{input.Id}", input);
});

// --- עדכון משימה ---
items.MapPut("/{id:int}", async (int id, Item input, ToDoDbContext db, HttpContext ctx) =>
{
    var userId = int.Parse(ctx.User.FindFirst("id")!.Value);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null) return Results.NotFound();

    item.Name = input.Name ?? item.Name;
    item.IsComplete = input.IsComplete;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// --- מחיקת משימה ---
items.MapDelete("/{id:int}", async (int id, ToDoDbContext db, HttpContext ctx) =>
{
    var userId = int.Parse(ctx.User.FindFirst("id")!.Value);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null) return Results.NotFound();

    db.Items.Remove(item);
    await db.SaveChangesAsync();
    return Results.NoContent();
});


// ---------- דף בדיקה ----------
app.MapGet("/", () => "✅ Todo API with JWT is running securely!");

app.Run();
