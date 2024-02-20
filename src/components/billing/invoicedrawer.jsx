import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

const invoiceDetails = [
  { title: 'Invoice Date : ', value: 'Dec 21, 2023' },
  { title: 'Invoice Number : ', value: '1234567890' },
  { title: 'Customer Number : ', value: 'Selena Grande' },
  { title: 'Company Name : ', value: 'ABC Corporation' },
  {
    title: 'Company Address : ',
    value: '137 Shore Dr, Palm Harbor, Mazakin Street, Florida, 34683, US'
  }
];

const rows = [
  { charge_id: 'CHG-1234567', desc: 'Project ABC', qty: '1', amt: '$130' },
  { charge_id: 'CHG-1234567', desc: 'Project ABC', qty: '2', amt: '$260' },
  { charge_id: 'CHG-1234567', desc: 'Project ABC', qty: '3', amt: '$320' }
];

const InvoiceDrawer = (props) => {
  // eslint-disable-next-line no-unused-vars
  const [disableDrawerClose, setDisableDrawerClose] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);

  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  return (
    <Drawer
      className="invoice-drawer"
      anchor={'right'}
      open={props.open}
      onClose={() => {
        if (!disableDrawerClose) {
          props.setOpen(false);
        }
      }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        paddingTop={2}
        paddingBottom={2}>
        <Typography variant="h5">Invoice</Typography>
        <Stack direction={'row'} gap={2} alignItems={'center'}>
          <Button className="print-btn" variant="outlined" startIcon={<PrintIcon />}>
            Print
          </Button>
          <IconButton aria-label="close" onClick={handleClose}>
            <CloseIcon fontSize="large" sx={{ color: '#d3cbfb !important' }} />
          </IconButton>
        </Stack>
      </Stack>
      <Divider />
      <Stack direction={'column'} marginTop={2.5}>
        <Stack direction={'column'} gap={2}>
          {invoiceDetails.map((item, index) => (
            <>
              <Stack key={index} direction={'row'} gap={1}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    textAlign: 'left',
                    color: '#828282'
                  }}>
                  {item.title}
                </Typography>{' '}
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '20px',
                    textAlign: 'left',
                    color: '#000000de'
                  }}>
                  {item.value}
                </Typography>
              </Stack>
            </>
          ))}
        </Stack>
        <Stack marginTop={5} gap={3}>
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 500,
              lineHeight: '20px',
              color: '#5A53DD'
            }}>
            Charges
          </Typography>
          <TableContainer
            component={Paper}
            sx={{ border: '1px solid #EBE8FF', borderRadius: '15px !important' }}>
            <Table aria-label="spanning table">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FAFAFF !important' }}>
                  <TableCell sx={{ padding: '20px 24px !important' }} align="left">
                    Charge ID{' '}
                  </TableCell>
                  <TableCell align="left">Description</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell sx={{ padding: '20px 24px !important' }} align="right">
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row}>
                    <TableCell sx={{ padding: '20px 24px !important' }}>{row.charge_id}</TableCell>
                    <TableCell>{row.desc}</TableCell>
                    <TableCell align="right">{row.qty}</TableCell>
                    <TableCell sx={{ padding: '20px 24px !important' }} align="right">
                      {row.amt}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell
                    sx={{
                      borderBottom: 'none',
                      padding: '16px 32px 0px !important',
                      fontSize: '16px !important',
                      fontWeight: '500 !important',
                      lineHeight: '20px !important',
                      color: '#000000DE !important'
                    }}
                    colSpan={3}>
                    Subtotal
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: 'none',
                      padding: '16px 32px 0px !important',
                      fontSize: '16px !important',
                      fontWeight: '500 !important',
                      lineHeight: '20px !important',
                      color: '#000000DE !important'
                    }}
                    align="right">
                    {'$710'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{
                      padding: '16px 32px !important',
                      fontSize: '16px !important',
                      fontWeight: '500 !important',
                      lineHeight: '20px !important',
                      color: '#000000DE !important'
                    }}>
                    Tax
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: '16px !important',
                      padding: '16px 32px 0px !important',
                      fontWeight: '500 !important',
                      lineHeight: '20px !important',
                      color: '#000000DE !important'
                    }}>
                    {'$10'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{
                      borderBottom: 'none',
                      fontSize: '24px !important',
                      fontWeight: '500 !important',
                      lineHeight: '20px !important',
                      padding: '24px !important'
                    }}
                    colSpan={3}>
                    Total
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: 'none',
                      fontSize: '24px !important',
                      fontWeight: '500 !important',
                      lineHeight: '20px !important',
                      padding: '24px !important',
                      color: '#27AE60 !important'
                    }}
                    align="right">
                    {'$720'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
        <Stack marginTop={'20px'}>
          <Box
            sx={{
              border: '1px solid #EBE8FF',
              borderRadius: '15px'
            }}
            p={3}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '24px'
              }}>
              {'Disclaimer & Refund Policy'}
            </Typography>
            <Stack direction={'column'} gap={3}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '21px',
                  color: '#828282'
                }}>
                {
                  'All invoices are issued in accordance with the terms and conditions outlined in our agreement or contract. The products or services detailed in this invoice have been provided or delivered as agreed upon. Any discrepancies or concerns regarding this invoice must be communicated within 60 days of receipt. Failure to notify us within this period will be considered as an acceptance of the invoice in full.'
                }
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '21px',
                  color: '#828282'
                }}>
                {'Thank you for choosing Zoomin Live. We appreciate your business.'}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default InvoiceDrawer;

InvoiceDrawer.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  setIsParentFormDialogOpen: PropTypes.func,
  setParentType: PropTypes.func,
  setIsDisableFamilyDialogOpen: PropTypes.func,
  setIsChildFormDialogOpen: PropTypes.func,
  setIsRoomFormDialogOpen: PropTypes.func,
  family: PropTypes.object,
  setFamily: PropTypes.func,
  setPrimaryParent: PropTypes.func,
  setSecondaryParent: PropTypes.func,
  setChild: PropTypes.func,
  getFamiliesList: PropTypes.func,
  roomsList: PropTypes.array
};
