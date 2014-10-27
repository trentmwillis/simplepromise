// This is a simple implementation of Promises/A+ that was developed primarily for learning
// purposes.
//
// Borrowed heavily from https://github.com/rhysbrettbowen/promise_impl, but added my own flair
// with a bunch of additional comments and a healthy dose of security.
(function() {
    // Promises have 3 states
    var STATES = {
        PENDING: 0,   // Pending = still waiting to be resolved
        FULFILLED: 1, // Fulfilled = success
        REJECTED: 2   // Rejected = failure
    };

    // Utility functions to check type of object, not necessary to the implementation, but useful.
    function isFunction(obj) {
        return obj && typeof obj === 'function';
    };

    function isObject(obj) {
        return obj && typeof obj === 'object';
    };

    SimplePromise = function() {
        
        /* PRIVATE PROPERTIES */

        var _state = STATES.PENDING, // The current state of the Promise
            _queue = [],             // The 'thenables' chained to the Promise
            _value;                  // The resolved value/reason of the Promise

        /* PRIVATE METHODS */

        // A method to control the state of the Promise. State should never be changed by any other
        // method.
        function _changeState(state, value) {   // 2.1 - 2.1.3.2
            // Check 3 things:
            // 1. We are in the pending state
            // 2. We are moving to a different state
            // 3. There is a value/reason
            if (_state === STATES.PENDING && _state !== state && arguments.length > 1) {
                // Set the new state and value/reason for fulfillment/rejection
                _state = state;
                _value = value;

                // Run the onFulfilled/onRejected function chain
                _execute();
            }
        };

        // This gets called after the first successful state change and during any then() calls
        // after that. It calls the associated onFulfilled/onRejected function and then resolves the
        // Promise from then() accordingly so that chaining can be accomplished.
        function _execute() { // 2.2.2 - 2.2.3.3
            // Use setTimeout to get us to the platform code execution context
            setTimeout(function() { // 2.2.4
                var then, resolutionFunction, value;

                // Keep up execution till the queue is empty
                while(_queue.length) { // 2.2.6.1 - 2.2.6.2
                    // Get the next thenable
                    then = _queue.shift();

                    try {
                        // Decide which function to run (either onFulfilled or onRejected) and
                        // default to either returning or throwing the value if it doesn't exist.
                        resolutionFunction = (_state === STATES.FULFILLED) ?
                                             (then.onFulfilled || function(x) { return x; }) : // 2.2.7.3
                                             (then.onRejected || function(x) { throw x; });    // 2.2.7.4

                        // If a value is returned, store it so we can resolve with it.
                        value = resolutionFunction(_value); // 2.2.5
                    } catch (err) {
                        // If an error is thrown, the associated Promise gets rejected.
                        then.promise.toRejected(err); // 2.2.7.2
                        continue;
                    }

                    _resolve(then.promise, value); // 2.2.7.1
                }
            }, 0);
        };

        // This is from the massively complicated "Promise Resolution Procedure".
        function _resolve(promise, x) { // 2.3
            if (promise === x) {        // 2.3.1
                promise.toRejected(new TypeError());
            }

            else if (x && x.constructor === SimplePromise) { // 2.3.2
                if (x.state() === STATES.PENDING) {          // 2.3.2.1
                    x.then(function(value) {
                        _resolve(promise, value);            // 2.3.2.2
                    }, function(reason) {
                        promise.toRejected(reason);          // 2.3.2.3
                    });
                } else {
                    if (x.state() === STATES.FULFILLED) {
                        promise.toFulfilled(x.value());
                    } else {
                        promise.toRejected(x.value());
                    }
                }
            }

            else if (x !== null && (typeof x === 'object' || typeof x === 'function')) { // 2.3.3
                var called = false; // 2.3.3.3.3
                try {
                    var then = x.then;                // 2.3.3.1
                    if (typeof then === 'function') { // 2.3.3.3
                        then.call(x, function(y) {
                            called || _resolve(promise, y); // 2.3.3.3.1
                            called = true;
                        }, function(r) {
                            called || promise.toRejected(r); // 2.3.3.3.2
                            called = true;
                        });
                    } else { // 2.3.3.4
                        promise.toFulfilled(x);
                    }
                } catch(e) { // 2.3.3.3.4
                    called || promise.toRejected(e); // 2.3.3.3.1/2
                }
            }

            else { // 2.3.4
                promise.toFulfilled(x);
            }
        };
    

        /* PRIVILEGED/PUBLIC METHODS */

        // The 'then' function. Defines what to do on a resolution of the promise. Returns another
        // Promise so we can chain.
        this.then = function(onFulfilled, onRejected) { // 2.2
            // Make a new Promise to return.
            var promise = new SimplePromise();

            // Push the functions to the queue, but make sure they're actually functions first.
            _queue.push({                                                  // 2.2.1, 2.2.6
                onFulfilled: isFunction(onFulfilled) ? onFulfilled : null, // 2.2.1.1
                onRejected: isFunction(onRejected) ? onRejected : null,    // 2.2.1.2
                promise: promise
            });

            // If the Promise is already resolved (not pending), go ahead and execute.
            if (_state !== STATES.PENDING) {
                _execute();
            }

            return promise; // 2.2.7
        };

        // Resolution methods, to move the promises to a resolved state (either fulfilled or
        // rejected). These will rarely be called explicitly, but more likely through a deferred
        // implementation.
        this.resolve = function(value) {
            _resolve(this, value);
        };

        this.reject = function(reason) {
            this.toRejected(reason);
        };


        // Public changing state methods, since an open interface would just be ugly.
        this.toFulfilled = function(value) {
            _changeState(STATES.FULFILLED, value);
        };

        this.toRejected = function(reason) {
            _changeState(STATES.REJECTED, reason);
        };

        // Accessors, because giving direct access to the _state and _value is  just bad, because
        // they should only be modified by the Promise itself.
        this.state = function() {
            return _state;
        };

        this.value = function() {
            return _value;
        };
    };
})();
