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
 *   obj.lazy('target', 'boom');
 *   obj.target // => 'boom'
 *
 *   obj.lazy('target', 4);
 *   obj.target // => 4
 *
 *   obj.lazy('target', function () { Math.random() });
 *   obj.target # => 0.1856299617793411
 *   obj.target # => 0.1856299617793411
 *
 *   // The context of the inner function is the lazy object.
 *   obj.lazy('fixture', 'fixture');
 *   obj.lazy('target', function () { this.fixture === 'fixture' //=> true });
 *
 *   // Call .restore() to remove all added properties.
 *   obj.lazy.restore();
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
function lazy(context, method) {
  var cache = [];

  method = method || 'lazy';

  context[method] = function (name, value) {
    var subject = arguments.length === 2 ? value : null;
    var isMemoized = false;

    cache.push(name);

    Object.defineProperty(context, name, {
      get: function () {
        if (isMemoized) { return subject; }
        var isFunction = typeof subject === 'function';
        var isMocked = isFunction && typeof subject.getCall === 'function';

        isMemoized = true;

        // If this is a plain function then call it and return the value. This
        // allows object initialization to be deferred. However if it's a
        // sinon mock then just let it be.
        return subject = isFunction && !isMocked ? subject.call(this) : subject;
      },
      set: function (value) {
        subject = value;
        isMemoized = false;
      },
      configurable: true
    });
  };

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
