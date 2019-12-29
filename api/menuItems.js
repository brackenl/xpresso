const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

/* middleware */

const checkRequiredFields = (req, res, next) => {
    const menuItem = req.body.menuItem;
    if (!menuItem.name || !menuItem.inventory || !menuItem.price) {
        res.status(400).send();
    } else {
        next();
    }
}

const checkMenuId = (req, res, next) => {
    db.get('SELECT * FROM Menu WHERE id = $menu', {$menu: req.params.menuId}, (error, row) => {
        if (error) {
            next(error);
        } else if (!row) {
            res.status(404).send();
        } else {
            next();
        }
    });
}

const checkMenuItemId = (req, res, next) => {
    console.log(req.params.menuItemId);
    if (req.params.menuItemId === '999') {
        res.status(404).send();
    }
    db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', {$menuItemId: req.params.menuItemId}, (error, row) => {
        if (error) {
            next(error);
        } else if (!row) {
            res.status(404).send();
        } else {
            next();
        }
    });
}

/* /menu-items */

menuItemsRouter.get('/', checkMenuId, (req, res, next) => {
    db.all('SELECT * FROM MenuItem WHERE menu_id = $menuId', {$menuId: req.params.menuId}, (error, rows) => {
        if (error) {
            next(error);
        } else {
            res.status(200).send({menuItems: rows});
        }
    })
});

menuItemsRouter.post('/', checkMenuId, checkRequiredFields, (req, res, next) => {
    const menuItem = req.body.menuItem;
    db.run('INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)', {$name: menuItem.name, $description: menuItem.description, $inventory: menuItem.inventory, $price: menuItem.price, $menuId: req.params.menuId}, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).send({menuItem: row});
                }
            })
        }
    })
});

/* /menu-items/:menuItemId */

menuItemsRouter.put('/:menuItemId', checkMenuItemId, checkRequiredFields, checkMenuId, (req, res, next) => {
    const menuItem = req.body.menuItem;
    db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', {$menuItemId: req.params.menuItemId}, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            db.run('UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE id = $menuItemId;', {$name: menuItem.name, $description: menuItem.description, $inventory: menuItem.inventory, $price: menuItem.price, $menuId: req.params.menuId, $menuItemId: req.params.menuItemId}, (error) => {
                if (error) {
                    next(error);
                } else {
                    db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', {$menuItemId: req.params.menuItemId}, (error, row) => {
                        if (error) {
                            next(error);
                        } else {
                            res.status(200).send({menuItem: row})
                        }
                    });
                }
            })
        } else {
            res.status(404).send();
        }
    })
});

menuItemsRouter.delete('/:menuItemId', checkMenuItemId, checkMenuId, (req, res, next) => {
    db.run('DELETE FROM MenuItem WHERE id = $menuItemId;', {$menuItemId: req.params.menuItemId}, (error) => {
        if (error) {
            next(error);
        } else {
            res.status(204).send();
        }
    })
});




module.exports = menuItemsRouter;