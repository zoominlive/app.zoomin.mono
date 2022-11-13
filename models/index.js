const Users = require('./users');
const Customers = require('./customers');
const CustomerLocations = require('./customer_locations');
const Family = require('./family');
const Child = require('./child');
const Camera = require('./camera');
const RecentViewers = require('./recent_viewers');
const Room = require('./room');

CustomerLocations.belongsTo(Customers, { foreignKey: 'cust_id' });
Users.belongsTo(Customers, { foreignKey: 'cust_id' });
Room.belongsTo(Customers, { foreignKey: 'cust_id' });
// Room.belongsTo(CustomerLocations, { foreignKey: 'location' });
module.exports = {
  Users,
  Customers,
  CustomerLocations,
  Family,
  Child,
  RecentViewers,
  Room,
  Camera
};
