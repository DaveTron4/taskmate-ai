import express from "express";
import passport from "passport";
import { AuthScheme } from "@composio/core";
import { composio, DEFAULT_EXTERNAL_USER_ID } from "../services/mcp.js";
import { config } from "../config/index.js";
import { pool } from "../config/database.js";

const router = express.Router();

router.get("/login/success", (req, res) => {
  if (req.user) {
    res.status(200).json({ success: true, user: req.user });
  } else {
    res.status(200).json({ success: false, user: null });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({ success: true, message: "failure" });
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(error);
    }

    req.session.destroy((err) => {
      res.clearCookie("connect.sid");

      res.json({ status: "logout", user: {} });
    });
  });
});

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["read:user"],
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    successRedirect: "https://taskmate-ai-mauve.vercel.app/composio",
    failureRedirect: "https://taskmate-ai-mauve.vercel.app/login",
  })
);

export default router;

export const requireAuth = (req, res, next) => {
  if (req.user && req.user.user_id) {
    return next();
  }
  return res.status(401).json({ ok: false, error: "Authentication required" });
};

export const getComposioExternalUserId = async (userId) => {
  return `user_${userId}`;
};

export const startGmailAuth = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const externalUserId = await getComposioExternalUserId(req.user.user_id);
    const baseCallbackUrl =
      config.GMAIL_LINK_CALLBACK_URL_GMAIL ||
      `https://taskmate-ai-ef8u.onrender.com/api/auth/gmail/callback`;
    const callbackUrl = `${baseCallbackUrl}?external_user_id=${encodeURIComponent(
      externalUserId
    )}`;

    const r = await composio.connectedAccounts.link(
      externalUserId,
      config.GMAIL_AUTH_CONFIG_ID,
      { callbackUrl }
    );
    const url = r.linkUrl || r.redirectUrl;
    if (!url)
      return res.status(500).json({ ok: false, error: "Missing linkUrl" });
    res.json({ ok: true, url });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};

export const startCanvasAuth = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const externalUserId = await getComposioExternalUserId(req.user.user_id);
    const apiKey = req.body.apiKey || config.CANVAS_API_KEY;
    const baseUrl = req.body.baseUrl || config.CANVAS_BASE_URL;
    const resp = await composio.connectedAccounts.initiate(
      externalUserId,
      config.CANVAS_AUTH_CONFIG_ID,
      {
        config: AuthScheme.APIKey({
          api_key: apiKey,
          generic_api_key: apiKey,
          full: baseUrl,
          base_url: baseUrl,
        }),
      }
    );

    if (resp.id) {
      try {
        await pool.query(
          `INSERT INTO composio_connections (user_id, composio_account_id, service_name, external_user_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (composio_account_id) 
           DO UPDATE SET user_id = EXCLUDED.user_id, service_name = EXCLUDED.service_name, external_user_id = EXCLUDED.external_user_id`,
          [req.user.user_id, resp.id, "canvas", externalUserId]
        );
      } catch (dbError) {
        console.error("Error storing Canvas connection:", dbError);
      }
    }

    res.json({ ok: true, data: resp });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
};

export const startGoogleMeetingsAuth = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    if (!config.GOOGLEMEETINGS_AUTH_CONFIG_ID) {
      return res.status(500).json({
        ok: false,
        error:
          "Google Meetings auth config ID not configured. Please set COMPOSIO_GOOGLEMEETINGS_AUTH_CONFIG_ID in your .env file.",
      });
    }

    const externalUserId = await getComposioExternalUserId(req.user.user_id);
    const baseCallbackUrl =
      config.GOOGLEMEETINGS_LINK_CALLBACK_URL ||
      `https://taskmate-ai-ef8u.onrender.com/api/auth/gmeetings/callback`;
    const callbackUrl = `${baseCallbackUrl}?external_user_id=${encodeURIComponent(
      externalUserId
    )}`;

    const r = await composio.connectedAccounts.link(
      externalUserId,
      config.GOOGLEMEETINGS_AUTH_CONFIG_ID,
      { callbackUrl }
    );
    const url = r.linkUrl || r.redirectUrl;
    if (!url)
      return res.status(500).json({ ok: false, error: "Missing linkUrl" });
    res.json({ ok: true, url });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};

