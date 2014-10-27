(function() {
    // A simple Deferred class for interacting with Promises
    SimpleDeferred = function() {
        // The associated Promise for the deferred
        this.promise = new SimplePromise();
    };

    // Mark the Promise as resolved/fulfilled
    SimpleDeferred.prototype.resolve = function(value) {
        this.promise.resolve(value);
    };

    // Mark the Promise as rejected
    SimpleDeferred.prototype.reject = function(reason) {
        this.promise.reject(reason);
    };
})();
