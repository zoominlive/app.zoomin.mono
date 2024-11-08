const sequelize = require('./lib/database');
const Child = require('./models/child');  // Import your Child model
const CustomerLocationAssignmentsCopy = require('./models/customer_location_assignment_copy');  // Import your CustomerLocationAssignments model

// Define location mapping for simplicity
const locationMapping = {
  "Primary Location": 202,
  "Secondary Location": 203
};

async function migrateChildrenLocations() {
  try {
    // Fetch all users
    const children = await Child.findAll();

    for (const child of children) {
      // Parse `location` field to get selected locations
      
      let locationData;
      try {      
        locationData = typeof child.location === 'string' ? JSON.parse(child.location) : child.location;
        console.log('locationData==>', locationData);
      } catch (error) {
        console.error(`Failed to parse location for child ${child.child_id}`, error);
        continue;
      }
      
      // Check if `selected_locations` exists in location data
      if (locationData && locationData.locations) {
        const accessableLocations = locationData.locations;

        // Iterate over each selected location
        for (const locName of accessableLocations) {
          const loc_id = locationMapping[locName];

          // Skip if loc_id is undefined (meaning location is unrecognized)
          if (!loc_id) {
            console.warn(`Unknown location: ${locName} for child ${child.child_id}`);
            continue;
          }

          // Insert a record into `customer_location_assignments`
          await CustomerLocationAssignmentsCopy.create({
            user_id: null,
            family_member_id: null,
            family_id: child.family_id,
            child_id: child.child_id,
            cust_id: child.cust_id,
            loc_id: loc_id
          });

          console.log(`Added location ${locName} (loc_id: ${loc_id}) for child ${child.child_id}`);
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
migrateChildrenLocations();
