// models/user.js
'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.BudgetItem, { foreignKey: 'userId', as: 'budgetItems', onDelete: 'CASCADE' });
      User.hasMany(models.Loan, { foreignKey: 'userId', as: 'loans', onDelete: 'CASCADE' });
      User.hasMany(models.EMI, { foreignKey: 'userId', as: 'emis', onDelete: 'CASCADE' });
    }
    async isValidPassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }
  User.init({
    fullName: {
      type: DataTypes.STRING,
      allowNull: false, // CRITICAL
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    occupation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      unique: true, // Can cause error if multiple users try to register with same empty/null phone
      allowNull: true, // If allowing empty/null, ensure your UI and logic handle this
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false, // CRITICAL
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false, // CRITICAL
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });
  return User;
};