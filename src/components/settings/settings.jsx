/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  InputLabel,
  Paper,
  Stack,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import React, { useEffect, useMemo, useState } from 'react';
import { useContext } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import SettingsForm from './settingsform';
import SettingsActions from './settingsactions';
// import DeleteDialog from '../common/deletedialog';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
// import Loader from '../common/loader';
import debounce from 'lodash.debounce';
import NoDataDiv from '../common/nodatadiv';
import SearchIcon from '@mui/icons-material/Search';
import NewDeleteDialog from '../common/newdeletedialog';
import LinerLoader from '../common/linearLoader';
// import SchedulerDialog from '../families/scheduler';
import DefaultScheduler from '../families/defaultScheduler';
import { Form, Formik } from 'formik';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import moment from 'moment';
import { grey } from '@mui/material/colors';
import {
  CameraAltOutlined,
  Category,
  KeyOutlined,
  PlaceOutlined,
  PortraitOutlined
} from '@mui/icons-material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Country, State, City } from 'country-state-city';
import APIKeys from '../apikeys/apikeys';
import TokenExchange from '../tokenexchange/tokenexchange';
import SettingsFormZone from './settingsformzone';
import SettingsFormTag from './settingsformtag';
import NewDefaultScheduler from '../families/newDefaultScheduler';

