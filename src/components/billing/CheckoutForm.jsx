import React, { useContext, useState } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
  CardNumberElement,
  CardCvcElement,
  CardExpiryElement
} from '@stripe/react-stripe-js';
import PropTypes from 'prop-types';
import AuthContext from '../../context/authcontext';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { Plus } from 'react-feather';
import { countries } from '../../utils/constants';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CheckoutForm(props) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardDetails, setCardDetails] = useState(null);
  const authCtx = useContext(AuthContext);
  const [firstName, setFirstName] = useState(null);
  const [country, setCountry] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();

  const handleAddPaymentMethod = async () => {
    console.log('cardElement', CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardNumberElement),
      billing_details: {
        name: firstName,
        address: {
          country: country.code
        }
      }
    });

    if (error) {
      console.error(error);
    } else {
      setCardDetails(paymentMethod);
      saveCardDetails(paymentMethod.id);
    }
  };

  const saveCardDetails = async (cardToken) => {
    try {
      const response = await API.post(`payment/save-card-details`, {
        cardToken: cardToken,
        userId: authCtx.user.stripe_cust_id, // Replace 'user_id' with the actual user ID
        cust_id: localStorage.getItem('cust_id') || authCtx.user.cust_id
      });
      if (response.status === 200) {
        if (location.pathname == '/terms-and-conditions') {
          authCtx.setPaymentMethod(true);
          navigate('dashboard');
        } else {
          props.closeDialog();
          props.getCustPaymentMethod();
          props.setIsLoading(false);
          console.log(response.data.message); // Log success message
        }
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
    } catch (error) {
      console.error('Error saving card details:', error);
    }
  };
  return (
    <form id="card-form">
      <Grid container spacing={4}>
        <Grid item md={12} xs={12}>
          <Typography className="card-element-labels">Card Number</Typography>
          <Box className="input-fields">
            <CardNumberElement />
          </Box>
        </Grid>
        <Grid item md={12} xs={12}>
          <Typography className="card-element-labels">Card Holder Name</Typography>
          <TextField
            labelId="first_name"
            placeholder="Enter Name as on the Card"
            name="first_name"
            value={firstName}
            className="input-fields"
            onChange={(event) => {
              setFirstName(event.target.value);
            }}
            // helperText={touched.first_name && errors.first_name}
            // error={touched.first_name && Boolean(errors.first_name)}
            fullWidth
          />
        </Grid>
        <Grid item md={6} xs={12}>
          <Typography className="card-element-labels">Expiration</Typography>
          <Box className="input-fields">
            <CardExpiryElement />
          </Box>
        </Grid>
        <Grid item md={6} xs={12}>
          <Typography className="card-element-labels">CVC</Typography>
          <Box className="input-fields">
            <CardCvcElement />
          </Box>
        </Grid>
        <Grid item md={12} xs={12}>
          <Typography className="card-element-labels">Country</Typography>
          <Autocomplete
            id="country-select-demo"
            sx={{ width: 300 }}
            options={countries}
            autoHighlight
            getOptionLabel={(option) => option.label}
            onChange={(_, value) => setCountry(value)}
            renderOption={(props, option) => (
              <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                <img
                  loading="lazy"
                  width="20"
                  srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                  src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                  alt=""
                />
                {option.label} ({option.code}) +{option.phone}
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose a country"
                inputProps={{
                  ...params.inputProps,
                  autoComplete: 'new-password' // disable autocomplete and autofill
                }}
              />
            )}
          />
        </Grid>
      </Grid>
      <Box paddingTop={'38px'}>
        <Button
          className="add-payment-button"
          variant="contained"
          startIcon={location.pathname == 'billing' && <Plus />}
          onClick={handleAddPaymentMethod}>
          {location.pathname == 'billing' ? 'Add Payment Method' : 'Continue'}
        </Button>
      </Box>
      {cardDetails && (
        <div>
          <p>Card Brand: {cardDetails.card.brand}</p>
          <p>Last 4 Digits: {cardDetails.card.last4}</p>
          <p>
            Expiration Date: {cardDetails.card.exp_month}/{cardDetails.card.exp_year}
          </p>
        </div>
      )}
    </form>
  );
}

CheckoutForm.propTypes = {
  closeDialog: PropTypes.func,
  getCustPaymentMethod: PropTypes.func,
  setIsLoading: PropTypes.func
};
