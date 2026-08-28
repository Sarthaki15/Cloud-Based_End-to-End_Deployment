/**
 * verifyToken.js
 * ---------------------------------------------------------
 * Verifies the AWS Cognito-issued JWT (Access Token) sent by
 * the frontend in the `Authorization: Bearer <token>` header.
 *
 * Uses aws-jwt-verify, which downloads and caches the Cognito
 * User Pool's public JWKS automatically — no secret key needed
 * on the backend, since Cognito uses RS256 asymmetric signing.
 * ---------------------------------------------------------
 */
import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = await verifier.verify(token);
    req.user = {
      sub: payload.sub,
      username: payload.username,
      scope: payload.scope,
    };
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional auth: attaches req.user if a valid token is present,
// but does not block the request if it's missing/invalid.
export async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return next();

  try {
    const payload = await verifier.verify(token);
    req.user = { sub: payload.sub, username: payload.username };
  } catch {
    // ignore invalid token for optional routes
  }
  next();
}
