import {
  composio,
  DEFAULT_EXTERNAL_USER_ID,
  anthropic,
} from "../services/mcp.js";
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

    // Helper function to categorize events
    const categorizeEvent = (title) => {
      const lowerTitle = (title || "").toLowerCase();

      // School-related keywords
      if (
        lowerTitle.match(
          /\b(class|lecture|exam|quiz|homework|assignment|study|school|university|college|cs\s|math|physics|chemistry|biology|lab|seminar|tutorial|project|presentation|essay)\b/
        )
      ) {
        return "school"; // Purple
      }

      // Work-related keywords
      if (
        lowerTitle.match(
          /\b(work|meeting|shift|standup|scrum|sprint|client|deadline|conference|interview|office|team|project meeting|1:1|one-on-one|sync)\b/
        )
      ) {
        return "work"; // Cyan
      }

      // Default to personal
      return "personal"; // Orange
    };

    const events = items.map((event) => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      const title = event.summary || "No Title";

      return {
        id: event.id,
        title,
        start,
        end,
        allDay: !event.start?.dateTime,
        category: categorizeEvent(title),
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

    // Get current date for filtering out past assignments
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

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
          // Only show assignments due today or in the future
          if (due >= now) {
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
              category: "school", // All Canvas assignments are school-related
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
      `[Canvas] Total upcoming assignments: ${allAssignments.length}`
    );

    res.json({
      ok: true,
      assignments: assignmentsWithMetadata,
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

// Get Gmail sent emails with AI analysis
export const getGmailEmails = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const externalUserId = await getComposioExternalUserId(req.user.user_id);

    // Get Gmail tools
    const gmailTools = await composio.tools.get(externalUserId, {
      toolkits: ["GMAIL"],
      limit: 100,
    });

    // Find the list messages tool
    let listMessagesTool = gmailTools.find(
      (tool) =>
        tool.name === "GMAIL_LIST_MESSAGES" ||
        tool.name === "GMAIL_LIST_SENT_MESSAGES" ||
        (tool.name.toLowerCase().includes("list") &&
          tool.name.toLowerCase().includes("message"))
    );

    if (!listMessagesTool) {
      // Search for it
      const searchResults = await composio.tools.get(externalUserId, {
        toolkits: ["GMAIL"],
        search: "list sent messages",
        limit: 50,
      });
      listMessagesTool = searchResults.find(
        (tool) =>
          tool.name === "GMAIL_LIST_MESSAGES" ||
          tool.name === "GMAIL_LIST_SENT_MESSAGES" ||
          (tool.name.toLowerCase().includes("list") &&
            tool.name.toLowerCase().includes("message"))
      );
    }

    if (!listMessagesTool) {
      return res.json({
        ok: true,
        emails: [],
        message: "Gmail list messages tool not found",
      });
    }

    // Fetch sent messages (last 10)
    let messagesResult;
    try {
      messagesResult = await composio.tools.execute(listMessagesTool.name, {
        userId: externalUserId,
        arguments: {
          query: "in:sent",
          maxResults: 10,
        },
      });
    } catch (executeError) {
      console.error("Error executing Gmail list messages:", executeError);
      // Try alternative approach - get messages directly
      try {
        messagesResult = await composio.tools.execute("GMAIL_LIST_MESSAGES", {
          userId: externalUserId,
          arguments: {
            query: "in:sent",
            maxResults: 10,
          },
        });
      } catch (altError) {
        console.error("Alternative Gmail fetch also failed:", altError);
        return res.json({
          ok: true,
          emails: [],
          message: "Could not fetch Gmail messages",
        });
      }
    }

    // Extract messages from result
    let messages = [];
    if (messagesResult?.data?.messages) {
      messages = messagesResult.data.messages;
    } else if (messagesResult?.messages) {
      messages = messagesResult.messages;
    } else if (Array.isArray(messagesResult)) {
      messages = messagesResult;
    } else if (messagesResult?.data && Array.isArray(messagesResult.data)) {
      messages = messagesResult.data;
    }

    if (messages.length === 0) {
      return res.json({
        ok: true,
        emails: [],
        message: "No sent emails found",
      });
    }

    // Get full message details for each message
    const emailPromises = messages.slice(0, 10).map(async (message) => {
      try {
        // Get the get message tool
        let getMessageTool = gmailTools.find(
          (tool) =>
            tool.name === "GMAIL_GET_MESSAGE" ||
            tool.name === "GMAIL_READ_MESSAGE" ||
            (tool.name.toLowerCase().includes("get") &&
              tool.name.toLowerCase().includes("message"))
        );

        if (!getMessageTool) {
          const searchResults = await composio.tools.get(externalUserId, {
            toolkits: ["GMAIL"],
            search: "get message",
            limit: 20,
          });
          getMessageTool = searchResults.find(
            (tool) =>
              tool.name === "GMAIL_GET_MESSAGE" ||
              tool.name === "GMAIL_READ_MESSAGE"
          );
        }

        if (!getMessageTool) {
          return null;
        }

        const messageId = message.id || message.messageId || message.message_id;
        if (!messageId) return null;

        const messageResult = await composio.tools.execute(
          getMessageTool.name,
          {
            userId: externalUserId,
            arguments: {
              messageId: messageId,
              format: "full",
            },
          }
        );

        // Extract message data
        const messageData =
          messageResult?.data || messageResult?.payload || messageResult;
        const headers = messageData?.headers || [];
        const getHeader = (name) => {
          const header = headers.find((h) => h.name === name);
          return header?.value || "";
        };

        const subject = getHeader("Subject") || "No Subject";
        const to = getHeader("To") || "Unknown";
        const date = getHeader("Date") || new Date().toISOString();
        const body =
          messageData?.body?.data ||
          messageData?.snippet ||
          messageData?.body?.textPlain ||
          "";

        // Use Claude to analyze the email
        const analysisPrompt = `Analyze this email and provide:
1. A brief summary (2-3 sentences max)
2. Priority level: "important" or "normal"
3. Category: "Academic", "Career", "Personal", or "Other"

Email details:
Subject: ${subject}
To: ${to}
Body: ${body.substring(0, 1000)}

Respond in JSON format:
{
  "summary": "brief summary here",
  "priority": "important" or "normal",
  "category": "Academic" or "Career" or "Personal" or "Other"
}`;

        let analysis = {
          summary: body.substring(0, 150) + "...",
          priority: "normal",
          category: "Other",
        };

        try {
          const claudeResponse = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: analysisPrompt,
              },
            ],
          });

          const content = claudeResponse.content[0];
          if (content.type === "text") {
            const text = content.text;
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0]);
            }
          }
        } catch (claudeError) {
          console.error("Error analyzing email with Claude:", claudeError);
          // Use fallback analysis
        }

        // Format timestamp
        const emailDate = new Date(date);
        const now = new Date();
        const diffMs = now - emailDate;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let timestamp = "";
        if (diffHours < 1) {
          timestamp = "Just now";
        } else if (diffHours < 24) {
          timestamp = `${diffHours}h ago`;
        } else if (diffDays === 1) {
          timestamp = "1d ago";
        } else if (diffDays < 7) {
          timestamp = `${diffDays}d ago`;
        } else {
          timestamp = emailDate.toLocaleDateString();
        }

        return {
          id: messageId,
          sender: to.split(",")[0].trim(), // First recipient
          subject: subject,
          summary: analysis.summary,
          timestamp: timestamp,
          priority: analysis.priority,
          category: analysis.category,
        };
      } catch (error) {
        console.error("Error processing email:", error);
        return null;
      }
    });

    const emails = (await Promise.all(emailPromises)).filter(
      (email) => email !== null
    );

    res.json({
      ok: true,
      emails: emails,
    });
  } catch (e) {
    console.error("Error fetching Gmail emails:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
      message: e.message,
    });
  }
};
