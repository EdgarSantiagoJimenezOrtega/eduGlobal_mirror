const Joi = require('joi');

// Course validation schemas
const courseSchema = {
  create: Joi.object({
    title: Joi.string().required().min(1).max(255).trim(),
    slug: Joi.string().required().min(1).max(255).trim().pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow('').max(2000).trim(),
    author: Joi.string().allow('').max(255).trim(),
    language: Joi.string().allow('').max(50).trim(),
    category_id: Joi.number().integer().positive().allow(null),
    order: Joi.number().integer().min(0).default(0),
    cover_images: Joi.array().items(Joi.string().uri()).default([]),
    is_locked: Joi.boolean().default(false)
  }),
  
  update: Joi.object({
    title: Joi.string().min(1).max(255).trim(),
    slug: Joi.string().min(1).max(255).trim().pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow('').max(2000).trim(),
    author: Joi.string().allow('').max(255).trim(),
    language: Joi.string().allow('').max(50).trim(),
    category_id: Joi.number().integer().positive().allow(null),
    order: Joi.number().integer().min(0),
    cover_images: Joi.array().items(Joi.string().uri()),
    is_locked: Joi.boolean()
  }).min(1)
};

// Module validation schemas
const moduleSchema = {
  create: Joi.object({
    course_id: Joi.number().integer().positive().required(),
    title: Joi.string().required().min(1).max(255).trim(),
    description: Joi.string().allow('').max(2000).trim(),
    module_images: Joi.array().items(Joi.string().uri()).default([]),
    order: Joi.number().integer().min(0).default(0),
    is_locked: Joi.boolean().default(false)
  }),
  
  update: Joi.object({
    course_id: Joi.number().integer().positive(),
    title: Joi.string().min(1).max(255).trim(),
    description: Joi.string().allow('').max(2000).trim(),
    module_images: Joi.array().items(Joi.string().uri()),
    order: Joi.number().integer().min(0),
    is_locked: Joi.boolean()
  }).min(1)
};

// Lesson validation schemas
const lessonSchema = {
  create: Joi.object({
    module_id: Joi.number().integer().positive().required(),
    title: Joi.string().required().min(1).max(255).trim(),
    video_url: Joi.string().uri().allow('').trim(),
    support_content: Joi.string().allow('').trim(), // HTML content
    order: Joi.number().integer().min(0).default(0),
    drip_delay_minutes: Joi.number().integer().min(0).default(0)
  }),
  
  update: Joi.object({
    module_id: Joi.number().integer().positive(),
    title: Joi.string().min(1).max(255).trim(),
    video_url: Joi.string().uri().allow('').trim(),
    support_content: Joi.string().allow('').trim(),
    order: Joi.number().integer().min(0),
    drip_delay_minutes: Joi.number().integer().min(0)
  }).min(1)
};

// User progress validation schemas
const userProgressSchema = {
  create: Joi.object({
    user_id: Joi.string().uuid().required(), // Assuming Supabase auth UUIDs
    lesson_id: Joi.number().integer().positive().required(),
    is_completed: Joi.boolean().default(false),
    completed_at: Joi.date().iso().allow(null)
  }),
  
  update: Joi.object({
    user_id: Joi.string().uuid(),
    lesson_id: Joi.number().integer().positive(),
    is_completed: Joi.boolean(),
    completed_at: Joi.date().iso().allow(null)
  }).min(1)
};

// Favorites validation schemas
const favoriteSchema = {
  create: Joi.object({
    user_id: Joi.string().uuid().required(),
    item_type: Joi.string().valid('course', 'module', 'lesson').required(),
    item_id: Joi.number().integer().positive().required()
  }),
  
  update: Joi.object({
    user_id: Joi.string().uuid(),
    item_type: Joi.string().valid('course', 'module', 'lesson'),
    item_id: Joi.number().integer().positive()
  }).min(1)
};

// Category validation schemas
const categorySchema = {
  create: Joi.object({
    name: Joi.string().required().min(1).max(255).trim(),
    slug: Joi.string().required().min(1).max(255).trim().pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow('').max(1000).trim(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#8B5CF6'),
    icon: Joi.string().allow('').max(100).trim(),
    order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).trim(),
    slug: Joi.string().min(1).max(255).trim().pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow('').max(1000).trim(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    icon: Joi.string().allow('').max(100).trim(),
    order: Joi.number().integer().min(0),
    is_active: Joi.boolean()
  }).min(1)
};

// Region validation schemas
const regionSchema = {
  create: Joi.object({
    name: Joi.string().required().min(1).max(255).trim(),
    slug: Joi.string().required().min(1).max(255).trim().pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow('').max(1000).trim(),
    included_category_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required()
      .messages({
        'array.min': 'At least one category must be included'
      }),
    excluded_course_ids: Joi.array().items(Joi.number().integer().positive()).default([]),
    available_languages: Joi.array().items(Joi.string().max(10).trim()).min(1).required()
      .messages({
        'array.min': 'At least one language must be available'
      }),
    preferred_ui_language: Joi.string().max(10).trim().required(),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).trim(),
    slug: Joi.string().min(1).max(255).trim().pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow('').max(1000).trim(),
    included_category_ids: Joi.array().items(Joi.number().integer().positive()).min(1),
    excluded_course_ids: Joi.array().items(Joi.number().integer().positive()),
    available_languages: Joi.array().items(Joi.string().max(10).trim()).min(1),
    preferred_ui_language: Joi.string().max(10).trim(),
    is_active: Joi.boolean()
  }).min(1)
};

// Common parameter validations
const paramValidation = {
  id: Joi.number().integer().positive().required(),
  uuid: Joi.string().uuid().required()
};

// Query parameter validations
const queryValidation = {
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  order_by: Joi.string().valid('id', 'title', 'order', 'name').default('order'),
  order_direction: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().max(255).trim(),
  course_id: Joi.number().integer().positive(),
  module_id: Joi.number().integer().positive(),
  category_id: Joi.number().integer().positive(),
  language: Joi.string().max(50).trim(),
  user_id: Joi.string().uuid(),
  item_type: Joi.string().valid('course', 'module', 'lesson'),
  is_completed: Joi.boolean(),
  is_locked: Joi.boolean(),
  is_active: Joi.boolean()
};

module.exports = {
  courseSchema,
  moduleSchema,
  lessonSchema,
  userProgressSchema,
  favoriteSchema,
  categorySchema,
  regionSchema,
  paramValidation,
  queryValidation
};