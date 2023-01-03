'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const families = await queryInterface.rawSelect('family', { plain: false }, [
      'family_id',
      'cust_id'
    ]);

    await Promise.all(
      families.map(async (family) => {
        console.log('family', family.family_id, family.cust_id);
        await queryInterface.sequelize.query(
          `UPDATE child SET cust_id = "${family.cust_id}" WHERE family_id = "${family.family_id}"`
        );
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
