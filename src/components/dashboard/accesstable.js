import { Avatar, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import NoDataDiv from '../common/nodatadiv';
import { useEffect } from 'react';
// import { useContext } from 'react';
// import AuthContext from '../../context/authcontext';

export default function AccessTable({
  rows,
  columns,
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

  return (
    <>
      <Paper sx={{ marginTop: 2, height: '96%', minHeight: '338px' }}>
        <Box>
          <Typography style={{ padding: '20px 24px' }}>{title}</Typography>
          <Box className="div-header">
            {columns.map((column, index) => (
              <Box key={index} style={{ width: column.width }}>
                {column.label}
              </Box>
            ))}
          </Box>
          {rows && rows?.length > 0 ? (
            <Box
              style={{
                width: '100%',
                minHeight: '230px',
                overflowY: 'auto'
              }}
              className="table-body">
              {rows.map((row, index) => {
                return (
                  <Box
                    className="div-row row-marging"
                    key={`${row?.childFirstName}-${index}`}
                    onClick={() => hanldeRowClick(row?.family, index)}>
                    <Box style={{ width: '25%' }}>
                      <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <Box className="viewer-profile">
                          <Box className="profile-img">
                            <Avatar>
                              {row?.childFirstName[0].toUpperCase()}
                              {row?.childLastName[0].toUpperCase()}
                            </Avatar>
                          </Box>
                        </Box>
                        {/* {row?.childFirstName + ' ' + row.childLastName} */}
                      </Stack>
                    </Box>
                    <Box style={{ width: '25%' }} className="child-rooms">
                      <Box>
                        {row?.rooms?.map((r) => (
                          <Chip key={r} label={r} />
                        ))}
                      </Box>
                    </Box>
                    <Box style={{ width: '30%' }}>{row.date}</Box>
                    <Box style={{ width: '15%' }}>{row.status}</Box>
                  </Box>
                );
              })}
            </Box>
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
AccessTable.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  title: PropTypes.string,
  isLoading: PropTypes.bool,
  setFamily: PropTypes.func,
  setIsFamilyDrawerOpen: PropTypes.func,
  setFamilyIndex: PropTypes.func,
  familyIndex: PropTypes.number
};
