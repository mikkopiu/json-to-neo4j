var seraph = require("seraph");
var fs = require("fs");

// Parameters for importer
var RELATIVE_FILE_LOCATION = process.argv[2];

// Database settings
var DB_URL = "http://localhost";
var DB_PORT = "7474";
var DB_USER = "neo4j";
var DB_PASS = "asd123";

// Create DB connection
var db = seraph({
    server: DB_URL + ":" + DB_PORT,
    user: DB_USER,
    pass: DB_PASS
});

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
                location.data.Temperature.timeValuePairs.forEach(function(pair, index) {

                    // We want the location's information embedded into the Temperature node
                    var weather = pair;
                    weather.geoid = location.info.geoid;
                    weather.wmo = location.info.wmo;
                    weather.location_name = location.info.name;
                    weather.region = location.info.region;

                    // Create the basic Temperature node
                    var saveNode = db.save(weather, "Temperature", function(err, node) {
                        if (err) {
                            console.error("Error in adding Weather node!");
                            console.error(err);
                        } else {
                          console.log("Created node: " + node);
                        }
                    });

                    // Get datetime from the time-value-pair
                    var parsedDatetime = new Date(pair.time);
                    var dateQuery = 'MATCH (h:Hour)-[:IN_DAY]->(d:Day)' +
                                    '-[:IN_MONTH]->(m:Month)' +
                                    '-[:IN_YEAR]->(y:Year)' +
                                    ' WHERE h.hour = "'parseDateTime.getHours().length == 2 ? parsedDateTime.getHours() : "0" + parsedDateTime.getHours()'"' +
                                    ' AND d.day = "'parseDateTime.getDay().length == 2 ? parsedDateTime.getDay() : "0" + parsedDateTime.getDay()'"' +
                                    ' AND m.month = "'parseDateTime.getKuukausi'"' +
                                    ' AND y.year = "'parseDateTime.getVuosi'"' +
                                    ' RETURN h,d,m,y' +
                                    ' LIMIT 25';

                    // Create a relationship to the time the temperature was recorded
                    db.relate(savedNode, "IN_HOUR", "tuntiNode", function(err, relation) {
                        if (err) {
                          console.error("Error in creating relationship IN_HOUR!");
                          console.error(err);
                        } else {
                          console.log("Created relationship: " + relation);
                        }
                    });
                });
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
