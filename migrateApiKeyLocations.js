const sequelize = require('./lib/database');
const ApiKey = require('./models/api_keys');  // Import your Users model
const CustomerLocationAssignmentsCopy = require('./models/customer_location_assignment');  // Import your CustomerLocationAssignments model

// Define location mapping for simplicity
const locationMapping = {
  "Primary Location": 202,
  "Secondary Location": 203
};

async function migrateApiKeyLocations() {
  try {
    // Fetch all apikeys
    const apikeys = await ApiKey.findAll();

    for (const apikey of apikeys) {
      // Parse `location` field to get selected locations
      let locationData;
      try {      
        locationData = typeof apikey.location === 'string' ? JSON.parse(apikey.location) : apikey.location;
        console.log('locationData==>', locationData);
      } catch (error) {
        console.error(`Failed to parse location for apikey ${apikey.user_id}`, error);
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
            console.warn(`Unknown location: ${locName} for apikey ${apikey.id}`);
            continue;
          }

          // Insert a record into `customer_location_assignments`
          await CustomerLocationAssignmentsCopy.create({
            user_id: null,
            family_member_id: null,
            family_id: null,
            child_id: null,
            cust_id: apikey.cust_id,
            api_key_id: apikey.id,
            loc_id: loc_id
          });

          console.log(`Added location ${locName} (loc_id: ${loc_id}) for user ${apikey.id}`);
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
module.exports.migrateApiKeyLocations = migrateApiKeyLocations;
