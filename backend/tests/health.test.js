const request = require('supertest');
const express = require('express');

// Create a simple app for testing
const app = express();

// Add the health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EDU WEB Backend API'
  });
});

describe('Health Endpoint', () => {
  test('GET /health should return status OK', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('service', 'EDU WEB Backend API');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('Health response should have correct structure', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(typeof response.body.status).toBe('string');
    expect(typeof response.body.timestamp).toBe('string');
    expect(typeof response.body.service).toBe('string');
  });
});

describe('Basic Application Tests', () => {
  test('Application should be defined', () => {
    expect(app).toBeDefined();
  });

  test('Express app should be a function', () => {
    expect(typeof app).toBe('function');
  });
});