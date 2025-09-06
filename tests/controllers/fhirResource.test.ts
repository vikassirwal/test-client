import { Request, Response } from 'express';
import axios from 'axios';
import { getFhirResource } from '../../controllers/fhirResource';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FHIR Resource Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      params: {},
      query: {},
      headers: {},
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getFhirResource', () => {
    it('should return 401 when authorization header is missing', async () => {
      mockRequest.params = { version: 'r4', resourceType: 'Patient' };
      mockRequest.headers = {};

      await getFhirResource(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authorization header is required',
        timestamp: expect.any(String),
      });
    });

    it('should successfully retrieve FHIR resources without ID', async () => {
      const mockFhirResponse = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: '123',
              name: [{ family: 'Doe', given: ['John'] }],
            },
          },
        ],
      };

      mockRequest.params = { version: 'r4', resourceType: 'Patient' };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockFhirResponse,
      });

      await getFhirResource(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3010/fhir/r4/Patient',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFhirResponse);
    });

    it('should successfully retrieve specific FHIR resource with ID', async () => {
      const mockFhirResponse = {
        resourceType: 'Patient',
        id: '123',
        name: [{ family: 'Doe', given: ['John'] }],
      };

      mockRequest.params = { version: 'r4', resourceType: 'Patient', id: '123' };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockFhirResponse,
      });

      await getFhirResource(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3010/fhir/r4/Patient/123',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFhirResponse);
    });

    it('should handle query parameters correctly', async () => {
      const mockFhirResponse = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 0,
        entry: [],
      };

      mockRequest.params = { version: 'r4', resourceType: 'Patient' };
      mockRequest.query = { name: 'John', birthdate: '1990' };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockFhirResponse,
      });

      await getFhirResource(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3010/fhir/r4/Patient?name=John&birthdate=1990',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFhirResponse);
    });

    it('should handle FHIR server error response', async () => {
      mockRequest.params = { version: 'r4', resourceType: 'Patient' };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Resource not found',
            error: 'Not Found',
          },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      await getFhirResource(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'FHIR Server Error',
        message: 'Resource not found',
        errorDetails: 'Not Found',
        status: 404,
        timestamp: expect.any(String),
      });
    });

    it('should handle network errors', async () => {
      mockRequest.params = { version: 'r4', resourceType: 'Patient' };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      const mockError = new Error('Network error');
      mockedAxios.get.mockRejectedValueOnce(mockError);

      await getFhirResource(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing the request',
        timestamp: expect.any(String),
      });
    });

    it('should handle different FHIR resource types', async () => {
      const mockObservationResponse = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-123',
              status: 'final',
              code: { coding: [{ system: 'http://loinc.org', code: '12345-6' }] },
            },
          },
        ],
      };

      mockRequest.params = { version: 'r4', resourceType: 'Observation' };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockObservationResponse,
      });

      await getFhirResource(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3010/fhir/r4/Observation',
        expect.any(Object)
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockObservationResponse);
    });

    it('should handle different FHIR versions', async () => {
      const mockFhirResponse = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 0,
        entry: [],
      };

      mockRequest.params = { version: 'stu3', resourceType: 'Patient' };
      mockRequest.headers = { authorization: 'Bearer test-token' };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockFhirResponse,
      });

      await getFhirResource(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3010/fhir/stu3/Patient',
        expect.any(Object)
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFhirResponse);
    });
  });
});
