// models/loan.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Loan extends Model {
    static associate(models) {
      Loan.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Loan.hasMany(models.EMI, { foreignKey: 'loanId', as: 'relatedEmis', allowNull: true, constraints: false });
    }
  }
  Loan.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    loanName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalLoanAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    loanTermMonths: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATEONLY, // Use DATEONLY if you don't need time
      allowNull: true
    },
    monthlyPaymentCalculated: { // This could be the EMI amount
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    lenderName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paidMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Loan',
  });
  return Loan;
};