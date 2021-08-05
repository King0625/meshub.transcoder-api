var express = require('express');
var router = express.Router();
const { accountMiddleware, adminMiddleware } = require('../middleware/auth');
const debugController = require('../controllers/debug');
const { cancelSelfJobsValidator } = require('../middleware/validation');

router.get('/fixMissing', debugController.fixMissing);

router.use(accountMiddleware);
router.get('/accounts/jobs', debugController.getSelfJobs)
router.post('/accounts/jobs/cancel', cancelSelfJobsValidator, debugController.cancelSelfJobs)

router.use(adminMiddleware);
router.get('/workers', debugController.getAllWorkers);
router.post('/workers/reset', debugController.resetWorkerList);
router.post('/jobs/reset', debugController.resetJobData);
router.get('/workers/:workerId/splitjobs', debugController.getSplitJobsByWorkerId)
router.get('/jobs', debugController.listRunningJobDetails);
router.get('/accounts/:accountId/jobs', debugController.getJobsByAccountId)

module.exports = router;
