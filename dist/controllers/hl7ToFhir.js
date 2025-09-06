"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.convertHl7ToFhir = void 0;
const axios_1 = __importDefault(require("axios"));
const EMR_ENDPOINT = process.env.EMR_ENDPOINT || 'http://localhost:3010/convert/hl7-to-fhir';
const convertHl7ToFhir = async (req, res) => {
    try {
        if (!req.body || !req.body.message) {
            const errorResponse = {
                error: 'Bad Request',
                message: 'Request body must contain a "message" field with HL7 v2 message',
                timestamp: new Date().toISOString(),
            };
            res.status(400).json(errorResponse);
            return;
        }
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
        const conversionPayload = {
            resourceType: req.body.resourceType || 'Patient',
            message: req.body.message,
        };
        const response = await axios_1.default.post(EMR_ENDPOINT, conversionPayload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            timeout: 30000,
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error converting HL7 to FHIR:', errorMessage);
        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error;
            const errorResponse = {
                error: 'EMR Service Error',
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
exports.convertHl7ToFhir = convertHl7ToFhir;
const healthCheck = (req, res) => {
    const response = {
        status: 'OK',
        message: 'Demo integration service is running',
        timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=hl7ToFhir.js.map