const Users = require('./users');
const Customers = require('./customers');
const CustomerLocations = require('./customer_locations');
const Family = require('./family');
const Child = require('./child');

CustomerLocations.belongsTo(Customers, { foreignKey: 'cust_id' });

Child.belongsTo(Family, { foreignKey: 'family_id' });

module.exports = {
  Users,
  Customers,
  CustomerLocations,
  Family,
  Child
};
