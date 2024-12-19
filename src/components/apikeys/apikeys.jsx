/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from 'react';
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
  Grid,
  IconButton,
  InputLabel,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LinerLoader from '../common/linearLoader';
import PropTypes from 'prop-types';
import { Copy, Edit, Trash } from 'react-feather';
import API from '../../api';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import LayoutContext from '../../context/layoutcontext';
import CloseIcon from '@mui/icons-material/Close';
import { Form, Formik } from 'formik';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import NoAPIKeyDataDiv from './noapikeydatadiv';
import tick from '../../assets/tick.png';
import warningimg from '../../assets/warning.png';
import CopyToClipboard from 'react-copy-to-clipboard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { duotoneSpace } from 'react-syntax-highlighter/dist/esm/styles/prism';
import moment from 'moment';

const tableHeaders = ['Endpoint', 'Create', 'Edit', 'List', 'Delete', 'Enable/Disable'];
const tableRowsCopy = [
  {
    '/users': { create: false, edit: false, list: false, delete: false, enabledisable: false }
  },
  {
    '/cams': { create: false, edit: false, list: false, delete: false, enabledisable: null }
  },
  {
    '/zones': { create: false, edit: false, list: false, delete: false, enabledisable: false }
  },
  {
    '/family': {
      create: false,
      edit: false,
      list: false,
      delete: false,
      enabledisable: false
    }
  },
  {
    '/child': {
      create: false,
      edit: false,
      list: null,
      delete: false,
      enabledisable: false
    }
  },
  {
    '/locations': {
      create: false,
      edit: false,
      list: false,
      delete: false,
      enabledisable: false
    }
  }
];
// Define endpoint mappings based on permissions
const endpointMappings = {
  '/users': {
    create: '/api/users/create-user',
    edit: '/api/users/edit',
    list: '/api/users/all',
    delete: '/api/users/delete',
    enabledisable: ['/api/users/enable', '/api/users/disable'] // No endpoint for enable/disable in allowedEndpoints
  },
  '/cams': {
    create: '/api/cams/add',
    edit: '/api/cams/edit',
    list: '/api/cams',
    delete: '/api/cams/delete',
    enabledisable: null
  },
  '/zones': {
    create: '/api/zones/add',
    edit: '/api/zones/edit',
    list: '/api/zones',
    delete: '/api/zones/delete',
    enabledisable: null
  },
  '/family': {
    create: ['/api/family/add', '/api/family/add-secondary-family-member'],
    edit: '/api/family/edit',
    list: '/api/family',
    delete: [
      '/api/family/delete',
      '/api/family/delete-primary-member',
      '/api/family/delete-secondary-member'
    ],
    enabledisable: ['/api/family/enable', '/api/family/disable']
  },
  '/child': {
    create: '/api/family/child/add',
    edit: ['/api/family/child/edit', '/api/family/child/replace-room'],
    list: null,
    delete: '/api/family/child/delete',
    enabledisable: ['/api/family/child/enable', '/api/family/child/disable']
  },
  '/locations': {
    create: '/api/customers/create-customer-location',
    edit: '/api/customers/edit-customer-location',
    list: '/api/customers/locations',
    delete: '/api/customers/delete-customer-location',
    enabledisable: ['/api/customers/locations/enable', '/api/customers/locations/disable']
  }
};
const code = 'POST /exchange-token';
const body = `{
  "api_key": "your_api_key",
  "api_secret": "your_api_secret"
}`;
const auth = 'x-api-key:your_jwt_token';

