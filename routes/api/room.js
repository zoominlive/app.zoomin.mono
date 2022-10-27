const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const roomController = require('../../controllers/rooms');

/* room end points */
router.get('/', authController, roomController.getAllRoomsDetails);
router.post('/add', authController, roomController.createRoom);
router.put('/edit', authController, roomController.editRoom);
router.delete('/delete', authController, roomController.deleteRoom);
router.get('/list', authController, roomController.getAllRoomsList);

module.exports = router;
