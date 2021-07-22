var express = require('express');
var router = express.Router();
const { adminMiddleware } = require('../middleware/auth');
const accountController = require('../controllers/account');

router.use(adminMiddleware);

router.get('/', accountController.listAccounts)
router.get('/:account', accountController.getAccount)
router.post('/:account', accountController.createAccount)
router.delete('/:account', accountController.deleteAccount)

module.exports = router;