/**
 * Anonymous session-ID management.
 *
 * This module stores a random UUID that identifies an *anonymous* browser
 * session.  It is NOT an authentication token or a credential – it is just a
 * device-local identifier used to group content created before the user signs
 * in (e.g. draft resume entries).  Real authentication tokens are stored
 * exclusively in HttpOnly cookies managed by the backend and are never
 * accessible to JavaScript.
 */

const SESSION_KEY = "career_platform_session_id";

export const getSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};
