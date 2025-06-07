// models/budgetitem.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BudgetItem extends Model {
    static associate(models) {
      // Correct association back to User
      BudgetItem.belongsTo(models.User, {
        foreignKey: 'userId', // This foreign key must exist in the BudgetItems table
        as: 'user'           // Alias
      });
    }
  }
  BudgetItem.init({
    userId: { // This defines the foreign key column
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Name of the table Users (Sequelize usually pluralizes)
        key: 'id'       // Primary key of the Users table
      },
      onDelete: 'CASCADE' // Or 'SET NULL' if you want to keep budget items on user delete
    },
    monthYear: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
    itemName: { type: DataTypes.STRING, allowNull: false },
    plannedAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    actualAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true }
  }, {
    sequelize,
    modelName: 'BudgetItem', // Table name will usually be 'BudgetItems'
  });
  return BudgetItem;
};