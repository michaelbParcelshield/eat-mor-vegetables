using FastEndpoints;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace eat_mor_vegetables_api.Endpoints;

// Request model
public class SendSmsRequest
{
    public string To { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

// Response model
public class SendSmsResponse
{
    public bool Success { get; set; }
    public string MessageSid { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}

// FastEndpoints endpoint
public class SendSmsEndpoint : Endpoint<SendSmsRequest, SendSmsResponse>
{
    private readonly IConfiguration _configuration;

    public SendSmsEndpoint(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public override void Configure()
    {
        Post("/api/sms/send");
        AllowAnonymous();
        Summary(s => {
            s.Summary = "Send SMS notification";
            s.Description = "Sends an SMS notification using Twilio";
        });
    }

    public override async Task HandleAsync(SendSmsRequest req, CancellationToken ct)
    {
        try
        {
            // Get Twilio configuration from environment variables or configuration
            // Environment variables take precedence over appsettings.json
            var accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID") 
                           ?? _configuration["Twilio:AccountSid"];
            
            var authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN") 
                          ?? _configuration["Twilio:AuthToken"];
            
            var fromPhoneNumber = Environment.GetEnvironmentVariable("TWILIO_PHONE_NUMBER") 
                                ?? _configuration["Twilio:PhoneNumber"];

            // Validate configuration
            if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(fromPhoneNumber))
            {
                await SendAsync(new SendSmsResponse
                {
                    Success = false,
                    ErrorMessage = "Twilio configuration is missing. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables."
                }, 400, ct);
                return;
            }

            // Validate request
            if (string.IsNullOrEmpty(req.To) || string.IsNullOrEmpty(req.Message))
            {
                await SendAsync(new SendSmsResponse
                {
                    Success = false,
                    ErrorMessage = "Phone number and message are required"
                }, 400, ct);
                return;
            }

            // Initialize Twilio client
            TwilioClient.Init(accountSid, authToken);

            // Send SMS
            var message = await MessageResource.CreateAsync(
                body: req.Message,
                from: new Twilio.Types.PhoneNumber(fromPhoneNumber),
                to: new Twilio.Types.PhoneNumber(req.To)
            );

            // Return success response
            await SendAsync(new SendSmsResponse
            {
                Success = true,
                MessageSid = message.Sid,
                Status = message.Status.ToString()
            }, 200, ct);
        }
        catch (Exception ex)
        {
            // Return error response
            await SendAsync(new SendSmsResponse
            {
                Success = false,
                ErrorMessage = ex.Message
            }, 500, ct);
        }
    }
} 