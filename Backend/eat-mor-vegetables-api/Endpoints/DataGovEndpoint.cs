using FastEndpoints;
using FluentValidation;
using System.Net.Http.Headers;
using System.Text.Json;

namespace eat_mor_vegetables_api.Endpoints;

// Request models for api.data.gov integration
public class DataGovRequest
{
    public string ApiEndpoint { get; set; } = string.Empty;
    public string Method { get; set; } = "GET";
    public Dictionary<string, string> QueryParameters { get; set; } = new();
    public Dictionary<string, string> Headers { get; set; } = new();
    public string? RequestBody { get; set; }
}

public class DataGovResponse
{
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string Data { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
    public Dictionary<string, string> ResponseHeaders { get; set; } = new();
    public RateLimitInfo? RateLimit { get; set; }
}

public class RateLimitInfo
{
    public int? Limit { get; set; }
    public int? Remaining { get; set; }
}

// Example endpoint for NREL Alternative Fuel Stations
public class NrelFuelStationsRequest
{
    public string? State { get; set; }
    public string? FuelType { get; set; }
    public int Limit { get; set; } = 10;
    public string? City { get; set; }
    public string? Zip { get; set; }
}

public class NrelFuelStationsResponse
{
    public bool Success { get; set; }
    public object? Data { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public RateLimitInfo? RateLimit { get; set; }
}

// Generic Data.gov API endpoint
public class DataGovEndpoint : Endpoint<DataGovRequest, DataGovResponse>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public DataGovEndpoint(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public override void Configure()
    {
        Post("/api/data-gov/query");
        AllowAnonymous();
        Summary(s => {
            s.Summary = "Query api.data.gov APIs";
            s.Description = "Generic endpoint to query various government APIs through api.data.gov gateway";
        });
    }

    public override async Task HandleAsync(DataGovRequest req, CancellationToken ct)
    {
        try
        {
            // Get API key from configuration
            var apiKey = Environment.GetEnvironmentVariable("DATA_GOV_API_KEY") 
                        ?? _configuration["DataGov:ApiKey"] 
                        ?? "DEMO_KEY";

            // Create HTTP client
            var httpClient = _httpClientFactory.CreateClient();
            
            // Build the request URL
            var uriBuilder = new UriBuilder(req.ApiEndpoint);
            
            // Add query parameters
            var queryParams = new List<string>();
            foreach (var param in req.QueryParameters)
            {
                queryParams.Add($"{param.Key}={Uri.EscapeDataString(param.Value)}");
            }
            
            // Add API key as query parameter if not already present
            if (!req.QueryParameters.ContainsKey("api_key"))
            {
                queryParams.Add($"api_key={apiKey}");
            }
            
            if (queryParams.Any())
            {
                uriBuilder.Query = string.Join("&", queryParams);
            }

            // Create HTTP request
            var request = new HttpRequestMessage(new HttpMethod(req.Method), uriBuilder.ToString());
            
            // Add API key as header (preferred method)
            request.Headers.Add("X-Api-Key", apiKey);
            
            // Add custom headers
            foreach (var header in req.Headers)
            {
                request.Headers.Add(header.Key, header.Value);
            }

            // Add request body if provided
            if (!string.IsNullOrEmpty(req.RequestBody) && req.Method != "GET")
            {
                request.Content = new StringContent(req.RequestBody, System.Text.Encoding.UTF8, "application/json");
            }

            // Make the request
            var response = await httpClient.SendAsync(request, ct);
            var responseContent = await response.Content.ReadAsStringAsync(ct);

            // Extract rate limit information
            var rateLimit = new RateLimitInfo();
            if (response.Headers.TryGetValues("X-RateLimit-Limit", out var limitValues))
            {
                if (int.TryParse(limitValues.First(), out var limit))
                    rateLimit.Limit = limit;
            }
            if (response.Headers.TryGetValues("X-RateLimit-Remaining", out var remainingValues))
            {
                if (int.TryParse(remainingValues.First(), out var remaining))
                    rateLimit.Remaining = remaining;
            }

            // Build response
            var result = new DataGovResponse
            {
                Success = response.IsSuccessStatusCode,
                StatusCode = (int)response.StatusCode,
                Data = responseContent,
                ErrorMessage = response.IsSuccessStatusCode ? string.Empty : $"API request failed: {response.StatusCode}",
                ResponseHeaders = response.Headers.ToDictionary(h => h.Key, h => string.Join(", ", h.Value)),
                RateLimit = rateLimit
            };

            // Handle specific api.data.gov errors
            if (!response.IsSuccessStatusCode)
            {
                try
                {
                    var errorResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                    if (errorResponse.TryGetProperty("error", out var errorObj))
                    {
                        if (errorObj.TryGetProperty("code", out var code) && errorObj.TryGetProperty("message", out var message))
                        {
                            result.ErrorMessage = $"API Error [{code.GetString()}]: {message.GetString()}";
                        }
                    }
                }
                catch
                {
                    // If we can't parse the error, use the default message
                }
            }

            await SendAsync(result, result.Success ? 200 : result.StatusCode, ct);
        }
        catch (Exception ex)
        {
            await SendAsync(new DataGovResponse
            {
                Success = false,
                StatusCode = 500,
                ErrorMessage = $"Internal error: {ex.Message}"
            }, 500, ct);
        }
    }
}

// Specific endpoint for NREL Alternative Fuel Stations (example)
public class NrelFuelStationsEndpoint : Endpoint<NrelFuelStationsRequest, NrelFuelStationsResponse>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public NrelFuelStationsEndpoint(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public override void Configure()
    {
        Get("/api/data-gov/fuel-stations");
        AllowAnonymous();
        Summary(s => {
            s.Summary = "Get alternative fuel stations";
            s.Description = "Query NREL Alternative Fuel Stations API through api.data.gov";
        });
    }

    public override async Task HandleAsync(NrelFuelStationsRequest req, CancellationToken ct)
    {
        try
        {
            // Get API key
            var apiKey = Environment.GetEnvironmentVariable("DATA_GOV_API_KEY") 
                        ?? _configuration["DataGov:ApiKey"] 
                        ?? "DEMO_KEY";

            // Create HTTP client
            var httpClient = _httpClientFactory.CreateClient();
            
            // Build query parameters
            var queryParams = new List<string>
            {
                $"limit={req.Limit}",
                $"api_key={apiKey}"
            };

            if (!string.IsNullOrEmpty(req.State))
                queryParams.Add($"state={Uri.EscapeDataString(req.State)}");
            
            if (!string.IsNullOrEmpty(req.FuelType))
                queryParams.Add($"fuel_type={Uri.EscapeDataString(req.FuelType)}");
            
            if (!string.IsNullOrEmpty(req.City))
                queryParams.Add($"city={Uri.EscapeDataString(req.City)}");
            
            if (!string.IsNullOrEmpty(req.Zip))
                queryParams.Add($"zip={Uri.EscapeDataString(req.Zip)}");

            // Build URL
            var url = $"https://developer.nrel.gov/api/alt-fuel-stations/v1.json?{string.Join("&", queryParams)}";

            // Create request
            var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Get, url);
            request.Headers.Add("X-Api-Key", apiKey);

            // Make request
            var response = await httpClient.SendAsync(request, ct);
            var responseContent = await response.Content.ReadAsStringAsync(ct);

            // Extract rate limit info
            var rateLimit = new RateLimitInfo();
            if (response.Headers.TryGetValues("X-RateLimit-Limit", out var limitValues))
            {
                if (int.TryParse(limitValues.First(), out var limit))
                    rateLimit.Limit = limit;
            }
            if (response.Headers.TryGetValues("X-RateLimit-Remaining", out var remainingValues))
            {
                if (int.TryParse(remainingValues.First(), out var remaining))
                    rateLimit.Remaining = remaining;
            }

            if (response.IsSuccessStatusCode)
            {
                var data = JsonSerializer.Deserialize<object>(responseContent);
                await SendOkAsync(new NrelFuelStationsResponse
                {
                    Success = true,
                    Data = data,
                    RateLimit = rateLimit
                }, ct);
            }
            else
            {
                await SendAsync(new NrelFuelStationsResponse
                {
                    Success = false,
                    ErrorMessage = $"API request failed: {response.StatusCode}",
                    RateLimit = rateLimit
                }, (int)response.StatusCode, ct);
            }
        }
        catch (Exception ex)
        {
            await SendAsync(new NrelFuelStationsResponse
            {
                Success = false,
                ErrorMessage = $"Internal error: {ex.Message}"
            }, 500, ct);
        }
    }
}

// Validator for DataGovRequest
public class DataGovRequestValidator : Validator<DataGovRequest>
{
    public DataGovRequestValidator()
    {
        RuleFor(x => x.ApiEndpoint)
            .NotEmpty()
            .WithMessage("API endpoint URL is required")
            .Must(BeValidUrl)
            .WithMessage("Please provide a valid URL");

        RuleFor(x => x.Method)
            .NotEmpty()
            .WithMessage("HTTP method is required")
            .Must(BeValidHttpMethod)
            .WithMessage("Please provide a valid HTTP method (GET, POST, PUT, DELETE, etc.)");
    }

    private bool BeValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out _);
    }

    private bool BeValidHttpMethod(string method)
    {
        var validMethods = new[] { "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS" };
        return validMethods.Contains(method.ToUpper());
    }
}

// Validator for NrelFuelStationsRequest
public class NrelFuelStationsRequestValidator : Validator<NrelFuelStationsRequest>
{
    public NrelFuelStationsRequestValidator()
    {
        RuleFor(x => x.Limit)
            .GreaterThan(0)
            .WithMessage("Limit must be greater than 0")
            .LessThanOrEqualTo(200)
            .WithMessage("Limit cannot exceed 200");

        RuleFor(x => x.State)
            .MaximumLength(2)
            .WithMessage("State should be a 2-character code")
            .When(x => !string.IsNullOrEmpty(x.State));

        RuleFor(x => x.Zip)
            .Matches(@"^\d{5}(-\d{4})?$")
            .WithMessage("Please provide a valid ZIP code (12345 or 12345-6789)")
            .When(x => !string.IsNullOrEmpty(x.Zip));
    }
} 