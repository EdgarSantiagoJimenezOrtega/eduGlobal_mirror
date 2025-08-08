const Joi = require('joi');

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi schema object
 * @param {String} property - Request property to validate ('body', 'params', 'query')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      console.log('❌ Validation failed for:', req.method, req.path);
      console.log('📝 Raw data received:', JSON.stringify(req[property], null, 2));
      console.log('🔍 Validation errors:', error.details);
      
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      console.log('📋 Processed error details:', errorDetails);

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request data validation failed',
        details: errorDetails
      });
    }

    // Replace the original property with the validated (and potentially transformed) value
    req[property] = value;
    next();
  };
};

/**
 * Validate request parameters (like :id)
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate query parameters
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate request body
 */
const validateBody = (schema) => validate(schema, 'body');

module.exports = {
  validate,
  validateParams,
  validateQuery,
  validateBody
};