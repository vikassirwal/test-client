"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFhirResource = void 0;
const axios_1 = __importDefault(require("axios"));
const FHIR_BASE_URL = process.env.FHIR_BASE_URL || 'http://localhost:3010/fhir';
const getFhirResource = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            const errorResponse = {
                error: 'Unauthorized',
                message: 'Authorization header is required',
                timestamp: new Date().toISOString(),
            };
            res.status(401).json(errorResponse);
            return;
        }
        const { version, resourceType, id } = req.params;
        const queryParams = req.query;
        let fhirUrl = `${FHIR_BASE_URL}/${version}/${resourceType}`;
        if (id) {
            fhirUrl += `/${id}`;
        }
        const queryString = new URLSearchParams(queryParams).toString();
        if (queryString) {
            fhirUrl += `?${queryString}`;
        }
        const response = await axios_1.default.get(fhirUrl, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error retrieving FHIR resource:', errorMessage);
        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error;
            const errorResponse = {
                error: 'FHIR Server Error',
                message: axiosError.response.data?.message || errorMessage,
                errorDetails: axiosError.response.data?.error,
                status: axiosError.response.status,
                timestamp: new Date().toISOString(),
            };
            res.status(axiosError.response.status).json(errorResponse);
        }
        else {
            const errorResponse = {
                error: 'Internal Server Error',
                message: 'An unexpected error occurred while processing the request',
                timestamp: new Date().toISOString(),
            };
            res.status(500).json(errorResponse);
        }
    }
};
exports.getFhirResource = getFhirResource;
//# sourceMappingURL=fhirResource.js.map