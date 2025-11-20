import { pool } from "./database.js";

const getBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://taskmate-ai-ef8u.onrender.com";
  }
  return "http://localhost:3001";
};

const options = {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${getBaseUrl()}/auth/github/callback`,
};

const verify = async (accessToken, refreshToken, profile, callback) => {
  const {
    _json: { id, name, login, avatar_url },
  } = profile;
  const userData = {
    githubId: id,
    username: login,
    avatarUrl: avatar_url,
    accessToken,
  };

  try {
    // Check if identity already exists (using identities table per ERD)
    const identityResult = await pool.query(
      "SELECT * FROM identities WHERE provider = $1 AND provider_user_id = $2",
      ["github", userData.githubId.toString()]
    );

    if (identityResult.rows.length > 0) {
      // Identity exists - get the linked user
      const identity = identityResult.rows[0];
      const userResult = await pool.query(
        "SELECT * FROM users WHERE user_id = $1",
        [identity.user_id]
      );
      const user = userResult.rows[0];

      // Update access token and last login
      await pool.query(
        "UPDATE identities SET access_token_encrypted = $1, linked_at = now() WHERE identity_id = $2",
        [accessToken, identity.identity_id]
      );
      await pool.query(
        "UPDATE users SET last_login_at = now() WHERE user_id = $1",
        [user.user_id]
      );

      return callback(null, user);
    }

    // New identity - create user first, then identity
    const newUserResult = await pool.query(
      `INSERT INTO users (username, avatar_url, created_at, last_login_at)
             VALUES ($1, $2, now(), now())
             RETURNING *`,
      [userData.username, userData.avatarUrl]
    );
    const newUser = newUserResult.rows[0];

    // Create identity linked to new user
    await pool.query(
      `INSERT INTO identities (user_id, provider, provider_user_id, provider_username, avatar_url, access_token_encrypted, profile_json, linked_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
      [
        newUser.user_id,
        "github",
        userData.githubId.toString(),
        userData.username,
        userData.avatarUrl,
        accessToken,
        JSON.stringify(profile._json),
      ]
    );

    return callback(null, newUser);
  } catch (error) {
    return callback(error);
  }
};
export { options, verify };
