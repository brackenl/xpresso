const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

/* middleware */

const checkValidEmployee = (req, res, next) => {
    db.get('SELECT * FROM Employee WHERE id = $employeeId', {$employeeId: req.params.employeeId}, (error, row) => {
        if (error) {
            next(error) 
        } else if (!row) {
            res.status(404).send();
        } else {
            next();
        }
    });
};

const checkValidTimesheetId = (req, res, next) => {
    if (req.params.timesheetId) {
        db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', {$timesheetId: req.params.timesheetId}, (error, row) => {
            if (error) {
                next(error) 
            } else if (row) {
                next();
            } else {
                res.status(404).send();
            }
        });
    }
}

const checkValidTimesheet = (req, res, next) => {
    const timesheet = req.body.timesheet;
    if (!timesheet.hours || !timesheet.rate || !timesheet.date) {
        res.status(400).send();
    } else {
        next();
    }
}

/* '/' routes */

timesheetsRouter.get('/', checkValidEmployee, (req, res, next) => {

    db.all('SELECT * FROM Timesheet WHERE employee_id = $employeeId', {$employeeId: req.params.employeeId}, (error, rows) => {
        if (error) {
            next(error);
        } else if (rows) {
            res.status(200).send({timesheets: rows});
        } else {
            res.status(404).send();
        }
    })
});

timesheetsRouter.post('/', checkValidEmployee, checkValidTimesheet, (req, res, next) => {

    const timesheet = req.body.timesheet;
    db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)`, {$hours: timesheet.hours, $rate: timesheet.rate, $date: timesheet.date, $employeeId: req.params.employeeId}, function(error)  {
       if (error) {
           next(error);
       } else {
           db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,  (error, row) => {
            if (error) {
                next(error);
            } else {
                res.status(201).send({timesheet: row});
            }
           });
       }
   });
});

/* '/:timesheetId' routes */

timesheetsRouter.put('/:timesheetId', checkValidEmployee, checkValidTimesheetId, checkValidTimesheet, (req, res, next) => {

    const timesheet = req.body.timesheet;
    db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', {$timesheetId: req.params.timesheetId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            db.run('UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE id = $timesheetId;', {$hours: timesheet.hours, $rate: timesheet.rate, $date: timesheet.date, $employeeId: req.params.employeeId, $timesheetId: req.params.timesheetId}, (error) => {
                if (error) {
                    next(error);
                } else {
                    db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', {$timesheetId: req.params.timesheetId}, (error, row) => {
                        if (error) {
                            next(error);
                        } else {
                            res.status(200).send({timesheet: row})
                        }
                    });
                }
            })
        } else {
            res.status(404).send();
        }
    })
});

timesheetsRouter.delete('/:timesheetId', checkValidEmployee, checkValidTimesheetId, (req, res, next) => {
    db.run('DELETE FROM Timesheet WHERE id = $timesheetId;', {$timesheetId: req.params.timesheetId}, (error) => {
        if (error) {
            next(error);
        } else {
            res.status(204).send();
        }
    })
});

module.exports = timesheetsRouter;