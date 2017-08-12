'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const {ProviderOptions} = require('./provider-options');
const {RamlSource} = require('./raml-source');
const {ApiServer} = require('./server');
const winston = require('winston');
const path = require('path');
const gulp = require('gulp');
/**
 * A class responsible for creating web socket server, observe API project
 * folder and update client when any of the RAML source files change.
 */
class RamlJsDataProvider {
  /**
   * Constructs the project.
   *
   * @param {ProviderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   */
  constructor(opts) {
    if (!(opts instanceof ProviderOptions)) {
      opts = new ProviderOptions(opts);
    }
    this.opts = opts;
    this.logger = this.__setupLogger();
    if (!this.opts.isValid) {
      this.printValidationErrors();
      this.printValidationWarnings();
      throw new Error('Options did not passed validation.');
    }
    this.printValidationWarnings();
  }

  /**
   * Creates a logger object to log debug output.
   */
  __setupLogger() {
    var level = this.opts.verbose ? 'debug' : 'error';
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({level: level}),
        new (winston.transports.File)({
          filename: 'api-console-debug.log',
          level: 'error'
        })
      ]
    });
  }

  printValidationErrors() {
    this.opts.validationErrors.forEach((error) => {
      this.logger.error(error);
    });
  }

  printValidationWarnings() {
    var warnings = this.opts.validationWarnings;
    if (!warnings || !warnings.length) {
      return;
    }
    warnings.forEach((warning) => {
      this.logger.warn(warning);
    });
  }

  /**
   * A class that generates a JSON from raml.
   *
   * @return {RamlSource}
   */
  get ramlSource() {
    if (!this.__ramlSource) {
      this.__ramlSource = new RamlSource(this.logger);
    }
    return this.__ramlSource;
  }

  get server() {
    if (!this.__server) {
      this.__server = new ApiServer(this.opts.host, this.opts.port);
    }
    return this.__server;
  }
  /**
   * Starts the web socket server and observes the project directory for
   * changes.
   *
   * @return {Promise} Promise resolved with a port number used to run the
   * console.
   */
  start() {
    var port;
    return this.startServer()
    .then(_initPort => port = _initPort)
    .then(() => this.observeApi())
    .then(() => this._updateApiData())
    .then(() => port);
  }
  /**
   * Stops the web socket server and unobserves api project folder.
   *
   * @return {Promise} A promise resolved when all allocated resources has been
   * released.
   */
  stop() {
    this.unobserveApi();
    return this.stopServer();
  }
  /**
   * Creates instance of web socket server and sends initial RAML data to
   * clients.
   *
   * @return {Promise} Promise resolved when the server is started. Port number
   * is passed as an argument to the resolve function.
   */
  startServer() {
    return this.server.startServer();
  }
  /**
   * Stops the web socket server.
   * @return {Promise} Promise resolved when the server is down and port has
   * been released.
   */
  stopServer() {
    return this.server.killServer();
  }
  /**
   * Starts observing API project folder for changes.
   * Observable path is defined via `projectRoot` option.
   *
   * If this has been called already, previous listeners will be removed.
   */
  observeApi() {
    this.unobserveApi();
    if (!this.__filesHandler) {
      this.__filesHandler = this._fileChangedHandler.bind(this);
    }
    var observablePath = this.opts.projectRoot + '/**/*.*';
    this._filesObserver = gulp.watch(observablePath, this.__filesHandler);
    this._filesObserver.on('change', this.__filesHandler);
  }
  /**
   * Stops observing API project folder for changes.
   * It does nothing if `observeApi()` wasn't called before.
   */
  unobserveApi() {
    if (!this._filesObserver || !this.__filesHandler) {
      return;
    }
    this._filesObserver.removeListener('change', this.__filesHandler);
  }
  /**
   * A handler called when any file in the API dir changed.
   *
   * TODO:
   * The function call queue is controlled by `gulp`'s `watch` function
   * and calls are queued until the function do not resolve the promise.
   * This may lead to problems when parsing large API files and clients may wait
   * senonds until they are updated without any indication of work in progress.
   *
   * @return {Promise} Resolved promise when the API json file has been
   * generated and result sent to clients.
   */
  _fileChangedHandler(file) {
    if (typeof file !== 'string') {
      return;
    }
    this.server.sendLoading();
    return this._updateApiData()
    .catch(cause => {
      const message = 'RAML Parser error: ' + cause.message;
      this.server.sendError('critical', message);
    });
  }
  /**
   * Generates JSON data and send it to the clients.
   * @return {Promise}
   */
  _updateApiData() {
    return this._setRaml()
    .then(raml => {
      this.server.sendRaml(raml);
    });
  }

  /**
   * Reads the RAML data, transforms it to JavaScript object and enhances for
   * the console.
   *
   * @return {Promise} Resolved promise with JavaScript object representing a
   * RAML data.
   */
  _setRaml() {
    const location = path.join(this.opts.projectRoot, this.opts.api);
    return this.ramlSource.getRamlJson(location);
  }
}

exports.RamlJsDataProvider = RamlJsDataProvider;
