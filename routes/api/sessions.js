const express = require('express');
const { withAuthentication } = require('@frontegg/client');
const { IdentityClient } = require('@frontegg/client');
const identityClient = new IdentityClient({ FRONTEGG_CLIENT_ID: process.env.FRONTEGG_CLIENT_ID, FRONTEGG_API_KEY: process.env.FRONTEGG_API_KEY });

const router = express.Router();

const Sessions = require('../../models/sessions');
const sequelize = require('../../lib/database');
const constants = require('../../lib/constants');

router.post("/create", withAuthentication(), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const token = req.header("Authorization")?.substring(7);
    const userAgent = req.header("User-Agent");
    const params = req.body;
    console.log("params--->", params);
    const decodeToken = await identityClient.validateIdentityOnToken(token);
    const sessionExists = await Sessions.findOne({
      where: { user_id: params.userId },
      order: [["created_at", "DESC"]],
    });
    if (!sessionExists) {
      const sessionData = await Sessions.create({
        user_id: params.userId,
        token: params.token,
        user_agent: userAgent,
        isLoggedIn: true,
      });
    } else if (sessionExists?.dataValues?.token !== token) {
      const updateSession = await Sessions.update(
        { isExpired: true, isLoggedIn: false },
        { where: { id: sessionExists.dataValues.id } }
      );
      const sessionData = await Sessions.create({
        user_id: params.userId,
        token: params.token,
        user_agent: userAgent,
        isLoggedIn: true,
      });
    }
    await t.commit();
    res
      .status(200)
      .json({ IsSuccess: true, Message: "Authentication successful" });
  } catch (error) {
    await t.rollback();
    console.log("error", error);
    res
      .status(500)
      .json({
        IsSuccess: false,
        error_log: error,
        Message: constants.INTERNAL_SERVER_ERROR,
      });
  }
});

router.put("/edit", withAuthentication(), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const params = req.body;

    const sessionExists = await Sessions.findOne({
      where: { user_id: params.userId },
      order: [["created_at", "DESC"]],
    });

    let editedProfile = await Sessions.update(
      {
        isLoggedIn: false,
        isExpired: true,
      },
      {
        where: { id: sessionExists.dataValues.id },
      }
    );
    await t.commit();
    res.status(200).json({ IsSuccess: true, Message: "Logout successful" });
  } catch (error) {
    await t.rollback();
    console.log('error==>', error);
    res
      .status(500)
      .json({
        IsSuccess: false,
        error_log: error,
        Message: constants.INTERNAL_SERVER_ERROR,
      });
    }
});

module.exports = router;