const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const roomController = require('../../controllers/rooms');
const { withAuthentication } = require('@frontegg/client');

/* room end points */
router.get('/', withAuthentication(), authController, roomController.getAllRoomsDetails);
router.post('/add', withAuthentication(), authController, roomController.createRoom);
router.put('/edit', withAuthentication(), authController, roomController.editRoom);
router.put('/disable', withAuthentication(), authController, roomController.disableRoom);
router.put('/enable', withAuthentication(), authController, roomController.enableRoom);
router.delete('/delete', withAuthentication(), authController, roomController.deleteRoom);
router.get('/list', withAuthentication(), authController, roomController.getAllRoomsList);

module.exports = router;
