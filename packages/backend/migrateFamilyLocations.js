const sequelize = require('./lib/database');
const Family = require('./models/family');  // Import your Family model
const CustomerLocationAssignmentsCopy = require('./models/customer_location_assignment');  // Import your CustomerLocationAssignments model

// Define location mapping for simplicity
const locationMapping = {
  "Primary Location": 202,
  "Secondary Location": 203
};

async function migrateFamilyLocations() {
  try {
    // Fetch all users
    const famUsers = await Family.findAll();

    for (const fam of famUsers) {
      // Parse `location` field to get selected locations
      
      let locationData;
      try {      
        locationData = typeof fam.location === 'string' ? JSON.parse(fam.location) : fam.location;
        console.log('locationData==>', locationData);
      } catch (error) {
        console.error(`Failed to parse location for fam ${fam.family_member_id}`, error);
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
            console.warn(`Unknown location: ${locName} for fam ${fam.family_member_id}`);
            continue;
          }

          // Insert a record into `customer_location_assignments`
          await CustomerLocationAssignmentsCopy.create({
            user_id: null,
            family_member_id: fam.family_member_id,
            family_id: fam.family_id,
            child_id: null,
            cust_id: fam.cust_id,
            loc_id: loc_id
          });

          console.log(`Added location ${locName} (loc_id: ${loc_id}) for fam ${fam.family_member_id}`);
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
module.exports.migrateFamilyLocations = migrateFamilyLocations;