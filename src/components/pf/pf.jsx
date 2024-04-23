import { useContext } from 'react';
import { ProductFruits } from 'react-product-fruits';
import AuthContext from '../../context/authcontext';

export function PF() {
  const authCtx = useContext(AuthContext);

  const userInfo = {
    username: authCtx.user.first_name + '' + authCtx.user.last_name, // REQUIRED - any unique user identifier
    email: authCtx.user.email,
    firstname: authCtx.user.first_name,
    lastname: authCtx.user.last_name,
    signUpAt: authCtx.user.createdAt,
    role: authCtx.user.role
    // props: { customProp1: 123 } used to pass any other properties
  };

  return <ProductFruits workspaceCode={'tolz2SzpdmAUTMVA'} language="en" user={userInfo} />;
}
