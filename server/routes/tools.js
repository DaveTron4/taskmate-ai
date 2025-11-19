import { composio, DEFAULT_EXTERNAL_USER_ID } from "../services/mcp.js";
import { getComposioExternalUserId } from "./auth.js";
import { config } from "../config/index.js";
import { pool } from "../config/database.js";

export const getToolsCount = async (req, res) => {
  try {
    let externalUserId;
    if (req.user && req.user.user_id) {
      externalUserId = await getComposioExternalUserId(req.user.user_id);
    } else {
      externalUserId = req.query.userId || DEFAULT_EXTERNAL_USER_ID;
    }

    const gmailTools = await composio.tools.get(externalUserId, {
      toolkits: ["GMAIL"],
    });

    let canvasTools = [];
    try {
      canvasTools = await composio.tools.get(externalUserId, {
        toolkits: ["CANVAS"],
      });
    } catch (err) {
      console.error(
        "Error loading Canvas tools (ignored for now):",
        err.message
      );
    }

    const allTools = [...gmailTools, ...canvasTools];

    res.json({
      ok: true,
      toolCounts: {
        gmail: gmailTools.length,
        canvas: canvasTools.length,
        total: allTools.length,
        combined: gmailTools.length + canvasTools.length,
      },
      tools: {
        gmail: gmailTools.map((tool) => tool.name),
        canvas: canvasTools.map((tool) => tool.name),
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};

export const searchTools = async (req, res) => {
  try {
    const { query, toolkit = "GMAIL", limit = 10 } = req.query;
    let externalUserId;
    if (req.user && req.user.user_id) {
      externalUserId = await getComposioExternalUserId(req.user.user_id);
    } else {
      externalUserId = req.query.userId || DEFAULT_EXTERNAL_USER_ID;
    }

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: "Query parameter is required",
        example: "/api/tools/search?query=send%20email&toolkit=GMAIL&limit=5",
      });
    }

    const tools = await composio.tools.get(externalUserId, {
      search: query,
      toolkits: [toolkit.toUpperCase()],
      limit: parseInt(limit),
    });

    res.json({
      ok: true,
      query,
      toolkit,
      toolCount: tools.length,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};

export const searchCanvasTools = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    let externalUserId;
    if (req.user && req.user.user_id) {
      externalUserId = await getComposioExternalUserId(req.user.user_id);
    } else {
      externalUserId = req.query.userId || DEFAULT_EXTERNAL_USER_ID;
    }

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: "Query parameter is required",
        example: "/api/tools/canvas/search?query=assignment&limit=5",
      });
    }

    let tools = [];
    try {
      tools = await composio.tools.get(externalUserId, {
        search: query,
        toolkits: ["CANVAS"],
        limit: parseInt(limit),
      });
    } catch (err) {
      console.error("Error searching Canvas tools:", err.message);
      return res.status(500).json({
        ok: false,
        error:
          "Canvas toolkit schema is currently inconsistent. Try again after upgrading Composio.",
      });
    }

    res.json({
      ok: true,
      query,
      toolCount: tools.length,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};

export const getCalendarEvents = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const externalUserId = await getComposioExternalUserId(req.user.user_id);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const timeMin = weekStart.toISOString();
    const timeMax = weekEnd.toISOString();

    const calendarTools = await composio.tools.get(externalUserId, {
      toolkits: ["GOOGLECALENDAR"],
      limit: 100,
    });

    console.log(`Found ${calendarTools.length} Google Calendar tools`);
    if (calendarTools.length > 0) {
      console.log(
        "Available tools:",
        calendarTools.map((t) => t.name).slice(0, 10)
      );
    }

    let listEventsTool = calendarTools.find(
      (tool) =>
        tool.name === "GOOGLECALENDAR_FIND_EVENT" ||
        tool.name === "GOOGLECALENDAR_LIST_EVENTS" ||
        tool.name === "GOOGLECALENDAR_EVENTS_LIST" ||
        tool.name === "GOOGLECALENDAR_LISTCALENDAREVENTS"
    );

    if (!listEventsTool) {
      console.log("Tool not found in first batch, searching...");
      const searchResults = await composio.tools.get(externalUserId, {
        toolkits: ["GOOGLECALENDAR"],
        search: "list events",
        limit: 50,
      });
      listEventsTool = searchResults.find(
        (tool) =>
          tool.name === "GOOGLECALENDAR_FIND_EVENT" ||
          tool.name === "GOOGLECALENDAR_LIST_EVENTS" ||
          tool.name === "GOOGLECALENDAR_EVENTS_LIST" ||
          (tool.name.toLowerCase().includes("find") &&
            tool.name.toLowerCase().includes("event")) ||
          (tool.name.toLowerCase().includes("list") &&
            tool.name.toLowerCase().includes("event"))
      );
    }

    if (!listEventsTool) {
      listEventsTool = calendarTools.find(
        (tool) =>
          (tool.name.toLowerCase().includes("find") &&
            tool.name.toLowerCase().includes("event")) ||
          (tool.name.toLowerCase().includes("list") &&
            tool.name.toLowerCase().includes("event"))
      );
    }

    if (!listEventsTool) {
      console.log(
        "List events tool not found. Available tools:",
        calendarTools.map((t) => t.name)
      );
      return res.json({
        ok: true,
        events: [],
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        message: "Calendar tool not found",
      });
    }

    console.log(`Using tool: ${listEventsTool.name}`);
    console.log(`Fetching events from ${timeMin} to ${timeMax}`);

    let result;
    try {
      result = await composio.tools.execute(listEventsTool.name, {
        userId: externalUserId,
        arguments: {
          calendarId: "primary",
          timeMin,
          timeMax,
          maxResults: 250,
          singleEvents: true,
          orderBy: "startTime",
        },
      });
      console.log(
        "Tool execution result:",
        JSON.stringify(result, null, 2).substring(0, 500)
      );
    } catch (executeError) {
      console.error("Tool execution error:", executeError);
      console.error("Tool execution error details:", {
        message: executeError.message,
        stack: executeError.stack,
        toolName: listEventsTool.name,
      });
      throw executeError;
    }

    let items = [];
    if (result?.data?.items) {
      items = result.data.items;
    } else if (result?.items) {
      items = result.items;
    } else if (Array.isArray(result)) {
      items = result;
    } else if (result?.data && Array.isArray(result.data)) {
      items = result.data;
    }

    const events = items.map((event) => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;

      return {
        id: event.id,
        title: event.summary || "No Title",
        start,
        end,
        allDay: !event.start?.dateTime,
      };
    });

    res.json({
      ok: true,
      events,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
  } catch (e) {
    console.error("Error fetching calendar events:", e);
    console.error("Error stack:", e.stack);
    console.error("Error details:", {
      message: e.message,
      name: e.name,
      userId: req.user?.user_id,
    });
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};

export const getCanvasAssignments = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const externalUserId = await getComposioExternalUserId(req.user.user_id);

    // Compute this week (Mon–Sun)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    // 🔹 1) List courses directly, no tools.get on CANVAS
    const coursesResult = await composio.tools.execute("CANVAS_LIST_COURSES", {
      userId: externalUserId,
      arguments: {
        enrollment_state: "active", // can tweak if needed
        per_page: 100,
      },
    });

    console.log(
      "[Canvas] Raw CANVAS_LIST_COURSES result:",
      JSON.stringify(coursesResult, null, 2).substring(0, 2000)
    );

    if (coursesResult?.error || coursesResult?.data?.error) {
      console.error(
        "[Canvas] Error from CANVAS_LIST_COURSES:",
        coursesResult.error || coursesResult.data.error
      );
      return res.json({
        ok: true,
        assignments: [],
        message:
          "Canvas returned an error while listing courses. Check your Canvas connection in Composio.",
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      });
    }

    let courses = [];
    // main branch: your data lives at data.response_data
    if (Array.isArray(coursesResult?.data?.response_data)) {
      courses = coursesResult.data.response_data;
    } else if (Array.isArray(coursesResult?.data)) {
      courses = coursesResult.data;
    } else if (Array.isArray(coursesResult)) {
      courses = coursesResult;
    } else if (
      coursesResult?.data?.data &&
      Array.isArray(coursesResult.data.data)
    ) {
      courses = coursesResult.data.data;
    } else if (
      coursesResult?.data?.courses &&
      Array.isArray(coursesResult.data.courses)
    ) {
      courses = coursesResult.data.courses;
    }

    console.log(
      `[Canvas] Found ${courses.length} courses for user ${externalUserId}`
    );

    const allAssignments = [];

    // 🔹 2) For each course, get assignments via CANVAS_GET_ALL_ASSIGNMENTS
    for (const course of courses) {
      const courseId = course.id ?? course.course_id;
      if (!courseId) continue;

      try {
        const assignmentsResult = await composio.tools.execute(
          "CANVAS_GET_ALL_ASSIGNMENTS",
          {
            userId: externalUserId,
            arguments: {
              // send both variants to be safe with the tool schema
              courseId: Number(courseId),
              course_id: Number(courseId),
              per_page: 100,
            },
          }
        );

        let assignments = [];
        // 🔴 key fix: also check data.response_data for assignments
        if (Array.isArray(assignmentsResult?.data?.response_data)) {
          assignments = assignmentsResult.data.response_data;
        } else if (Array.isArray(assignmentsResult?.data)) {
          assignments = assignmentsResult.data;
        } else if (
          assignmentsResult?.data?.data &&
          Array.isArray(assignmentsResult.data.data)
        ) {
          assignments = assignmentsResult.data.data;
        } else if (Array.isArray(assignmentsResult)) {
          assignments = assignmentsResult;
        }

        console.log(
          `[Canvas] Course ${courseId} (${
            course.name || course.course_name || "Unnamed"
          }) assignments fetched: ${assignments.length}`
        );

        for (const assignment of assignments) {
          const dueDate = assignment.due_at || assignment.due_date;
          if (!dueDate) continue;

          const due = new Date(dueDate);
          if (due >= weekStart && due <= weekEnd) {
            // Get assignment URL - prefer html_url, otherwise construct it
            let assignmentUrl = assignment.html_url || assignment.url;
            if (
              !assignmentUrl &&
              config.CANVAS_BASE_URL &&
              courseId &&
              assignment.id
            ) {
              // Construct URL: baseUrl/courses/courseId/assignments/assignmentId
              const baseUrl = config.CANVAS_BASE_URL.replace(/\/$/, "");
              assignmentUrl = `${baseUrl}/courses/${courseId}/assignments/${assignment.id}`;
            }

            allAssignments.push({
              id: assignment.id,
              name:
                assignment.name || assignment.title || "Untitled Assignment",
              courseName: course.name || course.course_name || "Unknown Course",
              dueDate,
              points: assignment.points_possible ?? null,
              submitted: assignment.submission?.submitted_at ?? null,
              url: assignmentUrl || null,
            });
          }
        }
      } catch (error) {
        console.error(
          `[Canvas] Error fetching assignments for course ${courseId}:`,
          error?.message || error
        );
      }
    }

    // Sort by due date ascending
    allAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Fetch user's assignment metadata
    const assignmentIds = allAssignments.map((a) => String(a.id));
    let metadataMap = {};
    if (assignmentIds.length > 0) {
      const metadataResult = await pool.query(
        `SELECT assignment_id, priority, estimated_hours, status 
         FROM assignment_metadata 
         WHERE user_id = $1 AND assignment_id = ANY($2::text[])`,
        [req.user.user_id, assignmentIds]
      );
      metadataResult.rows.forEach((row) => {
        metadataMap[row.assignment_id] = {
          priority: row.priority || "medium",
          estimatedHours: row.estimated_hours
            ? parseFloat(row.estimated_hours)
            : null,
          status: row.status || "not_started",
        };
      });
    }

    // Merge metadata into assignments
    const assignmentsWithMetadata = allAssignments.map((assignment) => {
      const metadata = metadataMap[String(assignment.id)] || {
        priority: "medium",
        estimatedHours: null,
        status: "not_started",
      };
      return {
        ...assignment,
        priority: metadata.priority,
        estimatedHours: metadata.estimatedHours,
        status: metadata.status,
      };
    });

    console.log(
      `[Canvas] Total assignments this week: ${allAssignments.length}`
    );

    res.json({
      ok: true,
      assignments: assignmentsWithMetadata,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
  } catch (e) {
    console.error("Error fetching Canvas assignments:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};

export const updateAssignmentMetadata = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const assignmentId = req.params.assignmentId;
    const { priority, estimatedHours, status } = req.body;

    if (!assignmentId) {
      return res
        .status(400)
        .json({ ok: false, error: "assignmentId is required" });
    }

    if (priority && !["low", "medium", "high"].includes(priority)) {
      return res
        .status(400)
        .json({ ok: false, error: "priority must be low, medium, or high" });
    }

    if (status && !["not_started", "in_progress", "done"].includes(status)) {
      return res.status(400).json({
        ok: false,
        error: "status must be not_started, in_progress, or done",
      });
    }

    if (estimatedHours !== null && estimatedHours !== undefined) {
      const hours = parseFloat(estimatedHours);
      if (isNaN(hours) || hours < 0) {
        return res.status(400).json({
          ok: false,
          error: "estimatedHours must be a positive number",
        });
      }
    }

    await pool.query(
      `INSERT INTO assignment_metadata (user_id, assignment_id, priority, estimated_hours, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id, assignment_id)
       DO UPDATE SET
         priority = COALESCE(EXCLUDED.priority, assignment_metadata.priority),
         estimated_hours = COALESCE(EXCLUDED.estimated_hours, assignment_metadata.estimated_hours),
         status = COALESCE(EXCLUDED.status, assignment_metadata.status),
         updated_at = now()`,
      [
        req.user.user_id,
        String(assignmentId),
        priority || null,
        estimatedHours !== null && estimatedHours !== undefined
          ? parseFloat(estimatedHours)
          : null,
        status || null,
      ]
    );

    res.json({ ok: true, message: "Assignment metadata updated" });
  } catch (e) {
    console.error("Error updating assignment metadata:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};
