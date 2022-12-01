const Users = require('./users');
const Customers = require('./customers');
const CustomerLocations = require('./customer_locations');
const Family = require('./family');
const Child = require('./child');
const Camera = require('./camera');
const RecentViewers = require('./recent_viewers');
const Room = require('./room');

CustomerLocations.belongsTo(Customers, { foreignKey: 'cust_id' });
Family.hasMany(Child, {
  sourceKey: 'family_id',
  foreignKey: {
    name: 'family_id'
  }
});
Camera.belongsTo(Room, { foreignKey: 'cust_id' });
Room.hasMany(Camera, {
  sourceKey: 'cust_id',
  foreignKey: {
    name: 'cust_id'
  }
});
Child.belongsTo(Family, { foreignKey: 'family_id' });
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
