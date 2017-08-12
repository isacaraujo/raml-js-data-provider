'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc <pawel.psztyc@mulesoft.com>
 */
const path = require('path');
/**
 * Options object for the ApiConsoleDevPreview class.
 */
class ProviderOptions {
  constructor(opts) {
    opts = opts || {};

    this.validateOptions(opts);
    if (!this.isValid) {
      return;
    }

    opts = this._setDefaults(opts);

    /**
     * Optional. Prints verbose output. Default to `false`.
     * @type {Boolean}
     */
    this.verbose = opts.verbose;
    /**
     * Optional. Host name to create web socket server on.
     * @type {String}
     */
    this.host = opts.host;
    /**
     * Port number to run the web server on. If not set it uses first available
     * port from range `<49152, 65535>`.
     * @type {Number}
     */
    this.port = opts.port;
    /**
     * The RAML api entry point. Default to `api.raml`.
     * @type {String}
     */
    this.api = opts.api;
    /**
     * API project folder location.
     * Default to current working directory.
     * @type {String}
     */
    this.projectRoot = opts.projectRoot;
  }

  get validOptions() {
    return {
      api: String,
      port: Number,
      host: String,
      projectRoot: String,
      verbose: Boolean
    };
  }

  get isValid() {
    return this.validationErrors.length === 0;
  }

  _setDefaults(opts) {
    if (!('api' in opts)) {
      opts.api = 'api.raml';
    }
    if (!('projectRoot' in opts)) {
      opts.projectRoot = process.cwd();
    } else if (opts.projectRoot.indexOf('/') !== 0) {
      // Required for the watch task
      opts.projectRoot = path.resolve(opts.projectRoot);
    }
    opts.verbose = typeof opts.verbose === 'boolean' ? opts.verbose : false;
    opts.host = typeof opts.host === 'string' ? opts.host : undefined;
    opts.port = typeof opts.port === 'number' ? opts.port : undefined;
    return opts;
  }

  /**
   * Validates user input options.
   * Sets `_validationErrors` and `_validationWarnings` arrays on this object
   * containing corresponing messages.
   *
   * @param {Object} userOpts User options to check.
   */
  validateOptions(userOpts) {
    this.validationErrors = [];
    this.validationWarnings = [];

    this._validateOptionsList(userOpts);
  }

  _validateOptionsList(userOpts) {
    var keys = Object.keys(userOpts);
    var known = this.validOptions;
    var knownKeys = Object.keys(known);
    var unknown = [];
    var invalid = [];

    keys.forEach(property => {
      if (knownKeys.indexOf(property) === -1) {
        unknown.push(property);
        return;
      }
      var type = known[property];
      if (!this._validType(userOpts[property], type)) {
        invalid.push({
          property: property,
          expected: type,
          given: typeof userOpts[property]
        });
      }
    });

    if (unknown.length) {
      let message = 'Unknown option';
      if (unknown.length > 1) {
        message += 's';
      }
      message += ': ' + unknown.join(', ');
      this.validationErrors.push(message);
    }

    if (invalid.length) {
      invalid.forEach(error => {
        let message = 'Expecting ' + error.expected.name + ' for property ';
        message += error.property + ' but ' + error.given + ' was given.';
        this.validationErrors.push(message);
      });
    }
  }

  _validType(input, expected) {
    if (input instanceof Array && expected === Array) {
      return true;
    }
    if (Object(input) === input && expected === Object) {
      return true;
    }
    var type = expected.name;
    type = type ? type.toLowerCase() : undefined;
    if (typeof input === type) {
      return true;
    }
    return false;
  }
}
exports.ProviderOptions = ProviderOptions;
