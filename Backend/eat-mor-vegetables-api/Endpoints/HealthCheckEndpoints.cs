using FastEndpoints;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Reflection;

namespace eat_mor_vegetables_api.Endpoints;

// Health check response models
public class HealthCheckResponse
{
    public string Status { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public Dictionary<string, ComponentHealth> Components { get; set; } = new();
    public double TotalDurationMs { get; set; }
}

public class ComponentHealth
{
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double DurationMs { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
}

public class BasicHealthResponse
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

// Basic health check endpoint
public class BasicHealthEndpoint : EndpointWithoutRequest<BasicHealthResponse>
{
    public override void Configure()
    {
        Get("/api/health");
        AllowAnonymous();
        Summary(s => {
            s.Summary = "Basic health check";
            s.Description = "Returns basic application health status";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        await SendOkAsync(new BasicHealthResponse
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow
        }, ct);
    }
}

// Detailed health check endpoint
public class DetailedHealthEndpoint : EndpointWithoutRequest<HealthCheckResponse>
{
    private readonly HealthCheckService _healthCheckService;
    private readonly IConfiguration _configuration;

    public DetailedHealthEndpoint(HealthCheckService healthCheckService, IConfiguration configuration)
    {
        _healthCheckService = healthCheckService;
        _configuration = configuration;
    }

    public override void Configure()
    {
        Get("/api/health/detailed");
        AllowAnonymous();
        Summary(s => {
            s.Summary = "Detailed health check";
            s.Description = "Returns detailed application health status with component information";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var startTime = DateTime.UtcNow;
        var healthReport = await _healthCheckService.CheckHealthAsync(ct);
        var endTime = DateTime.UtcNow;
        
        var response = new HealthCheckResponse
        {
            Status = healthReport.Status.ToString(),
            Version = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "Unknown",
            Timestamp = DateTime.UtcNow,
            TotalDurationMs = (endTime - startTime).TotalMilliseconds,
            Components = healthReport.Entries.ToDictionary(
                kvp => kvp.Key,
                kvp => new ComponentHealth
                {
                    Status = kvp.Value.Status.ToString(),
                    Description = kvp.Value.Description ?? string.Empty,
                    DurationMs = kvp.Value.Duration.TotalMilliseconds,
                    Data = kvp.Value.Data.ToDictionary(d => d.Key, d => d.Value)
                }
            )
        };

        var statusCode = healthReport.Status switch
        {
            HealthStatus.Healthy => 200,
            HealthStatus.Degraded => 200,
            HealthStatus.Unhealthy => 503,
            _ => 503
        };

        await SendAsync(response, statusCode, ct);
    }
}

// Readiness check endpoint (typically used by orchestrators)
public class ReadinessEndpoint : EndpointWithoutRequest<BasicHealthResponse>
{
    private readonly HealthCheckService _healthCheckService;

    public ReadinessEndpoint(HealthCheckService healthCheckService)
    {
        _healthCheckService = healthCheckService;
    }

    public override void Configure()
    {
        Get("/api/health/ready");
        AllowAnonymous();
        Summary(s => {
            s.Summary = "Readiness check";
            s.Description = "Returns whether the application is ready to receive requests";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var healthReport = await _healthCheckService.CheckHealthAsync(ct);
        
        var response = new BasicHealthResponse
        {
            Status = healthReport.Status.ToString(),
            Timestamp = DateTime.UtcNow
        };

        var statusCode = healthReport.Status == HealthStatus.Healthy ? 200 : 503;
        await SendAsync(response, statusCode, ct);
    }
}

// Liveness check endpoint (typically used by orchestrators)
public class LivenessEndpoint : EndpointWithoutRequest<BasicHealthResponse>
{
    public override void Configure()
    {
        Get("/api/health/live");
        AllowAnonymous();
        Summary(s => {
            s.Summary = "Liveness check";
            s.Description = "Returns whether the application is alive and responding";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        // Simple liveness check - if we can respond, we're alive
        await SendOkAsync(new BasicHealthResponse
        {
            Status = "Alive",
            Timestamp = DateTime.UtcNow
        }, ct);
    }
} 