const sequelize = require('./lib/database');
const Users = require('./models/users');  // Import your Users model
const CustomerLocationAssignmentsCopy = require('./models/customer_location_assignment');  // Import your CustomerLocationAssignments model

// Define location mapping for simplicity
const locationMapping = {
  "Primary Location": 202,
  "Secondary Location": 203
};

async function migrateUserLocations() {
  try {
    // Fetch all users
    const users = await Users.findAll();

    for (const user of users) {
      // Parse `location` field to get selected locations
      let locationData;
      try {      
        locationData = typeof user.location === 'string' ? JSON.parse(user.location) : user.location;
        console.log('locationData==>', locationData);
      } catch (error) {
        console.error(`Failed to parse location for user ${user.user_id}`, error);
        continue;
      }
      
      // Check if `selected_locations` exists in location data
      if (locationData && locationData.accessable_locations) {
        const accessableLocations = locationData.accessable_locations;

        // Iterate over each selected location
        for (const locName of accessableLocations) {
          const loc_id = locationMapping[locName];

          // Skip if loc_id is undefined (meaning location is unrecognized)
          if (!loc_id) {
            console.warn(`Unknown location: ${locName} for user ${user.user_id}`);
            continue;
          }

          // Insert a record into `customer_location_assignments`
          await CustomerLocationAssignmentsCopy.create({
            user_id: user.user_id,
            family_member_id: null,
            family_id: null,
            child_id: null,
            cust_id: user.cust_id,
            loc_id: loc_id
          });

          console.log(`Added location ${locName} (loc_id: ${loc_id}) for user ${user.user_id}`);
        }
      }
    }
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    sequelize.close();  // Close the connection
  }
}

// Run the migration
migrateUserLocations();
