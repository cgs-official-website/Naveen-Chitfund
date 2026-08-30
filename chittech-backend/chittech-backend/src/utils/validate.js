const { ApiError } = require('../middleware/errorHandler');

/** Validate `req.body` against a zod schema, throwing a 400 ApiError on failure. */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return next(new ApiError(400, `Validation error: ${msg}`));
    }
    req.body = result.data;
    next();
  };
}

function getPagination(req) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginatedResponse(rows, total, page, limit) {
  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = { validateBody, getPagination, paginatedResponse, ApiError };
