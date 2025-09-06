import { Request, Response } from 'express';
import axios from 'axios';
import {
  ConversionRequest,
  ErrorResponse,
  HealthCheckResponse,
} from '../dtos/hl7.dto';

const EMR_ENDPOINT =
  process.env.EMR_ENDPOINT || 'http://localhost:3010';

export const convertHl7ToFhir = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    //. check if request body exists
    if (!req.body || !req.body.message) {
      const errorResponse: ErrorResponse = {
        error: 'Bad Request',
        message:
          'Request body must contain a "message" field with HL7 v2 message',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // check token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      const errorResponse: ErrorResponse = {
        error: 'Unauthorized',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Prepare the request payload for the conversion service
    const conversionPayload: ConversionRequest = {
      resourceType: req.body.resourceType || 'Patient',
      message: req.body.message,
    };

    // Make request to the EMR service
    const response = await axios.post(`${EMR_ENDPOINT}/convert/hl7-to-fhir`, conversionPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      timeout: 30000, // 30 second timeout
    });

    // Return the response from the EMR service
    res.status(response.status).json(response.data);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error converting HL7 to FHIR:', errorMessage);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response: {
          status: number;
          data?: { message?: string; error?: unknown };
        };
      };
      const errorResponse: ErrorResponse = {
        error: 'EMR Service Error',
        message: axiosError.response.data?.message || errorMessage,
        errorDetails: axiosError.response.data?.error,
        status: axiosError.response.status,
        timestamp: new Date().toISOString(),
      };
      res.status(axiosError.response.status).json(errorResponse);
    }  else {
      const errorResponse: ErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing the request',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
    }
  }
};

export const healthCheck = (req: Request, res: Response): void => {
  const response: HealthCheckResponse = {
    status: 'OK',
    message: 'Demo integration service is running',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
};
