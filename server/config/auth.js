import { pool } from "./database.js";

const options = {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/auth/github/callback'
}

const verify = async (accessToken, refreshToken, profile, callback) => {
    const { _json: { id, name, login, avatar_url } } = profile
    
    try {
        // Step 1: Check if this GitHub identity already exists
        const identityResult = await pool.query(
            'SELECT * FROM identities WHERE provider = $1 AND provider_user_id = $2',
            ['github', id.toString()]
        )

        let user;

        if (identityResult.rows.length > 0) {
            // Identity exists - get the linked user
            const identity = identityResult.rows[0]
            const userResult = await pool.query(
                'SELECT * FROM users WHERE user_id = $1',
                [identity.user_id]
            )
            user = userResult.rows[0]

            // Update the access token and last login
            await pool.query(
                `UPDATE identities 
                 SET access_token_encrypted = $1, linked_at = now()
                 WHERE identity_id = $2`,
                [accessToken, identity.identity_id]
            )

            await pool.query(
                'UPDATE users SET last_login_at = now() WHERE user_id = $1',
                [user.user_id]
            )

            console.log(`✅ Existing user logged in: ${user.username}`)
        } else {
            // New GitHub identity - create user and identity
            // First, create a new user
            const newUserResult = await pool.query(
                `INSERT INTO users (username, avatar_url, created_at, last_login_at)
                 VALUES ($1, $2, now(), now())
                 RETURNING *`,
                [login, avatar_url]
            )
            user = newUserResult.rows[0]

            // Then, create the identity linked to this user
            await pool.query(
                `INSERT INTO identities (
                    user_id, provider, provider_user_id, provider_username, 
                    avatar_url, access_token_encrypted, profile_json, linked_at
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
                [
                    user.user_id,
                    'github',
                    id.toString(),
                    login,
                    avatar_url,
                    accessToken,
                    JSON.stringify(profile._json)
                ]
            )

            console.log(`✅ New user created: ${user.username}`)
        }

        return callback(null, user)

    } catch (error) {
        console.error('⚠️ Error in GitHub OAuth verify:', error)
        return callback(error)
    }
}

export { options, verify }