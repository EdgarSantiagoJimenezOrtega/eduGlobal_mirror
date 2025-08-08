const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { favoriteSchema, paramValidation, queryValidation } = require('../validators/schemas');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const Joi = require('joi');

// GET /api/favorites - List favorites with filtering
router.get('/', 
  validateQuery(Joi.object({
    ...queryValidation,
    user_id: Joi.string().uuid(),
    item_type: Joi.string().valid('course', 'module', 'lesson'),
    item_id: Joi.number().integer().positive()
  })), 
  async (req, res) => {
    try {
      const { limit, offset, order_by, order_direction, user_id, item_type, item_id } = req.query;
      
      let query = supabase
        .from('favorites')
        .select(`
          id,
          user_id,
          item_type,
          item_id,
        `)
        .order(order_by === 'item_type' ? 'item_type' : 'id', { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      
      if (item_type) {
        query = query.eq('item_type', item_type);
      }
      
      if (item_id) {
        query = query.eq('item_id', item_id);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch favorites'
        });
      }

      // Enrich data with item details
      const enrichedData = await Promise.all(data.map(async (favorite) => {
        let itemDetails = null;
        
        try {
          switch (favorite.item_type) {
            case 'course':
              const { data: course } = await supabase
                .from('courses')
                .select('id, title, slug, cover_images')
                .eq('id', favorite.item_id)
                .single();
              itemDetails = course;
              break;
              
            case 'module':
              const { data: module } = await supabase
                .from('modules')
                .select(`
                  id, 
                  title, 
                  course_id,
                  courses (id, title, slug)
                `)
                .eq('id', favorite.item_id)
                .single();
              itemDetails = module;
              break;
              
            case 'lesson':
              const { data: lesson } = await supabase
                .from('lessons')
                .select(`
                  id, 
                  title, 
                  module_id,
                  modules (
                    id, 
                    title,
                    course_id,
                    courses (id, title, slug)
                  )
                `)
                .eq('id', favorite.item_id)
                .single();
              itemDetails = lesson;
              break;
          }
        } catch (enrichmentError) {
          console.warn(`Failed to enrich ${favorite.item_type} ${favorite.item_id}:`, enrichmentError);
        }
        
        return {
          ...favorite,
          item_details: itemDetails
        };
      }));

      res.status(200).json({
        data: enrichedData,
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

// GET /api/favorites/:id - Get single favorite
router.get('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          user_id,
          item_type,
          item_id,
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Favorite with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch favorite'
        });
      }

      // Enrich with item details
      let itemDetails = null;
      
      try {
        switch (data.item_type) {
          case 'course':
            const { data: course } = await supabase
              .from('courses')
              .select('id, title, slug, description, cover_images, is_locked')
              .eq('id', data.item_id)
              .single();
            itemDetails = course;
            break;
            
          case 'module':
            const { data: module } = await supabase
              .from('modules')
              .select(`
                id, 
                title, 
                description,
                course_id,
                is_locked,
                courses (id, title, slug)
              `)
              .eq('id', data.item_id)
              .single();
            itemDetails = module;
            break;
            
          case 'lesson':
            const { data: lesson } = await supabase
              .from('lessons')
              .select(`
                id, 
                title, 
                video_url,
                module_id,
                modules (
                  id, 
                  title,
                  course_id,
                  courses (id, title, slug)
                )
              `)
              .eq('id', data.item_id)
              .single();
            itemDetails = lesson;
            break;
        }
      } catch (enrichmentError) {
        console.warn(`Failed to enrich ${data.item_type} ${data.item_id}:`, enrichmentError);
      }

      res.status(200).json({
        ...data,
        item_details: itemDetails
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

// POST /api/favorites - Create new favorite
router.post('/', 
  validateBody(favoriteSchema.create), 
  async (req, res) => {
    try {
      const favoriteData = req.body;

      // Verify that the referenced item exists
      let itemExists = false;
      
      switch (favoriteData.item_type) {
        case 'course':
          const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('id', favoriteData.item_id)
            .single();
          itemExists = !!course;
          break;
          
        case 'module':
          const { data: module } = await supabase
            .from('modules')
            .select('id')
            .eq('id', favoriteData.item_id)
            .single();
          itemExists = !!module;
          break;
          
        case 'lesson':
          const { data: lesson } = await supabase
            .from('lessons')
            .select('id')
            .eq('id', favoriteData.item_id)
            .single();
          itemExists = !!lesson;
          break;
      }

      if (!itemExists) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Referenced ${favoriteData.item_type} does not exist`,
          field: 'item_id'
        });
      }

      // Check if favorite already exists for this user-item combination
      const { data: existingFavorite } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', favoriteData.user_id)
        .eq('item_type', favoriteData.item_type)
        .eq('item_id', favoriteData.item_id)
        .single();

      if (existingFavorite) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Favorite already exists for this user and item',
          existing_id: existingFavorite.id
        });
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert(favoriteData)
        .select(`
          id,
          user_id,
          item_type,
          item_id,
        `)
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create favorite'
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

// PUT /api/favorites/:id - Update favorite (limited use case)
router.put('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(favoriteSchema.update), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If updating item reference, verify the new item exists
      if (updateData.item_type && updateData.item_id) {
        let itemExists = false;
        
        switch (updateData.item_type) {
          case 'course':
            const { data: course } = await supabase
              .from('courses')
              .select('id')
              .eq('id', updateData.item_id)
              .single();
            itemExists = !!course;
            break;
            
          case 'module':
            const { data: module } = await supabase
              .from('modules')
              .select('id')
              .eq('id', updateData.item_id)
              .single();
            itemExists = !!module;
            break;
            
          case 'lesson':
            const { data: lesson } = await supabase
              .from('lessons')
              .select('id')
              .eq('id', updateData.item_id)
              .single();
            itemExists = !!lesson;
            break;
        }

        if (!itemExists) {
          return res.status(400).json({
            error: 'Bad Request',
            message: `Referenced ${updateData.item_type} does not exist`,
            field: 'item_id'
          });
        }
      }

      const { data, error } = await supabase
        .from('favorites')
        .update(updateData)
        .eq('id', id)
        .select(`
          id,
          user_id,
          item_type,
          item_id,
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Favorite with id ${id} not found`
          });
        }
        
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update favorite'
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

// DELETE /api/favorites/:id - Delete favorite
router.delete('/:id', 
  validateParams(Joi.object({ id: paramValidation.id })), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete favorite'
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

// DELETE /api/favorites/user/:user_id/item/:item_type/:item_id - Delete favorite by user and item
router.delete('/user/:user_id/item/:item_type/:item_id', 
  validateParams(Joi.object({ 
    user_id: paramValidation.uuid,
    item_type: Joi.string().valid('course', 'module', 'lesson').required(),
    item_id: paramValidation.id
  })), 
  async (req, res) => {
    try {
      const { user_id, item_type, item_id } = req.params;

      const { data, error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user_id)
        .eq('item_type', item_type)
        .eq('item_id', item_id)
        .select('id');

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete favorite'
        });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Favorite not found for this user and item combination'
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

// GET /api/favorites/user/:user_id - Get all favorites for a user
router.get('/user/:user_id', 
  validateParams(Joi.object({ user_id: paramValidation.uuid })),
  validateQuery(Joi.object({
    ...queryValidation,
    item_type: Joi.string().valid('course', 'module', 'lesson')
  })), 
  async (req, res) => {
    try {
      const { user_id } = req.params;
      const { limit, offset, order_by, order_direction, item_type } = req.query;

      let query = supabase
        .from('favorites')
        .select(`
          id,
          user_id,
          item_type,
          item_id,
        `)
        .eq('user_id', user_id)
        .order(order_by === 'item_type' ? 'item_type' : 'id', { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);

      if (item_type) {
        query = query.eq('item_type', item_type);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to fetch user favorites'
        });
      }

      // Enrich data with item details
      const enrichedData = await Promise.all(data.map(async (favorite) => {
        let itemDetails = null;
        
        try {
          switch (favorite.item_type) {
            case 'course':
              const { data: course } = await supabase
                .from('courses')
                .select('id, title, slug, cover_images')
                .eq('id', favorite.item_id)
                .single();
              itemDetails = course;
              break;
              
            case 'module':
              const { data: module } = await supabase
                .from('modules')
                .select(`
                  id, 
                  title, 
                  course_id,
                  courses (id, title, slug)
                `)
                .eq('id', favorite.item_id)
                .single();
              itemDetails = module;
              break;
              
            case 'lesson':
              const { data: lesson } = await supabase
                .from('lessons')
                .select(`
                  id, 
                  title, 
                  module_id,
                  modules (
                    id, 
                    title,
                    course_id,
                    courses (id, title, slug)
                  )
                `)
                .eq('id', favorite.item_id)
                .single();
              itemDetails = lesson;
              break;
          }
        } catch (enrichmentError) {
          console.warn(`Failed to enrich ${favorite.item_type} ${favorite.item_id}:`, enrichmentError);
        }
        
        return {
          ...favorite,
          item_details: itemDetails
        };
      }));

      res.status(200).json({
        data: enrichedData,
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