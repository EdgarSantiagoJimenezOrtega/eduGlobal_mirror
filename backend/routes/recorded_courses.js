const express = require('express');
const router = express.Router();
const { getPool } = require('../config/mysql');
const Joi = require('joi');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');

// Validation schemas
const recordedCourseSchema = {
  update: Joi.object({
    title: Joi.string().min(1).max(255).trim(),
    description: Joi.string().allow('').trim(),
    video_embeded_code: Joi.string().allow('').trim(),
    recorded_at: Joi.date().iso()
  }).min(1)
};

const paramValidation = {
  id: Joi.number().integer().positive().required()
};

const queryValidation = {
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  search: Joi.string().max(255).trim(),
  educator_id: Joi.number().integer().positive()
};

// GET /api/recorded-courses - List all recorded courses
router.get('/',
  validateQuery(Joi.object(queryValidation)),
  async (req, res) => {
    try {
      const { limit, offset, search, educator_id } = req.query;
      const pool = getPool();

      // Build WHERE conditions
      let whereConditions = [];
      let queryParams = [];

      if (search) {
        whereConditions.push('(crs.title LIKE ? OR crs.description LIKE ? OR u.name LIKE ?)');
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (educator_id) {
        whereConditions.push('u.id = ?');
        queryParams.push(educator_id);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM classroom_recorded_sessions crs
        LEFT JOIN classrooms c ON c.id = crs.classroom_id
        LEFT JOIN users u ON u.id = c.user_id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Get paginated data
      const dataQuery = `
        SELECT
          crs.id,
          crs.classroom_id,
          crs.title,
          crs.description,
          crs.video_embeded_code,
          crs.recorded_at,
          crs.created_at,
          crs.updated_at,
          c.title as classroom_name,
          u.name as educator_name,
          u.id as educator_id,
          cat.title as category_name
        FROM classroom_recorded_sessions crs
        LEFT JOIN classrooms c ON c.id = crs.classroom_id
        LEFT JOIN users u ON u.id = c.user_id
        LEFT JOIN categories cat ON cat.id = c.category_id
        ${whereClause}
        ORDER BY crs.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams.push(limit, offset);
      const [rows] = await pool.query(dataQuery, queryParams);

      res.status(200).json({
        data: rows,
        pagination: {
          total,
          limit,
          offset,
          has_more: total > offset + limit
        }
      });
    } catch (error) {
      console.error('MySQL error:', error);
      res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch recorded courses'
      });
    }
  }
);

// GET /api/recorded-courses/:id - Get single recorded course
router.get('/:id',
  validateParams(Joi.object({ id: paramValidation.id })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const pool = getPool();

      const query = `
        SELECT
          crs.id,
          crs.classroom_id,
          crs.title,
          crs.description,
          crs.video_embeded_code,
          crs.recorded_at,
          crs.created_at,
          crs.updated_at,
          c.title as classroom_name,
          u.name as educator_name,
          u.id as educator_id,
          cat.title as category_name
        FROM classroom_recorded_sessions crs
        LEFT JOIN classrooms c ON c.id = crs.classroom_id
        LEFT JOIN users u ON u.id = c.user_id
        LEFT JOIN categories cat ON cat.id = c.category_id
        WHERE crs.id = ?
      `;

      const [rows] = await pool.query(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Recorded course with id ${id} not found`
        });
      }

      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('MySQL error:', error);
      res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch recorded course'
      });
    }
  }
);

// PUT /api/recorded-courses/:id - Update recorded course
router.put('/:id',
  validateParams(Joi.object({ id: paramValidation.id })),
  validateBody(recordedCourseSchema.update),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const pool = getPool();

      console.log('📝 PUT /api/recorded-courses/:id - Updating recorded course:', id);
      console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

      // Check if course exists
      const [existing] = await pool.query(
        'SELECT id FROM classroom_recorded_sessions WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Recorded course with id ${id} not found`
        });
      }

      // Build UPDATE query dynamically
      const fields = [];
      const values = [];

      if (updateData.title !== undefined) {
        fields.push('title = ?');
        values.push(updateData.title);
      }
      if (updateData.description !== undefined) {
        fields.push('description = ?');
        values.push(updateData.description);
      }
      if (updateData.video_embeded_code !== undefined) {
        fields.push('video_embeded_code = ?');
        values.push(updateData.video_embeded_code);
      }
      if (updateData.recorded_at !== undefined) {
        fields.push('recorded_at = ?');
        values.push(updateData.recorded_at);
      }

      fields.push('updated_at = NOW()');
      values.push(id);

      const updateQuery = `
        UPDATE classroom_recorded_sessions
        SET ${fields.join(', ')}
        WHERE id = ?
      `;

      await pool.query(updateQuery, values);

      // Fetch updated course
      const [rows] = await pool.query(`
        SELECT
          crs.id,
          crs.classroom_id,
          crs.title,
          crs.description,
          crs.video_embeded_code,
          crs.recorded_at,
          crs.created_at,
          crs.updated_at,
          c.title as classroom_name,
          u.name as educator_name,
          u.id as educator_id,
          cat.title as category_name
        FROM classroom_recorded_sessions crs
        LEFT JOIN classrooms c ON c.id = crs.classroom_id
        LEFT JOIN users u ON u.id = c.user_id
        LEFT JOIN categories cat ON cat.id = c.category_id
        WHERE crs.id = ?
      `, [id]);

      console.log('✅ Recorded course updated successfully:', id);
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('MySQL error:', error);
      res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update recorded course'
      });
    }
  }
);

// DELETE /api/recorded-courses/:id - Delete recorded course
router.delete('/:id',
  validateParams(Joi.object({ id: paramValidation.id })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const pool = getPool();

      console.log(`🗑️ Deleting recorded course ${id}`);

      // Check if course exists
      const [existing] = await pool.query(
        'SELECT id FROM classroom_recorded_sessions WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Recorded course with id ${id} not found`
        });
      }

      await pool.query('DELETE FROM classroom_recorded_sessions WHERE id = ?', [id]);

      console.log(`✅ Recorded course ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      console.error('MySQL error:', error);
      res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete recorded course'
      });
    }
  }
);

module.exports = router;
