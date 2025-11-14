import "./config/dotenv.js";
import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as GitHubStrategy } from "passport-github2";
import { options, verify } from "./config/auth.js";
import authRouter from "./routes/auth.js";

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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
