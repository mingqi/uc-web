express = require 'express'

route = require '../routes/manage/manage'
middleware = require '../lib/middleware'

router = express.Router()

router.use(route.checkRole);

router.get('/', route.home);
router.use('/ajax/:action', route.ajax);
router.get('/:page', route);

module.exports = exports = router;
