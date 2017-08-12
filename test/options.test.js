'use strict';

const {ProviderOptions} = require('../lib/provider-options.js');
const assert = require('chai').assert;

describe('Options', () => {

  describe('validateOptions()', () => {
    var options;

    describe('_validateOptionsList()', () => {
      beforeEach(function() {
        options = new ProviderOptions();
      });

      it('Should pass a known options', function() {
        options._validateOptionsList({
          verbose: true,
          host: 'test-host',
          port: 12345,
          api: 'test.raml',
          projectRoot: 'test/'
        });
        assert.isTrue(options.isValid);
      });

      it('Should not pass a unknown option', function() {
        options._validateOptionsList({
          test: 'test'
        });
        assert.isFalse(options.isValid);
      });

      it('Should not pass invalid type', function() {
        options._validateOptionsList({
          tagVersion: true,
          verbose: 'true',
          open: 'true',
          host: 123,
          port: '12345',
          api: null,
          projectRoot: 'test/',
          src: 'console-test/',
          sourceIsZip: true,
          noBower: false
        });
        assert.isFalse(options.isValid);
      });
    });
  });

  describe('Default options', () => {
    var options;

    before(function() {
      options = new ProviderOptions();
    });

    it('Should set verbose default option', function() {
      assert.isFalse(options.verbose);
    });

    it('Should set host default option', function() {
      assert.isUndefined(options.host);
    });

    it('Should set port default option', function() {
      assert.isUndefined(options.port);
    });

    it('Should set api default option', function() {
      assert.equal(options.api, 'api.raml');
    });

    it('Should set projectRoot default option', function() {
      assert.typeOf(options.projectRoot, 'string');
    });

    it('ProjectRoot is an absolute path', function() {
      assert.equal(options.projectRoot[0], '/');
    });
  });
});
