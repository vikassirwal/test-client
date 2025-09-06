import { Request, Response } from 'express';
import axios from 'axios';
import { convertHl7ToFhir, healthCheck } from '../../controllers/hl7ToFhir';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HL7 to FHIR Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {},
      headers: {},
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('convertHl7ToFhir', () => {
    it('should return 400 when request body is missing', async () => {
      mockRequest.body = {};

      await convertHl7ToFhir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Request body must contain a "message" field with HL7 v2 message',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 when message field is missing', async () => {
      mockRequest.body = { resourceType: 'Patient' };

      await convertHl7ToFhir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Request body must contain a "message" field with HL7 v2 message',
        timestamp: expect.any(String),
      });
    });

    it('should return 401 when authorization header is missing', async () => {
      mockRequest.body = { message: 'test message' };
      mockRequest.headers = {};

      await convertHl7ToFhir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authorization header is required',
        timestamp: expect.any(String),
      });
    });

    it('should successfully convert HL7 to FHIR', async () => {
      const mockHl7Message = 'MSH|^~&|TEST|FACILITY|RECEIVING|FACILITY|20240101000000||ADT^A01|12345|P|2.3||||';
      const mockFhirResponse = {
        resourceType: 'Patient',
        id: '123',
        name: [{ family: 'Doe', given: ['John'] }],
      };

      mockRequest.body = {
        resourceType: 'Patient',
        message: mockHl7Message,
      };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockFhirResponse,
      });

      await convertHl7ToFhir(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3010/convert/hl7-to-fhir',
        {
          resourceType: 'Patient',
          message: mockHl7Message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          timeout: 30000,
        }
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFhirResponse);
    });

    it('should use default resourceType when not provided', async () => {
      const mockHl7Message = 'MSH|^~&|TEST|FACILITY|RECEIVING|FACILITY|20240101000000||ADT^A01|12345|P|2.3||||';

      mockRequest.body = { message: mockHl7Message };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { resourceType: 'Patient' },
      });

      await convertHl7ToFhir(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3010/convert/hl7-to-fhir',
        {
          resourceType: 'Patient',
          message: mockHl7Message,
        },
        expect.any(Object)
      );
    });

    it('should handle EMR service error response', async () => {
      const mockHl7Message = 'MSH|^~&|TEST|FACILITY|RECEIVING|FACILITY|20240101000000||ADT^A01|12345|P|2.3||||';

      mockRequest.body = { message: mockHl7Message };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      const mockError = {
        response: {
          status: 500,
          data: {
            message: 'EMR service error',
            error: 'Internal server error',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await convertHl7ToFhir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'EMR Service Error',
        message: 'EMR service error',
        errorDetails: 'Internal server error',
        status: 500,
        timestamp: expect.any(String),
      });
    });

    it('should handle network errors', async () => {
      const mockHl7Message = 'MSH|^~&|TEST|FACILITY|RECEIVING|FACILITY|20240101000000||ADT^A01|12345|P|2.3||||';

      mockRequest.body = { message: mockHl7Message };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      const mockError = new Error('Network error');
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await convertHl7ToFhir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing the request',
        timestamp: expect.any(String),
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      healthCheck(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'OK',
        message: 'Demo integration service is running',
        timestamp: expect.any(String),
      });
    });
  });
});
