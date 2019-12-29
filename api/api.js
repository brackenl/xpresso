const express = require('express');
const apiRouter = express.Router();
const menuRouter = require('./menus');
const employeesRouter = require('./employees');

apiRouter.use('/employees', employeesRouter);
apiRouter.use('/menus', menuRouter);



module.exports = apiRouter;