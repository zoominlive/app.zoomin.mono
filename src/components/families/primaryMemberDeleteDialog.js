import {
  Button,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Select,
  Stack,
  Box,
  MenuItem,
  FormHelperText,
  DialogContent
} from '@mui/material';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { capitalizeFirstLetter } from '../../utils/capitalizefirstletter';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { useState } from 'react';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import closeicon from '../../assets/closeicon.svg';
import ConfirmationDialog from '../common/confirmationdialog';

const validationSchema = yup.object({
  member: yup.string('Enter Family Member').required('family Member is required')
});

const PrimaryMemberDeleteDialog = ({ open, setOpen, family, getFamiliesList }) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);

  const handleClose = () => {
    if (family?.secondary?.length == 0) {
      setOpen(false);
    } else {
      setIsCloseDialog(!isCloseDialog);
    }
  };

  const handleSubmit = (data) => {
    setSubmitLoading(true);
    API.delete('family/delete-primary-member', {
      data: {
        primary_family_member_id: family.primary.family_member_id,
        secondary_family_member_id: data?.member
      }
    }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        getFamiliesList();
        setOpen(false);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setSubmitLoading(false);
    });
  };

  return (
    <Dialog
      sx={{
        '& .MuiDialog-container': isCloseDialog
          ? {
              alignItems: 'flex-start',
              marginTop: '12vh',
              '& .MuiDialog-paper': { maxWidth: '440px !important' }
            }
          : {}
      }}
      open={open}
      onClose={handleClose}
      fullWidth
      className="small-dialog">
      {isCloseDialog ? (
        <>
          <ConfirmationDialog
            onCancel={() => {
              setIsCloseDialog(false);
            }}
            onConfirm={() => {
              setIsCloseDialog(false);
              setOpen(false);
            }}
            handleFormDialogClose={handleClose}
          />
        </>
      ) : (
        <>
          <DialogTitle>
            Delete Primary Member
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 18,
                top: 30
              }}>
              {!isCloseDialog ? <CloseIcon /> : <img src={closeicon} alt="closeicon" />}
            </IconButton>
          </DialogTitle>
          {family?.secondary?.length > 1 ? (
            <>
              <DialogContent>
                <Stack direction={'row'} justifyContent={'start'} alignItems={'center'} py={2.2}>
                  {/* <CheckCircleIcon /> */}
                  <DialogContentText>Please choose a new primary family member.</DialogContentText>
                </Stack>

                <Formik
                  enableReinitialize
                  validateOnChange
                  validationSchema={validationSchema}
                  initialValues={{
                    member: ''
                  }}
                  onSubmit={handleSubmit}>
                  {({ values, setFieldValue, touched, errors }) => {
                    return (
                      <Form>
                        <Stack spacing={1}>
                          <Box mt={1}>
                            <InputLabel id="customer">Family Member </InputLabel>
                            <FormControl fullWidth>
                              <Select
                                labelId="member"
                                id="member"
                                value={values?.member}
                                label="Family Member"
                                name="member"
                                error={touched.member && Boolean(errors.member)}
                                onChange={(event) => {
                                  setFieldValue('member', event.target.value);
                                }}>
                                {family?.secondary.map((i) => {
                                  return (
                                    <MenuItem value={i.family_member_id} key={i.family_member_id}>
                                      {capitalizeFirstLetter(i?.first_name)}{' '}
                                      {capitalizeFirstLetter(i?.last_name)}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                              {touched.member && Boolean(errors.member) && (
                                <FormHelperText sx={{ color: '#d32f2f' }}>
                                  {touched.member && errors.member}
                                </FormHelperText>
                              )}
                            </FormControl>
                          </Box>
                          <DialogActions sx={{ paddingTop: 3 }}>
                            <LoadingButton
                              className="add-btn delete-btn"
                              loading={submitLoading}
                              loadingPosition={submitLoading ? 'start' : undefined}
                              startIcon={submitLoading && <SaveIcon />}
                              variant="contained"
                              type="submit">
                              Submit
                            </LoadingButton>
                          </DialogActions>
                        </Stack>
                      </Form>
                    );
                  }}
                </Formik>
              </DialogContent>
            </>
          ) : (
            <>
              <Stack
                direction={'row'}
                justifyContent={'center'}
                alignItems={'start'}
                py={2}
                px={3.5}>
                <CheckCircleIcon />
                <DialogContentText>
                  {family?.secondary?.length == 1
                    ? `Deleting this primary family member will promote ${
                        capitalizeFirstLetter(family?.secondary[0]?.first_name) +
                        ' ' +
                        capitalizeFirstLetter(family?.secondary[0]?.last_name)
                      } to the primary role.`
                    : 'You can not delete the primary family member without another family member to take its place.'}
                </DialogContentText>
              </Stack>

              <DialogActions sx={{ paddingRight: 4, paddingBottom: 2 }}>
                {family?.secondary?.length == 1 ? (
                  <>
                    <Stack direction="row" justifyContent="flex-end" width="100%">
                      <Button
                        className="log-btn"
                        variant="outlined"
                        sx={{ marginRight: 1.5 }}
                        onClick={() => {
                          setOpen(false);
                        }}>
                        No
                      </Button>

                      <LoadingButton
                        id="yes-btn"
                        className="log-btn"
                        loading={submitLoading}
                        loadingPosition={submitLoading ? 'start' : undefined}
                        startIcon={submitLoading && <SaveIcon />}
                        variant="contained"
                        onClick={() => {
                          handleSubmit({ member: family?.secondary[0]?.family_member_id });
                          setOpen(false);
                        }}>
                        Yes
                      </LoadingButton>
                    </Stack>
                  </>
                ) : (
                  <Button
                    id="yes-btn"
                    className="log-btn"
                    variant="outlined"
                    sx={{ marginRight: 1.5, color: '#ffff' }}
                    style={{ color: '#ffff' }}
                    onClick={() => {
                      setOpen(false);
                    }}>
                    okay
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </>
      )}
    </Dialog>
  );
};

export default PrimaryMemberDeleteDialog;

PrimaryMemberDeleteDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  family: PropTypes.obj,
  getFamiliesList: PropTypes.func
};
