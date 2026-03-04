const express = require('express');

const router = express.Router();

router.get('/', (req, res) => res.render('reports/dashboard', { pageTitle: 'Dashboard' }));
router.get('/reports', (req, res) => res.render('reports/index', { pageTitle: 'Reports' }));

router.get('/users', (req, res) => res.render('users/index', { pageTitle: 'Users' }));
router.get('/users/create', (req, res) => res.render('users/create', { pageTitle: 'Create User' }));
router.get('/users/:id/edit', (req, res) => res.render('users/edit', { pageTitle: 'Edit User' }));
router.get('/users/:id/delete', (req, res) => res.render('users/delete', { pageTitle: 'Delete User' }));
router.get('/users/:id', (req, res) => res.render('users/show', { pageTitle: 'User Detail' }));

router.get('/equipment', (req, res) => res.render('equipment/index', { pageTitle: 'Equipment' }));
router.get('/equipment/create', (req, res) => res.render('equipment/create', { pageTitle: 'Create Equipment' }));
router.get('/equipment/:id/edit', (req, res) => res.render('equipment/edit', { pageTitle: 'Edit Equipment' }));
router.get('/equipment/:id/delete', (req, res) => res.render('equipment/delete', { pageTitle: 'Delete Equipment' }));
router.get('/equipment/:id', (req, res) => res.render('equipment/show', { pageTitle: 'Equipment Detail' }));

router.get('/borrows', (req, res) => res.render('borrows/index', { pageTitle: 'Borrows' }));
router.get('/borrows/create', (req, res) => res.render('borrows/create', { pageTitle: 'Create Borrow' }));
router.get('/borrows/:id/edit', (req, res) => res.render('borrows/edit', { pageTitle: 'Edit Borrow' }));
router.get('/borrows/:id/delete', (req, res) => res.render('borrows/delete', { pageTitle: 'Delete Borrow' }));
router.get('/borrows/:id', (req, res) => res.render('borrows/show', { pageTitle: 'Borrow Detail' }));

router.get('/borrow-details', (req, res) => res.render('borrow-details/index', { pageTitle: 'Borrow Details' }));
router.get('/borrow-details/create', (req, res) => res.render('borrow-details/create', { pageTitle: 'Create Borrow Detail' }));
router.get('/borrow-details/:id/edit', (req, res) => res.render('borrow-details/edit', { pageTitle: 'Edit Borrow Detail' }));
router.get('/borrow-details/:id/delete', (req, res) => res.render('borrow-details/delete', { pageTitle: 'Delete Borrow Detail' }));
router.get('/borrow-details/:id', (req, res) => res.render('borrow-details/show', { pageTitle: 'Borrow Detail Info' }));

module.exports = router;
