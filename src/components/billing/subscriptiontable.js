import { Box, Paper, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import NoDataDiv from '../common/nodatadiv';
import { useEffect, useState } from 'react';
import _ from 'lodash';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { useLocation } from 'react-router-dom';

const currentDate = new Date();

// Get the year and month from the current date
const year = currentDate.getFullYear();
const month = currentDate.getMonth();

// Create a new Date object for the first day of the next month
const firstDayOfNextMonth = new Date(year, month + 1, 1);
const formattedDate = firstDayOfNextMonth.toDateString();
export default function SubscriptionTable({
  rows,
  title,
  isLoading,
  setFamily,
  setIsFamilyDrawerOpen,
  setFamilyIndex,
  familyIndex
}) {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [custData, setCustData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [dataIsLoading, setDataIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const location = useLocation();

  const hanldeRowClick = (data, index) => {
    let { secondary, children, ...rest } = data;
    let familyDetails = { primary: rest, secondary: secondary, children: children };
    setFamily(familyDetails);
    setFamilyIndex(index);
    setIsFamilyDrawerOpen(true);
  };

  useEffect(() => {
    if (rows?.length && typeof familyIndex === 'number') {
      let { secondary, children, ...rest } = rows[familyIndex].family || {};
      let familyDetails = { primary: rest, secondary: secondary, children: children };
      setFamily(familyDetails);
    }
  }, [rows]);

  useEffect(() => {
    getCustomerById();
    fetchProducts();
  }, []);

  const mappedProducts = products?.map((item) => item);

  const fixedCam = mappedProducts.find((item) => item.name == 'Fixed Camera License');
  const locationLicense = mappedProducts.find((item) => item.name == 'Location License');
  const monthlyMobileLicensePerUser = mappedProducts.find(
    (item) => item.name == 'Month Mobile Live Stream User License'
  );
  const monthlyMobileLicensePerRoom = mappedProducts.find((item) => item.name == 'Sub Test');
  const subscriptionPreviewData = [
    {
      Type: 'Fixed Camera License',
      Number: custData?.max_cameras,
      NextInvoiceDate: formattedDate,
      Charge: fixedCam?.unit_amount / 100,
      Status: 'Available'
    },
    {
      Type: 'Location License',
      Number: custData?.max_locations,
      NextInvoiceDate: formattedDate,
      Charge: locationLicense?.unit_amount / 100,
      Status: 'Available'
    },
    {
      Type: 'Monthly Mobile Live Stream Per User',
      Number: custData?.max_stream_live_license,
      NextInvoiceDate: formattedDate,
      Charge: monthlyMobileLicensePerUser?.unit_amount / 100,
      Status: 'Available'
    },
    {
      Type: 'Monthly Mobile Live Stream Per Room',
      Number: custData?.max_stream_live_license_room,
      NextInvoiceDate: formattedDate,
      Charge: monthlyMobileLicensePerRoom?.unit_amount / 100,
      Status: 'Available'
    }
  ];

  const getCustomerById = () => {
    setDataIsLoading(true);
    API.get('customers/getCustomer', {
      params: { id: authCtx.user.cust_id || localStorage.getItem('cust_id') }
    }).then((response) => {
      if (response.status === 200) {
        setCustData(response.data.Data);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setDataIsLoading(false);
    });
  };

  const fetchProducts = async () => {
    try {
      setDataIsLoading(true);
      const response = await API.get('payment/list-products');
      if (response.status === 200) {
        const data = await response.data;
        const priceList = data.data.priceList.data;
        const productList = data.data.products.data;
        const updatedProductList = productList.map((product) => {
          // Find the corresponding price in the priceList
          const price = priceList.find((price) => price.id === product.default_price);
          // If a matching price is found, attach its unit_amount to the product
          if (price) {
            return {
              ...product,
              price_id: price.id,
              unit_amount: price.unit_amount
            };
          } else {
            return product;
          }
        });
        setProducts(updatedProductList.filter((item) => item.active));
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  let amount = rows.map((item) => parseInt(item.Charge * item.Number));
  amount = _.sum(amount);
  let amountOnTnc = subscriptionPreviewData.map((item) => parseInt(item.Charge * item.Number));
  amountOnTnc = _.sum(amountOnTnc);
  return (
    <>
      <Paper sx={{ marginTop: 2, boxShadow: 'unset' }}>
        <Box className="zl__table-block">
          <Typography style={{ padding: '20px 14px' }}>{title}</Typography>
          {location.pathname == '/billing' ? (
            rows && rows?.length > 0 ? (
              <>
                <Box
                  style={{
                    width: '100%',
                    minHeight: '230px',
                    overflowY: 'auto'
                  }}
                  className="table-body zl__tr-grp">
                  <Box
                    sx={{
                      display: 'flex',
                      marginBottom: '16px',
                      fontSize: '16px',
                      fontWeight: 500,
                      margin: '10px 12px'
                    }}>
                    <Box style={{ width: '25%' }}>{'Description'}</Box>
                    <Box style={{ width: '18%' }}>{'Qty'}</Box>
                    <Box style={{ width: '20%' }}>{'Status'}</Box>
                    <Box style={{ width: '20%' }}>{'Next Charge Date'}</Box>
                    <Box style={{ width: '20%', textAlign: 'right' }}>{'Amount'}</Box>
                  </Box>
                  {rows.map((row, index) => {
                    return (
                      <>
                        <Box
                          className="div-row row-marging zl__tr-block"
                          key={`${row?.childFirstName}-${index}`}
                          onClick={() => hanldeRowClick(row?.family, index)}>
                          <Box className="zl__td-block" style={{ width: '25%' }}>
                            <Stack direction={'row'} alignItems={'center'} gap={1}>
                              {row?.Type}
                            </Stack>
                          </Box>
                          <Box style={{ width: '15%' }} className="zl__td-block">
                            {row?.Number}
                          </Box>
                          <Box className="zl__td-block" style={{ width: '20%' }}>
                            {_.startCase(row.Status)}
                          </Box>
                          <Box className="zl__td-block" style={{ width: '20%' }}>
                            {row.NextInvoiceDate}
                          </Box>
                          <Box
                            className="zl__td-block"
                            style={{ width: '20%', color: '#6AD2A0', textAlign: 'right' }}>
                            {'$' + parseFloat(row.Charge * row.Number).toFixed(2)}
                          </Box>
                        </Box>
                      </>
                    );
                  })}
                </Box>
                <Box className="div-row row-marging zl__tr-block-subscription">
                  <Box className="zl__td-block" style={{ width: '60%' }}>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <Typography
                        sx={{
                          fontSize: '16px !important',
                          fontWeight: '500 !important',
                          lineHeight: '24px',
                          color: '#000000DE !important'
                        }}>
                        {'Total Subscription'}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box style={{ width: '20%' }} className="zl__td-block">
                    <Box style={{ display: 'flex' }}>{''}</Box>
                  </Box>
                  <Box className="zl__td-block" style={{ width: '20%', textAlign: 'right' }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: '#6AD2A0 !important' }}>
                      {'$' +
                        parseFloat(
                          location.pathname == '/terms-and-conditions' ? amountOnTnc : amount
                        ).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
                <Box className="zl__tr-block-ts" marginTop={'-10px !important'}>
                  <Box className="zl__td-block-ts" style={{ width: '30%' }}></Box>
                  <Box style={{ width: '30%' }}>
                    <Box style={{ display: 'flex' }}>{''}</Box>
                  </Box>
                  <Box
                    className="zl__td-block-ts"
                    style={{ width: '100%', color: '#6AD2A0', textAlign: 'right' }}>
                    <Typography
                      sx={{
                        fontSize: '12px !important',
                        fontWeight: 400,
                        lineHeight: '18px',
                        color: '#00000052 !important',
                        paddingRight: '10px'
                      }}>
                      *Plus all applicable taxes
                    </Typography>{' '}
                  </Box>
                </Box>
              </>
            ) : !isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ paddingTop: 2 }}>
                <NoDataDiv />
              </Stack>
            ) : null
          ) : subscriptionPreviewData && subscriptionPreviewData?.length > 0 ? (
            <>
              <Box
                style={{
                  width: '100%',
                  minHeight: '230px',
                  overflowY: 'auto'
                }}
                className="table-body zl__tr-grp">
                <Box
                  sx={{
                    display: 'flex',
                    marginBottom: '16px',
                    fontSize: '16px',
                    fontWeight: 500,
                    margin: '10px 12px'
                  }}>
                  <Box style={{ width: '25%' }}>{'Description'}</Box>
                  <Box style={{ width: '18%' }}>{'Qty'}</Box>
                  <Box style={{ width: '20%' }}>{'Status'}</Box>
                  <Box style={{ width: '20%' }}>{'Next Charge Date'}</Box>
                  <Box style={{ width: '20%', textAlign: 'right' }}>{'Amount'}</Box>
                </Box>
                {subscriptionPreviewData.map((row, index) => {
                  return (
                    <>
                      <Box
                        className="div-row row-marging zl__tr-block"
                        key={`${row?.childFirstName}-${index}`}
                        onClick={() => hanldeRowClick(row?.family, index)}>
                        <Box className="zl__td-block" style={{ width: '25%' }}>
                          <Stack direction={'row'} alignItems={'center'} gap={1}>
                            {row?.Type}
                          </Stack>
                        </Box>
                        <Box style={{ width: '15%' }} className="zl__td-block">
                          {row?.Number}
                        </Box>
                        <Box className="zl__td-block" style={{ width: '20%' }}>
                          {_.startCase(row.Status)}
                        </Box>
                        <Box className="zl__td-block" style={{ width: '20%' }}>
                          {row.NextInvoiceDate}
                        </Box>
                        <Box
                          className="zl__td-block"
                          style={{ width: '20%', color: '#6AD2A0', textAlign: 'right' }}>
                          {'$' + parseFloat(row.Charge * row.Number).toFixed(2)}
                        </Box>
                      </Box>
                    </>
                  );
                })}
              </Box>
              <Box className="div-row row-marging zl__tr-block-subscription">
                <Box className="zl__td-block" style={{ width: '60%' }}>
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <Typography
                      sx={{
                        fontSize: '16px !important',
                        fontWeight: '500 !important',
                        lineHeight: '24px',
                        color: '#000000DE !important'
                      }}>
                      {'Total Subscription'}
                    </Typography>
                  </Stack>
                </Box>
                <Box style={{ width: '20%' }} className="zl__td-block">
                  <Box style={{ display: 'flex' }}>{''}</Box>
                </Box>
                <Box className="zl__td-block" style={{ width: '20%', textAlign: 'right' }}>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: '#6AD2A0 !important' }}>
                    {'$' +
                      parseFloat(
                        location.pathname == '/terms-and-conditions' ? amountOnTnc : amount
                      ).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              <Box className="zl__tr-block-ts" marginTop={'-10px !important'}>
                <Box className="zl__td-block-ts" style={{ width: '30%' }}></Box>
                <Box style={{ width: '30%' }}>
                  <Box style={{ display: 'flex' }}>{''}</Box>
                </Box>
                <Box
                  className="zl__td-block-ts"
                  style={{ width: '100%', color: '#6AD2A0', textAlign: 'right' }}>
                  <Typography
                    sx={{
                      fontSize: '12px !important',
                      fontWeight: 400,
                      lineHeight: '18px',
                      color: '#00000052 !important',
                      paddingRight: '10px'
                    }}>
                    *Plus all applicable taxes
                  </Typography>{' '}
                </Box>
              </Box>
            </>
          ) : !isLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ paddingTop: 2 }}>
              <NoDataDiv />
            </Stack>
          ) : null}
        </Box>
      </Paper>
    </>
  );
}
SubscriptionTable.propTypes = {
  rows: PropTypes.array,
  title: PropTypes.string,
  isLoading: PropTypes.bool,
  setFamily: PropTypes.func,
  setIsFamilyDrawerOpen: PropTypes.func,
  setFamilyIndex: PropTypes.func,
  familyIndex: PropTypes.number
};
