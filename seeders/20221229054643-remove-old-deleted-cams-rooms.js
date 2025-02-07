'use strict';
const connectToDatabase = require('../models/index');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const Models = await connectToDatabase();
    const data = await Models.CamerasInZones.findAll({
      include: [
        {
          model: Models.Camera
        },
        {
          model: Models.Zone
        }
      ]
    });

    await Promise.all(
      data.map(async (cam_zone) => {
        if (cam_zone.zone == null || cam_zone.camera == null) {
          await Models.CamerasInZones.destroy({
            where: {
              cam_zone_id: cam_zone.cam_zone_id
            }
          });
        }
      })
    );

    const data1 = await Models.ZonesInChild.findAll({
      include: [
        {
          model: Models.Child
        },
        {
          model: Models.Zone,
          as: 'zone'
        }
      ]
    });

    await Promise.all(
      data1.map(async (zone_child) => {
        if (zone_child.zone == null || zone_child.child == null) {
          await Models.ZonesInChild.destroy({
            where: {
              zone_child_id: zone_child.zone_child_id
            }
          });
        }
      })
    );
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
