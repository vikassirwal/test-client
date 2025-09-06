export interface ConversionRequest {
    resourceType?: string;
    message: string;
}
export interface ErrorResponse {
    error: string;
    message: string;
    status?: number;
    errorDetails?: unknown;
    timestamp: string;
}
export interface HealthCheckResponse {
    status: string;
    message: string;
    timestamp: string;
}
export interface Hl7ToFhirResponse {
    success: boolean;
    data?: unknown;
    error?: ErrorResponse;
}
//# sourceMappingURL=hl7.dto.d.ts.map