const crypto = require('crypto');
const connectToDatabase = require("../models/index");
const sequelize = require('../lib/database');
const userServices = require('../services/users');
const constants = require('../lib/constants');
const Customers = require('../models/customers');
const CustomerLocationAssignments = require('../models/customer_location_assignment');

module.exports = {
  createApiKey: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const generateApiKey = () => crypto.randomBytes(32).toString('hex');
      const generateApiSecret = () => crypto.randomBytes(40).toString('hex');

      const apiKey = generateApiKey();
      const apiSecret = generateApiSecret();
      // const hashedSecret = crypto.createHash('sha256').update(apiSecret).digest('hex');
      
      let fronteggTenantId;
      let customer = await Customers.findOne({where: {cust_id: params.cust_id}});        
      fronteggTenantId = customer.dataValues.frontegg_tenant_id;

      const frontEggUser = await userServices.createFrontEggAppUser(params.frontegg_tenant_id || fronteggTenantId, params);
      const { ApiKeys, CustomerLocationAssignments } = await connectToDatabase();
      params.key = apiKey;
      // params.secret = apiSecret;
      // params.hashedSecret = hashedSecret;
      params.frontegg_tenant_id = params.frontegg_tenant_id == null ? fronteggTenantId : params.frontegg_tenant_id;
      params.frontegg_user_id = frontEggUser.id;
      params.cust_id = params.cust_id;
      params.location = params.location;
      let apiKeyCreated;
      if(frontEggUser) apiKeyCreated = await ApiKeys.create(params, { transaction: t });
      if(apiKeyCreated) {
        const locsToAdd = params.location.map((_) => {
          return {
            loc_id: _.loc_id,
            cust_id: params.cust_id,
            api_key_id: apiKeyCreated.id
          };
        });
        
        await CustomerLocationAssignments.bulkCreate(locsToAdd, {
          transaction: t,
        });
      }

      if (apiKeyCreated) {
        
        apiKeyCreated.dataValues.secret = apiSecret;
        await t.commit(); // Commit the transaction
        return res.status(201).json({
          data: apiKeyCreated,
          Message: "API Key created successfully",
        }); // Return to end the response cycle
      }

      await t.rollback(); // Rollback the transaction in case of failure
      res.status(400).json({ error: "API key creation failed" });
    } catch (error) {
      await t.rollback(); // Rollback the transaction in case of error
      res.status(500).json({ err: error });
    } finally {
      next();
    }
  },

  editApiKey: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const { ApiKeys } = await connectToDatabase();

      const apiKeyUpdated = await ApiKeys.update(params, {where: {id: params.id}}, { transaction: t });
      if (apiKeyUpdated) await userServices.updateFrontEggAppUser(params.frontegg_tenant_id, params);

      if (apiKeyUpdated) {
        await t.commit(); // Commit the transaction
        return res.status(200).json({
          data: apiKeyUpdated,
          Message: "API Key details update successfully",
        }); // Return to end the response cycle
      }

      await t.rollback(); // Rollback the transaction in case of failure
      res.status(400).json({ error: "API key creation failed" });
    } catch (error) {
      await t.rollback(); // Rollback the transaction in case of error
      res.status(500).json({ err: error });
    } finally {
      next();
    }
  },

  changeApiKeyStatus: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const { ApiKeys } = await connectToDatabase();

      const updateKeyStatus = await ApiKeys.update(
        { status: params.status },
        { where: { id: params.id } },
        { transaction: t }
      );

      if (updateKeyStatus) {
        await t.commit(); // Commit the transaction
        return res
          .status(200)
          .json({
            data: updateKeyStatus,
            Message: "Key status updated successfully",
          }); // Return to end the response cycle
      }

      await t.rollback(); // Rollback the transaction in case of failure
      res.status(400).json({ error: "API key update failed" });
    } catch (error) {
      await t.rollback(); // Rollback the transaction in case of error
      res.status(500).json({ err: error });
    } finally {
      next();
    }
  },

  validateApiKey: async (req, res, next) => {
    // const apiKey = req.headers['x-api-key'];
    const {api_key, api_secret} = req.body;
    const { ApiKeys } = await connectToDatabase();
    if (!api_key || !api_secret) {
      return res.status(401).json({ Message: 'API key and secret are required'  });
    }
  
    // Assuming a function getApiKeyDetails exists to fetch API key details from the database
    const keyDetails = await ApiKeys.findOne(
      { where: { key: api_key } }
    );
    if (!keyDetails || keyDetails.status == 'disabled') {
      return res.status(403).json({ Message: 'Invalid or inactive API key' });
    }
  
    // if (keyDetails.expires_at && new Date() > keyDetails.expires_at) {
    //   return res.status(403).json({ message: 'API key expired' });
    // }
    const isValidSecret = keyDetails.secret === api_secret;

    if (!isValidSecret) {
      return res.status(403).json({ Message: 'Invalid API secret' });
    }
    // Check if the key has permissions for the requested endpoint
    const endpoint = req.originalUrl;
    if (!keyDetails.allowed_endpoints.includes(endpoint)) {
      return res.status(403).json({ Message: 'API key does not have access to this endpoint' });
    }
  
    req.api_key = keyDetails;
    next();
    // res.status(200).json({Message: "Validated!"})
  },

  getToken: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { api_key, api_secret } = req.body;
      const { ApiKeys } = await connectToDatabase();
      if (!api_key || !api_secret) {
        return res.status(401).json({ Message: 'API key and secret are required'  });
      }
    
      // Assuming a function getApiKeyDetails exists to fetch API key details from the database
      const keyDetails = await ApiKeys.findOne(
        { where: { key: api_key } }
      );
      if (!keyDetails || keyDetails.status == 'disabled') {
        return res.status(403).json({ Message: 'Invalid or inactive API key' });
      }
    
      // if (keyDetails.expires_at && new Date() > keyDetails.expires_at) {
      //   return res.status(403).json({ message: 'API key expired' });
      // }
      // const isValidSecret = keyDetails.secret === api_secret;
  
      // if (!isValidSecret) {
      //   return res.status(403).json({ Message: 'Invalid API secret' });
      // }
      const token = await userServices.createFrontEggUserAccessToken(keyDetails.dataValues.frontegg_tenant_id, keyDetails.dataValues.frontegg_user_id)
      if (token) {
        t.commit();
        res.status(200).json({ Data: { secret: token }, Message: "Token retrieved successfully" })
      }
    } catch (error) {
      await t.rollback();
      console.log('err', error);
      res.status(500).json({ err: error });
    }
  },

  // No Longer in use
  getNewJWTToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const newJwt = await userServices.createNewJWTToken(refreshToken)
      res.status(200).json({
        data: newJwt,
      });
    } catch (error) {
      res.status(500).json({Message: constants.INTERNAL_SERVER_ERROR, err: error});
    }
  },

  getApiKeyList: async (req, res, next) => {
    const { ApiKeys, CustomerLocations } = await connectToDatabase();

    let keyList = await ApiKeys.findAll({
      include: [
        {
          model: CustomerLocations,
          as: 'api_key_locations'
        }
      ]
    });
    return res.status(200).json({
      data: keyList,
      count: keyList.length
    });
  },

  getLatestRecord: async (req, res, next) => {
    const { ApiKeys, CustomerLocations } = await connectToDatabase();

    let keyList = await ApiKeys.findAll({
      limit: 1,
      order: [ [ 'createdAt', 'DESC' ]],
      include: [
        {
          model: CustomerLocations,
          as: 'api_key_locations'
        }
      ]
    });
    return res.status(200).json({
      data: keyList,
    });
  },

  deleteApiKey: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { id, frontegg_user_id } = req.body;
      const { ApiKeys } = await connectToDatabase();
      let deleteKey = await ApiKeys.destroy(
        { where: { id: id }, raw: true }, 
        { transaction: t }
      );
      await CustomerLocationAssignments.destroy(
        { where: { api_key_id: id } },
        { transaction: t }
      );
      if(deleteKey) {
        await userServices.removeFrontEggUser(frontegg_user_id);
      }
      await t.commit();
      res.status(200).json({
        data: deleteKey,
        Message: "Key Deleted Successfully"
      });
    } catch (error) {
      await t.rollback(); // Rollback the transaction in case of error
      console.log('err', error);
      
      res.status(500).json({ err: error, Message: error.message });
    } finally {
      next();
    }
  }
};