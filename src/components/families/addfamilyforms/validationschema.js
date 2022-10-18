import * as yup from 'yup';
import API from '../../../api';
import { errorMessageHandler } from '../../../utils/errormessagehandler';

function checkEmailUnique(value) {
  if (value) {
    return new Promise((resolve) => {
      API.post('users/emailValidation', { email: value }).then((response) => {
        if (response.status === 200) {
          if (response.data.Data) {
            return resolve(false);
          } else {
            return resolve(true);
          }
        } else {
          errorMessageHandler(
            undefined,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            undefined
          );
        }
      });
    });
  }
}

export default [
  yup.object().shape({
    primary: yup.object().shape({
      first_name: yup.string().required('First Name is required'),
      last_name: yup.string().required('Last Name is required'),
      relationship: yup.string().required('Role is required'),
      phone: yup
        .string()
        .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number')
        .required('Phone is required'),
      email: yup
        .string()
        .email('Enter valid email')
        .required('Email is required')
        .test('checkEmailUnique', 'Email already exists', checkEmailUnique)
    })
  }),
  yup.object().shape({
    secondary: yup.array().of(
      yup.object().shape({
        first_name: yup.string().required('First Name is required'),
        last_name: yup.string().required('Last Name is required'),
        relationship: yup.string().required('Role is required'),
        phone: yup
          .string()
          .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number')
          .required('Phone is required'),
        email: yup
          .string()
          .email('Enter valid email')
          .required('Email is required')
          .test('checkEmailUnique', checkEmailUnique)
      })
    )
  }),
  yup.object().shape({
    children: yup
      .array()
      .of(
        yup.object().shape({
          first_name: yup.string().required('First Name is required'),
          rooms: yup
            .array()
            .of(
              yup.object().shape({
                room_id: yup.string(),
                room_name: yup.string()
              })
            )
            .min(1, 'Enter at least one room')
            .required('required')
        })
      )
      .min(1, 'Add atleast one child')
  })
];
