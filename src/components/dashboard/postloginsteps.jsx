/* eslint-disable no-unused-vars */
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Checkbox,
  Grid,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import SubscriptionTable from '../billing/subscriptiontable';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../billing/CheckoutForm';
import { loadStripe } from '@stripe/stripe-js';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const STEPS = ['Terms & Conditions', 'Subscription Details'];

const PostLoginSteps = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionRows, setSubscriptionRows] = useState([]);
  const [checked, setChecked] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [products, setProducts] = useState();
  const [custData, setCustData] = useState();
  const stripe_cust_id = authCtx.user.stripe_cust_id;

  useEffect(() => {
    listSubscriptions();
  }, []);

  const stripePromise = loadStripe(
    'pk_test_51OGEnKERJiP7ChzSM3d7ey4jza1QvU6Ch040MDBMpVxqG656ytQip6v9f4vsYi4Zsfz09S1AFyVrOZYo9J3t0Vfi00Mu9LPpdw'
  );

  const listSubscriptions = () => {
    setIsLoading(true);
    API.get('payment/list-subscriptions', {
      params: { stripe_cust_id: stripe_cust_id, cust_id: localStorage.getItem('cust_id') }
    }).then((response) => {
      if (response.status === 200) {
        let mappedSubscriptionRes = response.data.data.subscriptionsFromDB.map((item) => ({
          Type: item.product_name,
          Number: item.quantity,
          NextInvoiceDate: item.ends_at.split('T')[0],
          Charge: item.stripe_price,
          Status: item.stripe_status
        }));
        setSubscriptionRows(mappedSubscriptionRes);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
    });
  };

  const handleCheckChange = () => {
    setChecked(!checked);
  };

  const handleSubmit = () => {
    if (!checked) {
      setShowMessage(true);
    } else {
      switch (activeStep) {
        case 0:
        case 1:
          setActiveStep(activeStep + 1);
          break;
      }
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box display={'flex'} justifyContent={'center'}>
            <Grid container spacing={2} width={'70%'}>
              <Box
                sx={{
                  backgroundColor: '#fff',
                  padding: '36px 48px',
                  borderRadius: '20px',
                  marginTop: 3
                }}>
                <Typography variant="h4">Terms & Conditions</Typography>
                <Box padding={'10px 0px'}>
                  <Typography fontWeight={300}>Last updated on February 12, 2024</Typography>
                </Box>
                <Typography variant="h6" className="t-n-c-title">
                  Accounts and membership
                </Typography>
                <Typography variant="body2">
                  If you create an account on the Services, you are responsible for maintaining the
                  security of your account and you are fully responsible for all activities that
                  occur under the account and any other actions taken in connection with it. We may
                  monitor and review new accounts before you may sign in and start using the
                  Services. Providing false contact information of any kind may result in the
                  termination of your account. You must immediately notify us of any unauthorized
                  uses of your account or any other breaches of security. We will not be liable for
                  any acts or omissions by you, including any damages of any kind incurred as a
                  result of such acts or omissions. We may suspend, disable, or delete your account
                  (or any part thereof) if we determine that you have violated any provision of this
                  Agreement or that your conduct or content would tend to damage our reputation and
                  goodwill. If we delete your account for the foregoing reasons, you may not
                  re-register for our Services. We may block your email address and Internet
                  protocol address to prevent further registration.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Billing and payments
                </Typography>
                <Typography variant="body2">
                  You shall pay all fees or charges to your account in accordance with the fees,
                  charges, and billing terms in effect at the time a fee or charge is due and
                  payable. If auto-renewal is enabled for the Services you have subscribed for, you
                  will be charged automatically in accordance with the term you selected. If, in our
                  judgment, your purchase constitutes a high-risk transaction, we will require you
                  to provide us with a copy of your valid government-issued photo identification,
                  and possibly a copy of a recent bank statement for the credit or debit card used
                  for the purchase. We reserve the right to change products at any time. We also
                  reserve the right to refuse any order you place with us. We may, in our sole
                  discretion, limit or cancel quantities purchased per person, per household or per
                  order. These restrictions may include orders placed by or under the same customer
                  account, the same credit card, and/or orders that use the same billing and/or
                  shipping address. In the event that we make a change to or cancel an order, we may
                  attempt to notify you by contacting the e-mail and/or billing address/phone number
                  provided at the time the order was made.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Accuracy of information
                </Typography>
                <Typography variant="body2">
                  Occasionally there may be information on the Services that contains typographical
                  errors, inaccuracies or omissions that may relate to product descriptions,
                  pricing, promotions and offers. We reserve the right to correct any errors,
                  inaccuracies or omissions, and to change or update information or cancel orders if
                  any information on the Services or Services is inaccurate at any time without
                  prior notice (including after you have submitted your order). We undertake no
                  obligation to update, amend or clarify information on the Services including,
                  without limitation, pricing information, except as required by law. No specified
                  update or refresh date applied on the Services should be taken to indicate that
                  all information on the Services or Services has been modified or updated.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Uptime guarantee
                </Typography>
                <Typography variant="body2">
                  We offer a Service uptime guarantee of 99% of available time per month. If we fail
                  to maintain this service uptime guarantee in a particular month (as solely
                  determined by us), you may contact us and request a credit off your Service fee
                  for that month. The credit may be used only for the purchase of further products
                  and services from us, and is exclusive of any applicable taxes. The service uptime
                  guarantee does not apply to service interruptions caused by: (1) periodic
                  scheduled maintenance or repairs we may undertake from time to time; (2)
                  interruptions caused by you or your activities; (3) outages that do not affect
                  core Service functionality; (4) causes beyond our control or that are not
                  reasonably foreseeable; and (5) outages related to the reliability of certain
                  programming environments.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Links to other resources
                </Typography>
                <Typography variant="body2">
                  Although the Services may link to other resources (such as websites, mobile
                  applications, etc.), we are not, directly or indirectly, implying any approval,
                  association, sponsorship, endorsement, or affiliation with any linked resource,
                  unless specifically stated herein. We are not responsible for examining or
                  evaluating, and we do not warrant the offerings of, any businesses or individuals
                  or the content of their resources. We do not assume any responsibility or
                  liability for the actions, products, services, and content of any other third
                  parties. You should carefully review the legal statements and other conditions of
                  use of any resource which you access through a link on the Services. Your linking
                  to any other off-site resources is at your own risk.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Prohibited uses
                </Typography>
                <Typography variant="body2">
                  In addition to other terms as set forth in the Agreement, you are prohibited from
                  using the Services or Content: (a) for any unlawful purpose; (b) to solicit others
                  to perform or participate in any unlawful acts; (c) to violate any international,
                  federal, provincial or state regulations, rules, laws, or local ordinances; (d) to
                  infringe upon or violate our intellectual property rights or the intellectual
                  property rights of others; (e) to harass, abuse, insult, harm, defame, slander,
                  disparage, intimidate, or discriminate based on gender, sexual orientation,
                  religion, ethnicity, race, age, national origin, or disability; (f) to submit
                  false or misleading information; (g) to upload or transmit viruses or any other
                  type of malicious code that will or may be used in any way that will affect the
                  functionality or operation of the Services, third party products and services, or
                  the Internet; (h) to spam, phish, pharm, pretext, spider, crawl, or scrape; (i)
                  for any obscene or immoral purpose; or (j) to interfere with or circumvent the
                  security features of the Services, third party products and services, or the
                  Internet. We reserve the right to terminate your use of the Services for violating
                  any of the prohibited uses.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Intellectual property rights
                </Typography>
                <Typography variant="body2">
                  “Intellectual Property Rights” means all present and future rights conferred by
                  statute, common law or equity in or in relation to any copyright and related
                  rights, trademarks, designs, patents, inventions, goodwill and the right to sue
                  for passing off, rights to inventions, rights to use, and all other intellectual
                  property rights, in each case whether registered or unregistered and including all
                  applications and rights to apply for and be granted, rights to claim priority
                  from, such rights and all similar or equivalent rights or forms of protection and
                  any other results of intellectual activity which subsist or will subsist now or in
                  the future in any part of the world. This Agreement does not transfer to you any
                  intellectual property owned by ZOOMiN Live or third parties, and all rights,
                  titles, and interests in and to such property will remain (as between the parties)
                  solely with ZOOMiN Live. All trademarks, service marks, graphics and logos used in
                  connection with the Services, are trademarks or registered trademarks of ZOOMiN
                  Live or its licensors. Other trademarks, service marks, graphics and logos used in
                  connection with the Services may be the trademarks of other third parties. Your
                  use of the Services grants you no right or license to reproduce or otherwise use
                  any of ZOOMiN Live or third party trademarks.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Limitation of liability
                </Typography>
                <Typography variant="body2">
                  To the fullest extent permitted by applicable law, in no event will ZOOMiN Live,
                  its affiliates, directors, officers, employees, agents, suppliers or licensors be
                  liable to any person for any indirect, incidental, special, punitive, cover or
                  consequential damages (including, without limitation, damages for lost profits,
                  revenue, sales, goodwill, use of content, impact on business, business
                  interruption, loss of anticipated savings, loss of business opportunity) however
                  caused, under any theory of liability, including, without limitation, contract,
                  tort, warranty, breach of statutory duty, negligence or otherwise, even if the
                  liable party has been advised as to the possibility of such damages or could have
                  foreseen such damages. To the maximum extent permitted by applicable law, the
                  aggregate liability of ZOOMiN Live and its affiliates, officers, employees,
                  agents, suppliers and licensors relating to the services will be limited to an
                  amount no greater than one dollar or any amounts actually paid in cash by you to
                  ZOOMiN Live for the prior one month period prior to the first event or occurrence
                  giving rise to such liability. The limitations and exclusions also apply if this
                  remedy does not fully compensate you for any losses or fails of its essential
                  purpose.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Indemnification
                </Typography>
                <Typography variant="body2">
                  You agree to indemnify and hold ZOOMiN Live and its affiliates, directors,
                  officers, employees, agents, suppliers and licensors harmless from and against any
                  liabilities, losses, damages or costs, including reasonable attorneys’ fees,
                  incurred in connection with or arising from any third party allegations, claims,
                  actions, disputes, or demands asserted against any of them as a result of or
                  relating to your Content, your use of the Services or any willful misconduct on
                  your part.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Changes and amendments
                </Typography>
                <Typography variant="body2">
                  We reserve the right to modify this Agreement or its terms related to the Services
                  at any time at our discretion. When we do, we will revise the updated date at the
                  bottom of this page, send you an email to notify you. We may also provide notice
                  to you in other ways at our discretion, such as through the contact information
                  you have provided.
                </Typography>
                <Typography variant="body2">
                  An updated version of this Agreement will be effective immediately upon the
                  posting of the revised Agreement unless otherwise specified. Your continued use of
                  the Services after the effective date of the revised Agreement (or such other act
                  specified at that time) will constitute your consent to those changes.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Acceptance of these terms
                </Typography>
                <Typography variant="body2">
                  You acknowledge that you have read this Agreement and agree to all its terms and
                  conditions. By accessing and using the Services you agree to be bound by this
                  Agreement. If you do not agree to abide by the terms of this Agreement, you are
                  not authorized to access or use the Services.
                </Typography>
                <Typography variant="h6" className="t-n-c-title">
                  Contacting us
                </Typography>
                <Typography variant="body2">
                  If you have any questions, concerns, or complaints regarding this Agreement, we
                  encourage you to contact us using the details below:
                </Typography>
                <Stack direction={'row'} gap={1} className="t-n-c-title">
                  <MailOutlineIcon />
                  <a href="mailto:support@zoominlive.com">support@zoominlive.com</a>
                </Stack>
              </Box>
              <Stack direction="row" justifyContent="space-between" width="100%" marginTop={3}>
                {activeStep == 0 && (
                  <Stack alignItems={'center'} direction={'row'} width={'100%'}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={checked}
                      onChange={handleCheckChange}
                    />
                    I Agree to All Terms & Conditions
                  </Stack>
                )}
                <Stack direction="row" justifyContent="flex-end" width="100%">
                  <LoadingButton
                    className="add-btn accept-continue-btn"
                    loading={submitLoading}
                    loadingPosition={submitLoading ? 'start' : undefined}
                    startIcon={submitLoading && <SaveIcon />}
                    variant="text"
                    onClick={handleSubmit}
                    type="submit">
                    {activeStep === STEPS.length - 1 ? 'Finish' : 'Accept & Continue'}{' '}
                    <ArrowForwardIosIcon
                      fontSize="inherit"
                      sx={{ marginLeft: '10px', color: '#fff !important' }}
                    />
                  </LoadingButton>
                </Stack>
              </Stack>
              {showMessage && (
                <Typography color={'red'}>
                  *To continue you must agree to the terms and conditions
                </Typography>
              )}
            </Grid>
          </Box>
        );
      case 1:
        return (
          <>
            <Box className="invoice">
              <Grid container spacing={2}>
                <Grid item lg={7}>
                  <Paper className="zl__table-res">
                    <SubscriptionTable
                      rows={subscriptionRows}
                      title={'Subscriptions'}
                      isLoading={isLoading}
                      setProductsForCheckout={setProducts}
                      setCustomerDataProp={setCustData}
                    />
                  </Paper>
                </Grid>
                <Grid item lg={5}>
                  <Paper sx={{ padding: '40px', marginTop: 2 }}>
                    <Elements stripe={stripePromise}>
                      <CheckoutForm checked={checked} products={products} custData={custData} />
                    </Elements>
                  </Paper>
                </Grid>
              </Grid>
              <Stack direction="row" justifyContent="flex-end" width="100%" marginTop={3}>
                {activeStep > 0 && (
                  <Button
                    className="log-btn"
                    variant="outlined"
                    sx={{ marginRight: 1.5 }}
                    // disabled={submitLoading || isValidating}
                    onClick={handleBack}>
                    Previous Step
                  </Button>
                )}
              </Stack>
            </Box>
          </>
        );

      default:
        return <div>Not Found</div>;
    }
  };

  console.log('postlogin');
  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      <Box p={3} mx="auto">
        {renderStepContent(activeStep)}
      </Box>
    </>
  );
};

export default PostLoginSteps;

PostLoginSteps.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  customer: PropTypes.object,
  setCustomer: PropTypes.func,
  getCustomersList: PropTypes.func
};
