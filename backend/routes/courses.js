const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { courseSchema, paramValidation, queryValidation } = require('../validators/schemas');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const Joi = require('joi');

// GET /api/courses - List all courses with optional filtering
router.get('/', 
  validateQuery(Joi.object(queryValidation)), 
  async (req, res) => {
    try {
      const { limit, offset, order_by, order_direction, is_locked } = req.query;
      
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
          is_locked
        `)
        .order(order_by, { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      // Apply filters if provided
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

// GET /api/courses/:id - Get single course
router.get('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          slug,
          description,
          category_id,
          order,
          cover_images,
          is_locked
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Course with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch course'
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

// POST /api/courses - Create new course
router.post('/', 
  validateBody(courseSchema.create), 
  async (req, res) => {
    try {
      console.log('🆕 POST /api/courses - Creating new course');
      console.log('📝 Received data:', JSON.stringify(req.body, null, 2));
      console.log('📋 Data types:', {
        title: typeof req.body.title,
        slug: typeof req.body.slug,
        description: typeof req.body.description,
        category_id: typeof req.body.category_id,
        order: typeof req.body.order,
        cover_images: typeof req.body.cover_images,
        is_locked: typeof req.body.is_locked
      });
      
      const courseData = req.body;

      // Check if slug already exists
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', courseData.slug)
        .single();

      if (existingCourse) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Course with this slug already exists',
          field: 'slug'
        });
      }

      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create course'
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

// PUT /api/courses/:id - Update course
router.put('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(courseSchema.update), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If updating slug, check if it already exists (excluding current course)
      if (updateData.slug) {
        const { data: existingCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', updateData.slug)
          .neq('id', id)
          .single();

        if (existingCourse) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Course with this slug already exists',
            field: 'slug'
          });
        }
      }

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Course with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update course'
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

// DELETE /api/courses/:id - Delete course
router.delete('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateQuery(Joi.object({
    cascade: Joi.boolean().default(false)
  })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { cascade } = req.query;

      console.log(`🗑️ Deleting course ${id}, cascade: ${cascade}`);

      // Check if course has associated modules
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', id);

      if (modules && modules.length > 0 && !cascade) {
        console.log(`❌ Course has ${modules.length} modules, cascade delete not enabled`);
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete course with associated modules. Delete modules first or enable cascade delete.',
          moduleCount: modules.length
        });
      }

      if (cascade && modules && modules.length > 0) {
        console.log(`🔄 Cascade deleting ${modules.length} modules and their lessons`);
        
        // Delete lessons for each module
        for (const module of modules) {
          // Delete user progress for lessons in this module
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('module_id', module.id);

          if (lessons && lessons.length > 0) {
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
          }

          // Delete lessons
          await supabase
            .from('lessons')
            .delete()
            .eq('module_id', module.id);

          // Delete favorites for this module
          await supabase
            .from('favorites')
            .delete()
            .eq('item_type', 'module')
            .eq('item_id', module.id);
        }

        // Delete modules
        await supabase
          .from('modules')
          .delete()
          .eq('course_id', id);

        // Delete favorites for this course
        await supabase
          .from('favorites')
          .delete()
          .eq('item_type', 'course')
          .eq('item_id', id);

        console.log(`✅ Cascade delete completed for course ${id}`);
      }

      // Delete the course
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete course'
        });
      }

      console.log(`✅ Course ${id} deleted successfully`);
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

// GET /api/courses/:id/modules - Get all modules for a course
router.get('/:id/modules', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateQuery(Joi.object(queryValidation)), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit, offset, order_by, order_direction, is_locked } = req.query;

      // First check if course exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('id', id)
        .single();

      if (courseError) {
        if (courseError.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Course with id ${id} not found`
          });
        }
        
        console.error('Database error:', courseError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to verify course existence'
        });
      }

      let query = supabase
        .from('modules')
        .select(`
          id,
          course_id,
          title,
          description,
          order,
          is_locked
        `)
        .eq('course_id', id)
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

module.exports = router;