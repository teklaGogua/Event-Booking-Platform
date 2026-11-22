const { ZodError } = require('zod');

// validate({ body: schema, params: schema, query: schema })
// Parsed (typed, trimmed, coerced) values end up in req.valid.body / .params / .query
function validate(schemas) {
  return (req, res, next) => {
    try {
      req.valid = {};
      for (const key of ['params', 'query', 'body']) {
        if (schemas[key]) req.valid[key] = schemas[key].parse(req[key] ?? {});
      }
      next();
    } catch (err) {
      next(err instanceof ZodError ? err : err);
    }
  };
}

module.exports = validate;
