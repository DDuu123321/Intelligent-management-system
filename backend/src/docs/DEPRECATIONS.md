# Deprecations

## Removed Utility: utils/response.js
- Removed in favor of middleware/response.js providing res.standard()
- Old helpers: successResponse, errorResponse, success, error
- Migration: Replace res.json(successResponse(data,msg)) with res.standard(data, { message: msg }) and error with res.standard({ error: { code } }, { message, status })
- Effective Date: 2025-09-03
- Removal Commit: <TBD>

## Planned
- Legacy inline route business logic -> consolidated controllers (completed for employees, checkins, vehicles, monitoring, attendance)
- Next wave: licenses heavy logic -> licenseController + licenseService extraction
