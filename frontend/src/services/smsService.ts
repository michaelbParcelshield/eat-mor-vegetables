interface SMSRequest {
  to: string;
  message: string;
}

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class SMSService {
  private readonly BASE_URL = 'https://eat-mor-vegetables-backend-gubrh2gdevcscrgd.centralus-01.azurewebsites.net';
  private readonly SMS_ENDPOINT = '/api/sms/send';

  async sendMealPlanNotification(phoneNumber: string, mealPlanName: string): Promise<SMSResponse> {
    try {
      console.log('Sending SMS notification to:', phoneNumber, 'for meal plan:', mealPlanName);

      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const message = `🥗 Great news! You've been subscribed to your meal plan: "${mealPlanName}". Get ready for a week of delicious, budget-friendly meals! - Eat Mor Vegetables`;

      const requestData: SMSRequest = {
        to: this.formatPhoneNumber(phoneNumber),
        message
      };

      console.log('SMS request data:', requestData);

      const response = await fetch(`${this.BASE_URL}${this.SMS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      console.log('SMS API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SMS API error response:', errorText);
        throw new Error(`SMS API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('SMS API success response:', result);

      return {
        success: true,
        message: result.message || 'SMS sent successfully'
      };

    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters for validation
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid length (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add +1 prefix for US numbers if not already present
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // Add + prefix if not present
    if (!phoneNumber.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phoneNumber;
  }

  formatPhoneForDisplay(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phoneNumber;
  }
}

export const smsService = new SMSService();
export type { SMSResponse }; 