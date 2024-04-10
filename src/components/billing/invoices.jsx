/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useRef, useState } from 'react';
import LayoutContext from '../../context/layoutcontext';
import AuthContext from '../../context/authcontext';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  TextareaAutosize,
  Typography
} from '@mui/material';
import LinerLoader from '../common/linearLoader';
import SubscriptionTable from './subscriptiontable';
import { Plus } from 'react-feather';
import AccountBalance from '../../assets/account_balance.svg';
import AccountBalanceBottomRight from '../../assets/account_balance_bottom_right.svg';
import NextChargeDate from '../../assets/next_charge_date.svg';
import NextChargeDateBottomRight from '../../assets/next_charge_date_bottom_right.svg';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import moment from 'moment';
import PropTypes from 'prop-types';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import InvoiceDrawer from './invoicedrawer';
import { Elements } from '@stripe/react-stripe-js';
import DisputeActions from './disputeactions';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import visa_png from '../../assets/visa_png.png';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import NoDataDiv from '../common/nodatadiv';
// import ViewersTable from '../dashboard/viewerstable';

const SubscriptionColumns = [
  { label: 'Type', width: '60%' },
  { label: 'Number', width: '20%' },
  { label: 'Charge', width: '20%' }
  // { label: 'Status', width: '25%' }
];

const invoiceList = [
  {
    invoice_date: 'Dec 21, 2023',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    method: 'Credit Card',
    amount: '$257.50',
    status: 'Paid'
  },
  {
    invoice_date: 'Dec 27, 2023',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    method: 'Debit Card',
    amount: '$257.50',
    status: 'Outstanding'
  },
  {
    invoice_date: 'Dec 21, 2023',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    method: 'Credit Card',
    amount: '$257.50',
    status: 'Paid'
  },
  {
    invoice_date: 'Dec 21, 2023',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    method: 'Debit Card',
    amount: '$257.50',
    status: 'Outstanding'
  },
  {
    invoice_date: 'Dec 21, 2023',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    method: 'Debit Card',
    amount: '$257.50',
    status: 'Outstanding'
  }
];

const stripePromise = loadStripe(
  'pk_test_51OGEnKERJiP7ChzSM3d7ey4jza1QvU6Ch040MDBMpVxqG656ytQip6v9f4vsYi4Zsfz09S1AFyVrOZYo9J3t0Vfi00Mu9LPpdw'
);

