using FastEndpoints;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddFastEndpoints();
builder.Services.AddAuthorization();

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Add HttpClient for api.data.gov integration
builder.Services.AddHttpClient();

// Add health checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Application is running"))
    .AddCheck("twilio-config", () => 
    {
        var configuration = builder.Configuration;
        var accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID") ?? configuration["Twilio:AccountSid"];
        var authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN") ?? configuration["Twilio:AuthToken"];
        var phoneNumber = Environment.GetEnvironmentVariable("TWILIO_PHONE_NUMBER") ?? configuration["Twilio:PhoneNumber"];
        
        if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(phoneNumber))
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Twilio configuration is missing");
        }
        
        return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Twilio configuration is valid");
    })
    .AddCheck("data-gov-config", () => 
    {
        var configuration = builder.Configuration;
        var apiKey = Environment.GetEnvironmentVariable("DATA_GOV_API_KEY") ?? configuration["DataGov:ApiKey"];
        
        if (string.IsNullOrEmpty(apiKey) || apiKey == "DEMO_KEY")
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Degraded("Using DEMO_KEY for api.data.gov - consider getting a real API key");
        }
        
        return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Data.gov API key is configured");
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAll");

app.UseAuthorization();

// Add health check middleware
app.UseHealthChecks("/api/health");

app.UseFastEndpoints();

app.Run();
