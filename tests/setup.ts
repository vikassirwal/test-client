// Test setup file
import 'dotenv/config';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.EMR_ENDPOINT = 'http://localhost:3010';
process.env.FHIR_BASE_URL = 'http://localhost:3010/fhir';
process.env.PORT = '3001';
