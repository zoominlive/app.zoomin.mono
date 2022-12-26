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
const AccessLogs = require('./access_logs');
const ChangeLogs = require('./change_logs');

const sequelize = require('../lib/database');

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

Users.belongsTo(AccessLogs, { foreignKey: 'user_id' });
AccessLogs.hasOne(Users, {
  sourceKey: 'user_id',
  foreignKey: {
    name: 'user_id'
  }
});

Users.belongsTo(ChangeLogs, { foreignKey: 'user_id' });
ChangeLogs.hasOne(Users, {
  sourceKey: 'user_id',
  foreignKey: {
    name: 'user_id'
  }
});

RoomsInChild.belongsTo(Child, { foreignKey: 'child_id' });
Child.hasMany(RoomsInChild, {
  as: 'newRooms',
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
RoomsInChild.hasOne(Room, {
  as: 'rooms',
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
  }
});

Child.belongsTo(Family, { foreignKey: 'family_id' });
Users.belongsTo(Customers, { foreignKey: 'cust_id' });
Room.belongsTo(Customers, { foreignKey: 'cust_id' });

const connection = {};

module.exports = async () => {
  if (connection?.isConnected) {
    console.log('=> Using existing connection.');
    return {
      ChangeLogs,
      AccessLogs,
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
  }

  await sequelize.sync();
  await sequelize.authenticate();
  connection.isConnected = true;
  console.log('=> Created a new connection.');
  return {
    ChangeLogs,
    AccessLogs,
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
};
