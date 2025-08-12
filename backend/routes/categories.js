const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { categorySchema, paramValidation, queryValidation } = require('../validators/schemas');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const Joi = require('joi');

// GET /api/categories - List all categories with optional filtering
router.get('/', 
  validateQuery(Joi.object({
    ...queryValidation,
    is_active: Joi.boolean()
  })), 
  async (req, res) => {
    try {
      const { limit, offset, order_by, order_direction, is_active } = req.query;
      
      let query = supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          color,
          icon,
          order,
          is_active,
          created_at
        `, { count: 'exact' })
        .order(order_by === 'name' ? 'name' : 'order', { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      // Apply filters if provided
      if (typeof is_active === 'boolean') {
        query = query.eq('is_active', is_active);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch categories'
        });
      }

      res.status(200).json({
        data,
        pagination: {
          total: count,
          limit,
          offset,
          has_more: count > offset + limit
        }
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
);

// GET /api/categories/:id - Get single category
router.get('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          color,
          icon,
          order,
          is_active,
          created_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Category with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch category'
        });
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
);

// POST /api/categories - Create new category
router.post('/', 
  validateBody(categorySchema.create), 
  async (req, res) => {
    try {
      console.log('🆕 POST /api/categories - Creating new category');
      console.log('📝 Received data:', JSON.stringify(req.body, null, 2));
      
      const categoryData = req.body;

      // Check if slug already exists
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categoryData.slug)
        .single();

      if (existingCategory) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Category with this slug already exists',
          field: 'slug'
        });
      }

      // Check if name already exists
      const { data: existingName } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryData.name)
        .single();

      if (existingName) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Category with this name already exists',
          field: 'name'
        });
      }

      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create category'
        });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
);

// PUT /api/categories/:id - Update category
router.put('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(categorySchema.update), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If updating slug, check if it already exists (excluding current category)
      if (updateData.slug) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', updateData.slug)
          .neq('id', id)
          .single();

        if (existingCategory) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Category with this slug already exists',
            field: 'slug'
          });
        }
      }

      // If updating name, check if it already exists (excluding current category)
      if (updateData.name) {
        const { data: existingName } = await supabase
          .from('categories')
          .select('id')
          .eq('name', updateData.name)
          .neq('id', id)
          .single();

        if (existingName) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Category with this name already exists',
            field: 'name'
          });
        }
      }

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Category with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update category'
        });
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateQuery(Joi.object({
    force: Joi.boolean().default(false)
  })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { force } = req.query;

      console.log(`🗑️ Deleting category ${id}, force: ${force}`);

      // Check if category has associated courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('category_id', id);

      if (courses && courses.length > 0 && !force) {
        console.log(`❌ Category has ${courses.length} courses, force delete not enabled`);
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete category with associated courses. Remove courses from category first or enable force delete.',
          courseCount: courses.length
        });
      }

      if (force && courses && courses.length > 0) {
        console.log(`🔄 Force deleting category with ${courses.length} courses - setting category_id to null`);
        
        // Set category_id to null for all associated courses
        await supabase
          .from('courses')
          .update({ category_id: null })
          .eq('category_id', id);
      }

      // Delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete category'
        });
      }

      console.log(`✅ Category ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
);

// GET /api/categories/:id/courses - Get all courses for a category
router.get('/:id/courses', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateQuery(Joi.object(queryValidation)), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit, offset, order_by, order_direction, is_locked } = req.query;

      // First check if category exists
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', id)
        .single();

      if (categoryError) {
        if (categoryError.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Category with id ${id} not found`
          });
        }
        
        console.error('Database error:', categoryError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to verify category existence'
        });
      }

      let query = supabase
        .from('courses')
        .select(`
          id,
          title,
          slug,
          description,
          category_id,
          order,
          cover_images,
          is_locked,
          categories (
            id,
            name,
            color
          )
        `, { count: 'exact' })
        .eq('category_id', id)
        .order(order_by === 'title' ? 'title' : 'order', { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      if (typeof is_locked === 'boolean') {
        query = query.eq('is_locked', is_locked);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch courses'
        });
      }

      res.status(200).json({
        data,
        pagination: {
          total: count,
          limit,
          offset,
          has_more: count > offset + limit
        }
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
);

module.exports = router;