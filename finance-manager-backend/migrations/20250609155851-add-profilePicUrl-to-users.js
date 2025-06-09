'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'profilePicUrl', { // Ensure 'Users' matches your table name
      type: Sequelize.STRING,
      allowNull: true, // Allow users to not have a profile picture
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'profilePicUrl');
  }
};