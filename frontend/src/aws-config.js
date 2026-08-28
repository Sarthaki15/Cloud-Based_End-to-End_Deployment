/**
 * aws-config.js
 * Reads Cognito User Pool settings from Vite env vars.
 * Create a `.env` file in /frontend (see .env.example) with:
 *   VITE_COGNITO_USER_POOL_ID=...
 *   VITE_COGNITO_CLIENT_ID=...
 *   VITE_API_BASE_URL=...
 */
export const cognitoConfig = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
