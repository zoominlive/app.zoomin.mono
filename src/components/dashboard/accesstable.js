import { Avatar, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import NoDataDiv from '../common/nodatadiv';
import FamilyDrawer from '../families/familydrawer';
import { useContext, useEffect, useState } from 'react';
import ParentsForm from '../families/parentform';
import ChildForm from '../families/childform';
import RoomAddForm from '../families/roomaddform';
import DisableDialog from '../families/disabledialog';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import AuthContext from '../../context/authcontext';
import dayjs from 'dayjs';
export default function AccessTable({ rows, columns, title, isLoading, getDashboardData }) {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [isFamilyDrawerOpen, setIsFamilyDrawerOpen] = useState(false);
  const [family, setFamily] = useState();
  const [isParentFormDialogOpen, setIsParentFormDialogOpen] = useState(false);
  const [isChildFormDialogOpen, setIsChildFormDialogOpen] = useState(false);
  const [isRoomFormDialogOpen, setIsRoomFormDialogOpen] = useState(false);
  const [isDisableFamilyDialogOpen, setIsDisableFamilyDialogOpen] = useState(false);
  const [primaryParent, setPrimaryParent] = useState();
  const [secondaryParent, setSecondaryParent] = useState();
  const [child, setChild] = useState();
  const [parentType, setParentType] = useState('');
  const [roomsList, setRoomsList] = useState([]);
  const [disableLoading, setDisableLoading] = useState(false);

  // const [roomsDropdownLoading, setRoomsDropdownLoading] = useState(false);
  const handleFamilyDisable = (data) => {
    setDisableLoading(true);
    API.put('family/disable', {
      family_member_id: family.primary.family_member_id,
      member_type: 'primary',
      family_id: family.primary.family_id,
      scheduled_end_date:
        data.selectedOption === 'schedule' && dayjs(data.disableDate).format('YYYY-MM-DD')
    }).then((response) => {
      if (response.status === 200) {
        if (response?.data?.Data?.scheduled === true) {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.scheduled_end_date = dayjs(data.disableDate).format('YYYY-MM-DD');
            return tempFamily;
          });
        }
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        //getFamiliesList();
        if (data.selectedOption === 'disable') {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.status = 'Disabled';
            tempFamily.secondary.length > 0 &&
              tempFamily.secondary.forEach((parent) => {
                parent.status = 'Disabled';
              });

            tempFamily.children.forEach((child) => {
              child.status = 'Disabled';
            });
            if (tempFamily.primary.scheduled_end_date) {
              tempFamily.primary.scheduled_end_date = null;
            }
            return tempFamily;
          });
        } else {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.scheduled_end_date = data.disableDate;
            return tempFamily;
          });
        }
        setIsDisableFamilyDialogOpen(false);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setDisableLoading(false);
    });
  };

  useEffect(() => {
    // setRoomsDropdownLoading(true);
    API.get('rooms/list', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setRoomsList(response.data.Data);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        // setRoomsDropdownLoading(false);
      }
    );
  }, []);
  const hanldeRowClick = (data) => {
    console.log('calling===============================');
    let { secondary, children, ...rest } = data;
    let familyDetails = { primary: rest, secondary: secondary, children: children };
    setFamily(familyDetails);
    setIsFamilyDrawerOpen(true);
  };
  return (
    <>
      <Paper sx={{ marginTop: 2, height: '96%', minHeight: '338px' }}>
        <Box>
          <Typography style={{ padding: 20 }}>{title}</Typography>
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
                    onClick={() => hanldeRowClick(row?.family)}>
                    <Box style={{ width: '45%' }}>
                      <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <Box className="viewer-profile">
                          <Box className="profile-img">
                            <Avatar>
                              {row?.childFirstName[0].toUpperCase()}
                              {row?.childLastName[0].toUpperCase()}
                            </Avatar>
                          </Box>
                        </Box>
                        {row?.childFirstName + ' ' + row.childLastName}
                      </Stack>
                    </Box>
                    <Box className="child-rooms">
                      <Box>
                        {row?.rooms.map((r) => (
                          <Chip key={r} label={r} />
                        ))}
                      </Box>
                    </Box>
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
      {isDisableFamilyDialogOpen && (
        <DisableDialog
          open={isDisableFamilyDialogOpen}
          setOpen={setIsDisableFamilyDialogOpen}
          loading={disableLoading}
          title="Disable Family"
          contentText="This action will disable access for all children."
          handleDisable={handleFamilyDisable}
          handleDialogClose={() => setIsDisableFamilyDialogOpen(false)}
        />
      )}

      {isRoomFormDialogOpen && (
        <RoomAddForm
          open={isRoomFormDialogOpen}
          setOpen={setIsRoomFormDialogOpen}
          roomsList={roomsList}
          family={family}
          child={child}
          setChild={setChild}
          setFamily={setFamily}
          getFamiliesList={getDashboardData()}
        />
      )}
      {isChildFormDialogOpen && (
        <ChildForm
          open={isChildFormDialogOpen}
          setOpen={setIsChildFormDialogOpen}
          roomsList={roomsList}
          family={family}
          child={child}
          setChild={setChild}
          setFamily={setFamily}
          getFamiliesList={getDashboardData()}
        />
      )}

      {isParentFormDialogOpen && (
        <ParentsForm
          open={isParentFormDialogOpen}
          setOpen={setIsParentFormDialogOpen}
          primaryParent={primaryParent}
          setPrimaryParent={setPrimaryParent}
          secondaryParent={secondaryParent}
          setSecondaryParent={setSecondaryParent}
          family={family}
          setFamily={setFamily}
          getFamiliesList={getDashboardData()}
          setParentType={setParentType}
          parentType={parentType}
        />
      )}

      <FamilyDrawer
        open={isFamilyDrawerOpen}
        setOpen={setIsFamilyDrawerOpen}
        family={family}
        setFamily={setFamily}
        setIsParentFormDialogOpen={setIsParentFormDialogOpen}
        setIsChildFormDialogOpen={setIsChildFormDialogOpen}
        setIsRoomFormDialogOpen={setIsRoomFormDialogOpen}
        setIsDisableFamilyDialogOpen={setIsDisableFamilyDialogOpen}
        setPrimaryParent={setPrimaryParent}
        setSecondaryParent={setSecondaryParent}
        setChild={setChild}
        getFamiliesList={getDashboardData()}
        setParentType={setParentType}
        roomsList={roomsList}
        parentType={parentType}
      />
    </>
  );
}
AccessTable.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  title: PropTypes.string,
  isLoading: PropTypes.bool,
  getDashboardData: PropTypes.func
};
