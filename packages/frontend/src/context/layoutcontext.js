import React, { useState } from 'react';
import PropTypes from 'prop-types';

const defaultState = {
  layout: {
    active: null,
    breadcrumb: []
  }
};

const LayoutContext = React.createContext({
  layout: {
    active: null,
    breadcrumb: []
  }
});

export const LayoutContextProvider = (props) => {
  const [breadcrumb, setBreadcrumb] = useState(defaultState.layout.breadcrumb);
  const [active, setActive] = useState(defaultState.layout.active);

  // Method to handle breadcrumb changes
  const handleBreadCrumb = (breadCrumbToSet) => setBreadcrumb(breadCrumbToSet);

  // Method to make highlight for the active module
  const handleActive = (index) => setActive(index);

  const context = {
    breadcrumb,
    active,
    setBreadcrumb: handleBreadCrumb,
    setActive: handleActive
  };

  return <LayoutContext.Provider value={context}>{props.children}</LayoutContext.Provider>;
};
LayoutContextProvider.propTypes = {
  children: PropTypes.any
};

export default LayoutContext;
