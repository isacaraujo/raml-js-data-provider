'use strict';

const {RamlJsDataProvider} = require('../lib/data-provider');
const assert = require('chai').assert;

describe('Data provider', () => {

  var processor;

  describe('Constructor', function() {

    it('Throws an error for invalid options', function() {
      assert.throws(function() {
        new RamlJsDataProvider({
          test: true
        });
      });
    });

    it('Do not throws an error for valid options', function() {
      assert.doesNotThrow(function() {
        new RamlJsDataProvider({
          api: 'test'
        });
      });
    });

    it('Sets an option object', function() {
      processor = new RamlJsDataProvider({
        api: 'test'
      });
      assert.typeOf(processor.opts, 'object');
    });

    it('Sets the logger', function() {
      processor = new RamlJsDataProvider({
        api: 'test'
      });
      assert.typeOf(processor.logger, 'object');
    });
  });

  describe('printValidationErrors()', function() {
    it('Prints validation error to the logger.error', function() {
      var calledCount = 0;
      const logger = {
        error: function() {
          calledCount++;
        },
        info: function() {}
      };
      processor = new RamlJsDataProvider({
        api: 'test'
      });
      processor.logger = logger;
      processor.opts.validationErrors = ['test'];
      processor.printValidationErrors();
      assert.equal(calledCount, 1);
    });
  });

  describe('printValidationWarnings()', function() {
    it('Prints validation error to the logger.error', function() {
      var calledCount = 0;
      const logger = {
        warn: function() {
          calledCount++;
        },
        info: function() {}
      };
      processor = new RamlJsDataProvider({
        api: 'test'
      });
      processor.logger = logger;
      processor.opts.validationWarnings = ['test'];
      processor.printValidationWarnings();
      assert.equal(calledCount, 1);
    });
  });

  describe('Getters', function() {
    before(function() {
      processor = new RamlJsDataProvider();
    });

    it('Returns server', function() {
      assert.equal(processor.server.constructor.name, 'ApiServer');
    });

    it('server is the same object each time called', function() {
      var t1 = processor.server;
      var t2 = processor.server;
      assert.isTrue(t1 === t2);
    });

    it('Returns ramlSource', function() {
      assert.equal(processor.ramlSource.constructor.name, 'RamlSource');
    });

    it('consoleSources is the same object each time called', function() {
      var t1 = processor.ramlSource;
      var t2 = processor.ramlSource;
      assert.isTrue(t1 === t2);
    });
  });

  describe('_setRaml()', function() {
    this.timeout(10000);
    const options = {
      projectRoot: './test/api/',
      api: 'api.raml'
    };
    before(function() {
      processor = new RamlJsDataProvider(options);
    });

    it('Produces javascript object from RAML', function() {
      return processor._setRaml()
      .then(result => {
        assert.typeOf(result, 'object');
      });
    });
  });
});
