const express = require('express');
const menuRouter = express.Router();
const menuItemsRouter = require('./menuItems');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


/* middleware */

const checkRequiredFields = (req, res, next) => {
    const  menu = req.body.menu;
    if (!menu.title) {
        res.status(400).send();
    }
    next();
};

const checkMenuId = (req, res, next) => {
    db.get('SELECT * FROM Menu WHERE id = $menu', {$menu: req.params.menuId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            next();
        } else {
            res.status(404).send();
        }
    });
}

/* /menus/:menuId/menu-items */

menuRouter.use('/:menuId/menu-items', menuItemsRouter);

/* /menus */

menuRouter.get('/', (req, res, next) => {

    db.all(`SELECT * FROM Menu`, (error, rows) => {
        if (error) {
            next(error);
        } else {
            res.status(200).send({menus: rows});
        }
    })
});

menuRouter.post('/', checkRequiredFields, (req, res, next) => {

    const menu = req.body.menu;
    db.run(`INSERT INTO Menu (title) VALUES ($title)`, {$title: menu.title}, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).send({menu: row});
                }
            })
        }
    })
});


/* /menus/:menuId */

menuRouter.get('/:menuId', (req, res, next) => {
    db.get('SELECT * FROM Menu WHERE id = $menuId', {$menuId: req.params.menuId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            res.status(200).send({menu: row});
        } else {
            res.status(404).send();
        }
    })
});

menuRouter.put('/:menuId', checkRequiredFields, (req, res, next) => {

    const menu = req.body.menu;
    db.get('SELECT * FROM Menu WHERE id = $menuId', {$menuId: req.params.menuId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            db.run('UPDATE Menu SET title = $title WHERE id = $menuId;', {$title: menu.title, $menuId: req.params.menuId}, (error) => {
                if (error) {
                    next(error);
                } else {
                    db.get('SELECT * FROM Menu WHERE id = $menuId', {$menuId: req.params.menuId}, (error, row) => {
                        if (error) {
                            next(error);
                        } else {
                            res.status(200).send({menu: row})
                        }
                    });
                }
            })
        } else {
            res.status(404).send();
        }
    })
});

menuRouter.delete('/:menuId', checkMenuId, (req, res, next) => {

    db.get('SELECT * FROM MenuItem WHERE menu_id = $menuId', {$menuId: req.params.menuId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            res.status(400).send();
        } else {
            db.run('DELETE FROM Menu WHERE id = $menuId;', {$menuId: req.params.menuId}, (error) => {
                if (error) {
                    next(error);
                } else {
                    res.status(204).send();
                }
            })
        }
    })
});




module.exports = menuRouter;