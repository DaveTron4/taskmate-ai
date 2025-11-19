import { pool } from "../config/database.js";
import { composio } from "../services/mcp.js";
import { getComposioExternalUserId } from "../routes/auth.js";

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, dueTime, category, priority, hasNoDueDate } = req.body;
    
    // Get user ID from session
    const userId = req.user?.user_id || 1; // Default to 1 for testing
    
    // Validate required fields
    if (!title || !category || !priority) {
      return res.status(400).json({
        ok: false,
        error: "Title, category, and priority are required"
      });
    }
    
    // Combine date and time if provided
    let dueDateTime = null;
    if (!hasNoDueDate && dueDate) {
      if (dueTime) {
        dueDateTime = `${dueDate} ${dueTime}`;
      } else {
        dueDateTime = `${dueDate} 23:59:59`;
      }
    }
    
    // Insert task into database
    const result = await pool.query(
      `INSERT INTO tasks (user_id, category, title, description, due_date, due_time, priority, has_no_due_date, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual')
       RETURNING *`,
      [userId, category, title, description, dueDateTime, dueTime, priority, hasNoDueDate]
    );
    
    const task = result.rows[0];
    
    // Optionally sync to Google Calendar if user has Google Calendar connected
    let googleEventId = null;
    if (!hasNoDueDate && dueDate) {
      try {
        const externalUserId = await getComposioExternalUserId(userId);
        
        // Create event in Google Calendar
        const response = await composio.tools.execute("GOOGLECALENDAR_CREATE_EVENT", {
          userId: externalUserId,
          arguments: {
            calendarId: "primary",
            summary: title,
            description: description || '',
            start: {
              dateTime: dueDateTime,
              timeZone: 'America/New_York',
            },
            end: {
              dateTime: dueDateTime,
              timeZone: 'America/New_York',
            },
          },
        });
        
        if (response?.data?.id) {
          googleEventId = response.data.id;
          
          // Update task with Google event ID
          await pool.query(
            `UPDATE tasks SET synced_to_google = true, google_event_id = $1 WHERE task_id = $2`,
            [googleEventId, task.task_id]
          );
        }
      } catch (syncError) {
        console.error("Error syncing to Google Calendar:", syncError);
        // Don't fail the entire request if sync fails
      }
    }
    
    res.json({
      ok: true,
      task: {
        ...task,
        google_event_id: googleEventId,
        synced_to_google: !!googleEventId,
      }
    });
  } catch (e) {
    console.error("Error creating task:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};

// Get all tasks for a user
export const getTasks = async (req, res) => {
  try {
    const userId = req.user?.user_id || 1; // Default to 1 for testing
    
    const result = await pool.query(
      `SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC NULLS LAST`,
      [userId]
    );
    
    res.json({
      ok: true,
      tasks: result.rows,
    });
  } catch (e) {
    console.error("Error fetching tasks:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};

// Get a single task by ID
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.user_id || 1;
    
    const result = await pool.query(
      `SELECT * FROM tasks WHERE task_id = $1 AND user_id = $2`,
      [taskId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Task not found"
      });
    }
    
    res.json({
      ok: true,
      task: result.rows[0],
    });
  } catch (e) {
    console.error("Error fetching task:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, dueDate, dueTime, category, priority, hasNoDueDate, status } = req.body;
    const userId = req.user?.user_id || 1;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (hasNoDueDate !== undefined) {
      updates.push(`has_no_due_date = $${paramCount++}`);
      values.push(hasNoDueDate);
    }
    if (dueDate !== undefined) {
      const dueDateTime = dueTime ? `${dueDate} ${dueTime}` : `${dueDate} 23:59:59`;
      updates.push(`due_date = $${paramCount++}`);
      values.push(dueDateTime);
    }
    if (dueTime !== undefined) {
      updates.push(`due_time = $${paramCount++}`);
      values.push(dueTime);
    }
    
    updates.push(`updated_at = now()`);
    
    values.push(taskId, userId);
    
    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE task_id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Task not found"
      });
    }
    
    res.json({
      ok: true,
      task: result.rows[0]
    });
  } catch (e) {
    console.error("Error updating task:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.user_id || 1;
    
    // Get task to check if it has Google event ID
    const taskResult = await pool.query(
      `SELECT google_event_id FROM tasks WHERE task_id = $1 AND user_id = $2`,
      [taskId, userId]
    );
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Task not found"
      });
    }
    
    const googleEventId = taskResult.rows[0].google_event_id;
    
    // Delete from Google Calendar if synced
    if (googleEventId) {
      try {
        const externalUserId = await getComposioExternalUserId(userId);
        await composio.tools.execute(
          externalUserId,
          "GOOGLECALENDAR_DELETE_EVENT",
          { eventId: googleEventId },
          "default"
        );
      } catch (syncError) {
        console.error("Error deleting from Google Calendar:", syncError);
      }
    }
    
    // Delete from database
    await pool.query(
      `DELETE FROM tasks WHERE task_id = $1 AND user_id = $2`,
      [taskId, userId]
    );
    
    res.json({
      ok: true,
      message: "Task deleted successfully"
    });
  } catch (e) {
    console.error("Error deleting task:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};
