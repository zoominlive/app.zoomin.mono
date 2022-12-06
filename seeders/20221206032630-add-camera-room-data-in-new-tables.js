'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cameras = await queryInterface.rawSelect('camera', { plain: false }, [
      'cam_Id',
      'room_ids'
    ]);

    let camRoomObj = [];
    cameras?.forEach((cam) => {
      cam?.room_ids?.rooms?.forEach((room) => {
        camRoomObj.push({
          cam_id: cam?.cam_id,
          room_id: room?.room_id,
          created_At: new Date(),
          updated_at: new Date()
        });
      });
    });
    await queryInterface.bulkInsert('cameras_assigned_to_rooms', camRoomObj, {});

    const children = await queryInterface.rawSelect('child', { plain: false }, [
      'child_id',
      'rooms'
    ]);

    let childRoomObj = [];
    children?.forEach((child) => {
      child?.rooms?.rooms?.forEach((room) => {
        childRoomObj.push({
          child_id: child?.child_id,
          room_id: room?.room_id,
          created_At: new Date(),
          updated_at: new Date()
        });
      });
    });
    await queryInterface.bulkInsert('rooms_assigned_to_child', childRoomObj, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
