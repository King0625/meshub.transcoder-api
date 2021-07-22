var express = require('express');
var router = express.Router();
const debugController = require('../controllers/debug');

/* GET home page. */
router.get('/', debugController.getAllWorkers);
router.get('/reset', debugController.resetWorkerList);
router.get('/resetJob', debugController.resetJobData);
router.get('/fixMissing', debugController.fixMissing);
router.get('/job_details', debugController.listRunningJobDetails);

module.exports = router;
