# HL7 to FHIR Integration Service

A Node.js Express application that provides integration services for HL7 v2 to FHIR conversion and FHIR resource retrieval. This service acts as a proxy between client applications and backend FHIR/EMR systems.

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 10.0.0 or higher

You can check your versions using:
```bash
node --version
npm --version
```

## Installation

1. Clone the repository and navigate to the project directory:
```bash
cd test-client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
# EMR/HL7 to FHIR conversion endpoint
EMR_ENDPOINT=http://localhost:3010

# Server configuration
PORT=3000
```

## Running the Application

### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:3000` by default.

## Testing

### Running Tests

```bash
# Run all tests
npm test
```

## API Endpoints

### Health Check

**GET** `/`

Check if the service is running.

**Response:**
```json
{
  "status": "OK",
  "message": "Demo integration service is running",
  "timestamp": "2025-09-06T14:29:11.891Z"
}
```

---

### HL7 to FHIR Conversion

**POST** `/hl7-to-fhir`

Convert HL7 v2 messages to FHIR format.

**Headers:**
- `Authorization`: Bearer token (required)
- `Content-Type`: application/json

**Request Body:**
```json
{
  "resourceType": "Patient",
  "message": "MSH|^~&|SENDING_APPLICATION|SENDING_FACILITY|RECEIVING_APPLICATION|RECEIVING_FACILITY|20110613072049||ADT^A08|934579920110613072049|P|2.3||||\nEVN|A08|20110613072049|||\nPID|1||135769||MOUSE^MICKEY^||19281118|M|||123 Main St.^^Lake Buena Vista^FL^32830||(407)939-1289^^^theMainMouse@disney.com|||||1719|99999999||||||||||||||||||||\nPV1|1|O|||||7^Disney^Walt^^MD^^^^|||||||||||||||||||||||||||||||||||||||||||||\nGT1|1|78|MOUSE^MARSHALL^||123 Main St.^^Lake Buena Vista^FL^32830|(407)939-1289^^^^^^||19190101|M||||||||||||||||||||||||||||||||||||||||||||||\nIN1|1||1|ABC Insurance Medicaid|P O Box 12345^^Atlanta^GA^30348|Claims^Florida |(555)555-1234^^^^^^|G1234|||||||G|Mouse^Mickey|SELF|19281118|123 Main St.^^Lake Buena Vista^FL^32830|Y||||||||||||P||||ZYX1234589-1|||||||M||||M||\nIN2||||||ZYX1234589-1||||ZYX1234589-1|||||||||||||||000079||||||||||||||||||||||||||||||||||||||(206)446-5080^^^^^260^4465080|||||||||SELF"
}
```

**Success Response (200):**
```json
{
  "resourceType": "Patient",
  "id": "135769",
  "name": [
    {
      "family": "Mouse",
      "given": ["Mickey"]
    }
  ],
  "gender": "male",
  "birthDate": "1928-11-18"
}
```

**Error Responses:**

*400 Bad Request:*
```json
{
  "error": "Bad Request",
  "message": "Request body must contain a 'message' field with HL7 v2 message",
  "timestamp": "2025-09-06T14:29:11.891Z"
}
```

*401 Unauthorized:*
```json
{
  "error": "Unauthorized",
  "message": "Authorization header is required",
  "timestamp": "2025-09-06T14:29:11.891Z"
}
```

*503 Service Unavailable:*
```json
{
  "error": "Service Unavailable",
  "message": "EMR service is not available. Please ensure the service is running on the configured endpoint",
  "timestamp": "2025-09-06T14:29:11.891Z"
}
```

---

### FHIR Resource Retrieval

**GET** `/fhir/{version}/{resourceType}`

Retrieve FHIR resources of a specific type.

**GET** `/fhir/{version}/{resourceType}/{id}`

Retrieve a specific FHIR resource by ID.

**Headers:**
- `Authorization`: Bearer token (required)

**Path Parameters:**
- `version`: FHIR version (e.g., "r4", "stu3")
- `resourceType`: FHIR resource type (e.g., "Patient", "Observation", "Encounter")
- `id`: (Optional) Specific resource ID

**Query Parameters:**
- Any valid FHIR search parameters

**Example Requests:**
```bash
# Get all Patient resources
curl -X GET 'http://localhost:3000/fhir/r4/Patient' \
  -H 'authorization: Bearer YOUR_JWT_TOKEN'

# Get specific Patient by ID
curl -X GET 'http://localhost:3000/fhir/r4/Patient/123' \
  -H 'authorization: Bearer YOUR_JWT_TOKEN'

# Search Patients by name
curl -X GET 'http://localhost:3000/fhir/r4/Patient?name=John' \
  -H 'authorization: Bearer YOUR_JWT_TOKEN'


**Success Response (200):**
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "123",
        "name": [
          {
            "family": "Doe",
            "given": ["John"]
          }
        ]
      }
    }
  ]
}
```

**Error Responses:**

*401 Unauthorized:*
```json
{
  "error": "Unauthorized",
  "message": "Authorization header is required",
  "timestamp": "2025-09-06T14:29:11.891Z"
}
```

*404 Not Found:*
```json
{
  "error": "FHIR Server Error",
  "message": "Request failed with status code 404",
  "errorDetails": "Resource not found",
  "status": 404,
  "timestamp": "2025-09-06T14:29:11.891Z"
}
```

*503 Service Unavailable:*
```json
{
  "error": "Service Unavailable",
  "message": "FHIR server is not available. Please ensure the server is running on the configured endpoint",
  "timestamp": "2025-09-06T14:29:11.891Z"
}
```

---

## Error Handling

All endpoints return consistent error responses with the following structure:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "status": 400,
  "errorDetails": "Additional error information",
  "timestamp": "2025-09-06T14:29:11.891Z"
}
```