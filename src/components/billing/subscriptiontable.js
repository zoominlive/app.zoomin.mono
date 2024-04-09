import { Box, Paper, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import NoDataDiv from '../common/nodatadiv';
import { useEffect } from 'react';
import _ from 'lodash';
// import { useContext } from 'react';
// import AuthContext from '../../context/authcontext';

export default function SubscriptionTable({
  rows,
  // columns,
  title,
  isLoading,
  setFamily,
  setIsFamilyDrawerOpen,
  setFamilyIndex,
  familyIndex
}) {
  //const authCtx = useContext(AuthContext);

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
  let amount = rows.map((item) => parseInt(item.Charge));
  amount = _.sum(amount);
  return (
    <>
      <Paper sx={{ marginTop: 2, boxShadow: 'unset' }}>
        <Box className="zl__table-block">
          <Typography style={{ padding: '20px 14px' }}>{title}</Typography>
          {rows && rows?.length > 0 ? (
            <>
              <Box
                style={{
                  width: '100%',
                  minHeight: '230px',
                  overflowY: 'auto'
                }}
                className="table-body zl__tr-grp">
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
                          {row.Status}
                        </Box>
                        <Box className="zl__td-block" style={{ width: '20%' }}>
                          {row.NextInvoiceDate}
                        </Box>
                        <Box
                          className="zl__td-block"
                          style={{ width: '20%', color: '#6AD2A0', textAlign: 'right' }}>
                          {parseFloat(row.Charge).toFixed(2)}
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
                    {parseFloat(amount).toFixed(2)}
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
  columns: PropTypes.array,
  title: PropTypes.string,
  isLoading: PropTypes.bool,
  setFamily: PropTypes.func,
  setIsFamilyDrawerOpen: PropTypes.func,
  setFamilyIndex: PropTypes.func,
  familyIndex: PropTypes.number
};
