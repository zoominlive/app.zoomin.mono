import { Box, Paper, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import NoDataDiv from '../common/nodatadiv';
import { useEffect } from 'react';
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
  console.log(rows);
  return (
    <>
      <Paper sx={{ marginTop: 2, height: '96%', minHeight: '338px', boxShadow: 'unset' }}>
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
                        <Box className="zl__td-block" style={{ width: '60%' }}>
                          <Stack direction={'row'} alignItems={'center'} gap={1}>
                            {row?.Type}
                          </Stack>
                        </Box>
                        <Box style={{ width: '20%' }} className="child-rooms zl__td-block">
                          <Box style={{ display: 'flex' }}>{row?.Number}</Box>
                        </Box>
                        <Box className="zl__td-block" style={{ width: '20%', color: '#6AD2A0' }}>
                          {row.Charge}
                        </Box>
                        {/* <Box className="zl__td-block" style={{ width: '25%' }}>
                        {row.status}
                      </Box> */}
                      </Box>
                    </>
                  );
                })}
              </Box>
              {/* <Box className="div-row row-marging zl__tr-block">
                <Box className="zl__td-block" style={{ width: '60%' }}>
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    {'Total Subscription'}
                  </Stack>
                </Box>
                <Box style={{ width: '20%' }} className="child-rooms zl__td-block">
                  <Box style={{ display: 'flex' }}>{''}</Box>
                </Box>
                <Box className="zl__td-block" style={{ width: '20%', color: '#6AD2A0' }}>
                  {'$985'}
                </Box>
              </Box> */}
              {/* <Box style={{ width: '60%' }} display={'flex'} flexDirection={'row-reverse'}>
                {' '}
                <Typography
                  sx={{
                    fontSize: '12px !important',
                    fontWeight: 400,
                    lineHeight: '18px',
                    color: '#00000052 !important'
                  }}>
                  *Plus all applicable taxes
                </Typography>
              </Box> */}
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
