using FastEndpoints;
using FluentValidation;

namespace eat_mor_vegetables_api.Endpoints;

public class SendSmsValidator : Validator<SendSmsRequest>
{
    public SendSmsValidator()
    {
        RuleFor(x => x.To)
            .NotEmpty()
            .WithMessage("Phone number is required")
            .Matches(@"^\+?[1-9]\d{1,14}$")
            .WithMessage("Please provide a valid phone number in E.164 format (e.g., +1234567890)");

        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("Message is required")
            .MaximumLength(1600)
            .WithMessage("Message cannot exceed 1600 characters");
    }
} 