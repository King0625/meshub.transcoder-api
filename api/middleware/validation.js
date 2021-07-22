const { body, query, param } = require('express-validator');

module.exports = {
  getJobsByUuidsValidator: [
    query('uuids').exists().withMessage("[query string] 'uuids' is required")
      .isArray({ min: 1 }).withMessage("[query string] 'uuids' must be an array that contains at least 1 element")
  ],
  removeMp4ByUuidValidator: [
    body('uuid').exists().withMessage("[body] 'uuid' is required")
  ]
}