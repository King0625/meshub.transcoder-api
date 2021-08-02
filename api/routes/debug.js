var express = require('express');
var router = express.Router();
const { accountMiddleware, adminMiddleware } = require('../middleware/auth');
const debugController = require('../controllers/debug');

router.get('/fixMissing', debugController.fixMissing);

router.use(accountMiddleware);
router.get('/accounts/:accountId/jobs', debugController.getJobsByAccountId)

router.use(adminMiddleware);
router.get('/workers', debugController.getAllWorkers);
router.post('/workers/reset', debugController.resetWorkerList);
router.post('/jobs/reset', debugController.resetJobData);
router.get('/workers/:workerId/splitjobs', debugController.getSplitJobsByWorkerId)
router.get('/jobs', debugController.listRunningJobDetails);

module.exports = router;
