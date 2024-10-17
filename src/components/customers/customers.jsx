import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  InputLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
// import Loader from '../common/loader';
import { useEffect, useState, useContext, useMemo } from 'react';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import LayoutContext from '../../context/layoutcontext';
import { useSnackbar } from 'notistack';
import NoDataDiv from '../common/nodatadiv';
import debounce from 'lodash.debounce';
import { Plus } from 'react-feather';
import CustomerForm from './customerform';
import CustomerActions from './customeractions';
import NewDeleteDialog from '../common/newdeletedialog';
import SearchIcon from '@mui/icons-material/Search';
import LinerLoader from '../common/linearLoader';

const Customers = () => {
  const authCtx = useContext(AuthContext);
  const layoutCtx = useContext(LayoutContext);
  // const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isCustomerFormDialogOpen, setIsCustomerFormDialogOpen] = useState(false);
  const [customersList, setCustomersList] = useState([]);
  const [customersPayload, setCustomersPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: ''
  });
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [customer, setCustomer] = useState();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    getCustomersList();
  }, [customersPayload]);

  useEffect(() => {
    layoutCtx.setActive(10);
    layoutCtx.setBreadcrumb(['Customers', authCtx?.custName || null]);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, [authCtx?.custName]);

  // Method to fetch customer list for table
  const getCustomersList = () => {
    setIsLoading(true);
    API.get('customers/all', { params: customersPayload }).then((response) => {
      if (response.status === 200) {
        setCustomersList(response.data.Data.customers);
        setTotalCustomers(response.data.Data.count);
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

  // Method to delete customer
  const handleCustomerDelete = () => {
    setDeleteLoading(true);
    API.delete('customers/delete', {
      data: { customerId: customer.cust_id, confirmationText: `DELETE ${customer.company_name}` }
    }).then((response) => {
      if (response.status === 200) {
        getCustomersList();
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
      setCustomer();
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    });
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setCustomersPayload((prevPayload) => ({
      ...prevPayload,
      pageNumber: 0,
      searchBy: event.target.value ? event.target.value : ''
    }));
  };

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setCustomersPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setCustomersPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  // Calls the search handler after 500ms
  const debouncedResults = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  const hanldeCustomerSelect = (data) => {
    setIsLoading(true);
    localStorage.setItem('cust_id', data.cust_id);
    let name = data.company_name;
    localStorage.setItem('cust_name', name);
    authCtx.setCustName(name);
    API.get('users', { params: { cust_id: data.cust_id } }).then((response) => {
      if (response.status === 200) {
        authCtx.setUser({
          ...response.data.Data,
          location: response.data.Data.location
        });
        localStorage.setItem(
          'user',
          JSON.stringify({ ...response.data.Data, location: response.data.Data.location })
        );
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
    <Box className="listing-wrapper">
      <Card className="filter">
        <CardContent>
          <Box>
            <Grid container spacing={2}>
              <Grid item md={8} sm={12}>
                <Box>
                  <Grid container spacing={2}>
                    <Grid item md={5} sm={12}>
                      <InputLabel id="search">Search</InputLabel>
                      <TextField
                        labelId="search"
                        placeholder="Customer Name,Email"
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
                md={4}
                sm={12}
                sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Box>
                  <Button
                    className="add-button"
                    variant="contained"
                    startIcon={<Plus />}
                    onClick={() => setIsCustomerFormDialogOpen(true)}>
                    {' '}
                    Add Customer
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          <Box mt={2} position="relative">
            <LinerLoader loading={isLoading} />
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ minWidth: '150px' }}>Customer</TableCell>
                    <TableCell align="left">Company Name</TableCell>
                    <TableCell align="left">Maximum Locations</TableCell>
                    <TableCell align="left">Maximum cameras</TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customersList?.length > 0
                    ? customersList?.map((row, index) => (
                        <TableRow key={index} hover>
                          <TableCell component="th" scope="row">
                            <Stack direction="row" alignItems="center" spacing={3}>
                              <Avatar>{`${row.billing_contact_first[0].toUpperCase()}${row.billing_contact_last[0].toUpperCase()}`}</Avatar>

                              <Typography>{`${row.billing_contact_first[0].toUpperCase()}${row.billing_contact_first.slice(
                                1
                              )} ${row.billing_contact_last[0].toUpperCase()}${row.billing_contact_last.slice(
                                1
                              )}`}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="left">{row.company_name}</TableCell>
                          <TableCell align="left">{row.max_locations}</TableCell>
                          <TableCell align="left">{row.max_cameras}</TableCell>
                          <TableCell align="left">
                            <Button onClick={() => hanldeCustomerSelect(row)}>
                              Select Customer
                            </Button>
                          </TableCell>
                          <TableCell align="right">
                            <CustomerActions
                              customer={row}
                              setCustomer={setCustomer}
                              setIsCustomerFormDialogOpen={setIsCustomerFormDialogOpen}
                              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
              {!isLoading && customersList?.length == 0 ? <NoDataDiv /> : null}
              {customersList?.length > 0 ? (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 25, 50]}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  component="div"
                  count={totalCustomers}
                  rowsPerPage={customersPayload?.pageSize}
                  page={customersPayload?.pageNumber}
                  sx={{ flex: '1 1 auto' }}
                />
              ) : null}
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
      {isCustomerFormDialogOpen && (
        <CustomerForm
          open={isCustomerFormDialogOpen}
          setOpen={setIsCustomerFormDialogOpen}
          customer={customer}
          setCustomer={setCustomer}
          getCustomersList={getCustomersList}
        />
      )}
      <NewDeleteDialog
        open={isDeleteDialogOpen}
        title="Delete Customer"
        contentText={'Are you sure you want to delete this customer?'}
        loading={deleteLoading}
        customer={customer ? customer : null}
        handleDialogClose={() => {
          setCustomer();
          setIsDeleteDialogOpen(false);
        }}
        handleDelete={handleCustomerDelete}
      />
    </Box>
  );
};
export default Customers;