const Settings = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [isUserFormDialogOpen, setIsUserFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [locationsList, setLocationsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [customerDetails, setCustomerDetails] = useState(null);
  const [totalLocations, setTotalLocations] = useState(0);
  const [totalZones, setTotalZones] = useState(0);
  const [totalTags, setTotalTags] = useState(0);
  const [location, setLocation] = useState();
  const [zone, setZone] = useState();
  const [tag, setTag] = useState();
  const [activeLocations, setActiveLocations] = useState(0);
  const [usersPayload, setUsersPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    cust_id: localStorage.getItem('cust_id')
  });
  const [zonesPayload, setZonesPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    cust_id: localStorage.getItem('cust_id')
  });
  const [tagsPayload, setTagsPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    cust_id: localStorage.getItem('cust_id')
  });
  const [value, setValue] = useState(0);
  const [timer, setTimer] = useState([]);
  const [allowCustomSchedule, setAllowCustomSchedule] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [stripeCust, setStripeCust] = useState();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [checked, setChecked] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [startDate, setStartDate] = useState(moment());
  const [endDate, setEndDate] = useState(moment());
  const [trialDays, setTrialDays] = useState(0);
  const [scheduledPrices, setScheduledPrices] = useState([]);
  const [customerInfo, setCustomerInfo] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [apiKeysList, setApiKeysList] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const stripe_cust_id = authCtx.user.stripe_cust_id;

  // Fetch products from the backend
  useEffect(() => {
    // fetchProducts();
    // fetchScheduledSubscriptions();
    // fetchSubscriptions();
    getCustPaymentMethod();
  }, []);

  useEffect(() => {
    // Load countries initially
    const countryList = Country.getAllCountries();
    setCountries(countryList);
  }, []);

  // Load states based on selected country
  useEffect(() => {
    if (selectedCountry) {
      const stateList = State.getStatesOfCountry(selectedCountry?.isoCode);
      setStates(stateList);
      setSelectedState(null); // Reset state selection when country changes
      setCities([]); // Clear cities when country changes
    }
  }, [selectedCountry]);

  // Load cities based on selected state
  useEffect(() => {
    if (selectedState) {
      const cityList = City.getCitiesOfState(selectedCountry?.isoCode, selectedState?.isoCode);
      setCities(cityList);
      setSelectedCity(null); // Reset city selection when state changes
    }
  }, [selectedState, selectedCountry]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await API.get('payment/list-products');
      if (response.status === 200) {
        const data = await response.data;
        const priceList = response.data.data.priceList.data;
        const productList = response.data.data.products.data;
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
        setProducts(updatedProductList);
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

  const fetchScheduledSubscriptions = async () => {
    try {
      setIsLoading(true);
      const response = await API.get('payment/list-scheduled-subscriptions', {
        params: {
          stripe_cust_id: authCtx.user.stripe_cust_id,
          cust_id: localStorage.getItem('cust_id')
        }
      });
      if (response.status === 200) {
        const data = await response.data.data.localSubscriptions;
        // setScheduledPrices(data.map((item) => item.phases[0].items[0].price));
        setScheduledPrices(data.map((item) => item.plan));
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

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const response = await API.get('payment/list-subscriptions', {
        params: {
          stripe_cust_id: authCtx.user.stripe_cust_id,
          cust_id: localStorage.getItem('cust_id')
        }
      });
      const data = await response.data.data.subscriptions;
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCheckChange = (event, productId, price_id = 123, qty) => {
    if (event.target.checked) {
      setSelectedProducts((prevSelected) => [...prevSelected, productId]);
      setChecked([
        ...checked,
        {
          product: {
            [event.target.name]: event.target.value,
            qty: qty,
            price_id: price_id
          }
        }
      ]);
    } else {
      setSelectedProducts((prevSelected) => prevSelected.filter((id) => id !== productId));

      setChecked((prevChecked) => {
        const arr = prevChecked.filter(({ product }) => product.price_id !== price_id);
        return arr;
      });
    }
  };

  useEffect(() => {
    layoutCtx.setActive(null);
    switch (value) {
      case 0:
        layoutCtx.setBreadcrumb(['Locations', 'Location Manager']);
        break;
      case 1:
        layoutCtx.setBreadcrumb([
          'Stream Availability',
          'Default Stream Availability - All Cameras'
        ]);
        break;
      case 2:
        layoutCtx.setBreadcrumb(['Customer Profile', 'Customer Details and Contact Information']);
        break;
      case 3:
        layoutCtx.setBreadcrumb(['Zone Types', 'Zone Type Manager']);
        break;
      case 4:
        layoutCtx.setBreadcrumb(['Recording Tags', 'Recording Tag Manager']);
        break;
      case 5:
        layoutCtx.setBreadcrumb(['API Keys', 'Manage API Keys and Permissions to endpoints']);
        break;
      default:
        layoutCtx.setBreadcrumb(['Settings', 'Manage settings']);
        break;
    }
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, [value]);

  useEffect(() => {
    return () => {
      debouncedResults.cancel();
      debouncedZoneResults.cancel();
      debouncedTagResults.cancel();
    };
  });

  useEffect(() => {
    getLocationsList();
  }, [usersPayload]);

  useEffect(() => {
    getZonesList();
  }, [zonesPayload]);

  useEffect(() => {
    getTagsList();
  }, [tagsPayload]);

  useEffect(() => {
    getDefaultScheduleSettings();
  }, []);

  // Method to fetch location list for table
  const getLocationsList = () => {
    setIsLoading(true);
    API.get('customers/all/locations', { params: usersPayload }).then((response) => {
      if (response.status === 200) {
        setLocationsList(response.data.Data.locations);
        setTotalLocations(response.data.Data.count);
        setCustomerDetails(response.data.Data.customer);
        setActiveLocations(response.data.Data.activeLocations);
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

  // Method to fetch zones list for table
  const getZonesList = () => {
    setIsLoading(true);
    API.get('zone-type', { params: zonesPayload }).then((response) => {
      if (response.status === 200) {
        console.log('zones_response==>', response.data);
        setZonesList(response.data.Data.zoneTypes);
        setTotalZones(response.data.Data.count);
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

  // Method to fetch tags list for table
  const getTagsList = () => {
    setIsLoading(true);
    API.get('cams/list-record-tags', { params: tagsPayload }).then((response) => {
      if (response.status === 200) {
        console.log('zones_response==>', response.data);
        setTagsList(response.data.Data.recordTags);
        setTotalTags(response.data.Data.count);
      } else {
        if (response.message === 'Network Error') {
          enqueueSnackbar('Please refresh the page.', {
            variant: 'info',
            action: (key) => (
              <Button
                onClick={() => {
                  window.location.reload();
                  closeSnackbar(key);
                }}
                sx={{ color: '#fff', textTransform: 'none' }}>
                Refresh
              </Button>
            )
          });
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      }
      setIsLoading(false);
    });
  };

  // Method to fetch Default Settings for Schedule
  const getDefaultScheduleSettings = () => {
    setIsLoading(true);
    API.get('family/child/schedule', {
      params: {
        cust_id: authCtx.user.cust_id || localStorage.getItem('cust_id')
      }
    }).then((response) => {
      if (response.status === 200) {
        setTimer(response.data.Data.schedule.timeRange);
        setAllowCustomSchedule(response.data.Data.schedule.allowCustomSchedule);
        setSelectedDays(response.data.Data.schedule.timeRange[0][1]);
        // setLocationsList(response.data.Data.locations);
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

  // Method to fetch Customer Payment Method along with Customer Details
  const getCustPaymentMethod = () => {
    setIsLoading(true);
    API.get('payment/list-customer-payment-method', {
      params: { stripe_cust_id: stripe_cust_id, cust_id: localStorage.getItem('cust_id') }
    }).then((response) => {
      if (response.status === 200) {
        setStripeCust(response.data.customerDetails);
        setSelectedCountry(response.data.customerDetails.address?.country);
        setSelectedState(response.data.customerDetails.address?.state);
        setSelectedCity(response.data.customerDetails.address?.city);
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

  // Method to delete location
  const handleLocationDelete = () => {
    setDeleteLoading(true);
    let payload = {
      loc_id: location.loc_id
    };
    API.delete('customers/delete-customer-location', {
      data: { ...payload }
    }).then((response) => {
      if (response.status === 200) {
        getLocationsList();
        enqueueSnackbar(response.data.Message, {
          variant: 'success'
        });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setLocation();
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    });
  };

  // Method to delete zone
  const handleZoneDelete = () => {
    setDeleteLoading(true);
    let payload = {
      zone_type_id: zone.zone_type_id
    };
    API.delete('zone-type/delete', {
      data: { ...payload }
    }).then((response) => {
      if (response.status === 200) {
        getZonesList();
        enqueueSnackbar(response.data.Message, {
          variant: 'success'
        });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setZone();
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    });
  };

  // Method to delete tag
  const handleTagDelete = () => {
    setDeleteLoading(true);
    let payload = {
      tag_id: tag.tag_id
    };
    API.delete('cams/delete-record-tag', {
      data: { ...payload }
    }).then((response) => {
      if (response.status === 200) {
        getTagsList();
        enqueueSnackbar(response.data.Message, {
          variant: 'success'
        });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setTag();
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    });
  };

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  const handleZonesPageChange = (_, newPage) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  const handleTagsPageChange = (_, newPage) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setUsersPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  const handleChangeZonesRowsPerPage = (event) => {
    setUsersPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  const handleChangeTagsRowsPerPage = (event) => {
    setUsersPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setUsersPayload((prevPayload) => ({
      ...prevPayload,
      pageNumber: 0,
      searchBy: event.target.value ? event.target.value : ''
    }));
  };

  const handleZoneSearch = (event) => {
    setZonesPayload((prevPayload) => ({
      ...prevPayload,
      pageNumber: 0,
      searchBy: event.target.value ? event.target.value : ''
    }));
  };

  const handleTagSearch = (event) => {
    setTagsPayload((prevPayload) => ({
      ...prevPayload,
      pageNumber: 0,
      searchBy: event.target.value ? event.target.value : ''
    }));
  };

  // Calls the search handler after 500ms
  const debouncedResults = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  const debouncedZoneResults = useMemo(() => {
    return debounce(handleZoneSearch, 500);
  }, []);

  const debouncedTagResults = useMemo(() => {
    return debounce(handleTagSearch, 500);
  }, []);

  const handleSubmit = (data) => {
    const payload = {
      cust_id: localStorage.getItem('cust_id'),
      userId: authCtx.user.stripe_cust_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      addressline1: data.addressLine1,
      addressline2: data.addressLine2,
      postalcode: data.postalcode,
      country: selectedCountry.isoCode,
      state: selectedState.name,
      city: selectedCity.name
    };
    setIsLoading(true);
    setSubmitLoading(true);
    API.put('payment/update-customer', payload).then((response) => {
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
      setSubmitLoading(false);
    });
  };
  const handleIncrement = (productId) => {
    setProductQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: (prevQuantities[productId] || 0) + 1 // Increment quantity by 1
    }));
  };

  const handleDecrement = (productId) => {
    setProductQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: Math.max(0, prevQuantities[productId] - 1) // Ensure quantity doesn't go below 0
    }));
  };

  const getProductQuantity = (productName) => {
    switch (productName) {
      case 'Mobile Live Stream Room License':
        return authCtx.user.max_stream_live_license_zone;
      case 'Sentry Perimeter Monitoring License':
        return authCtx.user.max_stream_live_license;
      default:
        return 1;
    }
  };

  const handleCheckout = async () => {
    // Given date
    const givenDate = moment(startDate);
    // Calculate the end date by adding days to the given date
    const endDate = givenDate.clone().add(trialDays, 'days');

    // Convert end date to Unix timestamp
    const unixTimestamp = endDate.unix();
    setIsLoading(true);
    API.post('payment/create-checkout', {
      cust_id: localStorage.getItem('cust_id'),
      stripe_cust_id: authCtx.user?.stripe_cust_id,
      products: checked,
      startDate: moment(startDate).unix(),
      trial_period_days: trialDays
    }).then((response) => {
      if (response.status === 200) {
        console.log(response.data);
        enqueueSnackbar('Successfully subscribed!', {
          variant: 'success'
        });
        setTrialDays(0);
        setStartDate(moment());
        fetchProducts();
        fetchScheduledSubscriptions();
        setChecked([]);
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

  const StyledTab = styled(Tab)(({ theme }) => ({
    alignItems: 'flex-start',
    border: '1px solid',
    borderColor: grey[300],
    textTransform: 'none',
    borderRadius: '12px',
    padding: '18px',
    transition: 'all 0.2s ease-in-out',
    width: '100%',
    margin: 'auto',
    maxWidth: 'unset',
    '& p': {
      color: grey[600]
    },
    '& svg': {
      fontSize: 22,
      color: grey[500]
    },
    '&.Mui-selected, &:hover': {
      backgroundColor: '#5A53DD',
      '& p': {
        color: '#FFFFFF'
      },
      '& svg': {
        color: '#FFFFFF !important'
      }
    }
  }));

  const tabData = [
    {
      label: 'Locations',
      icon: <PlaceOutlined />
    },
    {
      label: 'Stream Availability',
      icon: <CameraAltOutlined />
    },
    {
      label: 'Customer Profile',
      icon: <PortraitOutlined />
    },
    {
      label: 'Zone Types',
      icon: <Category />
    },
    {
      label: 'Recording Tags',
      icon: <LocalOfferIcon />
    },
    {
      label: 'API Keys',
      icon: <KeyOutlined />
    }
  ];

  const TabPanel = ({ children, value, index }) => {
    return value === index && <Box sx={{ borderRadius: '12px' }}>{children}</Box>;
  };

  return (
    // <Box sx={{ width: '100%' }}>
    //   <TabContext value={value}>
    //     <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
    //       <TabList onChange={handleChange} aria-label="lab API tabs example">
    //         {(authCtx.user.role === 'Admin' || authCtx.user.role === 'Super Admin') && (
    //           <Tab
    //             sx={{ textTransform: 'none', fontSize: '16px' }}
    //             label="Customer Profile"
    //             value="1"
    //           />
    //         )}
    //         <Tab sx={{ textTransform: 'none', fontSize: '16px' }} label="Locations" value="2" />
    //         <Tab sx={{ textTransform: 'none', fontSize: '16px' }} label="Cameras" value="3" />
    //       </TabList>
    //     </Box>
    //     <TabPanel value="1">
    //       <Box sx={{ position: 'relative' }}>
    //         <LinerLoader loading={isLoading} />
    //         <Card>
    //           <CardHeader title="Stripe Account Details"></CardHeader>
    //           <CardContent>
    //             <Formik
    //               enableReinitialize
    //               validateOnChange
    //               // validationSchema={validationSchema}
    //               initialValues={{
    //                 name: stripeCust?.name || '',
    //                 email: stripeCust?.email || '',
    //                 phone: stripeCust?.phone || '',
    //                 description: stripeCust?.description || '',
    //                 city: stripeCust?.address?.city || '',
    //                 state: stripeCust?.address?.state || '',
    //                 country: stripeCust?.address?.country || ''
    //               }}
    //               onSubmit={handleSubmit}>
    //               {({ values, setFieldValue, touched, errors }) => {
    //                 return (
    //                   <Form>
    //                     <Grid container spacing={2}>
    //                       <Grid item md={6} xs={12}>
    //                         <TextField
    //                           label="Name"
    //                           name="name"
    //                           value={values?.name}
    //                           onChange={(event) => {
    //                             setFieldValue('name', event.target.value);
    //                           }}
    //                           helperText={touched.name && errors.name}
    //                           error={touched.name && Boolean(errors.name)}
    //                           fullWidth
    //                         />
    //                       </Grid>
    //                       <Grid item md={6} xs={12}>
    //                         <TextField
    //                           label="Email"
    //                           name="email"
    //                           value={values?.email}
    //                           onChange={(event) => {
    //                             setFieldValue('email', event.target.value);
    //                           }}
    //                           helperText={touched.email && errors.email}
    //                           error={touched.email && Boolean(errors.email)}
    //                           fullWidth
    //                         />
    //                       </Grid>
    //                       <Grid item md={6} xs={12}>
    //                         <TextField
    //                           label="Phone"
    //                           name="phone"
    //                           value={values?.phone}
    //                           onChange={(event) => {
    //                             setFieldValue('phone', event.target.value);
    //                           }}
    //                           helperText={touched.phone && errors.phone}
    //                           error={touched.phone && Boolean(errors.phone)}
    //                           fullWidth
    //                         />
    //                       </Grid>
    //                       <Grid item md={6} xs={12}>
    //                         <TextField
    //                           label="Description"
    //                           name="description"
    //                           value={values?.description}
    //                           onChange={(event) => {
    //                             setFieldValue('description', event.target.value);
    //                           }}
    //                           helperText={touched.description && errors.description}
    //                           error={touched.description && Boolean(errors.description)}
    //                           fullWidth
    //                         />
    //                       </Grid>
    //                       <Grid item xs={12} md={12}>
    //                         <Divider />
    //                       </Grid>
    //                       <Grid item xs={12} md={12}>
    //                         <Typography variant="subtitle1">Address</Typography>
    //                       </Grid>
    //                       <Grid item md={6} xs={12}>
    //                         <TextField
    //                           label="Country"
    //                           name="country"
    //                           value={values?.country}
    //                           onChange={(event) => {
    //                             setFieldValue('country', event.target.value);
    //                           }}
    //                           helperText={touched.description && errors.description}
    //                           error={touched.description && Boolean(errors.description)}
    //                           fullWidth
    //                         />
    //                       </Grid>
    //                       <Grid item md={6} xs={12}>
    //                         <TextField
    //                           label="State"
    //                           name="state"
    //                           value={values?.state}
    //                           onChange={(event) => {
    //                             setFieldValue('state', event.target.value);
    //                           }}
    //                           helperText={touched.description && errors.description}
    //                           error={touched.description && Boolean(errors.description)}
    //                           fullWidth
    //                         />
    //                       </Grid>
    //                       <Grid item md={6} xs={12}>
    //                         <TextField
    //                           label="City"
    //                           name="city"
    //                           value={values?.city}
    //                           onChange={(event) => {
    //                             setFieldValue('city', event.target.value);
    //                           }}
    //                           helperText={touched.description && errors.description}
    //                           error={touched.description && Boolean(errors.description)}
    //                           fullWidth
    //                         />
    //                       </Grid>
    //                       <Grid item xs={12} md={12}>
    //                         <Stack
    //                           direction="row"
    //                           justifyContent="flex-end"
    //                           alignItems="center"
    //                           spacing={3}>
    //                           {authCtx.user.role === 'Super Admin' && (
    //                             <LoadingButton
    //                               loading={submitLoading}
    //                               loadingPosition={submitLoading ? 'start' : undefined}
    //                               startIcon={submitLoading && <SaveIcon />}
    //                               variant="contained"
    //                               type="submit">
    //                               Save Changes
    //                             </LoadingButton>
    //                           )}
    //                         </Stack>
    //                       </Grid>
    //                       <Grid item xs={12} md={12}>
    //                         <Divider />
    //                       </Grid>
    //                       {/* temporarily checking with role test instead of commenting whole code block */}
    //                       {authCtx.user.role === 'test' && (
    //                         <>
    //                           <Grid item xs={12} md={12}>
    //                             <Typography variant="h5">Subscription Plans</Typography>
    //                           </Grid>
    //                           {products
    //                             ?.filter((item) => item.active)
    //                             .map((product, index) => (
    //                               <>
    //                                 <Grid item xs={12} md={2}>
    //                                   <Box
    //                                     className="product-box"
    //                                     // style={{ width: '250px' }}
    //                                     key={product.id}>
    //                                     <Checkbox
    //                                       disabled={scheduledPrices?.includes(product.price_id)}
    //                                       id={product.id}
    //                                       name={product.name}
    //                                       checked={
    //                                         checked.find(
    //                                           (item) => item.product.price_id === product.price_id
    //                                         ) || scheduledPrices?.includes(product.price_id)
    //                                       }
    //                                       onChange={(e) =>
    //                                         handleCheckChange(
    //                                           e,
    //                                           product.id,
    //                                           product.price_id || product.default_price,
    //                                           getProductQuantity(product.name)
    //                                         )
    //                                       }
    //                                       inputProps={{
    //                                         'aria-label': 'controlled'
    //                                       }}
    //                                     />
    //                                     <Typography variant="h6">{product.name}</Typography>
    //                                     <Typography variant="subtitle1">
    //                                       Price: ${' '}
    //                                       {product.unit_amount
    //                                         ? (product.unit_amount / 100) *
    //                                           (product.name == 'Mobile Live Stream Room License'
    //                                             ? authCtx.user.max_stream_live_license_zone
    //                                             : product.name ===
    //                                               'Sentry Perimeter Monitoring License'
    //                                             ? authCtx.user.max_stream_live_license
    //                                             : 1)
    //                                         : '--'}
    //                                     </Typography>
    //                                     <Typography variant="subtitle1">
    //                                       Qty: {getProductQuantity(product.name)}
    //                                     </Typography>
    //                                     {/* <Button onClick={() => handleDecrement(product.id)}>-</Button>
    //                                   <Input
    //                                     type="number"
    //                                     value={productQuantities[product.id] || 0}
    //                                   />
    //                                   <Button onClick={() => handleIncrement(product.id)}>+</Button> */}
    //                                   </Box>
    //                                 </Grid>
    //                               </>
    //                             ))}
    //                           <Grid item xs={12} md={12}>
    //                             <Divider />
    //                           </Grid>
    //                           <Grid item xs={12} md={12}>
    //                             <Typography variant="h5">Set Free Trial Period</Typography>
    //                           </Grid>
    //                           <Grid item md={6}>
    //                             <Stack direction={'row'} gap={2} alignItems={'center'}>
    //                               <Box>
    //                                 <LocalizationProvider dateAdapter={AdapterMoment}>
    //                                   <InputLabel id="from">Start Date</InputLabel>
    //                                   <DesktopDatePicker
    //                                     disablePast
    //                                     open={isDatePickerOpen}
    //                                     // maxDate={moment().add(trialDays, 'days')}
    //                                     labelId="start_date"
    //                                     autoOk={true}
    //                                     value={startDate}
    //                                     inputFormat="MM/DD/YY"
    //                                     onClose={() => setIsDatePickerOpen(false)}
    //                                     renderInput={(params) => (
    //                                       <TextField
    //                                         onClick={() => setIsDatePickerOpen(true)}
    //                                         {...params}
    //                                       />
    //                                     )}
    //                                     components={{
    //                                       OpenPickerIcon: !isDatePickerOpen
    //                                         ? ArrowDropDownIcon
    //                                         : ArrowDropUpIcon
    //                                     }}
    //                                     onChange={(value) => {
    //                                       setStartDate(value);
    //                                     }}
    //                                   />
    //                                 </LocalizationProvider>
    //                               </Box>
    //                               <Box>
    //                                 <InputLabel id="from">No. of Days</InputLabel>
    //                                 <TextField
    //                                   name={'no_of_days'}
    //                                   type="number"
    //                                   value={trialDays}
    //                                   InputProps={{ inputProps: { min: 0, max: 45, step: 1 } }}
    //                                   onChange={(event) => {
    //                                     setTrialDays(event.target.value);
    //                                   }}
    //                                   fullWidth
    //                                 />
    //                               </Box>
    //                             </Stack>
    //                           </Grid>
    //                         </>
    //                       )}
    //                       {authCtx.user.role === 'test' && (
    //                         <Grid item xs={12} md={12}>
    //                           <Stack
    //                             direction="row"
    //                             justifyContent="flex-end"
    //                             alignItems="center"
    //                             spacing={3}>
    //                             {authCtx.user.role === 'Super Admin' && (
    //                               <Button
    //                                 sx={{
    //                                   '&:disabled': {
    //                                     backgroundColor: '#6e66c724 !important'
    //                                   }
    //                                 }}
    //                                 variant="contained"
    //                                 disabled={checked.length == 0}
    //                                 onClick={handleCheckout}>
    //                                 Start Service
    //                               </Button>
    //                             )}
    //                           </Stack>
    //                         </Grid>
    //                       )}
    //                     </Grid>
    //                   </Form>
    //                 );
    //               }}
    //             </Formik>
    //           </CardContent>
    //         </Card>
    //       </Box>
    //     </TabPanel>
    //     <TabPanel value="2">
    //       <Box className="listing-wrapper">
    //         <Card className="filter">
    //           <CardContent>
    //             <Box>
    //               <Grid container spacing={2}>
    //                 <Grid item md={9} sm={12}>
    //                   <Box>
    //                     <Grid container spacing={2}>
    //                       <Grid item md={4} sm={12}>
    //                         <InputLabel id="search">Search</InputLabel>
    //                         <TextField
    //                           labelId="search"
    //                           placeholder="Location"
    //                           onChange={debouncedResults}
    //                           InputProps={{
    //                             startAdornment: (
    //                               <InputAdornment position="start">
    //                                 <SearchIcon />
    //                               </InputAdornment>
    //                             )
    //                           }}
    //                         />
    //                       </Grid>
    //                     </Grid>
    //                   </Box>
    //                 </Grid>
    //                 <Grid
    //                   item
    //                   md={3}
    //                   sm={12}
    //                   sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
    //                   <Box>
    //                     <Button
    //                       className="add-button"
    //                       variant="contained"
    //                       startIcon={<Plus />}
    //                       onClick={() => setIsUserFormDialogOpen(true)}>
    //                       {' '}
    //                       Add Location
    //                     </Button>
    //                   </Box>
    //                 </Grid>
    //               </Grid>
    //             </Box>
    //           </CardContent>
    //         </Card>
    //         <Card>
    //           <CardContent>
    //             <Box mt={2} position="relative">
    //               <LinerLoader loading={isLoading} />
    //               <TableContainer component={Paper}>
    //                 <Table sx={{ minWidth: 650 }} aria-label="simple table">
    //                   <TableHead>
    //                     <TableRow>
    //                       <TableCell style={{ minWidth: '100px' }} align="left">
    //                         Location
    //                       </TableCell>
    //                       <TableCell align="left">Status</TableCell>
    //                       <TableCell align="right"></TableCell>
    //                     </TableRow>
    //                   </TableHead>
    //                   <TableBody>
    //                     {locationsList?.length > 0
    //                       ? locationsList?.map((row, index) => (
    //                           <TableRow key={index} hover>
    //                             <TableCell align="left">
    //                               <Stack direction="row">
    //                                 <Chip
    //                                   key={index}
    //                                   label={row.loc_name}
    //                                   color="primary"
    //                                   className="chip-color"
    //                                 />
    //                               </Stack>
    //                             </TableCell>
    //                             <TableCell align="left">
    //                               {row.status ? 'Active' : 'Inactive'}
    //                             </TableCell>
    //                             <TableCell align="right">
    //                               <SettingsActions
    //                                 location={row}
    //                                 setLocation={setLocation}
    //                                 setIsUserFormDialogOpen={setIsUserFormDialogOpen}
    //                                 setIsDeleteDialogOpen={setIsDeleteDialogOpen}
    //                               />
    //                             </TableCell>
    //                           </TableRow>
    //                         ))
    //                       : null}
    //                   </TableBody>
    //                 </Table>
    //                 {!isLoading && locationsList?.length == 0 ? <NoDataDiv /> : null}
    //                 {locationsList?.length > 0 ? (
    //                   <TablePagination
    //                     rowsPerPageOptions={[5, 10, 20, 25, 50]}
    //                     onPageChange={handlePageChange}
    //                     onRowsPerPageChange={handleChangeRowsPerPage}
    //                     component="div"
    //                     count={totalLocations}
    //                     rowsPerPage={usersPayload?.pageSize}
    //                     page={usersPayload?.pageNumber}
    //                     sx={{ flex: '1 1 auto' }}
    //                   />
    //                 ) : null}
    //               </TableContainer>
    //             </Box>
    //           </CardContent>
    //         </Card>
    //         {isUserFormDialogOpen && (
    //           <SettingsForm
    //             open={isUserFormDialogOpen}
    //             location={location}
    //             locationsList={locationsList}
    //             customer={customerDetails}
    //             activeLocations={activeLocations}
    //             setOpen={setIsUserFormDialogOpen}
    //             getLocationsList={getLocationsList}
    //             setLocation={setLocation}
    //           />
    //         )}
    //         {/* <DeleteDialog
    //           open={isDeleteDialogOpen}
    //           title="Delete User"
    //           contentText={'Are you sure you want to delete this location?'}
    //           loading={deleteLoading}
    //           handleDialogClose={() => {
    //             setLocation();
    //             setIsDeleteDialogOpen(false);
    //           }}
    //           handleDelete={handleLocationDelete}
    //         /> */}

    //         <NewDeleteDialog
    //           open={isDeleteDialogOpen}
    //           title="Delete location"
    //           contentText="Are you sure you want to delete this location?"
    //           loading={deleteLoading}
    //           handleDialogClose={() => {
    //             setLocation();
    //             setIsDeleteDialogOpen(false);
    //           }}
    //           handleDelete={handleLocationDelete}
    //         />
    //       </Box>
    //     </TabPanel>
    //     <TabPanel value="3">
    //       <DefaultScheduler
    //         // settings={true}
    //         custId={authCtx.user.cust_id || localStorage.getItem('cust_id')}
    //         timer={timer}
    //         selectedDays={selectedDays}
    //         getDefaultScheduleSettings={getDefaultScheduleSettings}
    //       />
    //     </TabPanel>
    //   </TabContext>
    // </Box>
    <>
      <Grid container gap={2}>
        <Grid
          item
          sm={2}
          md={2}
          lg={2}
          xl={2}
          sx={{ backgroundColor: '#fff', borderRadius: '12px' }}>
          <Tabs
            orientation="vertical"
            indicatorColor="white"
            value={value}
            onChange={(_event, newValue) => setValue(newValue)}
            sx={{
              '& .MuiTabs-flexContainer': {
                gap: 1.5
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px'
            }}>
            {tabData.map((tab, index) => (
              <StyledTab
                className="styled-tab"
                key={index}
                label={
                  <>
                    <Stack direction="row" className="settings-tab" alignItems="center" gap={1}>
                      {tab.icon}
                      <Box>
                        <Typography whiteSpace="nowrap">{tab.label}</Typography>
                      </Box>
                    </Stack>
                    <Box
                      className="settings-tab-only-icon"
                      sx={{ textAlign: 'center', margin: 'auto' }}>
                      {tab.icon}
                    </Box>
                  </>
                }
              />
            ))}
          </Tabs>
        </Grid>
        <Grid item sm={9.7} md={9.7} lg={9.7} xl={9.7}>
          <TabPanel value={value} index={2}>
            <Box sx={{ position: 'relative' }}>
              <LinerLoader loading={isLoading} />
              <Card sx={{ borderRadius: '12px' }}>
                <CardContent>
                  <Typography mb={2} fontWeight={'bold'}>
                    {' '}
                    Customer Details and Contact Information{' '}
                  </Typography>
                  <Formik
                    enableReinitialize
                    validateOnChange
                    // validationSchema={validationSchema}
                    initialValues={{
                      name: stripeCust?.name || '',
                      email: stripeCust?.email || '',
                      phone: stripeCust?.phone || '',
                      addressLine1: stripeCust?.address?.line1 || '',
                      addressLine2: stripeCust?.address?.line2 || '',
                      city: stripeCust?.address?.city || '',
                      state: stripeCust?.address?.state || '',
                      country: stripeCust?.address?.country || '',
                      postalcode: stripeCust?.address?.postal_code || ''
                    }}
                    onSubmit={handleSubmit}>
                    {({ values, setFieldValue, touched, errors }) => {
                      return (
                        <Form>
                          <Grid container spacing={2}>
                            <Grid item md={6} xs={12}>
                              <TextField
                                label="Primary Contact Name"
                                name="name"
                                value={values?.name}
                                onChange={(event) => {
                                  setFieldValue('name', event.target.value);
                                }}
                                helperText={touched.name && errors.name}
                                error={touched.name && Boolean(errors.name)}
                                fullWidth
                              />
                            </Grid>
                            <Grid item md={6} xs={12}>
                              <TextField
                                label="Primary Contact Email"
                                name="email"
                                value={values?.email}
                                onChange={(event) => {
                                  setFieldValue('email', event.target.value);
                                }}
                                helperText={touched.email && errors.email}
                                error={touched.email && Boolean(errors.email)}
                                fullWidth
                              />
                            </Grid>
                            <Grid item md={6} xs={12}>
                              <TextField
                                label="Primary Contact Phone"
                                name="phone"
                                value={values?.phone}
                                onChange={(event) => {
                                  setFieldValue('phone', event.target.value);
                                }}
                                helperText={touched.phone && errors.phone}
                                error={touched.phone && Boolean(errors.phone)}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} md={12}>
                              <Divider />
                            </Grid>
                            <Grid item xs={12} md={12}>
                              <Typography variant="subtitle1">Address</Typography>
                            </Grid>
                            <Grid item md={6} xs={12}>
                              <TextField
                                label="Address Line 1"
                                name="addressLine1"
                                value={values?.addressLine1}
                                onChange={(event) => {
                                  setFieldValue('addressLine1', event.target.value);
                                }}
                                helperText={touched.description && errors.description}
                                error={touched.description && Boolean(errors.description)}
                                fullWidth
                              />
                            </Grid>
                            <Grid item md={6} xs={12}>
                              <TextField
                                label="Address Line 2"
                                name="addressLine2"
                                value={values?.addressLine2}
                                onChange={(event) => {
                                  setFieldValue('addressLine2', event.target.value);
                                }}
                                helperText={touched.description && errors.description}
                                error={touched.description && Boolean(errors.description)}
                                fullWidth
                              />
                            </Grid>
                            <Grid item md={6} xs={12}>
                              {/* Country Dropdown */}
                              <Autocomplete
                                options={countries}
                                getOptionLabel={(option) =>
                                  typeof option === 'string' ? option : option.isoCode
                                } // Handle both string and object
                                value={selectedCountry}
                                onChange={(event, newValue) => {
                                  setSelectedCountry(newValue);
                                  console.log('country==', newValue.isoCode);
                                }}
                                renderInput={(params) => (
                                  <TextField {...params} label="Country" variant="outlined" />
                                )}
                                sx={{ marginBottom: 2 }}
                              />
                              {/* <TextField
                                label="Country"
                                name="country"
                                value={values?.country}
                                onChange={(event) => {
                                  setFieldValue('country', event.target.value);
                                }}
                                helperText={touched.description && errors.description}
                                error={touched.description && Boolean(errors.description)}
                                fullWidth
                              /> */}
                            </Grid>
                            <Grid item md={6} xs={12}>
                              {/* State Dropdown */}
                              <Autocomplete
                                options={states}
                                getOptionLabel={(option) =>
                                  typeof option === 'string' ? option : option.name
                                } // Handle both string and object
                                value={selectedState}
                                onChange={(event, newValue) => {
                                  setSelectedState(newValue);
                                  console.log('state==', newValue.name);
                                }}
                                disabled={!selectedCountry}
                                renderInput={(params) => (
                                  <TextField {...params} label="State" variant="outlined" />
                                )}
                                sx={{ marginBottom: 2 }}
                              />
                              {/* <TextField
                                label="State"
                                name="state"
                                value={values?.state}
                                onChange={(event) => {
                                  setFieldValue('state', event.target.value);
                                }}
                                helperText={touched.description && errors.description}
                                error={touched.description && Boolean(errors.description)}
                                fullWidth
                              /> */}
                            </Grid>
                            <Grid item md={6} xs={12}>
                              {/* City Dropdown */}
                              <Autocomplete
                                options={cities}
                                getOptionLabel={(option) =>
                                  typeof option === 'string' ? option : option.name
                                } // Handle both string and object
                                value={selectedCity}
                                onChange={(event, newValue) => {
                                  setSelectedCity(newValue);
                                  console.log('city==', newValue.name);
                                }}
                                disabled={!selectedState}
                                renderInput={(params) => (
                                  <TextField {...params} label="City" variant="outlined" />
                                )}
                                sx={{ marginBottom: 2 }}
                              />
                              {/* <TextField
                                label="City"
                                name="city"
                                value={values?.city}
                                onChange={(event) => {
                                  setFieldValue('city', event.target.value);
                                }}
                                helperText={touched.description && errors.description}
                                error={touched.description && Boolean(errors.description)}
                                fullWidth
                              /> */}
                            </Grid>
                            <Grid item md={6} xs={12}>
                              <TextField
                                label="Postal Code"
                                name="postalcode"
                                value={values?.postalcode}
                                onChange={(event) => {
                                  setFieldValue('postalcode', event.target.value);
                                }}
                                helperText={touched.description && errors.description}
                                error={touched.description && Boolean(errors.description)}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} md={12}>
                              <Stack
                                direction="row"
                                justifyContent="flex-end"
                                alignItems="center"
                                spacing={3}>
                                {authCtx.user.role === 'Super Admin' && (
                                  <LoadingButton
                                    loading={submitLoading}
                                    loadingPosition={submitLoading ? 'start' : undefined}
                                    startIcon={submitLoading && <SaveIcon />}
                                    variant="contained"
                                    type="submit">
                                    Save Changes
                                  </LoadingButton>
                                )}
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={12}>
                              <Divider />
                            </Grid>
                            {/* temporarily checking with role test instead of commenting whole code block */}
                            {authCtx.user.role === 'test' && (
                              <>
                                <Grid item xs={12} md={12}>
                                  <Typography variant="h5">Subscription Plans</Typography>
                                </Grid>
                                {products
                                  ?.filter((item) => item.active)
                                  .map((product, index) => (
                                    <>
                                      <Grid item xs={12} md={2}>
                                        <Box
                                          className="product-box"
                                          // style={{ width: '250px' }}
                                          key={product.id}>
                                          <Checkbox
                                            disabled={scheduledPrices?.includes(product.price_id)}
                                            id={product.id}
                                            name={product.name}
                                            checked={
                                              checked.find(
                                                (item) => item.product.price_id === product.price_id
                                              ) || scheduledPrices?.includes(product.price_id)
                                            }
                                            onChange={(e) =>
                                              handleCheckChange(
                                                e,
                                                product.id,
                                                product.price_id || product.default_price,
                                                getProductQuantity(product.name)
                                              )
                                            }
                                            inputProps={{
                                              'aria-label': 'controlled'
                                            }}
                                          />
                                          <Typography variant="h6">{product.name}</Typography>
                                          <Typography variant="subtitle1">
                                            Price: ${' '}
                                            {product.unit_amount
                                              ? (product.unit_amount / 100) *
                                                (product.name == 'Mobile Live Stream Room License'
                                                  ? authCtx.user.max_stream_live_license_zone
                                                  : product.name ===
                                                    'Sentry Perimeter Monitoring License'
                                                  ? authCtx.user.max_stream_live_license
                                                  : 1)
                                              : '--'}
                                          </Typography>
                                          <Typography variant="subtitle1">
                                            Qty: {getProductQuantity(product.name)}
                                          </Typography>
                                          {/* <Button onClick={() => handleDecrement(product.id)}>-</Button>
                                        <Input
                                          type="number"
                                          value={productQuantities[product.id] || 0}
                                        />
                                        <Button onClick={() => handleIncrement(product.id)}>+</Button> */}
                                        </Box>
                                      </Grid>
                                    </>
                                  ))}
                                <Grid item xs={12} md={12}>
                                  <Divider />
                                </Grid>
                                <Grid item xs={12} md={12}>
                                  <Typography variant="h5">Set Free Trial Period</Typography>
                                </Grid>
                                <Grid item md={6}>
                                  <Stack direction={'row'} gap={2} alignItems={'center'}>
                                    <Box>
                                      <LocalizationProvider dateAdapter={AdapterMoment}>
                                        <InputLabel id="from">Start Date</InputLabel>
                                        <DesktopDatePicker
                                          disablePast
                                          open={isDatePickerOpen}
                                          // maxDate={moment().add(trialDays, 'days')}
                                          labelId="start_date"
                                          autoOk={true}
                                          value={startDate}
                                          inputFormat="MM/DD/YY"
                                          onClose={() => setIsDatePickerOpen(false)}
                                          renderInput={(params) => (
                                            <TextField
                                              onClick={() => setIsDatePickerOpen(true)}
                                              {...params}
                                            />
                                          )}
                                          components={{
                                            OpenPickerIcon: !isDatePickerOpen
                                              ? ArrowDropDownIcon
                                              : ArrowDropUpIcon
                                          }}
                                          onChange={(value) => {
                                            setStartDate(value);
                                          }}
                                        />
                                      </LocalizationProvider>
                                    </Box>
                                    <Box>
                                      <InputLabel id="from">No. of Days</InputLabel>
                                      <TextField
                                        name={'no_of_days'}
                                        type="number"
                                        value={trialDays}
                                        InputProps={{ inputProps: { min: 0, max: 45, step: 1 } }}
                                        onChange={(event) => {
                                          setTrialDays(event.target.value);
                                        }}
                                        fullWidth
                                      />
                                    </Box>
                                  </Stack>
                                </Grid>
                              </>
                            )}
                            {authCtx.user.role === 'test' && (
                              <Grid item xs={12} md={12}>
                                <Stack
                                  direction="row"
                                  justifyContent="flex-end"
                                  alignItems="center"
                                  spacing={3}>
                                  {authCtx.user.role === 'Super Admin' && (
                                    <Button
                                      sx={{
                                        '&:disabled': {
                                          backgroundColor: '#6e66c724 !important'
                                        }
                                      }}
                                      variant="contained"
                                      disabled={checked.length == 0}
                                      onClick={handleCheckout}>
                                      Start Service
                                    </Button>
                                  )}
                                </Stack>
                              </Grid>
                            )}
                          </Grid>
                        </Form>
                      );
                    }}
                  </Formik>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>
          <TabPanel value={value} index={0}>
            <Box className="listing-wrapper">
              <Card className="filter" sx={{ marginTop: '0px !important' }}>
                <CardContent>
                  <Typography mb={1} fontWeight={'bold'}>
                    Location Manager
                  </Typography>
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item md={9} sm={12}>
                        <Box>
                          <Grid container spacing={2}>
                            <Grid item md={4} sm={12} mt={0}>
                              <InputLabel id="search">Search</InputLabel>
                              <TextField
                                labelId="search"
                                placeholder="Location"
                                onChange={debouncedResults}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchIcon />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                      <Grid
                        item
                        md={3}
                        sm={12}
                        sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Box>
                          <Button
                            className="add-button"
                            variant="contained"
                            startIcon={<Plus />}
                            onClick={() => setIsUserFormDialogOpen(true)}>
                            {' '}
                            Add Location
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
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
                            <TableCell style={{ minWidth: '100px' }} align="left">
                              Name
                            </TableCell>
                            <TableCell align="left">Status</TableCell>
                            <TableCell align="right"></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {locationsList?.length > 0
                            ? locationsList?.map((row, index) => (
                                <TableRow key={index} hover>
                                  <TableCell align="left">
                                    <Stack direction="row">
                                      <Chip
                                        key={index}
                                        label={row.loc_name}
                                        color="primary"
                                        className="chip-color"
                                      />
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="left">
                                    {row.status ? 'Active' : 'Inactive'}
                                  </TableCell>
                                  <TableCell align="right">
                                    <SettingsActions
                                      location={row}
                                      setLocation={setLocation}
                                      setIsUserFormDialogOpen={setIsUserFormDialogOpen}
                                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            : null}
                        </TableBody>
                      </Table>
                      {!isLoading && locationsList?.length == 0 ? <NoDataDiv /> : null}
                      {locationsList?.length > 0 ? (
                        <TablePagination
                          rowsPerPageOptions={[5, 10, 20, 25, 50]}
                          onPageChange={handlePageChange}
                          onRowsPerPageChange={handleChangeRowsPerPage}
                          component="div"
                          count={totalLocations}
                          rowsPerPage={usersPayload?.pageSize}
                          page={usersPayload?.pageNumber}
                          sx={{ flex: '1 1 auto' }}
                        />
                      ) : null}
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
              {isUserFormDialogOpen && (
                <SettingsForm
                  open={isUserFormDialogOpen}
                  location={location}
                  locationsList={locationsList}
                  customer={customerDetails}
                  activeLocations={activeLocations}
                  setOpen={setIsUserFormDialogOpen}
                  getLocationsList={getLocationsList}
                  setLocation={setLocation}
                />
              )}
              {/* <DeleteDialog
                open={isDeleteDialogOpen}
                title="Delete User"
                contentText={'Are you sure you want to delete this location?'}
                loading={deleteLoading}
                handleDialogClose={() => {
                  setLocation();
                  setIsDeleteDialogOpen(false);
                }}
                handleDelete={handleLocationDelete}
              /> */}

              <NewDeleteDialog
                open={isDeleteDialogOpen}
                title="Delete location"
                contentText="Are you sure you want to delete this location?"
                loading={deleteLoading}
                handleDialogClose={() => {
                  setLocation();
                  setIsDeleteDialogOpen(false);
                }}
                handleDelete={handleLocationDelete}
              />
            </Box>
          </TabPanel>
          <TabPanel value={value} index={3}>
            <Box className="listing-wrapper">
              <Card className="filter" sx={{ marginTop: '0px !important' }}>
                <CardContent>
                  <Typography mb={1} fontWeight={'bold'}>
                    Zone Type Manager
                  </Typography>
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item md={9} sm={12}>
                        <Box>
                          <Grid container spacing={2}>
                            <Grid item md={4} sm={12} mt={0}>
                              <InputLabel id="search">Search</InputLabel>
                              <TextField
                                labelId="search"
                                placeholder="Zone"
                                onChange={debouncedZoneResults}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchIcon />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                      <Grid
                        item
                        md={3}
                        sm={12}
                        sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Box>
                          <Button
                            className="add-button"
                            variant="contained"
                            startIcon={<Plus />}
                            onClick={() => setIsUserFormDialogOpen(true)}>
                            {' '}
                            Add Zone Type
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
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
                            <TableCell style={{ minWidth: '100px' }} align="left">
                              Name
                            </TableCell>
                            <TableCell align="right"></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {zonesList?.length > 0
                            ? zonesList?.map((row, index) => (
                                <TableRow key={index} hover>
                                  <TableCell align="left">
                                    <Stack direction="row">
                                      <Chip
                                        key={index}
                                        label={row.zone_type}
                                        color="primary"
                                        className="chip-color"
                                      />
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="right">
                                    <SettingsActions
                                      zone={row}
                                      setZone={setZone}
                                      setIsUserFormDialogOpen={setIsUserFormDialogOpen}
                                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            : null}
                        </TableBody>
                      </Table>
                      {!isLoading && zonesList?.length == 0 ? <NoDataDiv /> : null}
                      {zonesList?.length > 0 ? (
                        <TablePagination
                          rowsPerPageOptions={[5, 10, 20, 25, 50]}
                          onPageChange={handleZonesPageChange}
                          onRowsPerPageChange={handleChangeZonesRowsPerPage}
                          component="div"
                          count={totalZones}
                          rowsPerPage={zonesPayload?.pageSize}
                          page={zonesPayload?.pageNumber}
                          sx={{ flex: '1 1 auto' }}
                        />
                      ) : null}
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
              {isUserFormDialogOpen && (
                <SettingsFormZone
                  open={isUserFormDialogOpen}
                  zone={zone}
                  zonesList={zonesList}
                  setOpen={setIsUserFormDialogOpen}
                  getZonesList={getZonesList}
                  setZone={setZone}
                />
              )}
              {/* <DeleteDialog
                open={isDeleteDialogOpen}
                title="Delete User"
                contentText={'Are you sure you want to delete this location?'}
                loading={deleteLoading}
                handleDialogClose={() => {
                  setLocation();
                  setIsDeleteDialogOpen(false);
                }}
                handleDelete={handleLocationDelete}
              /> */}

              <NewDeleteDialog
                open={isDeleteDialogOpen}
                title="Delete Zone"
                contentText="Are you sure you want to delete this zone?"
                loading={deleteLoading}
                handleDialogClose={() => {
                  setZone();
                  setIsDeleteDialogOpen(false);
                }}
                handleDelete={handleZoneDelete}
              />
            </Box>
          </TabPanel>
          <TabPanel value={value} index={4}>
            <Box className="listing-wrapper">
              <Card className="filter" sx={{ marginTop: '0px !important' }}>
                <CardContent>
                  <Typography mb={1} fontWeight={'bold'}>
                    Recording Tag Manager
                  </Typography>
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item md={9} sm={12}>
                        <Box>
                          <Grid container spacing={2}>
                            <Grid item md={4} sm={12} mt={0}>
                              <InputLabel id="search">Search</InputLabel>
                              <TextField
                                labelId="search"
                                placeholder="Tag"
                                onChange={debouncedTagResults}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchIcon />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                      <Grid
                        item
                        md={3}
                        sm={12}
                        sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Box>
                          <Button
                            className="add-button"
                            variant="contained"
                            startIcon={<Plus />}
                            onClick={() => setIsUserFormDialogOpen(true)}>
                            {' '}
                            Add a new Tag
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
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
                            <TableCell style={{ minWidth: '100px' }} align="left">
                              Name
                            </TableCell>
                            <TableCell style={{ minWidth: '100px' }} align="left">
                              Status
                            </TableCell>
                            <TableCell align="right"></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tagsList?.length > 0
                            ? tagsList?.map((row, index) => (
                                <TableRow key={index} hover>
                                  <TableCell align="left">
                                    <Stack direction="row">
                                      <Chip
                                        key={index}
                                        label={row.tag_name}
                                        color="primary"
                                        className="chip-color"
                                      />
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="left">
                                    <Stack direction="row">
                                      <Chip
                                        key={index}
                                        label={row.status == true ? 'Active' : 'Inactive'}
                                        color="primary"
                                        className="chip-color"
                                      />
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="right">
                                    <SettingsActions
                                      tag={row}
                                      setTag={setTag}
                                      setIsUserFormDialogOpen={setIsUserFormDialogOpen}
                                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            : null}
                        </TableBody>
                      </Table>
                      {!isLoading && tagsList?.length == 0 ? <NoDataDiv /> : null}
                      {tagsList?.length > 0 ? (
                        <TablePagination
                          rowsPerPageOptions={[5, 10, 20, 25, 50]}
                          onPageChange={handleTagsPageChange}
                          onRowsPerPageChange={handleChangeTagsRowsPerPage}
                          component="div"
                          count={totalTags}
                          rowsPerPage={tagsPayload?.pageSize}
                          page={tagsPayload?.pageNumber}
                          sx={{ flex: '1 1 auto' }}
                        />
                      ) : null}
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
              {isUserFormDialogOpen && (
                <SettingsFormTag
                  open={isUserFormDialogOpen}
                  tag={tag}
                  tagsList={tagsList}
                  setOpen={setIsUserFormDialogOpen}
                  getTagsList={getTagsList}
                  setTag={setTag}
                />
              )}
              <NewDeleteDialog
                open={isDeleteDialogOpen}
                title="Delete Tag"
                contentText="Are you sure you want to delete this tag?"
                loading={deleteLoading}
                handleDialogClose={() => {
                  setTag();
                  setIsDeleteDialogOpen(false);
                }}
                handleDelete={handleTagDelete}
              />
            </Box>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <NewDefaultScheduler
              // settings={true}
              custId={authCtx.user.cust_id || localStorage.getItem('cust_id')}
              timer={timer}
              allowCustomSchedule={allowCustomSchedule}
              setAllowCustomSchedule={setAllowCustomSchedule}
              selectedDays={selectedDays}
              getDefaultScheduleSettings={getDefaultScheduleSettings}
            />
          </TabPanel>
          <TabPanel value={value} index={5}>
            <TokenExchange />
          </TabPanel>
        </Grid>
      </Grid>
    </>
  );
};

export default Settings;
