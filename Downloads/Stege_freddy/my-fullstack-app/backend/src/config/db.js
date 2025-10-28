const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('learning_platform', 'root', 'Freddy1243.', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;