const Invoices = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [backupCardDetails, setBackupCardDetails] = useState(null);
  const [billingDetails, setBillingDetails] = useState(null);
  const [paymentMethodDetails, setPaymentMethodDetails] = useState(null);
  const [backupPaymentMethodDetails, setBackupPaymentMethodDetails] = useState(null);
  const [isDatePickerOpen1, setIsDatePickerOpen1] = useState(false);
  const [isDatePickerOpen2, setIsDatePickerOpen2] = useState(false);
  const [fromDate, setFromDate] = useState(moment().subtract(7, 'days'));
  const [toDate, setToDate] = useState(moment().subtract(7, 'days'));
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [isInvoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [isDisputeFormDialogOpen, setIsDisputeFormDialogOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const [subscriptionRows, setSubscriptionRows] = useState([]);
  const [invoiceList, setInvoiceList] = useState([]);
  const [invoice, setInvoice] = useState();
  const [invoicePayload, setInvoicePayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    status: 'All',
    method: 'All'
  });

  const ref = useRef(null);
  const stripe_cust_id = authCtx.user.stripe_cust_id;
  const cust_id = authCtx.user.cust_id;

  const currentDate = new Date();

  // Get the year and month from the current date
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Create a new Date object for the first day of the next month
  const firstDayOfNextMonth = new Date(year, month + 1, 1);
  const formattedDate = firstDayOfNextMonth.toDateString();

  useEffect(() => {
    // Retrieve Customer's Payment Method
    getCustPaymentMethod();
    listSubscriptions();
    listInvoice();
  }, [invoicePayload]);

  useEffect(() => {
    setHeight(ref.current.clientHeight);
    setCardHeight(ref.current.clientHeight / 2 - 16);
  }, []);

  useEffect(() => {
    layoutCtx.setActive(10);
    layoutCtx.setBreadcrumb(['Billing Account', 'Manage your all the paid, unpaid bills']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setInvoicePayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setInvoicePayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  console.log('height-->', height);
  console.log('authCtx.user-->', authCtx.user);
  const Row = ({ row }) => {
    const { invoice_date, description, payment_method, amount_paid, amount_due, status } = row;
    return (
      <>
        <TableRow hover>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center">
              <Checkbox />
              <Typography>{`${moment(invoice_date).format('MM-DD-YYYY')}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell
            align="left"
            onClick={() => {
              setInvoiceDrawerOpen(true);
              setInvoice(row);
            }}>
            {/* <Stack direction="row"> */}
            <Typography>{description ? description : 'no description'}</Typography>
            {/* </Stack> */}
          </TableCell>
          <TableCell
            align="left"
            onClick={() => {
              setInvoiceDrawerOpen(true);
              setInvoice(row);
            }}>
            {/* <Stack direction="row"> */}
            <Typography>
              {payment_method == 'debit'
                ? 'Debit Card'
                : payment_method == 'credit'
                ? 'Credit Card'
                : payment_method}
            </Typography>
            {/* </Stack> */}
          </TableCell>
          <TableCell
            align="left"
            onClick={() => {
              setInvoiceDrawerOpen(true);
              setInvoice(row);
            }}>
            {/* <Stack direction="row"> */}
            <Typography>
              {status == 'paid'
                ? '$' + ' ' + parseFloat(amount_paid).toFixed(2)
                : '$' + ' ' + parseFloat(amount_due).toFixed(2)}
            </Typography>
            {/* </Stack> */}
          </TableCell>
          <TableCell
            align="left"
            onClick={() => {
              setInvoiceDrawerOpen(true);
              setInvoice(row);
            }}>
            {/* <Stack direction="row"> */}
            <Chip
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              className={`${status == 'Paid' ? 'paid' : 'outstanding'}-chip-color`}
            />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="left">
            {status !== 'paid' && (
              <Button className="add-button btn-radius" variant="contained">
                {'Pay Now'}
              </Button>
            )}
          </TableCell>
          <TableCell align="right">
            <DisputeActions setIsDisputeFormDialogOpen={setIsDisputeFormDialogOpen} />
          </TableCell>
        </TableRow>
      </>
    );
  };

  Row.propTypes = {
    row: PropTypes.shape({
      invoice_date: PropTypes.string,
      description: PropTypes.string,
      payment_method: PropTypes.string,
      amount_paid: PropTypes.number,
      amount_due: PropTypes.number,
      status: PropTypes.string
    })
  };

  const getCustPaymentMethod = () => {
    setIsLoading(true);
    API.get('payment/list-customer-payment-method', {
      params: { stripe_cust_id: stripe_cust_id, cust_id: localStorage.getItem('cust_id') }
    }).then((response) => {
      if (response.status === 200) {
        setCustomerDetails(response.data.customerDetails);
        setCardDetails({
          ...response.data.defaultCard[0]?.card,
          billingDetails: response.data.defaultCard[0]?.billing_details
        });
        setBackupCardDetails({
          ...response.data.backupCard[0]?.card,
          name: response.data.backupCard[0]?.billing_details.name,
          id: response.data.backupCard[0]?.id
        });
        setBillingDetails(response.data.data.data[0].billing_details);
        setPaymentMethodDetails(response.data.data.data[0]);
        setBackupPaymentMethodDetails(response.data.backupCard[0]);
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

  const listInvoice = () => {
    setIsLoading(true);
    API.get('payment/list-invoice', {
      params: {
        ...invoicePayload,
        stripe_cust_id: stripe_cust_id,
        cust_id: localStorage.getItem('cust_id')
      }
    }).then((response) => {
      if (response.status === 200) {
        setInvoiceList(response.data.invoiceFromDB);
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

  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const handleFormDialogClose = () => {
    setPaymentDialogOpen(false);
    setIsDisputeFormDialogOpen(false);
  };

  const handleRemoveCard = (type) => {
    // Retrieve Customer's Payment Method
    setIsLoading(true);
    API.post('payment/detach-payment-method', {
      pm_id: type == 'default' ? paymentMethodDetails.id : backupCardDetails.id
    }).then((response) => {
      if (response.status === 200) {
        getCustPaymentMethod();
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
    });
  };

  const handleStatusChange = (event) => {
    setInvoicePayload((prevPayload) => ({ ...prevPayload, status: event.target.value }));
  };

  const handleMethodChange = (event) => {
    setInvoicePayload((prevPayload) => ({ ...prevPayload, method: event.target.value }));
  };

  const handleMakePrimary = () => {
    setIsLoading(true);
    API.put('payment/update-customer', {
      userId: authCtx.user.stripe_cust_id,
      paymentMethodID: backupPaymentMethodDetails.id,
      cust_id: localStorage.getItem('cust_id')
    }).then((response) => {
      if (response.status === 200) {
        getCustPaymentMethod();
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
  return (
    <>
      <Box className="invoice">
        <LinerLoader loading={isLoading} />
        <Grid container spacing={3}>
          <Grid item md={12} sm={12} xs={12} lg={4.5}>
            <Paper sx={{ marginTop: 2, height: '96%' }} className="zl__table-res">
              <SubscriptionTable
                rows={subscriptionRows}
                columns={SubscriptionColumns}
                title={'Subscriptions'}
                isLoading={isLoading}
              />
            </Paper>
          </Grid>
          <Grid item md={12} sm={12} xs={12} lg={4}>
            <Paper sx={{ marginTop: 2, height: '96%' }} className="zl__table-res">
              <Paper sx={{ marginTop: 2, height: '96%', minHeight: '338px', boxShadow: 'unset' }}>
                <Box className="zl__table-block listing-wrapper">
                  <Stack direction={'row'} justifyContent={'space-between'}>
                    <Typography style={{ padding: '20px 14px' }}>Default Payment Method</Typography>
                    {/* {cardDetails && cardDetails?.billingDetails !== undefined && (
                      <Button
                        disableRipple
                        disableFocusRipple
                        sx={{ textTransform: 'none', ':hover': { backgroundColor: 'transparent' } }}
                        onClick={() => handleRemoveCard('default')}>
                        Remove
                      </Button>
                    )} */}
                  </Stack>
                  <Stack direction={'column'} justifyContent={'space-between'} gap={2}>
                    {cardDetails && cardDetails?.billingDetails !== undefined ? (
                      <Stack>
                        <Paper
                          sx={{
                            background:
                              'linear-gradient(180deg, #4F5BAE 0%, #19257B 100%), linear-gradient(0deg, #EBE8FF, #EBE8FF)',
                            height: '125px',
                            padding: '24px'
                          }}>
                          <Stack direction={'row'} justifyContent={'space-between'}>
                            <img src={visa_png} alt="visa" />
                            <Typography
                              sx={{
                                fontSize: '16px !important',
                                fontWeight: '400 !important',
                                lineHeight: '22px',
                                color: '#FFFFFF !important'
                              }}>
                              {cardDetails?.funding === 'credit'
                                ? 'Credit Card'
                                : cardDetails?.funding === 'debit'
                                ? 'Dedit Card'
                                : `${cardDetails?.funding}`}
                            </Typography>
                          </Stack>
                          <Stack marginTop={3}>
                            <Typography
                              sx={{
                                fontSize: '16px !important',
                                fontWeight: '400 !important',
                                lineHeight: '22px',
                                color: '#FFFFFF !important',
                                opacity: '60% !important'
                              }}>
                              {cardDetails?.billingDetails?.name}
                            </Typography>
                          </Stack>
                          <Stack>
                            <Typography
                              sx={{
                                fontSize: '20px !important',
                                fontWeight: '500 !important',
                                lineHeight: '28px',
                                color: '#FFFFFF !important'
                              }}>
                              {`#### #### #### ${cardDetails?.last4}`}
                            </Typography>
                          </Stack>
                        </Paper>
                      </Stack>
                    ) : (
                      <>
                        <Box
                          display={'flex'}
                          alignItems={'center'}
                          justifyContent={'center'}
                          marginTop={'50px'}>
                          <Stack
                            alignItems="center"
                            justifyContent="center"
                            sx={{ paddingTop: 2, color: '#8E8E8E' }}
                            gap={2}>
                            <Typography variant="caption" sx={{ fontSize: '20px' }}>
                              No payment method is selected
                            </Typography>
                            <Button
                              className="add-payment-button"
                              variant="contained"
                              startIcon={<Plus />}
                              onClick={() => setPaymentDialogOpen(true)}>
                              {' '}
                              Add Payment Method
                            </Button>
                          </Stack>
                        </Box>
                      </>
                    )}
                    <Stack width={'100%'}>
                      <Box
                        sx={{
                          border: '1px solid #EBE8FF !important',
                          borderRadius: '15px !important',
                          padding: '20px 16px !important'
                        }}>
                        <Stack
                          direction={'row'}
                          justifyContent={'space-between'}
                          gap={2}
                          alignItems={'center'}>
                          <Stack>
                            {backupCardDetails !== undefined &&
                              backupCardDetails?.id !== undefined && (
                                <Typography
                                  sx={{
                                    fontSize: '14px !important',
                                    fontWeight: '500 !important'
                                  }}>
                                  {backupCardDetails?.name}
                                </Typography>
                              )}
                            <Typography
                              sx={{
                                fontSize: '14px !important',
                                fontWeight: '400 !important',
                                color: '#998E8E !important',
                                lineHeight: '1.5 !important'
                              }}>
                              Backup Payment Method
                            </Typography>
                          </Stack>
                          {backupCardDetails !== undefined &&
                          backupCardDetails?.id !== undefined ? (
                            <Stack>
                              <Typography
                                sx={{
                                  fontSize: '14px !important',
                                  fontWeight: '500 !important'
                                }}>
                                {`#### #### #### ${backupCardDetails?.last4}`}
                              </Typography>
                              <Stack direction={'row'} gap={1}>
                                <Button
                                  disableRipple
                                  onClick={handleMakePrimary}
                                  sx={{
                                    justifyContent: 'end !important',
                                    fontSize: '14px !important',
                                    letterSpacing: '0px',
                                    padding: '0px',
                                    fontWeight: '500 !important',
                                    lineHeight: '20px !important',
                                    color: '#5A53DD !important',
                                    textTransform: 'none !important',
                                    ':hover': { backgroundColor: 'transparent' }
                                  }}>
                                  Make Primary
                                </Button>
                                or
                                <Button
                                  disableRipple
                                  onClick={() => handleRemoveCard('backup')}
                                  sx={{
                                    justifyContent: 'end !important',
                                    fontSize: '14px !important',
                                    letterSpacing: '0px',
                                    minWidth: '0px',
                                    padding: '0px',
                                    fontWeight: '500 !important',
                                    lineHeight: '20px !important',
                                    color: '#5A53DD !important',
                                    textTransform: 'none !important',
                                    ':hover': { backgroundColor: 'transparent' }
                                  }}>
                                  Remove
                                </Button>
                              </Stack>
                            </Stack>
                          ) : (
                            <Button
                              disableRipple
                              onClick={() => setPaymentDialogOpen(true)}
                              sx={{
                                fontSize: '14px !important',
                                letterSpacing: '0px',
                                padding: '0px',
                                fontWeight: '500 !important',
                                lineHeight: '20px !important',
                                color: '#5A53DD !important',
                                textTransform: 'none !important',
                                ':hover': { backgroundColor: 'transparent' }
                              }}>
                              Add Backup Payment Method
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            </Paper>
          </Grid>
          <Grid item md={12} sm={12} xs={12} lg={3.5} ref={ref}>
            <Paper sx={{ marginTop: 2 }}>
              <Paper
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  height: '96%',
                  minHeight: `${cardHeight}px`,
                  boxShadow: 'unset'
                }}>
                <Box>
                  <Stack direction={'row'} spacing={3} marginLeft={4}>
                    <Box>
                      <img src={AccountBalance} alt="AccountBalance" />
                    </Box>
                    <Box display={'flex'} alignItems={'center'} justifyContent={'left'}>
                      <Stack alignItems="center" sx={{ color: '#8E8E8E' }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontSize: '16px' }}>
                            Account Balance
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '32px',
                              color: '#000000',
                              fontWeight: '600 !important',
                              lineHeight: '48px'
                            }}>
                            $0.00
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
                <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                  <img src={AccountBalanceBottomRight} alt="AccountBalanceBottomRight" />
                </Box>
              </Paper>
            </Paper>
            <Paper sx={{ marginTop: 2 }}>
              <Paper
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  height: '96%',
                  minHeight: `${cardHeight}px`,
                  boxShadow: 'unset'
                }}>
                <Box className="">
                  <Stack direction={'row'} spacing={3} marginLeft={4}>
                    <Box>
                      <img src={NextChargeDate} alt="NextChargeDate" />
                    </Box>
                    <Box display={'flex'} alignItems={'center'} justifyContent={'left'}>
                      <Stack alignItems="center" sx={{ color: '#8E8E8E' }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontSize: '16px' }}>
                            Next Charge Date
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '32px',
                              color: '#000000',
                              fontWeight: '600 !important',
                              lineHeight: '48px'
                            }}>
                            {formattedDate}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
                <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                  <img src={NextChargeDateBottomRight} alt="NextChargeDateBottomRight" />
                </Box>
              </Paper>
            </Paper>
          </Grid>
        </Grid>

        <InvoiceDrawer
          open={isInvoiceDrawerOpen}
          customer={customerDetails && customerDetails}
          row={invoice && invoice}
          setOpen={setInvoiceDrawerOpen}
          cust_id={(cust_id !== null || cust_id !== undefined) && cust_id}
        />
        {isPaymentDialogOpen && (
          <Dialog open={isPaymentDialogOpen} onClose={handleClose} fullWidth>
            <DialogTitle sx={{ padding: '40px 40px 24px 40px' }}>
              {'Payment Method'}
              <DialogContentText></DialogContentText>
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                  position: 'absolute',
                  right: 18,
                  top: 30
                }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            {isCloseDialog ? (
              <>
                <Stack direction={'row'} justifyContent={'center'} alignItems={'start'} padding={3}>
                  <DialogContentText>
                    Are you sure you want to exit before completing the wizard ?
                  </DialogContentText>
                </Stack>
                <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
                  <Stack direction="row" justifyContent="flex-end" width="100%">
                    <Button
                      className="log-btn"
                      variant="outlined"
                      sx={{ marginRight: 1.5 }}
                      onClick={() => {
                        setIsCloseDialog(false);
                      }}>
                      No
                    </Button>

                    <Button
                      id="yes-btn"
                      className="log-btn"
                      variant="outlined"
                      sx={{ marginRight: 1.5, color: '#ffff' }}
                      style={{ color: '#ffff' }}
                      onClick={() => {
                        setIsCloseDialog(false);
                        handleFormDialogClose();
                      }}>
                      Yes
                    </Button>
                  </Stack>
                </DialogActions>
              </>
            ) : (
              <DialogContent sx={{ padding: '40px' }}>
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    closeDialog={handleFormDialogClose}
                    getCustPaymentMethod={getCustPaymentMethod}
                    setIsLoading={setIsLoading}
                  />
                </Elements>
              </DialogContent>
            )}
          </Dialog>
        )}
        {isDisputeFormDialogOpen && (
          <Dialog open={isDisputeFormDialogOpen} onClose={handleClose} sx={{ padding: '40px' }}>
            <DialogTitle
              sx={{
                padding: '40px 40px 8px 40px',
                fontSize: '22px !important',
                fontWeight: '600 !important',
                lineHeight: '28px !important',
                color: '#343434 !important'
              }}>
              {'Dispute Invoice'}
              <DialogContentText></DialogContentText>
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                  position: 'absolute',
                  right: 18,
                  top: 30
                }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            {isCloseDialog ? (
              <>
                <Stack direction={'row'} justifyContent={'center'} alignItems={'start'} padding={3}>
                  <DialogContentText>
                    Are you sure you want to exit before completing the wizard ?
                  </DialogContentText>
                </Stack>
                <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
                  <Stack direction="row" justifyContent="flex-end" width="100%">
                    <Button
                      className="log-btn"
                      variant="outlined"
                      sx={{ marginRight: 1.5 }}
                      onClick={() => {
                        setIsCloseDialog(false);
                      }}>
                      No
                    </Button>

                    <Button
                      id="yes-btn"
                      className="log-btn"
                      variant="outlined"
                      sx={{ marginRight: 1.5, color: '#ffff' }}
                      style={{ color: '#ffff' }}
                      onClick={() => {
                        setIsCloseDialog(false);
                        handleFormDialogClose();
                      }}>
                      Yes
                    </Button>
                  </Stack>
                </DialogActions>
              </>
            ) : (
              <DialogContent sx={{ padding: '40px' }}>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '16px !important',
                      fontWeight: '400 !important',
                      lineHeight: '24px !important',
                      letterSpacing: '0.1px !important',
                      color: '#828282 !important'
                    }}>
                    We understand there may be concerns regarding your invoice. <br /> Please
                    provide explanation of your dispute in the space below. <br /> This will help us
                    address concerns more efficiently.
                  </Typography>
                </Box>
                <Box marginTop={3}>
                  <TextareaAutosize
                    aria-label="minimum height"
                    minRows={7}
                    placeholder="Write here"
                    className="dispute-textarea"
                    maxLength={500}
                  />
                </Box>
                <Box marginTop={5}>
                  <Button className="dispute-invoice" variant="contained">
                    Dispute Invoice
                  </Button>
                </Box>
              </DialogContent>
            )}
          </Dialog>
        )}
      </Box>
      <Box className="listing-wrapper">
        <Card className="filter">
          <CardContent>
            <Grid container alignContent={'center'}>
              <Grid item lg={7} md={7} sm={12} xs={12}>
                <Grid container spacing={2}>
                  <Grid item md={2}>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <InputLabel id="from">From</InputLabel>
                      <DesktopDatePicker
                        open={isDatePickerOpen1}
                        maxDate={moment()}
                        labelId="from"
                        autoOk={true}
                        value={fromDate}
                        inputFormat="MM/DD/YY"
                        onClose={() => setIsDatePickerOpen1(false)}
                        renderInput={(params) => (
                          <TextField onClick={() => setIsDatePickerOpen1(true)} {...params} />
                        )}
                        components={{
                          OpenPickerIcon: !isDatePickerOpen1 ? ArrowDropDownIcon : ArrowDropUpIcon
                        }}
                        onChange={(value) => {
                          setFromDate(value);
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item md={2}>
                    <InputLabel id="to">To</InputLabel>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <DesktopDatePicker
                        labelId="to"
                        open={isDatePickerOpen2}
                        maxDate={moment()}
                        value={toDate}
                        inputFormat="MM/DD/YY"
                        onClose={() => setIsDatePickerOpen2(false)}
                        renderInput={(params) => (
                          <TextField onClick={() => setIsDatePickerOpen2(true)} {...params} />
                        )}
                        components={{
                          OpenPickerIcon: !isDatePickerOpen2 ? ArrowDropDownIcon : ArrowDropUpIcon
                        }}
                        onChange={(value) => {
                          setToDate(value);
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item md={3.5} sm={6}>
                    <InputLabel id="status">Select Status</InputLabel>
                    <FormControl fullWidth className="status-select">
                      <Select
                        labelId="status"
                        id="status"
                        value={invoicePayload?.status}
                        onChange={handleStatusChange}>
                        <MenuItem value={'All'}>All</MenuItem>
                        <MenuItem value={'paid'}>Paid</MenuItem>
                        <MenuItem value={'outstanding'}>Outstanding</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={4.5} sm={12}>
                    <InputLabel id="method">Select Method</InputLabel>
                    <FormControl fullWidth>
                      <Select
                        labelId="method"
                        id="method"
                        value={invoicePayload?.method}
                        onChange={handleMethodChange}>
                        <MenuItem value={'All'}>All</MenuItem>
                        <MenuItem value={'debit'}>Debit Card</MenuItem>
                        <MenuItem value={'credit'}>Credit Card</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item lg={1} md={1} sm={1} sx={{ textAlign: 'center' }}>
                <Box component={'span'} className="seprator"></Box>
              </Grid>
              <Grid item lg={4} md={4} sm={12} xs={12}>
                <>
                  <Grid container spacing={2} sx={{ marginTop: '0px' }}>
                    <Grid item md={6} sm={6} sx={{ marginTop: '0px', textAlign: 'right' }}>
                      <FormGroup sx={{ marginRight: '24px' }}></FormGroup>
                    </Grid>

                    <Grid item md={6} sm={6}>
                      <Button className="add-button" variant="contained">
                        {' '}
                        Submit
                      </Button>
                    </Grid>
                  </Grid>
                </>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box mt={2} position="relative">
              <LinerLoader loading={isLoading} />
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="left">
                        <Checkbox
                        // color="primary"
                        // indeterminate={numSelected > 0 && numSelected < rowCount}
                        // checked={rowCount > 0 && numSelected === rowCount}
                        // onChange={onSelectAllClick}
                        />
                        Invoice Date
                      </TableCell>
                      <TableCell align="left">Description</TableCell>
                      <TableCell align="left">Method</TableCell>
                      <TableCell align="left">Amount</TableCell>
                      <TableCell align="left">Status</TableCell>
                      <TableCell align="left"></TableCell>
                      <TableCell align="right">
                        <Button className="print-btn" variant="outlined" startIcon={<PrintIcon />}>
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceList?.length > 0
                      ? invoiceList?.map((row, index) => <Row row={row} key={index} />)
                      : null}
                  </TableBody>
                </Table>
                {!isLoading && invoiceList?.length == 0 ? <NoDataDiv /> : null}
                {invoiceList?.length > 0 ? (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 25, 50]}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    component="div"
                    count={invoiceList.length}
                    rowsPerPage={invoicePayload?.pageSize}
                    page={invoicePayload?.pageNumber}
                    sx={{ flex: '1 1 auto' }}
                  />
                ) : null}
              </TableContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default Invoices;
