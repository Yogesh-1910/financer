// models/emi.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EMI extends Model {
    static associate(models) {
      EMI.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      EMI.belongsTo(models.Loan, { foreignKey: 'loanId', as: 'loan', allowNull: true, constraints: false, onDelete: 'SET NULL' });
    }
  }
  EMI.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    loanId: { // Can be null if it's a standalone EMI not tied to a `Loan` record
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Loans', key: 'id' },
      onDelete: 'SET NULL' // If related loan is deleted, set this to NULL
    },
    emiDescription: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalEmiAmount: { // Total amount of the item bought on EMI
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    monthlyEmiPayment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    emiStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    emiEndDate: { // Can be calculated or entered
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    numberOfInstallments: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paidInstallments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'EMI',
  });
  return EMI;
};