var express = require('express');
var router = express.Router();
const transcodeController = require('../controllers/transcode');
const { accountMiddleware } = require('../middleware/auth');

router.post('/job', accountMiddleware, transcodeController.submitJob);
router.get('/job', accountMiddleware, transcodeController.getJobsByUuids);
router.get('/job_meshub', transcodeController.getJobByMeshub);
/* How to handle hanging sub_jobs? */
router.post('/job_meshub_progress', transcodeController.submitJobProgressByMeshub);
router.post('/merge', transcodeController.merge);
router.post('/upload', transcodeController.upload);
router.post('/remove_mp4', accountMiddleware, transcodeController.removeMp4ByUuid)

module.exports = router;
