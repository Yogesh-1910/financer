// migrations/XXXXXXXXXXXXXX-create-budget-item.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BudgetItems', { // Ensure table name matches what Sequelize expects
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: { // FOREIGN KEY DEFINITION
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // This MUST match the actual table name for users
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Or 'SET NULL' or 'RESTRICT'
      },
      monthYear: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('income', 'expense'),
        allowNull: false
      },
      itemName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      plannedAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      actualAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BudgetItems');
  }
};