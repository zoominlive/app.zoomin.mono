import React, { useContext, useEffect, useState } from 'react';
import LayoutContext from '../../context/layoutcontext';
import AuthContext from '../../context/authcontext';
import {
  Autocomplete,
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
  Divider,
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
  // TableBody,
  TableCell,
  TableContainer,
  TableHead,
  // TablePagination,
  TableRow,
  TextField,
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import InvoiceDrawer from './invoicedrawer';

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

const SubscriptionRows = [
  {
    Type: 'Fix Camera Live Streaming License',
    Number: 16,
    Charge: '$640'
  },
  {
    Type: 'Mobile Live Stream Room License',
    Number: 8,
    Charge: '$200'
  },
  {
    Type: 'Sentry Perimeter Monitoring License',
    Number: 2,
    Charge: '$145'
  }
];

const Invoices = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isDatePickerOpen1, setIsDatePickerOpen1] = useState(false);
  const [isDatePickerOpen2, setIsDatePickerOpen2] = useState(false);
  const [fromDate, setFromDate] = useState(moment().subtract(7, 'days'));
  const [toDate, setToDate] = useState(moment().subtract(7, 'days'));
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [isInvoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);

  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const handleFormDialogClose = () => {
    setPaymentDialogOpen(false);
  };
  const Row = ({ row }) => {
    const { invoice_date, description, method, amount, status } = row;
    return (
      <>
        <TableRow
          hover
          onClick={() => {
            setInvoiceDrawerOpen(true);
          }}>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center">
              <Checkbox />
              <Typography>{`${moment(invoice_date).format('MM-DD-YYYY')}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell align="left">
            {/* <Stack direction="row"> */}
            <Typography>{description}</Typography>
            {/* </Stack> */}
          </TableCell>
          <TableCell align="left">
            {/* <Stack direction="row"> */}
            <Typography>{method}</Typography>
            {/* </Stack> */}
          </TableCell>
          <TableCell align="left">
            {/* <Stack direction="row"> */}
            <Typography>{amount}</Typography>
            {/* </Stack> */}
          </TableCell>
          <TableCell align="left">
            {/* <Stack direction="row"> */}
            <Chip
              label={status}
              className={`${status == 'Paid' ? 'paid' : 'outstanding'}-chip-color`}
            />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="left">
            <Button className="add-button btn-radius" variant="contained">
              {' '}
              Pay Now
            </Button>
          </TableCell>
          <TableCell align="left">
            <IconButton aria-controls="alpha-menu" aria-haspopup="true">
              <MoreVertIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      </>
    );
  };
  Row.propTypes = {
    row: PropTypes.shape({
      invoice_date: PropTypes.string,
      description: PropTypes.string,
      method: PropTypes.string,
      amount: PropTypes.string,
      status: PropTypes.string
    })
  };
  useEffect(() => {
    layoutCtx.setActive(10);
    layoutCtx.setBreadcrumb(['Billing Account', 'Manage your all the paid, unpaid bills']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);
  return (
    <Box className="invoice">
      <LinerLoader loading={isLoading} />
      <Grid container spacing={3}>
        <Grid item md={12} sm={12} xs={12} lg={4}>
          <Paper sx={{ marginTop: 2 }} className="zl__table-res">
            <SubscriptionTable
              rows={SubscriptionRows}
              columns={SubscriptionColumns}
              title={'Subscriptions'}
              isLoading={isLoading}
              // getDashboardData={getDashboardData}
              // setFamily={setFamily}
              // setIsFamilyDrawerOpen={setIsFamilyDrawerOpen}
              // setFamilyIndex={setFamilyIndex}
              // familyIndex={familyIndex}
            />
          </Paper>
        </Grid>
        <Grid item md={12} sm={12} xs={12} lg={4}>
          <Paper sx={{ marginTop: 2 }} className="zl__table-res">
            <Paper sx={{ marginTop: 2, height: '96%', minHeight: '338px', boxShadow: 'unset' }}>
              <Box className="zl__table-block listing-wrapper">
                <Typography style={{ padding: '20px 14px' }}>Default Payment Method</Typography>
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
              </Box>
            </Paper>
          </Paper>
        </Grid>
        <Grid item md={12} sm={12} xs={12} lg={4}>
          <Paper sx={{ marginTop: 2 }}>
            <Paper
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                height: '96%',
                minHeight: '161px',
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
                          $2659.65
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
                minHeight: '161px',
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
                          Dec 22, 2023
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
                      <Select labelId="status" id="status" value={location}>
                        <MenuItem value={'All'}>All</MenuItem>
                        {[]}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={4.5} sm={12}>
                    <InputLabel id="method">Select Method</InputLabel>
                    <Autocomplete
                      labelId="method"
                      fullWidth
                      multiple
                      id="method"
                      options={[]}
                      isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                      getOptionLabel={(option) => {
                        return option?.room_name;
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option?.room_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          // label="Room"
                          fullWidth
                          placeholder="Method"
                          // InputProps={{
                          //   ...params.InputProps,
                          //   endAdornment: (
                          //     <React.Fragment>
                          //       {roomsDropdownLoading ? (
                          //         <CircularProgress color="inherit" size={20} />
                          //       ) : null}
                          //       {params.InputProps.endAdornment}
                          //     </React.Fragment>
                          //   )
                          // }}
                        />
                      )}
                    />
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
                {/* {!isLoading && recordedStreamList?.length == 0 ? <NoDataDiv /> : null}
                {recordedStreamList?.length > 0 ? (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 25, 50]}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    component="div"
                    count={recordedStreamList.length}
                    rowsPerPage={recordingsPayload?.pageSize}
                    page={recordingsPayload?.pageNumber}
                    sx={{ flex: '1 1 auto' }}
                  />
                ) : null} */}
              </TableContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
      {isPaymentDialogOpen && (
        <Dialog
          open={isPaymentDialogOpen}
          onClose={handleClose}
          fullWidth
          className="add-user-drawer">
          <DialogTitle sx={{ paddingTop: 3.5 }}>
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
          <Divider />
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
            <DialogContent></DialogContent>
          )}
        </Dialog>
      )}
      <InvoiceDrawer
        open={isInvoiceDrawerOpen}
        setOpen={setInvoiceDrawerOpen}
        // family={family}
        // setFamily={setFamily}
        // setIsParentFormDialogOpen={setIsParentFormDialogOpen}
        // setIsChildFormDialogOpen={setIsChildFormDialogOpen}
        // setIsRoomFormDialogOpen={setIsRoomFormDialogOpen}
        // setIsDisableFamilyDialogOpen={setIsDisableFamilyDialogOpen}
        // setPrimaryParent={setPrimaryParent}
        // setSecondaryParent={setSecondaryParent}
        // setChild={setChild}
        // getFamiliesList={getFamiliesList}
        // setParentType={setParentType}
        // roomsList={roomsList}
        // parentType={parentType}
      />
    </Box>
  );
};

export default Invoices;
