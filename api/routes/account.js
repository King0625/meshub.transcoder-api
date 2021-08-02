var express = require('express');
var router = express.Router();
const { accountMiddleware, adminMiddleware } = require('../middleware/auth');
const { createAccountValidator, loginAccountValidator, resetPasswordValidator } = require('../middleware/validation');
const accountController = require('../controllers/account');

router.post('/login', loginAccountValidator, accountController.loginAccount);

router.use(accountMiddleware, adminMiddleware);
router.get('/', accountController.listAccounts);
router.post('/', createAccountValidator, accountController.createAccount);
router.put('/reset-password/:accountId', resetPasswordValidator, accountController.resetPassword);
router.delete('/:accountId', accountController.deleteAccount);

module.exports = router;