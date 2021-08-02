const { body, query, param, validationResult } = require('express-validator');

function validationMiddleware(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = {
  submitJobValidator: [
    body('transcode_job.sourceUrl').exists().withMessage("[body] 'transcode_job.sourceUrl' is required"),
    body('transcode_job.job_type').exists().withMessage("[body] 'transcode_job.job_type' is required"),
    body('transcode_job.meshubNumbers').exists().withMessage("[body] 'transcode_job.job_type' is required")
      .isInt().withMessage("[body] 'transcode_job.job_type' must be an integer"),
    body('transcode_job.imageSourceUrl').custom((value, { req }) => {
      const jobType = req.body.transcode_job.job_type;
      if (jobType === 'merge' && value === undefined) {
        return false;
      }
      return true;
    }).withMessage("[body] 'transcode_job.imageSourceUrl' must be provided when 'transcode_job.job_type' is `merge`"),
    body('resolutions').exists().withMessage("[body] 'resolutions' is required")
      .isArray({ min: 1 }).withMessage("[body] 'resolutions' must be an array that contains at least 1 element"),
    body('resolutions.*.paramBitrate').exists().withMessage("[body] 'resolutions.*.paramBitrate' is required"),
    body('resolutions.*.paramCrf').exists().withMessage("[body] 'resolutions.*.paramCrf' is required"),
    body('resolutions.*.paramPreset').exists().withMessage("[body] 'resolutions.*.paramPreset' is required"),
    body('resolutions.*.paramResolutionHeight').exists().withMessage("[body] 'resolutions.*.paramResolutionHeight' is required"),
    body('resolutions.*.paramResolutionWidth').exists().withMessage("[body] 'resolutions.*.paramResolutionWidth' is required"),
    body('resolutions.*.resolution').exists().withMessage("[body] 'resolutions.*.resolution' is required"),
    validationMiddleware
  ],
  getJobsByUuidsValidator: [
    query('uuids').exists().withMessage("[query string] 'uuids' is required")
      .isArray({ min: 1 }).withMessage("[query string] 'uuids' must be an array that contains at least 1 element"),
    validationMiddleware
  ],
  removeMp4ByUuidValidator: [
    body('uuid').exists().withMessage("[body] 'uuid' is required"),
    validationMiddleware
  ],
  createAccountValidator: [
    body('account').exists().withMessage("[body] 'account' is required")
      .isLength({ min: 3 }).withMessage("[body] 'account' must contain at least 3 characters"),
    body('password').exists().withMessage("[body] 'password' is required")
      .isLength({ min: 6 }).withMessage("[body] 'password' must contain at least 6 characters"),
    validationMiddleware
  ],
  loginAccountValidator: [
    body('account').exists().withMessage("[body] 'account' is required"),
    body('password').exists().withMessage("[body] 'password' is required"),
    validationMiddleware
  ],
  resetPasswordValidator: [
    body('password').exists().withMessage("[body] 'password' is required")
      .isLength({ min: 6 }).withMessage("[body] 'password' must contain at least 6 characters"),
    validationMiddleware
  ],
}