const APIKeys = () => {
  const { enqueueSnackbar } = useSnackbar();
  const layoutCtx = useContext(LayoutContext);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeysList, setApiKeysList] = useState([]);
  const [lastCreatedKey, setLastCreatedKey] = useState(null);
  const [open, setOpen] = useState(false);
  const [openWarnDialog, setOpenWarnDialog] = useState(false);
  const [deleteAPIKey, setDeleteAPIKey] = useState(false);
  const authCtx = useContext(AuthContext);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [keyCreated, setKeyCreated] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [edit, setEdit] = useState(false);
  const [apiKeyDetails, setApiKeyDetails] = useState(null);
  const [tableRowsState, setTableRowsState] = useState(tableRowsCopy);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const validationSchema = yup.object({
    name: yup.string('Enter App name').required('App name is required'),
    email: yup.string('Enter your email').email('Enter a valid email').required('Email is required')
  });

  useEffect(() => {
    layoutCtx.setActive(11);
    layoutCtx.setBreadcrumb(['ZOOMiN LiVE App Registration', 'Manage your API keys']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    getAPIList();
  }, []);

  useEffect(() => {
    if (apiKeyDetails?.allowed_endpoints && edit) {
      console.log('apiKeyDetails?.allowedEndpoints', apiKeyDetails?.allowed_endpoints);
      mapEndpointsToPermissions(apiKeyDetails?.allowed_endpoints);
    }
  }, [edit, apiKeyDetails]);

  const mapEndpointsToPermissions = (endpoints) => {
    const updatedRows = tableRowsCopy.map((item) => {
      const endpoint = Object.keys(item)[0];
      const updatedPermissions = { ...item[endpoint] };

      for (const [action, apiEndpoint] of Object.entries(endpointMappings[endpoint])) {
        if (updatedPermissions[action] !== null) {
          if (Array.isArray(apiEndpoint)) {
            updatedPermissions[action] = apiEndpoint.some((ep) => endpoints.includes(ep));
          } else {
            updatedPermissions[action] = endpoints.includes(apiEndpoint);
          }
        }
      }

      return { [endpoint]: updatedPermissions };
    });

    setTableRowsState(updatedRows);
  };

  const getAPIList = () => {
    setIsLoading(true);
    API.get('api-key/list').then((response) => {
      if (response.status === 200) {
        setApiKeysList(response.data.data);
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

  const getLatestRecord = () => {
    setIsLoading(true);
    API.get('api-key/get-latest-record').then((response) => {
      if (response.status === 200) {
        // setLastCreatedKey(response.data.data);
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

  const handleCreateNewKey = () => {
    console.log(apiKeysList);
    if (apiKeysList.length == 2) {
      setOpenWarnDialog(true);
    } else {
      setOpen(true);
    }
  };

  const handleKeyStatus = (row) => {
    console.log('key==>', row);
    setIsLoading(true);
    API.patch('api-key/change-status', {
      id: row.id,
      status: row.status == 'active' ? 'disabled' : 'active'
    }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
        getAPIList();
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

  const handleDeleteKey = (row) => {
    console.log('key==>', row);
    setDeleteAPIKey(true);
    setData(row);
  };

  const deleteData = () => {
    console.log('data', data);
    setIsLoading(true);
    API.delete('api-key/delete', {
      data: {
        id: data.id,
        frontegg_user_id: data.frontegg_user_id
      }
    }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
        setDeleteAPIKey(false);
        getAPIList();
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

  const handleEdit = (row, data) => {
    console.log('key==>', row);
    console.log('data==>', data);
    setApiKeyDetails(row);
    setEdit(true);
    setOpen(true);
  };

  const handleFormDialogClose = () => setOpen(!open);

  const handleSubmit = (values) => {
    // Check if at least one action is selected
    const isAnyActionSelected = tableRowsState.some((item) => {
      const permissions = Object.values(item)[0];
      return Object.values(permissions).some((value) => value);
    });

    if (!isAnyActionSelected) {
      setError('Please select at least one action.');
      return;
    }
    console.log('values-->', values);
    console.log('tableRowsState-->', tableRowsState);

    // Get allowed endpoints based on permissions
    const getAllowedEndpoints = () => {
      const result = new Set();

      tableRowsState.forEach((item) => {
        const endpoint = Object.keys(item)[0];
        const permission = item[endpoint];

        for (const [action, value] of Object.entries(permission)) {
          if (value && endpointMappings[endpoint][action]) {
            const mappedEndpoint = endpointMappings[endpoint][action];
            if (Array.isArray(mappedEndpoint)) {
              mappedEndpoint.forEach((ep) => result.add(ep));
            } else {
              result.add(mappedEndpoint);
            }
          }
        }
      });

      return Array.from(result).filter(Boolean); // Remove null values
    };

    const filteredEndpoints = getAllowedEndpoints();
    console.log('filteredEndpoints==>', filteredEndpoints);
    console.log('authCtx.user==>', authCtx.user);

    setIsLoading(true);
    setSubmitLoading(true);
    if (edit) {
      API.put('api-key/edit', {
        id: apiKeyDetails.id,
        name: values.name,
        frontegg_user_id: apiKeyDetails.frontegg_user_id,
        frontegg_tenant_id: apiKeyDetails.frontegg_tenant_id,
        allowed_endpoints: filteredEndpoints
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          getAPIList();
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setIsLoading(false);
        setSubmitLoading(false);
        setOpen(false);
      });
    } else {
      API.post('api-key/create', {
        name: values?.name,
        email: values?.email,
        user_id: authCtx?.user?.frontegg_user_id || authCtx?.user?.user_id,
        frontegg_tenant_id: authCtx?.user?.frontegg_tenant_id,
        cust_id: authCtx?.user?.cust_id || localStorage.getItem('cust_id'),
        location: authCtx?.user?.location,
        allowed_endpoints: filteredEndpoints
      }).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          getAPIList();
          getLatestRecord();
          handleFormDialogClose();
          setKeyCreated(true);
          setTableRowsState(tableRowsCopy);
          setLastCreatedKey(response.data.data);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setIsLoading(false);
        setSubmitLoading(false);
      });
    }
  };

  const handleClose = () => {
    setIsCloseDialog(!isCloseDialog);
    setTableRowsState(tableRowsCopy);
    setSubmitLoading(false);
    setApiKeyDetails(null);
    setEdit(false);
  };

  const handleClosWarnDialog = () => {
    setOpenWarnDialog(false);
  };

  const handleKeySecretClose = () => setKeyCreated(!keyCreated);

  const handleCheckboxChange = (endpoint, action) => (event) => {
    setTableRowsState((prevState) =>
      prevState.map((item) => {
        const key = Object.keys(item)[0];
        if (key === endpoint) {
          return {
            [key]: {
              ...item[key],
              [action]: event.target.checked
            }
          };
        }
        return item;
      })
    );
  };

  const handleCheckAllChange = (endpoint) => (event) => {
    const isChecked = event.target.checked;
    setTableRowsState((prevState) =>
      prevState.map((item) => {
        const key = Object.keys(item)[0];
        if (key === endpoint) {
          return {
            [key]: {
              create: isChecked,
              edit: isChecked,
              list: item[key].list !== null ? isChecked : null,
              delete: isChecked,
              enabledisable: item[key].enabledisable !== null ? isChecked : null
            }
          };
        }
        return item;
      })
    );
  };

  const Row = ({ row }) => {
    return (
      <>
        <TableRow hover>
          <TableCell>
            <Typography>{row.name ? row.name : 'API key 1'}</Typography>
          </TableCell>
          <TableCell>
            <Typography>{`${row.key.toString().slice(0, 16)}` + '' + `[...]`}</Typography>
          </TableCell>
          <TableCell>
            <Typography>{moment(row.createdAt).format('MMMM D, YYYY')}</Typography>
          </TableCell>
          <TableCell className="api-key-status">
            <Chip
              label={row.status.toString()[0].toUpperCase() + row.status.slice(1)}
              className={
                row.status == 'disabled'
                  ? 'api-secret-key-chip-disabled'
                  : 'api-secret-key-chip-active'
              }
            />
          </TableCell>
          <TableCell>
            <Button
              className="enable-disable-button"
              variant="contained"
              sx={{
                borderRadius: '50px',
                textTransform: 'capitalize'
              }}
              onClick={() => handleKeyStatus(row)}>
              {row.status == 'disabled' ? 'Enable' : 'Disable'}
            </Button>
          </TableCell>
          <TableCell>
            <IconButton onClick={() => handleEdit(row)}>
              <Edit color="#5A53DD" />
            </IconButton>
          </TableCell>
          <TableCell>
            <IconButton onClick={() => handleDeleteKey(row)}>
              <Trash color="red" />
            </IconButton>
          </TableCell>
        </TableRow>
      </>
    );
  };

  Row.propTypes = {
    row: PropTypes.shape({
      createdAt: PropTypes.string,
      key: PropTypes.bool,
      name: PropTypes.string,
      status: PropTypes.object
    })
  };

  return (
    <>
      <Grid container spacing={3} className="stream-details-wraper">
        <Grid item xl={4} lg={4} md={4} sm={12} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography fontWeight={600}>How to Interact with the ZOOMiN LIVE API</Typography>

              <Stack direction={'column'} gap={3}>
                <Box mt={1}>
                  <Typography fontSize={16} fontWeight={500} color={'#828282'}>
                    The ZOOMiN LiVE API requires authentication using JWT (JSON Web Token) format.
                    To begin, click the{' '}
                    <span style={{ color: '#343434' }}>&apos;Create New App Integration&apos;</span>{' '}
                    button below to generate your API key and secret.
                  </Typography>
                  <Typography color={'#828282'} fontSize={16} fontWeight={500} mt={2}>
                    You can generate a maximum of 2 API keys. If you require more, please contact
                    our support team.
                  </Typography>
                </Box>
                <Box>
                  <Button
                    className="add-button"
                    variant="contained"
                    onClick={handleCreateNewKey}
                    sx={{
                      borderRadius: '50px',
                      textTransform: 'capitalize',
                      padding: '10px 18px'
                    }}>
                    Create New App Integration
                  </Button>
                </Box>
                <Typography color={'#828282'} fontSize={'16px'} fontWeight={500}>
                  Authentication Process:
                </Typography>
                <Stack direction={'column'} gap={2}>
                  <Box>
                    <Typography fontSize={16} fontWeight={500} color={'#828282'}>
                      <span style={{ color: '#343434' }}>1. Generate API Key & Secret:</span> Click
                      the “Create New API Key” button to obtain your API key and secret. Be sure to
                      securely store these credentials as the secret will only be displayed once.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography fontSize={16} fontWeight={500} color={'#828282'}>
                      <span style={{ color: '#343434' }}>
                        2. Exchange API Key & Secret for a JWT Token:
                      </span>{' '}
                      Before making any API calls, you need to exchange your API key & secret for a
                      token in JWT format. Use the following
                    </Typography>
                    <Typography fontSize={16} fontWeight={500} color={'#828282'} mt={1} mb={1}>
                      • endpoint to obtain your token:
                    </Typography>
                    <Box
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 3
                      }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          bgcolor: '#4D4D56',
                          px: 2,
                          py: 1
                        }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          endpoint
                        </Typography>
                        <CopyToClipboard text={code}>
                          <Button
                            startIcon={<ContentCopyIcon sx={{ color: '#EBE8FF !important' }} />}
                            sx={{
                              color: 'white',
                              textTransform: 'none'
                            }}>
                            Copy code
                          </Button>
                        </CopyToClipboard>
                      </Box>
                      <Box sx={{ bgcolor: '#272822', px: 3, py: 3 }}>
                        <Typography variant="body1" sx={{ color: 'white' }}>
                          {code}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography fontSize={16} fontWeight={500} color={'#828282'} mt={2} mb={1}>
                      • Request Body:
                    </Typography>
                    <Box
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 3
                      }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          bgcolor: '#4D4D56',
                          px: 2,
                          py: 1
                        }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          body
                        </Typography>
                        <CopyToClipboard text={body}>
                          <Button
                            startIcon={<ContentCopyIcon sx={{ color: '#EBE8FF !important' }} />}
                            sx={{
                              color: 'white',
                              textTransform: 'none'
                            }}>
                            Copy code
                          </Button>
                        </CopyToClipboard>
                      </Box>
                      <Box sx={{ bgcolor: '#272822', px: 2, py: 2 }}>
                        <SyntaxHighlighter
                          language="json"
                          style={duotoneSpace}
                          showLineNumbers={false}>
                          {body}
                        </SyntaxHighlighter>
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <Typography fontSize={16} fontWeight={500} color={'#828282'} mb={1}>
                      <span style={{ color: '#343434' }}>3. Use the Token for API Calls:</span> Once
                      you receive the token, include it in the ‘x-api-key’ header of your API
                      requests:
                    </Typography>
                    <Box
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 3
                      }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          bgcolor: '#4D4D56',
                          px: 2,
                          py: 1
                        }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          auth
                        </Typography>
                        <CopyToClipboard text={auth}>
                          <Button
                            startIcon={<ContentCopyIcon sx={{ color: '#EBE8FF !important' }} />}
                            sx={{
                              color: 'white',
                              textTransform: 'none'
                            }}>
                            Copy code
                          </Button>
                        </CopyToClipboard>
                      </Box>
                      <Box sx={{ bgcolor: '#272822', px: 3, py: 3 }}>
                        <Typography variant="body1" sx={{ color: 'white' }}>
                          {auth}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
                <Typography fontWeight={500} fontSize={16}>
                  For Complete API Documentation Visit:{' '}
                  <a href="https://apidocs.zoominlive.com/">https://apidocs.zoominlive.com/</a>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xl={8} lg={8} md={8} sm={12} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box mt={2} position="relative">
                <LinerLoader loading={isLoading} />
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>API Key</TableCell>
                        <TableCell>Create Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {apiKeysList?.length > 0
                        ? apiKeysList?.map((row, index) => <Row row={row} key={index} />)
                        : null}
                    </TableBody>
                  </Table>
                  {!isLoading && apiKeysList?.length == 0 ? (
                    <>
                      <NoAPIKeyDataDiv handleCreateNewKey={handleCreateNewKey} />
                    </>
                  ) : null}
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {open && (
        <>
          <Dialog open={open} onClose={handleClose} fullWidth className="add-user-drawer">
            <DialogTitle sx={{ paddingTop: 3.5 }}>
              {'App Registration'}
              <DialogContentText mt={1}>
                <Typography>
                  Name your application and provide an unique email address. Logs will display this
                  email address as your API keys user.
                </Typography>
              </DialogContentText>
              <IconButton
                aria-label="close"
                onClick={() => {
                  handleClose();
                }}
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
              <Formik
                enableReinitialize
                validateOnChange
                validationSchema={validationSchema}
                initialValues={{
                  name: apiKeyDetails?.name || '',
                  email: apiKeyDetails?.email || '',
                  allowedEndpoints: apiKeyDetails?.allowedEndpoints || []
                }}
                onSubmit={handleSubmit}>
                {({ values, setFieldValue, touched, errors }) => {
                  return (
                    <Form>
                      <DialogContent>
                        <Grid container spacing={2}>
                          <Grid item md={6} xs={12}>
                            <InputLabel id="name">Enter Name</InputLabel>
                            <TextField
                              sx={{
                                '& .MuiOutlinedInput-root	': { borderRadius: '15px' },
                                '& .MuiOutlinedInput-input	': { background: '#FAFAFF' },
                                marginTop: '4px'
                              }}
                              labelId="name"
                              name="name"
                              value={values?.name}
                              placeholder="Company name here"
                              onChange={(event) => {
                                setFieldValue('name', event.target.value);
                              }}
                              helperText={touched.name && errors.name}
                              error={touched.name && Boolean(errors.name)}
                              fullWidth
                            />
                          </Grid>
                          <Grid item md={6} xs={12}>
                            <InputLabel id="email">Email Id</InputLabel>
                            <TextField
                              sx={{
                                '& .MuiOutlinedInput-root	': { borderRadius: '15px' },
                                '& .MuiOutlinedInput-input	': { background: '#FAFAFF' },
                                marginTop: '4px'
                              }}
                              labelId="email"
                              name="email"
                              value={values?.email}
                              disabled={edit}
                              placeholder="Contact email id here"
                              onChange={(event) => {
                                setFieldValue('email', event.target.value);
                              }}
                              helperText={touched.email && errors.email}
                              error={touched.email && Boolean(errors.email)}
                              fullWidth
                            />
                          </Grid>
                          <Grid item md={12} xs={12}>
                            <InputLabel id="email">Manage Permissions</InputLabel>
                            <TableContainer
                              component={Paper}
                              sx={{
                                border: '1px solid #EBE8FF',
                                borderRadius: '15px !important',
                                marginTop: '8px'
                              }}>
                              <Table aria-label="spanning table">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: '#FAFAFF !important' }}>
                                    {tableHeaders.map((item, index) => (
                                      <TableCell
                                        key={index}
                                        sx={{
                                          paddingLeft:
                                            item === 'Endpoint' ? '30px !important' : '0px',
                                          borderLeft:
                                            item === 'Endpoint'
                                              ? '0px'
                                              : '1px solid rgba(224, 224, 224, 1)'
                                        }}
                                        align={item === 'Endpoint' ? 'left' : 'center'}>
                                        {item}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {tableRowsState.map((item, index) => {
                                    const endpoint = Object.keys(item)[0];
                                    const permissions = item[endpoint];
                                    console.log('endpoint', endpoint);
                                    console.log('item', item);
                                    console.log('permissions', permissions);

                                    return (
                                      <TableRow key={index}>
                                        <TableCell sx={{ paddingLeft: '30px !important' }}>
                                          <Checkbox
                                            checked={Object.values(permissions).every(
                                              (v) => v === true
                                            )}
                                            indeterminate={
                                              !Object.values(permissions).every(
                                                (v) => v === true
                                              ) &&
                                              Object.values(permissions).some((v) => v === true)
                                            }
                                            onChange={handleCheckAllChange(endpoint)}
                                          />
                                          {endpoint}
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{ borderLeft: '1px solid rgba(224, 224, 224, 1)' }}>
                                          <Checkbox
                                            checked={permissions.create}
                                            onChange={handleCheckboxChange(endpoint, 'create')}
                                          />
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{ borderLeft: '1px solid rgba(224, 224, 224, 1)' }}>
                                          <Checkbox
                                            checked={permissions.edit}
                                            onChange={handleCheckboxChange(endpoint, 'edit')}
                                          />
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{ borderLeft: '1px solid rgba(224, 224, 224, 1)' }}>
                                          <Checkbox
                                            sx={{
                                              '&.Mui-disabled': {
                                                pointerEvents: 'auto',
                                                '&:hover': {
                                                  backgroundColor: 'transparent'
                                                },
                                                cursor: 'not-allowed',
                                                '& .MuiSvgIcon-root': {
                                                  color: '#00000042 !important'
                                                }
                                              }
                                            }}
                                            disabled={permissions.list == null}
                                            checked={permissions.list}
                                            onChange={handleCheckboxChange(endpoint, 'list')}
                                          />
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{ borderLeft: '1px solid rgba(224, 224, 224, 1)' }}>
                                          <Checkbox
                                            checked={permissions.delete}
                                            onChange={handleCheckboxChange(endpoint, 'delete')}
                                          />
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{ borderLeft: '1px solid rgba(224, 224, 224, 1)' }}>
                                          <Checkbox
                                            sx={{
                                              '&.Mui-disabled': {
                                                pointerEvents: 'auto',
                                                '&:hover': {
                                                  backgroundColor: 'transparent'
                                                },
                                                cursor: 'not-allowed',
                                                '& .MuiSvgIcon-root': {
                                                  color: '#00000042 !important'
                                                }
                                              }
                                            }}
                                            disabled={permissions.enabledisable == null}
                                            checked={permissions.enabledisable}
                                            onChange={handleCheckboxChange(
                                              endpoint,
                                              'enabledisable'
                                            )}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>
                        </Grid>
                      </DialogContent>

                      <DialogActions
                        sx={{
                          padding: '0px 32px',
                          paddingBottom: 3,
                          justifyContent: 'space-between'
                        }}>
                        <Box>
                          {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                        </Box>
                        <LoadingButton
                          className="add-btn save-changes-btn"
                          loading={submitLoading}
                          loadingPosition={submitLoading ? 'start' : undefined}
                          startIcon={submitLoading && <SaveIcon />}
                          variant="text"
                          type="submit">
                          Submit
                        </LoadingButton>
                      </DialogActions>
                    </Form>
                  );
                }}
              </Formik>
            )}
          </Dialog>
        </>
      )}
      {keyCreated && (
        <>
          <Dialog open={keyCreated} onClose={handleKeySecretClose}>
            <DialogTitle sx={{ paddingTop: 3.5 }}>
              {'API Key & Secret'}
              <IconButton
                aria-label="close"
                onClick={() => {
                  handleKeySecretClose();
                }}
                sx={{
                  position: 'absolute',
                  right: 18,
                  top: 30
                }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ maxWidth: '480px !important' }}>
              <Stack direction={'column'} gap={1} justifyContent={'center'}>
                <Box margin={'auto'}>
                  <img src={tick} />
                </Box>
                <Box>
                  <Typography
                    color={'#343434'}
                    fontWeight={600}
                    fontSize={'22px'}
                    lineHeight={'33px'}
                    textAlign={'center'}>
                    Your API key and secret have been successfully generated.
                  </Typography>
                  <Typography
                    color={'#828282'}
                    fontWeight={400}
                    fontSize={'14px'}
                    textAlign={'center'}
                    lineHeight={'21px'}>
                    Please make sure to copy and securely store both the API key and secret now, as
                    this is the only time the secret will be displayed. If you lose the secret, you
                    will need to generate a new key and secret pair.
                  </Typography>
                </Box>
                {lastCreatedKey && (
                  <>
                    <Stack direction={'column'} gap={2} padding={2} borderRadius={2}>
                      <TextField
                        label={'API Key ID'}
                        value={lastCreatedKey?.key}
                        InputProps={{
                          endAdornment: (
                            <>
                              <IconButton
                                onClick={() => {
                                  navigator.clipboard.writeText(lastCreatedKey?.key);
                                  setOpenSnack(true);
                                }}>
                                <Copy />
                              </IconButton>
                            </>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root	': { borderRadius: '15px' },
                          '& .MuiOutlinedInput-input	': { background: '#FAFAFF' }
                        }}
                      />
                      <TextField
                        label={'API Secret ID'}
                        value={lastCreatedKey?.secret}
                        InputProps={{
                          endAdornment: (
                            <>
                              <IconButton
                                onClick={() => {
                                  navigator.clipboard.writeText(lastCreatedKey?.secret);
                                  setOpenSnack(true);
                                }}>
                                <Copy />
                              </IconButton>
                            </>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root	': { borderRadius: '15px' },
                          '& .MuiOutlinedInput-input	': { background: '#FAFAFF' }
                        }}
                      />
                    </Stack>
                    <Button
                      variant="contained"
                      className="add-btn"
                      sx={{ borderRadius: '30px' }}
                      onClick={() => {
                        setOpenSnack(true);
                        navigator.clipboard.writeText(
                          lastCreatedKey?.key + ' ' + lastCreatedKey?.secret
                        );
                        handleKeySecretClose();
                      }}>
                      Done
                    </Button>
                  </>
                )}
              </Stack>
            </DialogContent>
          </Dialog>
          <Snackbar
            open={openSnack}
            autoHideDuration={6000}
            onClose={handleClose}
            message="Copied!"
          />
        </>
      )}
      {openWarnDialog && (
        <Dialog open={openWarnDialog} onClose={handleClosWarnDialog}>
          <DialogContent sx={{ mt: '40px', mb: '40px', maxWidth: '411px !important' }}>
            <Stack direction={'column'} justifyContent={'center'}>
              <Box sx={{ margin: 'auto' }}>
                <img src={warningimg} width={80} height={80} alt="warning" />
              </Box>
              <Typography
                textAlign={'center'}
                fontWeight={600}
                color={'#343434'}
                fontSize={'22px'}
                lineHeight={'33px'}>
                You may generate a maximum of 2 API keys
              </Typography>
              <Typography
                textAlign={'center'}
                fontWeight={400}
                fontSize={'16px'}
                color={'#828282'}
                mt={3}
                mb={3}>
                If you need more API keys, please contact our support team, or consider deleting one
                of your existing keys.
              </Typography>
              <Typography
                textAlign={'center'}
                fontWeight={400}
                fontSize={'16px'}
                color={'#828282'}
                mb={3}>
                <span style={{ color: '#343434' }}>Note:</span> Deleting an API key will immediately
                terminate any active sessions linked to it.
              </Typography>
              <Button
                className="add-btn"
                sx={{
                  borderRadius: '30px',
                  maxWidth: '120px',
                  margin: 'auto',
                  textTransform: 'capitalize'
                }}
                onClick={handleClosWarnDialog}
                variant="contained">
                Continue
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      )}
      {deleteAPIKey && (
        <Dialog open={deleteAPIKey} onClose={handleClose}>
          <Stack direction={'row'} justifyContent={'center'} alignItems={'start'} padding={3}>
            <DialogContentText>
              Note: Deleting an API key will immediately terminate any active sessions linked to it.
            </DialogContentText>
          </Stack>
          <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
            <Stack direction="row" justifyContent="flex-end" width="100%">
              <Button
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5 }}
                onClick={() => {
                  setDeleteAPIKey(false);
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
                  deleteData();
                }}>
                Yes
              </Button>
            </Stack>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default APIKeys;
