const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { regionSchema, paramValidation, queryValidation } = require('../validators/schemas');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const Joi = require('joi');

// GET /api/regions - List all regions with optional filtering
router.get('/',
  validateQuery(Joi.object({
    ...queryValidation,
    is_active: Joi.boolean()
  })),
  async (req, res) => {
    try {
      const { limit, offset, order_by, order_direction, is_active } = req.query;

      let query = supabase
        .from('regions')
        .select(`
          id,
          name,
          slug,
          description,
          included_category_ids,
          excluded_course_ids,
          available_languages,
          preferred_ui_language,
          is_active,
          created_at
        `, { count: 'exact' })
        .order(order_by === 'name' ? 'name' : 'id', { ascending: order_direction === 'asc' })
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
          message: 'Failed to fetch regions'
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

// GET /api/regions/:id - Get single region
router.get('/:id',
  validateParams(Joi.object({ id: paramValidation.id })),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('regions')
        .select(`
          id,
          name,
          slug,
          description,
          included_category_ids,
          excluded_course_ids,
          available_languages,
          preferred_ui_language,
          is_active,
          created_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Region with id ${id} not found`
          });
        }

        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch region'
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

// POST /api/regions - Create new region
router.post('/',
  validateBody(regionSchema.create),
  async (req, res) => {
    try {
      console.log('🆕 POST /api/regions - Creating new region');
      console.log('📝 Received data:', JSON.stringify(req.body, null, 2));

      const regionData = req.body;

      // Validate that preferred_ui_language is in available_languages
      if (!regionData.available_languages.includes(regionData.preferred_ui_language)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Preferred UI language must be one of the available languages',
          field: 'preferred_ui_language'
        });
      }

      // Check if slug already exists
      const { data: existingRegion } = await supabase
        .from('regions')
        .select('id')
        .eq('slug', regionData.slug)
        .single();

      if (existingRegion) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Region with this slug already exists',
          field: 'slug'
        });
      }

      // Check if name already exists
      const { data: existingName } = await supabase
        .from('regions')
        .select('id')
        .eq('name', regionData.name)
        .single();

      if (existingName) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Region with this name already exists',
          field: 'name'
        });
      }

      // Verify that all category IDs exist
      if (regionData.included_category_ids && regionData.included_category_ids.length > 0) {
        const { data: categories } = await supabase
          .from('categories')
          .select('id')
          .in('id', regionData.included_category_ids);

        if (categories.length !== regionData.included_category_ids.length) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'One or more category IDs do not exist',
            field: 'included_category_ids'
          });
        }
      }

      // Verify that all course IDs exist (if excluded_course_ids provided)
      if (regionData.excluded_course_ids && regionData.excluded_course_ids.length > 0) {
        const { data: courses } = await supabase
          .from('courses')
          .select('id')
          .in('id', regionData.excluded_course_ids);

        if (courses.length !== regionData.excluded_course_ids.length) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'One or more course IDs do not exist',
            field: 'excluded_course_ids'
          });
        }
      }

      const { data, error } = await supabase
        .from('regions')
        .insert(regionData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create region'
        });
      }

      console.log('✅ Region created successfully:', data.id);
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

// PUT /api/regions/:id - Update region
router.put('/:id',
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(regionSchema.update),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('📝 PUT /api/regions/:id - Updating region:', id);
      console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

      // Validate that preferred_ui_language is in available_languages (if both provided)
      if (updateData.preferred_ui_language && updateData.available_languages) {
        if (!updateData.available_languages.includes(updateData.preferred_ui_language)) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Preferred UI language must be one of the available languages',
            field: 'preferred_ui_language'
          });
        }
      }

      // If updating only preferred_ui_language, check against existing available_languages
      if (updateData.preferred_ui_language && !updateData.available_languages) {
        const { data: existingRegion } = await supabase
          .from('regions')
          .select('available_languages')
          .eq('id', id)
          .single();

        if (existingRegion && !existingRegion.available_languages.includes(updateData.preferred_ui_language)) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Preferred UI language must be one of the available languages',
            field: 'preferred_ui_language'
          });
        }
      }

      // If updating slug, check if it already exists (excluding current region)
      if (updateData.slug) {
        const { data: existingRegion } = await supabase
          .from('regions')
          .select('id')
          .eq('slug', updateData.slug)
          .neq('id', id)
          .single();

        if (existingRegion) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Region with this slug already exists',
            field: 'slug'
          });
        }
      }

      // If updating name, check if it already exists (excluding current region)
      if (updateData.name) {
        const { data: existingName } = await supabase
          .from('regions')
          .select('id')
          .eq('name', updateData.name)
          .neq('id', id)
          .single();

        if (existingName) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Region with this name already exists',
            field: 'name'
          });
        }
      }

      // Verify that all category IDs exist (if provided)
      if (updateData.included_category_ids && updateData.included_category_ids.length > 0) {
        const { data: categories } = await supabase
          .from('categories')
          .select('id')
          .in('id', updateData.included_category_ids);

        if (categories.length !== updateData.included_category_ids.length) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'One or more category IDs do not exist',
            field: 'included_category_ids'
          });
        }
      }

      // Verify that all course IDs exist (if provided)
      if (updateData.excluded_course_ids && updateData.excluded_course_ids.length > 0) {
        const { data: courses } = await supabase
          .from('courses')
          .select('id')
          .in('id', updateData.excluded_course_ids);

        if (courses.length !== updateData.excluded_course_ids.length) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'One or more course IDs do not exist',
            field: 'excluded_course_ids'
          });
        }
      }

      const { data, error } = await supabase
        .from('regions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Region with id ${id} not found`
          });
        }

        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update region'
        });
      }

      console.log('✅ Region updated successfully:', id);
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

// DELETE /api/regions/:id - Delete region
router.delete('/:id',
  validateParams(Joi.object({ id: paramValidation.id })),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`🗑️ Deleting region ${id}`);

      // Delete the region
      const { error } = await supabase
        .from('regions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete region'
        });
      }

      console.log(`✅ Region ${id} deleted successfully`);
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

module.exports = router;
