'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cameras = await queryInterface.rawSelect('camera', { plain: false }, [
      'cam_Id',
      'room_ids'
    ]);

    let camZoneObj = [];
    cameras?.forEach((cam) => {
      cam?.room_ids?.zones?.forEach((zone) => {
        camZoneObj.push({
          cam_id: cam?.cam_id,
          zone_id: zone?.zone_id,
          created_At: new Date(),
          updated_at: new Date()
        });
      });
    });
    await queryInterface.bulkInsert('cameras_assigned_to_zones', camZoneObj, {});

    const children = await queryInterface.rawSelect('child', { plain: false }, [
      'child_id',
      'zones'
    ]);

    let childZoneObj = [];
    children?.forEach((child) => {
      child?.zones?.zones?.forEach((zone) => {
        childZoneObj.push({
          child_id: child?.child_id,
          zone_id: zone?.zone_id,
          created_At: new Date(),
          updated_at: new Date()
        });
      });
    });
    await queryInterface.bulkInsert('zones_assigned_to_child', childZoneObj, {});
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
