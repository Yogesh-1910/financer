// models/budgetitem.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BudgetItem extends Model {
    static associate(models) {
      BudgetItem.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  BudgetItem.init({
    userId: { // This defines the foreign key column
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }, // Table name 'Users'
      onDelete: 'CASCADE'
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
    modelName: 'BudgetItem', // Table name will be 'BudgetItems'
  });
  return BudgetItem;
};