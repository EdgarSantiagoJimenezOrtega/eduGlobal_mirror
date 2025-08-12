const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { lessonSchema, paramValidation, queryValidation } = require('../validators/schemas');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const Joi = require('joi');

// GET /api/lessons - List all lessons with optional filtering
router.get('/', 
  validateQuery(Joi.object(queryValidation)), 
  async (req, res) => {
    try {
      const { limit, offset, order_by, order_direction, module_id } = req.query;
      
      let query = supabase
        .from('lessons')
        .select(`
          id,
          module_id,
          title,
          video_url,
          support_content,
          order,
          drip_delay_minutes,
          modules (
            id,
            title,
            course_id,
            courses (
              id,
              title,
              slug
            )
          )
        `, { count: 'exact' })
        .order(order_by, { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (module_id) {
        query = query.eq('module_id', module_id);
      }

      const { data, error, count } = await query;

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

// GET /api/lessons/:id - Get single lesson
router.get('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          module_id,
          title,
          video_url,
          support_content,
          order,
          drip_delay_minutes,
          modules (
            id,
            title,
            course_id,
            courses (
              id,
              title,
              slug
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Lesson with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch lesson'
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

// POST /api/lessons - Create new lesson
router.post('/', 
  validateBody(lessonSchema.create), 
  async (req, res) => {
    try {
      const lessonData = req.body;

      // Verify that the module exists
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('id', lessonData.module_id)
        .single();

      if (moduleError) {
        if (moduleError.code === 'PGRST116') {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Referenced module does not exist',
            field: 'module_id'
          });
        }
        
        console.error('Database error:', moduleError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to verify module existence'
        });
      }

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select(`
          id,
          module_id,
          title,
          video_url,
          support_content,
          order,
          drip_delay_minutes,
          modules (
            id,
            title,
            course_id,
            courses (
              id,
              title,
              slug
            )
          )
        `)
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create lesson'
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

// PUT /api/lessons/:id - Update lesson
router.put('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(lessonSchema.update), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If updating module_id, verify the new module exists
      if (updateData.module_id) {
        const { data: module, error: moduleError } = await supabase
          .from('modules')
          .select('id')
          .eq('id', updateData.module_id)
          .single();

        if (moduleError) {
          if (moduleError.code === 'PGRST116') {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Referenced module does not exist',
              field: 'module_id'
            });
          }
          
          console.error('Database error:', moduleError);
          return res.status(500).json({
            error: 'Database Error',
            message: 'Failed to verify module existence'
          });
        }
      }

      const { data, error } = await supabase
        .from('lessons')
        .update({
          ...updateData
        })
        .eq('id', id)
        .select(`
          id,
          module_id,
          title,
          video_url,
          support_content,
          order,
          drip_delay_minutes,
          modules (
            id,
            title,
            course_id,
            courses (
              id,
              title,
              slug
            )
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Lesson with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update lesson'
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

// DELETE /api/lessons/:id - Delete lesson
router.delete('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if lesson has associated user progress records
      const { data: progressRecords } = await supabase
        .from('user_progress')
        .select('id')
        .eq('lesson_id', id)
        .limit(1);

      if (progressRecords && progressRecords.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete lesson with associated user progress. Delete progress records first.'
        });
      }

      // Check if lesson has favorites
      const { data: favorites } = await supabase
        .from('favorites')
        .select('id')
        .eq('item_type', 'lesson')
        .eq('item_id', id)
        .limit(1);

      if (favorites && favorites.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete lesson with associated favorites. Delete favorites first.'
        });
      }

      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete lesson'
        });
      }

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

// GET /api/lessons/:id/progress - Get user progress for a lesson
router.get('/:id/progress', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateQuery(Joi.object({ 
    user_id: Joi.string().uuid(),
    ...queryValidation 
  })), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, limit, offset } = req.query;

      // First check if lesson exists
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', id)
        .single();

      if (lessonError) {
        if (lessonError.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Lesson with id ${id} not found`
          });
        }
        
        console.error('Database error:', lessonError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to verify lesson existence'
        });
      }

      let query = supabase
        .from('user_progress')
        .select(`
          id,
          user_id,
          lesson_id,
          is_completed,
          completed_at,
        `)
        .eq('lesson_id', id)
        .range(offset, offset + limit - 1);

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch user progress'
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

// POST /api/lessons/:id/complete - Mark lesson as completed for user
router.post('/:id/complete', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(Joi.object({
    user_id: Joi.string().uuid().required()
  })), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      // Check if lesson exists
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', id)
        .single();

      if (lessonError) {
        if (lessonError.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Lesson with id ${id} not found`
          });
        }
        
        console.error('Database error:', lessonError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to verify lesson existence'
        });
      }

      // Upsert user progress (insert or update if exists)
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id,
          lesson_id: parseInt(id),
          is_completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update lesson progress'
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

module.exports = router;