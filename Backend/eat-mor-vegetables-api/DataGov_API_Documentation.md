# API.data.gov Integration Documentation

This document explains how to use the api.data.gov integration endpoints to query various government APIs.

## API Endpoints

### 1. Generic Data.gov Query Endpoint

**URL:** `POST /api/data-gov/query`

This is a generic endpoint that can query any government API through the api.data.gov gateway.

#### Request Format
```json
{
  "apiEndpoint": "https://developer.nrel.gov/api/alt-fuel-stations/v1.json",
  "method": "GET",
  "queryParameters": {
    "state": "CA",
    "fuel_type": "ELEC",
    "limit": "10"
  },
  "headers": {
    "Accept": "application/json"
  },
  "requestBody": null
}
```

#### Response Format
```json
{
  "success": true,
  "statusCode": 200,
  "data": "{ API response data }",
  "errorMessage": "",
  "responseHeaders": {
    "Content-Type": "application/json",
    "X-RateLimit-Limit": "1000",
    "X-RateLimit-Remaining": "999"
  },
  "rateLimit": {
    "limit": 1000,
    "remaining": 999
  }
}
```

### 2. NREL Alternative Fuel Stations Endpoint

**URL:** `GET /api/data-gov/fuel-stations`

This is a specific endpoint for querying NREL Alternative Fuel Stations data.

#### Query Parameters
- `state` (optional): 2-character state code (e.g., "CA", "NY")
- `fuelType` (optional): Fuel type (e.g., "ELEC", "CNG", "LPG")
- `limit` (optional): Number of results to return (default: 10, max: 200)
- `city` (optional): City name
- `zip` (optional): ZIP code (12345 or 12345-6789 format)

#### Example Request
```
GET /api/data-gov/fuel-stations?state=CA&fuelType=ELEC&limit=5
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "fuel_stations": [
      {
        "id": 1,
        "station_name": "Example Charging Station",
        "street_address": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102",
        "fuel_type_code": "ELEC"
      }
    ],
    "total_results": 1234
  },
  "errorMessage": "",
  "rateLimit": {
    "limit": 1000,
    "remaining": 999
  }
}
```

## Configuration

### API Key Setup

The endpoints use the api.data.gov API key for authentication. You can configure this in several ways:

1. **Environment Variable** (recommended for production):
   ```bash
   export DATA_GOV_API_KEY="your_api_key_here"
   ```

2. **Configuration File** (for development):
   ```json
   {
     "DataGov": {
       "ApiKey": "your_api_key_here"
     }
   }
   ```

3. **Default**: If no API key is configured, the system will use "DEMO_KEY" which has limited functionality.

### Getting an API Key

1. Visit: https://api.data.gov/signup
2. Fill out the form with your information
3. You'll receive an API key via email
4. Replace "DEMO_KEY" with your actual API key

## Authentication Methods

The api.data.gov gateway supports multiple authentication methods:

1. **HTTP Header** (preferred): `X-Api-Key: your_api_key`
2. **Query Parameter**: `?api_key=your_api_key`
3. **HTTP Basic Auth**: Username is the API key, password is empty

Our endpoints use both the header and query parameter methods for maximum compatibility.

## Rate Limits

- **Default Limit**: 1,000 requests per hour
- **Demo Key**: 30 requests per hour
- **Registered Users**: Higher limits available upon request

The endpoints return rate limit information in the response:
```json
{
  "rateLimit": {
    "limit": 1000,
    "remaining": 999
  }
}
```

## Error Handling

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 403 | Forbidden - Invalid API key or over rate limit |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Response Format
```json
{
  "success": false,
  "statusCode": 403,
  "data": "",
  "errorMessage": "API Error [API_KEY_INVALID]: Invalid API key",
  "responseHeaders": {},
  "rateLimit": null
}
```

## Example Use Cases

### 1. Find Electric Vehicle Charging Stations in California
```bash
curl -X GET "https://localhost:7000/api/data-gov/fuel-stations?state=CA&fuelType=ELEC&limit=10"
```

### 2. Query Any Government API
```bash
curl -X POST "https://localhost:7000/api/data-gov/query" \
  -H "Content-Type: application/json" \
  -d '{
    "apiEndpoint": "https://developer.nrel.gov/api/solar/solar_resource/v1.json",
    "method": "GET",
    "queryParameters": {
      "lat": "37.7749",
      "lon": "-122.4194"
    }
  }'
```

### 3. Query Census Data
```bash
curl -X POST "https://localhost:7000/api/data-gov/query" \
  -H "Content-Type: application/json" \
  -d '{
    "apiEndpoint": "https://api.census.gov/data/2019/acs/acs1",
    "method": "GET",
    "queryParameters": {
      "get": "NAME,B01003_001E",
      "for": "state:*"
    }
  }'
```

## Popular Government APIs

Here are some popular APIs you can query through the generic endpoint:

### Energy APIs
- **NREL Solar Resource**: `https://developer.nrel.gov/api/solar/solar_resource/v1.json`
- **EIA Energy Data**: `https://api.eia.gov/v2/`

### Transportation APIs
- **FAA Airport Status**: `https://soa.smext.faa.gov/asws/api/airport/status/`
- **NREL Alternative Fuel Stations**: `https://developer.nrel.gov/api/alt-fuel-stations/v1.json`

### Weather APIs
- **NOAA Weather**: `https://api.weather.gov/`

### Census APIs
- **Census Data**: `https://api.census.gov/data/`

## Health Check

The system includes a health check for the api.data.gov configuration:

```
GET /api/health/detailed
```

This will show:
- `data-gov-config`: Status of the API key configuration
- Rate limit information
- Configuration warnings

## Best Practices

1. **Use a Real API Key**: Replace "DEMO_KEY" with an actual API key for production use
2. **Monitor Rate Limits**: Check the rate limit information in responses
3. **Handle Errors Gracefully**: Implement proper error handling for rate limits and API failures
4. **Cache Results**: Cache API responses when appropriate to reduce API calls
5. **Use Environment Variables**: Store API keys in environment variables, not in code

## Troubleshooting

### "API_KEY_INVALID" Error
- Verify your API key is correct
- Check that the API key is properly set in configuration or environment variables

### Rate Limit Exceeded
- Wait for the rate limit to reset (typically 1 hour)
- Consider requesting a higher rate limit from api.data.gov

### Invalid URL or Endpoint
- Verify the government API endpoint URL is correct
- Check the API documentation for the specific government service

## Security Notes

- ✅ API keys are read from environment variables or configuration files
- ✅ No hardcoded API keys in the source code
- ✅ Development settings are excluded from version control
- ✅ Rate limit information is provided to help avoid abuse 