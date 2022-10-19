const _ = require('lodash');
const familyServices = require('../services/families');
const childServices = require('../services/children');
const userServices = require('../services/users');
module.exports = {
  createFamily: async (req, res, next) => {
    try {
      let { primary, secondary, children } = req.body;
      const userId = req.user.user_id;
      const custId = req.user.cust_id;

      //add primary parent

      primary.family_id = await familyServices.generateNewFamilyId(req.user.user_id);
      let primaryParent = await familyServices.createFamily({
        ...primary,
        user_id: userId,
        cust_id: custId
      });

      const familyId = primaryParent.family_id;

      //add secondary parent

      let secondaryParents = '';
      let createdFamily = Promise.all(
        secondary.map(async (family) => {
          const newFamily = await familyServices.createFamily({
            ...family,
            user_id: userId,
            cust_id: custId,
            family_id: familyId
          });

          return newFamily;
        })
      );
      secondaryParents = await createdFamily;

      //add children

      childServices;

      let createdChildren = Promise.all(
        children.map(async (child) => {
          const newFamily = await childServices.createChild({
            ...child,
            rooms: { rooms: child.rooms },
            family_id: familyId
          });

          return newFamily;
        })
      );
      children = await createdChildren;

      res.status(201).json({
        IsSuccess: true,
        Data: { primaryParent, secondaryParents, children },
        Message: 'New  Family Created'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message === 'Validation error' ? 'Email already exist' : error.message
      });
      next(error);
    }
  },

  editFamily: async (req, res, next) => {
    try {
      const params = req.body;
      let emailExist = false;
      const familyMember = await familyServices.getFamilyMember(params.family_member_id);

      if (params.email !== familyMember.email) {
        emailExist = await userServices.checkEmailExist(params.email);
      }

      if (emailExist) {
        res.status(409).json({
          IsSuccess: false,
          Data: {},
          Message: 'Email already exist'
        });
      } else {
        const editedFamily = await familyServices.editFamily(params);

        if (editedFamily) {
          res.status(200).json({
            IsSuccess: true,
            Data: editedFamily,
            Message: 'family details updated'
          });
        } else {
          res.status(404).json({
            IsSuccess: false,
            Data: {},
            Message: 'family member not found'
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message === 'Validation error' ? 'Email already exist' : error.message
      });
      next(error);
    }
  },

  getAllFamilyDetails: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        searchBy: req.query?.searchBy.replace(/'/g, "\\'"),
        roomsList: req.query?.rooms,
        location: req.query?.location
      };
      let familyDetails = await familyServices.getAllFamilyDetails(req.user.user_id, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: familyDetails,
        Message: `All the family's details for user:${req.user.first_name}`
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  addParent: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id;
      params.user_id = req.user.user_id;

      let emailExist = await userServices.checkEmailExist(params.email);

      if (emailExist) {
        res.status(409).json({
          IsSuccess: false,
          Data: {},
          Message: 'Email already exist'
        });
      } else {
        const parent = await familyServices.createFamily(params);

        res.status(201).json({
          IsSuccess: true,
          Data: parent,
          Message: 'New parent added'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  }
};
