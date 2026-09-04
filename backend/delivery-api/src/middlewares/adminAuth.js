// PLACEHOLDER middleware for future admin authentication.
//
// Management routes are intentionally left open for now (per project
// requirements) but are already wired through this middleware so that
// adding real authentication later (JWT, session, API key, etc.) only
// requires implementing the logic below — no route files need to change.
//
// To activate protection later:
//   1. Implement real verification here (e.g. verify a JWT, check a
//      hashed password with bcrypt against ADMIN_PASSWORD_HASH, etc).
//   2. Import and apply this middleware in the management route files
//      (see src/routes/*.routes.js — look for the `adminAuth` import).

function adminAuth(req, res, next) {
  // Currently a no-op. Left in place so route files already reference it
  // and future auth can be dropped in without touching routes/controllers.
  return next();
}

module.exports = adminAuth;
