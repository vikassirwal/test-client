import { Request, Response } from 'express';
import axios from 'axios';
import { ErrorResponse } from '../dtos/hl7.dto';

const EMR_ENDPOINT = process.env.EMR_ENDPOINT || 'http://localhost:3010';

export const getFhirResource = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if authorization header exists
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

    const { version, resourceType, id } = req.params;
    const queryParams = req.query;

    let fhirUrl = `${EMR_ENDPOINT}/fhir/${version}/${resourceType}`;
    if (id) {
      fhirUrl += `/${id}`;
    }

    // Add query parameters if any
    const queryString = new URLSearchParams(
      queryParams as Record<string, string>
    ).toString();
    if (queryString) {
      fhirUrl += `?${queryString}`;
    }


    const response = await axios.get(fhirUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    // Return the response from FHIR server
    res.status(response.status).json(response.data);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error retrieving FHIR resource:', errorMessage);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response: {
          status: number;
          data?: { message?: string; error?: unknown };
        };
      };
      const errorResponse: ErrorResponse = {
        error: 'FHIR Server Error',
        message: axiosError.response.data?.message || errorMessage,
        errorDetails: axiosError.response.data?.error,
        status: axiosError.response.status,
        timestamp: new Date().toISOString(),
      };
      res.status(axiosError.response.status).json(errorResponse);
    } else {
      const errorResponse: ErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing the request',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
    }
  }
};