export const startGoogleCalendarAuth = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    const externalUserId = await getComposioExternalUserId(req.user.user_id);
    const baseCallbackUrl =
      config.GCALENDAR_LINK_CALLBACK_URL ||
      `https://taskmate-ai-ef8u.onrender.com/api/auth/gcalendar/callback`;
    const callbackUrl = `${baseCallbackUrl}?external_user_id=${encodeURIComponent(
      externalUserId
    )}`;

    const r = await composio.connectedAccounts.link(
      externalUserId,
      config.GCALENDAR_AUTH_CONFIG_ID,
      { callbackUrl }
    );
    const url = r.linkUrl || r.redirectUrl;
    if (!url)
      return res.status(500).json({ ok: false, error: "Missing linkUrl" });
    res.json({ ok: true, url });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};

// Handle Gmail authentication callback
export const gmailCallback = async (req, res) => {
  try {
    const { error, status, connected_account_id, external_user_id } = req.query;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #dc2626; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Connection Failed</h1>
            <p>${error}</p>
            <p style="margin-top: 20px; font-size: 14px;">You can close this window.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (status === "success" && connected_account_id) {
      try {
        const connection = await composio.connectedAccounts.get(
          connected_account_id
        );

        const extUserId =
          external_user_id ||
          connection.externalUserId ||
          connection.external_user_id ||
          connection.userId;

        if (extUserId && extUserId.startsWith("user_")) {
          const userId = parseInt(extUserId.replace("user_", ""));

          await pool.query(
            `INSERT INTO composio_connections (user_id, composio_account_id, service_name, external_user_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (composio_account_id) 
             DO UPDATE SET user_id = EXCLUDED.user_id, service_name = EXCLUDED.service_name, external_user_id = EXCLUDED.external_user_id`,
            [userId, connected_account_id, "gmail", extUserId]
          );
        }
      } catch (error) {
        console.error("Error in Gmail callback:", error);
      }

      // Return HTML success page
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail Connected</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #10b981; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Gmail Connected Successfully!</h1>
            <p>You can close this window and return to the app.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (!connected_account_id) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Error</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #dc2626; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Connection Error</h1>
            <p>Missing account ID. You can close this window.</p>
          </div>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Successful</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 { color: #10b981; margin: 0 0 16px 0; }
          p { color: #666; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Connection Successful!</h1>
          <p>You can close this window and return to the app.</p>
        </div>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 { color: #dc2626; margin: 0 0 16px 0; }
          p { color: #666; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Error</h1>
          <p>${String(e)}</p>
          <p style="margin-top: 20px; font-size: 14px;">You can close this window.</p>
        </div>
      </body>
      </html>
    `);
  }
};

// Handle Google Calendar authentication callback
export const googleCalendarCallback = async (req, res) => {
  try {
    const { error, status, connected_account_id, external_user_id } = req.query;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #dc2626; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Connection Failed</h1>
            <p>${error}</p>
            <p style="margin-top: 20px; font-size: 14px;">You can close this window.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (status === "success" && connected_account_id) {
      try {
        const connection = await composio.connectedAccounts.get(
          connected_account_id
        );

        const extUserId =
          external_user_id ||
          connection.externalUserId ||
          connection.external_user_id ||
          connection.userId;

        if (extUserId && extUserId.startsWith("user_")) {
          const userId = parseInt(extUserId.replace("user_", ""));

          await pool.query(
            `INSERT INTO composio_connections (user_id, composio_account_id, service_name, external_user_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (composio_account_id) 
             DO UPDATE SET user_id = EXCLUDED.user_id, service_name = EXCLUDED.service_name, external_user_id = EXCLUDED.external_user_id`,
            [userId, connected_account_id, "googlecalendar", extUserId]
          );
        }
      } catch (error) {
        console.error("Error in Google Calendar callback:", error);
      }

      // Return HTML success page
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Calendar Connected</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #10b981; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Google Calendar Connected Successfully!</h1>
            <p>You can close this window and return to the app.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (!connected_account_id) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Error</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #dc2626; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Connection Error</h1>
            <p>Missing account ID. You can close this window.</p>
          </div>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Successful</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 { color: #10b981; margin: 0 0 16px 0; }
          p { color: #666; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Connection Successful!</h1>
          <p>You can close this window and return to the app.</p>
        </div>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 { color: #dc2626; margin: 0 0 16px 0; }
          p { color: #666; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Error</h1>
          <p>${String(e)}</p>
          <p style="margin-top: 20px; font-size: 14px;">You can close this window.</p>
        </div>
      </body>
      </html>
    `);
  }
};

// Handle Google Meetings authentication callback
export const googleMeetingsCallback = async (req, res) => {
  try {
    const { error, status, connected_account_id, external_user_id } = req.query;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #dc2626; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Connection Failed</h1>
            <p>${error}</p>
            <p style="margin-top: 20px; font-size: 14px;">You can close this window.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (status === "success" && connected_account_id) {
      try {
        const connection = await composio.connectedAccounts.get(
          connected_account_id
        );

        const extUserId =
          external_user_id ||
          connection.externalUserId ||
          connection.external_user_id ||
          connection.userId;

        if (extUserId && extUserId.startsWith("user_")) {
          const userId = parseInt(extUserId.replace("user_", ""));

          await pool.query(
            `INSERT INTO composio_connections (user_id, composio_account_id, service_name, external_user_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (composio_account_id) 
             DO UPDATE SET user_id = EXCLUDED.user_id, service_name = EXCLUDED.service_name, external_user_id = EXCLUDED.external_user_id`,
            [userId, connected_account_id, "googlemeetings", extUserId]
          );
        }
      } catch (error) {
        console.error("Error in Google Meetings callback:", error);
      }

      // Return HTML success page
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Meetings Connected</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #10b981; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Google Meetings Connected Successfully!</h1>
            <p>You can close this window and return to the app.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (!connected_account_id) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Error</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 { color: #dc2626; margin: 0 0 16px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Connection Error</h1>
            <p>Missing account ID. You can close this window.</p>
          </div>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Successful</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 { color: #10b981; margin: 0 0 16px 0; }
          p { color: #666; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Connection Successful!</h1>
          <p>You can close this window and return to the app.</p>
        </div>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 { color: #dc2626; margin: 0 0 16px 0; }
          p { color: #666; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Error</h1>
          <p>${String(e)}</p>
          <p style="margin-top: 20px; font-size: 14px;">You can close this window.</p>
        </div>
      </body>
      </html>
    `);
  }
};
// Handle Canvas authentication callback
export const canvasCallback = async (req, res) => {
  try {
    const { error, status, connected_account_id, external_user_id } = req.query;

    if (error) {
      return res
        .status(400)
        .json({ ok: false, error: `Authentication failed: ${error}` });
    }

    if (status === "success" && connected_account_id) {
      // Get connection details from Composio to retrieve external_user_id
      try {
        const connection = await composio.connectedAccounts.get(
          connected_account_id
        );
        const extUserId = connection.externalUserId || external_user_id;

        // Extract user_id from external_user_id (format: user_123)
        if (extUserId && extUserId.startsWith("user_")) {
          const userId = parseInt(extUserId.replace("user_", ""));

          // Store the connection mapping in the database
          await pool.query(
            `INSERT INTO composio_connections (user_id, composio_account_id, service_name, external_user_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (composio_account_id) 
             DO UPDATE SET user_id = EXCLUDED.user_id, service_name = EXCLUDED.service_name, external_user_id = EXCLUDED.external_user_id`,
            [userId, connected_account_id, "canvas", extUserId]
          );
        }
      } catch (dbError) {
        console.error("Error storing Composio connection:", dbError);
      }
      const redirectUrl =
        process.env.NODE_ENV === "production"
          ? "/login?auth=canvas_success&account_id=" + connected_account_id
          : "https://taskmate-ai-mauve.vercel.app/login?auth=canvas_success&account_id=" +
            connected_account_id;
      return res.redirect(redirectUrl);
    }

    if (!connected_account_id) {
      return res.status(400).json({ ok: false, error: "Missing account ID" });
    }

    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? "/login?auth=canvas_success"
        : "https://taskmate-ai-mauve.vercel.app/login?auth=canvas_success";
    res.redirect(redirectUrl);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};

// Check authentication status
export const checkAuthStatus = async (req, res) => {
  try {
    // Require authentication
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ ok: false, error: "Authentication required" });
    }

    // Check if required environment variables are configured
    if (!config.COMPOSIO_API_KEY) {
      return res.status(500).json({
        ok: false,
        error:
          "Composio API key not configured. Please set COMPOSIO_API_KEY in your .env file.",
      });
    }

    const userId = req.user.user_id;
    const externalUserId = await getComposioExternalUserId(userId);

    const userConnectionsResult = await pool.query(
      `SELECT composio_account_id, service_name FROM composio_connections WHERE user_id = $1`,
      [userId]
    );
    const userConnectionIds = new Set(
      userConnectionsResult.rows.map((row) => row.composio_account_id)
    );

    const allConnections = await composio.connectedAccounts.list();

    const userConnections = allConnections.items.filter((c) => {
      const isInDatabase = userConnectionIds.has(c.id);
      const matchesExternalUserId =
        c.externalUserId === externalUserId ||
        c.external_user_id === externalUserId ||
        c.userId === externalUserId;
      const isActive = c.status === "ACTIVE";

      return (isInDatabase || matchesExternalUserId) && isActive;
    });

    for (const conn of userConnections) {
      if (
        !userConnectionIds.has(conn.id) &&
        conn.externalUserId === externalUserId
      ) {
        if (conn.externalUserId && conn.externalUserId.startsWith("user_")) {
          const extractedUserId = parseInt(
            conn.externalUserId.replace("user_", "")
          );
          const serviceName = conn.toolkit?.slug || "unknown";

          try {
            await pool.query(
              `INSERT INTO composio_connections (user_id, composio_account_id, service_name, external_user_id)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (composio_account_id) 
               DO UPDATE SET user_id = EXCLUDED.user_id, service_name = EXCLUDED.service_name, external_user_id = EXCLUDED.external_user_id`,
              [extractedUserId, conn.id, serviceName, conn.externalUserId]
            );
          } catch (dbError) {
            console.error("Error auto-storing connection:", dbError);
          }
        }
      }
    }

    const gmailConns = userConnections.filter(
      (c) => c.toolkit?.slug === "gmail"
    );

    const googleCalendarConns = userConnections.filter(
      (c) => c.toolkit?.slug === "googlecalendar" || c.toolkit?.slug === "gcal"
    );

    const canvasConns = userConnections.filter(
      (c) => c.toolkit?.slug?.toLowerCase() === "canvas"
    );

    // Also check database directly for Canvas connections (in case Composio API is slow)
    const canvasDbCheck = await pool.query(
      `SELECT composio_account_id FROM composio_connections WHERE user_id = $1 AND service_name = $2`,
      [userId, "canvas"]
    );
    if (canvasDbCheck.rows.length > 0 && canvasConns.length === 0) {
      // Connection exists in DB but not in Composio API yet - trust the DB
      canvasConns.push({ id: canvasDbCheck.rows[0].composio_account_id });
    }

    const googleMeetingsConns = userConnections.filter(
      (c) =>
        c.toolkit?.slug === "googlemeetings" ||
        c.toolkit?.slug === "gmeet" ||
        c.toolkit?.slug === "googlemeet"
    );

    res.json({
      ok: true,
      connectedAccounts: {
        gmail: gmailConns.length > 0,
        gmailConnections: gmailConns,
        googlecalendar: googleCalendarConns.length > 0,
        googlecalendarConnections: googleCalendarConns,
        googlemeetings: googleMeetingsConns.length > 0,
        googlemeetingsConnections: googleMeetingsConns,
        canvas: canvasConns.length > 0,
        canvasConnections: canvasConns,
        totalConnections: userConnections.length,
      },
    });
  } catch (e) {
    console.error("Error checking auth status:", e);
    res.status(500).json({ ok: false, error: String(e) });
  }
};

// Unlink Gmail account
export const unlinkGmail = async (req, res) => {
  try {
    const { connectedAccountId } = req.body;

    if (!connectedAccountId) {
      return res.status(400).json({
        ok: false,
        error: "connectedAccountId is required",
      });
    }

    await composio.connectedAccounts.delete(connectedAccountId);

    res.json({
      ok: true,
      message: "Gmail account unlinked successfully",
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};
