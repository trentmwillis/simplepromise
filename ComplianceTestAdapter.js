// Use 'fs' to load in other files without being Node specific
var fs = require('fs');

// Load in the files as strings and eval them
eval(fs.readFileSync('SimplePromise.js') + '');
eval(fs.readFileSync('SimpleDeferred.js') + '');

// Export 'deferred' for the tests
module.exports = {
    deferred: function() {
        return new SimpleDeferred();
    }
}
