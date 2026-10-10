# 🐦 Twitter (X) Integration Analysis

## 🔍 Current State
- **Frontend:** The "Connect Identity" button correctly initiates the OAuth flow targeting the current page as the Redirect URI.
- **Backend:** `TwitterProvider` is configured to use `twitter-api-v2` for OAuth 2.0 PKCE.
- **Configuration:** `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are present in `apps/backend/.env`.

## ⚙️ How It Works (The Flow)
1.  **Initiation:** You click "Connect Identity" on `/affexai/admin/social/accounts`.
2.  **Redirect:** The app redirects you to `twitter.com` to authorize the app.
3.  **Callback:** Twitter sends you back to `/affexai/admin/social/accounts?code=...`.
4.  **Exchange:** The backend exchanges the `code` for an `accessToken`.
5.  **Storage:** The token is stored securely in the `social_accounts` table.

## ⚠️ Critical Requirement
For this to work, you **MUST** ensure the following URL is added to your **Twitter Developer Portal > User Authentication Settings > Callback URI / Redirect URL**:

`http://localhost:9003/affexai/admin/social/accounts` (for local development)

If you are deploying to production, add that URL as well (e.g., `https://your-domain.com/affexai/admin/social/accounts`).

## 🛠️ Next Steps
1.  Verify the Redirect URI in Twitter Developer Portal.
2.  Try connecting the account.
3.  If you encounter an error (e.g., "Callback URL not approved"), it means the URL above is missing from the portal.
