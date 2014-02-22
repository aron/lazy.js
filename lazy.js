/* Allow for creating of test variables with lazy subject evaluation in the
 * style of RSpecs let and subject. The named property is set to either a
 * static value, or a factory function which is lazily evaluated and memoized.
 *
 * This is useful for unit tests where you sometimes want to defer
 * initializaton of test variables until later in the suite.
 *
 * Examples
 *
 *   var obj = lazy({});
 *
 *   obj.set('target', 'boom');
 *   obj.target // => 'boom'
 *
 *   obj.set('target', 4);
 *   obj.target // => 4
 *
 *   obj.set('target', function () { Math.random() });
 *   obj.target # => 0.1856299617793411
 *   obj.target # => 0.1856299617793411
 *
 *   // The context of the inner function is the lazy object.
 *   obj.set('fixture', 'fixture');
 *   obj.set('target', function () { this.fixture === 'fixture' //=> true });
 *
 *   // Call .restore() to remove all added properties.
 *   obj.set.restore();
 *   obj.target //=> undefined
 *
 *   // The method name can also be specifed, I prefer "let" but it is a
 *   // reserved word, so I'll leave it to you to decide.
 *   var obj = lazy({}, 'let');
 *   obj.let('number', function () { Math.random() });
 *   obj.number //=> 0.3537909844890237
 *
 * Returns context.
 */
(function (module) {
  function lazy(context, method) {
    var cache = [];

    method  = method || 'set';
    context = context || {};

    Object.defineProperty(context, method, {
      value: function (name, value) {
        var subject = arguments.length === 2 ? value : null;

        cache.push(name);

        Object.defineProperty(context, name, {
          get: function () {
            var isFunction = typeof subject === 'function';
            var isMocked = isFunction && typeof subject.getCall === 'function';

            // If this is a plain function then call it and return the value. This
            // allows object initialization to be deferred. However if it's a
            // sinon mock then just let it be.
            return context[name] = isFunction && !isMocked ? subject.call(this) : subject;
          },
          set: function (value) {
            subject = value;
          },
          configurable: true,
          enumerable: true
        });
      }
    });

    // Clean up all test variables lazy evaluated with this.lazy().
    // This can be called in afterEach() to clean up after each test,
    // so that tests do not pollute each other.
    //
    // Examples
    //
    //   obj.lazy.restore() // Cleans up lazily-loaded variables in obj.
    //
    // Returns nothing.
    context[method].restore = function () {
      while (cache.length) {
        delete context[cache.pop()];
      }
    };

    return context;
  }

  // Export the function for various environments.
  if (typeof module.define === 'function' && module.define.amd) {
    module.define('lazy', function () {
      return lazy;
    });
  } else if (module.exports) {
    module.exports = lazy;
  } else {
    module.lazy = lazy;
  }
})(typeof module === 'object' ? module : this);
