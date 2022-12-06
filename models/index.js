const Users = require('./users');
const Customers = require('./customers');
const CustomerLocations = require('./customer_locations');
const Family = require('./family');
const Child = require('./child');
const Camera = require('./camera');
const RecentViewers = require('./recent_viewers');
const Room = require('./room');
const ScheduledToDisable = require('./scheluled_to_disable');
const RoomsInChild = require('./rooms_assigned_to_child');
const CamerasInRooms = require('./cameras_assigned_to_rooms');

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

RoomsInChild.belongsTo(Child, { foreignKey: 'child_id' });
Child.hasMany(RoomsInChild, {
  sourceKey: 'child_id',
  foreignKey: {
    name: 'child_id'
  }
});

CamerasInRooms.belongsTo(Room, { foreignKey: 'room_id' });
Room.hasMany(CamerasInRooms, {
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
  }
});

CamerasInRooms.belongsTo(Child, { foreignKey: 'child_id' });
Child.hasMany(CamerasInRooms, {
  sourceKey: 'child_id',
  foreignKey: {
    name: 'child_id'
  }
});

Room.belongsTo(RoomsInChild, { foreignKey: 'room_id' });
RoomsInChild.hasMany(Room, {
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
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
  Camera,
  ScheduledToDisable,
  RoomsInChild,
  CamerasInRooms
};
