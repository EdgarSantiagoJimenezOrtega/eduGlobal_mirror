const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { userProgressSchema, paramValidation, queryValidation } = require('../validators/schemas');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const Joi = require('joi');

// GET /api/user_progress - List user progress with filtering
router.get('/', 
  validateQuery(Joi.object({
    ...queryValidation,
    user_id: Joi.string().uuid(),
    lesson_id: Joi.number().integer().positive(),
    is_completed: Joi.boolean()
  })), 
  async (req, res) => {
    try {
      const { limit, offset, order_by, order_direction, user_id, lesson_id, is_completed } = req.query;
      
      let query = supabase
        .from('user_progress')
        .select(`
          id,
          user_id,
          lesson_id,
          is_completed,
          completed_at,
          lessons (
            id,
            title,
            module_id,
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
          )
        `)
        .order(order_by === 'completed_at' ? 'completed_at' : 'id', { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      
      if (lesson_id) {
        query = query.eq('lesson_id', lesson_id);
      }
      
      if (typeof is_completed === 'boolean') {
        query = query.eq('is_completed', is_completed);
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

// GET /api/user_progress/:id - Get single progress record
router.get('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          id,
          user_id,
          lesson_id,
          is_completed,
          completed_at,
          lessons (
            id,
            title,
            module_id,
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
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Progress record with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch progress record'
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

// POST /api/user_progress - Create new progress record
router.post('/', 
  validateBody(userProgressSchema.create), 
  async (req, res) => {
    try {
      const progressData = req.body;

      // Verify that the lesson exists
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', progressData.lesson_id)
        .single();

      if (lessonError) {
        if (lessonError.code === 'PGRST116') {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Referenced lesson does not exist',
            field: 'lesson_id'
          });
        }
        
        console.error('Database error:', lessonError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to verify lesson existence'
        });
      }

      // Check if progress already exists for this user-lesson combination
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', progressData.user_id)
        .eq('lesson_id', progressData.lesson_id)
        .single();

      if (existingProgress) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Progress record already exists for this user and lesson',
          existing_id: existingProgress.id
        });
      }

      const { data, error } = await supabase
        .from('user_progress')
        .insert(progressData)
        .select(`
          id,
          user_id,
          lesson_id,
          is_completed,
          completed_at,
          lessons (
            id,
            title,
            module_id,
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
          )
        `)
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create progress record'
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

// PUT /api/user_progress/:id - Update progress record
router.put('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(userProgressSchema.update), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If updating lesson_id, verify the new lesson exists
      if (updateData.lesson_id) {
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select('id')
          .eq('id', updateData.lesson_id)
          .single();

        if (lessonError) {
          if (lessonError.code === 'PGRST116') {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Referenced lesson does not exist',
              field: 'lesson_id'
            });
          }
          
          console.error('Database error:', lessonError);
          return res.status(500).json({
            error: 'Database Error',
            message: 'Failed to verify lesson existence'
          });
        }
      }

      // If marking as completed and no completed_at provided, set it to now
      if (updateData.is_completed === true && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
      
      // If marking as not completed, clear completed_at
      if (updateData.is_completed === false) {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from('user_progress')
        .update({
          ...updateData
        })
        .eq('id', id)
        .select(`
          id,
          user_id,
          lesson_id,
          is_completed,
          completed_at,
          lessons (
            id,
            title,
            module_id,
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
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Progress record with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update progress record'
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

// DELETE /api/user_progress/:id - Delete progress record
router.delete('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete progress record'
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

// GET /api/user_progress/user/:user_id/stats - Get user progress statistics
router.get('/user/:user_id/stats', 
  validateParams(Joi.object({ user_id: paramValidation.uuid })), 
  async (req, res) => {
    try {
      const { user_id } = req.params;

      // Get total lessons and completed lessons
      const { data: stats, error } = await supabase
        .rpc('get_user_progress_stats', { 
          input_user_id: user_id 
        });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch user progress statistics'
        });
      }

      // If no RPC function is available, calculate manually
      if (!stats || stats.length === 0) {
        const [totalLessonsResult, completedLessonsResult] = await Promise.all([
          supabase.from('lessons').select('id', { count: 'exact', head: true }),
          supabase
            .from('user_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('is_completed', true)
        ]);

        const totalLessons = totalLessonsResult.count || 0;
        const completedLessons = completedLessonsResult.count || 0;
        
        const progressStats = {
          user_id,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          completion_percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          last_activity: null
        };

        // Get last activity
        const { data: lastProgress } = await supabase
          .from('user_progress')
          .select('completed_at')
          .eq('user_id', user_id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        if (lastProgress) {
          progressStats.last_activity = lastProgress.completed_at;
        }

        return res.status(200).json(progressStats);
      }

      res.status(200).json(stats[0]);
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