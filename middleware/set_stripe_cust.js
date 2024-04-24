const connectToDatabase = require('../models/index');

module.exports = async function (req, res, next) {
  const { Customers } = await connectToDatabase();
  const cust_id = req.query.cust_id || req.body.cust_id;

  try {
    let stripe_customer_id;
    if(cust_id && req.user.role == 'Super Admin'){
      let customer = await Customers.findOne({ where: { cust_id: cust_id } });
      stripe_customer_id = customer.dataValues.stripe_cust_id;
      req.query.stripe_cust_id = stripe_customer_id
      req.body.stripe_cust_id = stripe_customer_id
    } 
    if(req.user.role == 'Admin') {
      let customer = await Customers.findOne({ where: { cust_id: req.user.cust_id } });
      stripe_customer_id = customer.dataValues.stripe_cust_id;
      req.query.stripe_cust_id = stripe_customer_id
      req.body.stripe_cust_id = stripe_customer_id
    }
    next();
  } catch (e) {
    console.log('error_log : ', e);
    return res.status(401).json({
      IsSuccess: true,
      Data: { error: e },
      Message: 'Err in the middleware'
    });
  }
};