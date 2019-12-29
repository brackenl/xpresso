const express = require('express');
const employeesRouter = express.Router();
const timesheetsRouter = require('./timesheets');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

/* middleware */

const checkRequiredFields = (req, res, next) => {
    const employee = req.body.employee;
    if (!employee.name || !employee.position || !employee.wage) {
        res.status(400).send();
    }
    next();
}


/* /employees/:employeeId/timesheets */

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

/* /employees */

employeesRouter.get('/', (req, res, next) => {

    db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (error, rows) => {
        if (error) {
            next(error);
        } else {
            res.status(200).send({employees: rows});
        }
    })
});

employeesRouter.post('/', checkRequiredFields, (req, res, next) => {

    const employee = req.body.employee;
    db.run(`INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)`, {$name: employee.name, $position: employee.position, $wage: employee.wage}, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).send({employee: row});
                }
            })
        }
    })
});

/* /employees/:employeeId */

employeesRouter.get('/:employeeId', (req, res, next) => {
    db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {$employeeId: req.params.employeeId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            res.status(200).send({employee: row});
        } else {
            res.status(404).send();
        }
    })
});

employeesRouter.put('/:employeeId', checkRequiredFields, (req, res, next) => {

    const employee = req.body.employee;
    db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {$employeeId: req.params.employeeId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            db.run('UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE Employee.id = $employeeId;', {$name: employee.name, $position: employee.position, $wage: employee.wage, $employeeId: req.params.employeeId}, (error) => {
                if (error) {
                    next(error);
                } else {
                    db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {$employeeId: req.params.employeeId}, (error, row) => {
                        if (error) {
                            next(error);
                        } else {
                            res.status(200).send({employee: row})
                        }
                    });
                }
            })
        } else {
            res.status(404).send();
        }
    })
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    const employee = req.body.employee;
    db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {$employeeId: req.params.employeeId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            db.run('UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId;', {$employeeId: req.params.employeeId}, (error) => {
                if (error) {
                    next(error);
                } else {
                    db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {$employeeId: req.params.employeeId}, (error, row) => {
                        if (error) {
                            next(error);
                        } else {
                            res.status(200).send({employee: row})
                        }
                    });
                }
            })
        } else {
            res.status(404).send();
        }
    })
})







module.exports = employeesRouter;