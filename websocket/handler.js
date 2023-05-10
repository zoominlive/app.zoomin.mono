"use strict";
const sequelize = require("../lib/database");
const userServices = require("../services/users");
const familyServices = require("../services/families");
const _ = require("lodash");

sequelize.sync();

module.exports.connectHandler = async (event, context, callback) => {
  try {
    return {
      statusCode: 200,
      body: 'Connected.',
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 200,
      body: 'Oops! Something Went Wrong.',
    };
  }
};

module.exports.disconnectHandler = (event, context, callback) => {
  try {
    return {status: 200, body:"disconnected"}
  }
    catch (error) {
      console.log(error);
      return {
        statusCode: 200,
        body: 'Oops! Something Went Wrong.',
      };
    }
};

module.exports.defaultHandler = async (event, context, callback) => {
  try {
    const t = await sequelize.transaction();
    let { family_member_id, user_id } = JSON.parse(event?.body);
    let updateObj = {
      socket_connection_id: event?.requestContext?.connectionId,
    };
    if (family_member_id) {
      updateObj = { ...updateObj, family_member_id: family_member_id };
      await familyServices.editFamily(updateObj, t);
      await t.commit();

    } else {
      updateObj = { ...updateObj, user_id: user_id };
      await userServices.editUserProfile(
        updateObj,
        _.omit(updateObj, ["user_id"]),
        t
      );
      await t.commit();
    }
    return {statusCode: 200, body:"default"}

}
catch (error) {
  await t.rollback();
  console.log(error);
  return {
    statusCode: 200,
    body: 'Oops! Something Went Wrong.',
  };
}
};
