const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { moduleSchema, paramValidation, queryValidation } = require('../validators/schemas');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const Joi = require('joi');

// GET /api/modules - List all modules with optional filtering
router.get('/', 
  validateQuery(Joi.object(queryValidation)), 
  async (req, res) => {
    try {
      const { limit, offset, order_by, order_direction, course_id, is_locked } = req.query;
      
      let query = supabase
        .from('modules')
        .select(`
          id,
          course_id,
          title,
          description,
          module_images,
          order,
          is_locked,
          courses (
            id,
            title,
            slug
          )
        `)
        .order(order_by, { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (course_id) {
        query = query.eq('course_id', course_id);
      }
      
      if (typeof is_locked === 'boolean') {
        query = query.eq('is_locked', is_locked);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch modules'
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

// GET /api/modules/:id - Get single module
router.get('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('modules')
        .select(`
          id,
          course_id,
          title,
          description,
          module_images,
          order,
          is_locked,
          courses (
            id,
            title,
            slug
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Module with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch module'
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

// POST /api/modules - Create new module
router.post('/', 
  validateBody(moduleSchema.create), 
  async (req, res) => {
    try {
      const moduleData = req.body;
      console.log('📥 Backend received module data:', JSON.stringify(moduleData, null, 2));

      // Remove drip_content if it exists (not in database schema)
      if ('drip_content' in moduleData) {
        delete moduleData.drip_content;
        console.log('🔧 Removed drip_content field');
      }

      console.log('📤 Data to insert in database:', JSON.stringify(moduleData, null, 2));

      // Verify that the course exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('id', moduleData.course_id)
        .single();

      if (courseError) {
        if (courseError.code === 'PGRST116') {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Referenced course does not exist',
            field: 'course_id'
          });
        }
        
        console.error('Database error:', courseError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to verify course existence'
        });
      }

      const { data, error } = await supabase
        .from('modules')
        .insert(moduleData)
        .select(`
          id,
          course_id,
          title,
          description,
          module_images,
          order,
          is_locked,
          courses (
            id,
            title,
            slug
          )
        `)
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create module'
        });
      }

      console.log('✅ Module created successfully:', JSON.stringify(data, null, 2));
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

// PUT /api/modules/:id - Update module
router.put('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(moduleSchema.update), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      console.log('📥 Backend received update data for module', id, ':', JSON.stringify(updateData, null, 2));

      // Remove drip_content if it exists (not in database schema)
      if ('drip_content' in updateData) {
        delete updateData.drip_content;
        console.log('🔧 Removed drip_content field from update');
      }

      console.log('📤 Data to update in database:', JSON.stringify(updateData, null, 2));

      // If updating course_id, verify the new course exists
      if (updateData.course_id) {
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('id', updateData.course_id)
          .single();

        if (courseError) {
          if (courseError.code === 'PGRST116') {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Referenced course does not exist',
              field: 'course_id'
            });
          }
          
          console.error('Database error:', courseError);
          return res.status(500).json({
            error: 'Database Error',
            message: 'Failed to verify course existence'
          });
        }
      }

      const { data, error } = await supabase
        .from('modules')
        .update({
          ...updateData
        })
        .eq('id', id)
        .select(`
          id,
          course_id,
          title,
          description,
          module_images,
          order,
          is_locked,
          courses (
            id,
            title,
            slug
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Module with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update module'
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

// DELETE /api/modules/:id - Delete module
router.delete('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateQuery(Joi.object({
    cascade: Joi.boolean().default(false)
  })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { cascade } = req.query;

      console.log(`🗑️ Deleting module ${id}, cascade: ${cascade}`);

      // Check if module has associated lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('module_id', id);

      if (lessons && lessons.length > 0 && !cascade) {
        console.log(`❌ Module has ${lessons.length} lessons, cascade delete not enabled`);
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete module with associated lessons. Delete lessons first or enable cascade delete.',
          lessonCount: lessons.length
        });
      }

      if (cascade && lessons && lessons.length > 0) {
        console.log(`🔄 Cascade deleting ${lessons.length} lessons`);
        
        // Delete user progress for these lessons
        await supabase
          .from('user_progress')
          .delete()
          .in('lesson_id', lessons.map(l => l.id));

        // Delete favorites for these lessons
        await supabase
          .from('favorites')
          .delete()
          .eq('item_type', 'lesson')
          .in('item_id', lessons.map(l => l.id));

        // Delete lessons
        await supabase
          .from('lessons')
          .delete()
          .eq('module_id', id);

        console.log(`✅ Cascade delete completed for module ${id}`);
      }

      // Delete favorites for this module
      await supabase
        .from('favorites')
        .delete()
        .eq('item_type', 'module')
        .eq('item_id', id);

      // Delete the module
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete module'
        });
      }

      console.log(`✅ Module ${id} deleted successfully`);
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


// GET /api/modules/:id/lessons - Get all lessons for a module
router.get('/:id/lessons',
  validateParams(Joi.object({ id: paramValidation.id })),
  validateQuery(Joi.object(queryValidation)),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit, offset, order_by, order_direction } = req.query;

      // First check if module exists
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('id', id)
        .single();

      if (moduleError) {
        if (moduleError.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Module with id ${id} not found`
          });
        }
        
        console.error('Database error:', moduleError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to verify module existence'
        });
      }

      const { data, error, count } = await supabase
        .from('lessons')
        .select(`
          id,
          module_id,
          title,
          video_url,
          support_content,
          order,
          drip_delay_minutes,
        `)
        .eq('module_id', id)
        .order(order_by === 'title' ? 'title' : 'order', { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch lessons'
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

// GET /api/modules/batch/without-image - Get modules without images
router.get('/batch/without-image', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select(`
        id,
        course_id,
        title,
        description,
        module_images,
        order,
        is_locked,
        courses (
          id,
          title,
          slug
        )
      `)
      .or('module_images.is.null,module_images.eq.{}')

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch modules without images'
      });
    }

    // Filter modules that actually have no images (empty array or null)
    const modulesWithoutImages = (data || []).filter(module =>
      !module.module_images ||
      module.module_images.length === 0 ||
      (Array.isArray(module.module_images) && module.module_images.every(img => !img))
    )

    res.status(200).json({
      data: modulesWithoutImages,
      count: modulesWithoutImages.length
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
});

// PUT /api/modules/batch/bulk-update-images - Update multiple modules with default image
router.put('/batch/bulk-update-images',
  validateBody(Joi.object({
    module_ids: Joi.array().items(Joi.number().integer().positive()).required(),
    default_image_url: Joi.string().uri().required()
  })),
  async (req, res) => {
    try {
      const { module_ids, default_image_url } = req.body;
      console.log(`🔄 Bulk updating ${module_ids.length} modules with default image`);

      const { data, error } = await supabase
        .from('modules')
        .update({ module_images: [default_image_url] })
        .in('id', module_ids)
        .select(`
          id,
          course_id,
          title,
          description,
          module_images,
          order,
          is_locked,
          courses (
            id,
            title,
            slug
          )
        `);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update modules'
        });
      }

      console.log(`✅ Successfully updated ${data.length} modules`);
      res.status(200).json({
        data,
        updated_count: data.length
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