import "./config/dotenv.js";
import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as GitHubStrategy } from "passport-github2";
import { options, verify } from "./config/auth.js";
import authRouter from "./routes/auth.js";
import path from "path";
import { fileURLToPath } from "url";

import * as authRoutes from "./routes/auth.js";
import * as toolsRoutes from "./routes/tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create express app
const app = express();

// middleware
app.use(
  session({
    secret: "codepath",
    resave: false,
    saveUninitialized: true,
  })
);

// initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// configure passport with GitHub strategy
passport.use(new GitHubStrategy(options, verify));

// serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// CORS and JSON middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE,PATCH",
    credentials: true,
  })
);

// routes
// Auth routes
app.use("/auth", authRouter);

// Root route
app.get("/", (req, res) => {
  res
    .status(200)
    .send(
      '<h1 style="text-align: center; margin-top: 50px;">TaskMate API</h1>'
    );
});

app.get("/api/auth/gmail/start", authRoutes.startGmailAuth);
app.get("/api/auth/gcalendar/start", authRoutes.startGoogleCalendarAuth);
app.get("/api/auth/gmeetings/start", authRoutes.startGoogleMeetingsAuth);
app.post("/api/auth/canvas/start", authRoutes.startCanvasAuth);
app.get("/api/auth/gmail/callback", authRoutes.gmailCallback);
app.get("/api/auth/gcalendar/callback", authRoutes.googleCalendarCallback);
app.get("/api/auth/gmeetings/callback", authRoutes.googleMeetingsCallback);
app.get("/api/auth/gmeet/callback", authRoutes.googleMeetingsCallback);
app.get("/api/auth/canvas/callback", authRoutes.canvasCallback);
app.get("/api/auth/status", authRoutes.checkAuthStatus);
app.post("/api/auth/gmail/unlink", authRoutes.unlinkGmail);

app.get("/api/tools/count", toolsRoutes.getToolsCount);
app.get("/api/tools/search", toolsRoutes.searchTools);
app.get("/api/tools/canvas/search", toolsRoutes.searchCanvasTools);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
