const expressJwt = require('express-jwt');

exports.accountMiddleware = [
  expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: [process.env.JWT_ALGORITHM]
  }),
  function (err, req, res, next) {
    res.status(err.status).json(err);
  }
]

exports.adminMiddleware = (req, res, next) => {
  if (req.user.account !== process.env.ADMIN_USER) {
    return res.status(403).json({
      message: "Forbidden"
    })
  }
  next();
}
