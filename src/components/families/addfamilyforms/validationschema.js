import * as yup from 'yup';

export default [
  yup.object().shape({
    primary: yup.object().shape({
      first_name: yup.string().required('First Name is required'),
      last_name: yup.string().required('Last Name is required'),
      role: yup.string().required('Role is required'),
      phone: yup
        .string()
        .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number')
        .required('Phone is required'),
      email: yup.string().email('Enter valid email').required('Email is required')
    })
  }),
  yup.object().shape({
    secondary: yup.array().of(
      yup.object().shape({
        first_name: yup.string().required('First Name is required'),
        last_name: yup.string().required('Last Name is required'),
        role: yup.string().required('Role is required'),
        phone: yup
          .string()
          .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number')
          .required('Phone is required'),
        email: yup.string().email('Enter valid email').required('Email is required')
      })
    )
  }),
  yup.object().shape({
    children: yup.array().of(
      yup.object().shape({
        first_name: yup.string().required('First Name is required'),
        rooms: yup.array()
      })
    )
  })
];
