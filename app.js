var seraph = require("seraph");
var fs = require("fs");

// Parameters for importer
var RELATIVE_FILE_LOCATION = process.argv[2];

// Database settings
var DB_URL = "http://localhost";
var DB_PORT = "7474";

// Create DB connection
var db = seraph(
    process.env["NEO4J_URL"] ||
    DB_URL + ":" + DB_PORT
);

var json;

try {
    // Main application block
    fs.readFile( __dirname + "/" + RELATIVE_FILE_LOCATION, function (err, data) {
        if (err) {
            throw err;
        }

        var jsonString = data.toString();

        if (validateJSON(jsonString)) {
            json = JSON.parse(jsonString);

            // Run through all locations in JSON
            json.locations.forEach(function(location, index, arr) {

                var loc = {};

                // We only want the values from location.info into the Location node
                var infoArr = Object.keys(location.info);
                infoArr.forEach(function(info) {
                    if (location.info.hasOwnProperty(info)) {
                        loc[info] = location.info[info];
                    }
                });

                // Ignore locations without an id (they don't adhere to our constraint)
                if (loc.id) {
                    // Create a constraint on Location's ID
                    db.constraints.uniqueness.createIfNone("Location", "id", function(err, constraint) {
                        console.info("Constraint created/updated for: " + constraint);
                    });

                    // Create/update Location node for this ID
                    db.save(loc, "Location", function(err, node) {
                        console.info("Node created/updated: " + node);
                    });
                }
            });
        }
    });
} catch (e) {
    console.error(e);
}

/**
 * Validate that a file contains JSON
 * @param {String} file File's contents as a String
 * @returns {Boolean} Is file valid JSON
 */
var validateJSON = function(file) {
    var valid = false;

    if (file) {
        try {
            var json = JSON.parse(file);
            if (json !== null) {
                valid = true;
            }
        } catch (e) {
            console.error("Non-valid input file! Make sure you've given a relative path to the file.");
            console.log(e);
            throw e;
        }
    }

    return valid;
};
