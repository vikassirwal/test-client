const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('ts-node').register({
  project: './tsconfig.json'
});

const { convertHl7ToFhir, healthCheck } = require('./controllers/hl7ToFhir.ts');
const { getFhirResource } = require('./controllers/fhirResource.ts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => healthCheck(req, res));
app.post('/hl7-to-fhir', (req, res) => convertHl7ToFhir(req, res));

// FHIR resource endpoints
app.get('/fhir/:version/:resourceType', (req, res) => getFhirResource(req, res));
app.get('/fhir/:version/:resourceType/:id', (req, res) => getFhirResource(req, res));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`HL7 to FHIR converter server running on port ${PORT}`);
});

module.exports = app;