import request from 'supertest';
const app = require('../server');

// Mock the controllers
jest.mock('../controllers/hl7ToFhir', () => ({
  convertHl7ToFhir: jest.fn(),
  healthCheck: jest.fn(),
}));

jest.mock('../controllers/fhirResource', () => ({
  getFhirResource: jest.fn(),
}));

describe('Server Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const { healthCheck } = require('../controllers/hl7ToFhir');
      healthCheck.mockImplementation((req: any, res: any) => {
        res.status(200).json({
          status: 'OK',
          message: 'Demo integration service is running',
          timestamp: '2025-09-06T15:00:00.000Z',
        });
      });

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'OK',
        message: 'Demo integration service is running',
        timestamp: '2025-09-06T15:00:00.000Z',
      });
    });
  });

  describe('HL7 to FHIR Endpoint', () => {
    it('should call convertHl7ToFhir controller', async () => {
      const { convertHl7ToFhir } = require('../controllers/hl7ToFhir');
      convertHl7ToFhir.mockImplementation((req: any, res: any) => {
        res.status(200).json({ resourceType: 'Patient' });
      });

      const response = await request(app)
        .post('/hl7-to-fhir')
        .set('authorization', 'Bearer test-token')
        .send({ message: 'test message' });

      expect(convertHl7ToFhir).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('FHIR Resource Endpoints', () => {
    it('should call getFhirResource controller for resource collection', async () => {
      const { getFhirResource } = require('../controllers/fhirResource');
      getFhirResource.mockImplementation((req: any, res: any) => {
        res.status(200).json({ resourceType: 'Bundle' });
      });

      const response = await request(app)
        .get('/fhir/r4/Patient')
        .set('authorization', 'Bearer test-token');

      expect(getFhirResource).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should call getFhirResource controller for specific resource', async () => {
      const { getFhirResource } = require('../controllers/fhirResource');
      getFhirResource.mockImplementation((req: any, res: any) => {
        res.status(200).json({ resourceType: 'Patient', id: '123' });
      });

      const response = await request(app)
        .get('/fhir/r4/Patient/123')
        .set('authorization', 'Bearer test-token');

      expect(getFhirResource).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/unknown-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        timestamp: expect.any(String),
      });
    });

    it('should handle server errors', async () => {
      const { healthCheck } = require('../controllers/hl7ToFhir');
      healthCheck.mockImplementation((req: any, res: any) => {
        throw new Error('Test error');
      });

      const response = await request(app).get('/');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: expect.any(String),
      });
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
