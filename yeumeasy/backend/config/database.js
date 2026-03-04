const path = require('path');
const { Sequelize } = require('sequelize');

const configuredStorage = process.env.DB_STORAGE;
const storagePath = configuredStorage
  ? (path.isAbsolute(configuredStorage)
    ? configuredStorage
    : path.resolve(__dirname, '..', configuredStorage))
  : path.join(__dirname, '..', 'database', 'yeumeasy.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false
});

module.exports = sequelize;
