var lazy = require('./lazy');
var assert = require('assert');
var format = require('util').format;

test('lazy() returns an object', function () {
  var context = lazy({});
  assert.equal(typeof context, 'object');
});

test('properties can be defined on the context using set()', function () {
  var context = lazy({});
  context.set('foo', 'bar');
  assert(context.hasOwnProperty('foo'), 'context should have property "foo"');
});

test('accessing a property returns it\'s value', function () {
  var context = lazy({});
  context.set('foo', 'bar');
  assert.equal(context.foo, 'bar');
});

test('accessing a defined function returns it\'s result', function () {
  var context = lazy({});
  context.set('baz', function () { return 'qux' });
  assert.equal(context.baz, 'qux');
});

test('accessing a defined function multiple times always returns the same value', function () {
  var context = lazy({});
  context.set('quux', function () { return Math.random() });
  assert.equal(context.quux, context.quux);
});

test('defined properties can be deleted from the context', function () {
  var context = lazy({});
  context.set('hoge', 'piyo');
  delete context.hoge;
  assert(context.hasOwnProperty('hoge') === false, 'context should not have property "hoge"');
});

test('defining a property with a sinon spy does not call the spy', function () {
  // Sinon style spy.
  function spy() {}
  spy.getCall = function () {};

  var context = lazy({});
  context.set('spy', spy);
  assert.equal(context.spy, spy, 'context.spy should return the spy function');
});

test('properties can be redefined on the context using set()', function () {
  var context = lazy({});
  context.set('toto', 'titi');
  context.set('toto', 'tata');
  assert.equal(context.toto, 'tata');
});

test('properties can be redefined on the context using assignment', function () {
  var context = lazy({});
  context.set('toto', 'titi');
  context.toto = 'tata';
  assert.equal(context.toto, 'tata');
});

test('the scope of a definition function is the context', function () {
  var context = lazy({});
  var scope;
  context.set('wibble', function () { scope = this; });
  context.wibble;

  assert.equal(context, scope);
});

test('the defined properties are enumerable', function () {
  var context = lazy({});
  context.set('foo', 'bar');
  context.set('baz', 'qux');
  assert.equal(Object.keys(context).length, 2);
});

test('the restore() method resets all properties on the context', function () {
  var context = lazy({});
  context.set('foo', function () { return {bar: 'baz'}; });
  context.foo.bar = 'qux';

  context.set.restore();
  assert.deepEqual(context.foo, {bar: 'baz'});
});

test('the clean() method removes all properties from the context', function () {
  var context = lazy({});
  context.set('foo', 'bar');
  context.set('baz', 'qux');
  context.set.clean();
  assert.equal(Object.keys(context).length, 0);
});

test('the name of the set() method can be provided on creation', function () {
  var context = lazy({}, 'let');
  assert.equal(typeof context.let, 'function');
});

run(test.suite);

// Test Suite Helpers

function test(msg, fn) {
  test.suite = test.suite || [];
  test.suite.push({msg: msg, fn: fn});
}

function run(suite) {
  var fails = [], total = suite.length, test;
  suite = suite.slice();

  while (suite.length) {
    test = suite.shift();
    try {
      test.fn();
    } catch (err) {
      fails.push({msg: test.msg, fn: test.fn, err: err});
    }
  }

  print(fails, total);
}

function print(fails, total) {
  if (fails.length) {
    fails.forEach(function (test) {
      var source = test.fn.toString().replace(/\n/g, '\n    ');
      puts('Test:\n    %s\n%s\nSource:\n    %s\n', test.msg, test.err.stack, source);
    });
    puts('%d tests completed with %d error(s)', total, fails.length);
    process.exit(1);
  } else {
    puts('%d tests passing with 0 errors', total);
    process.exit(0);
  }
}

function puts(msg) {
  var args = [].slice.call(arguments, 1);
  process.stdout.write(format.apply(null, [msg + '\n'].concat(args)));
}
