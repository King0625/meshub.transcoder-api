var express = require('express');
var router = express.Router();
const recoverSplitJobsController = require('../controllers/recover_splitjobs');

router.get('/', recoverSplitJobsController.index);

module.exports = router;

