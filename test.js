const {RamlJsDataProvider} = require('./lib/data-provider');

const prev = new RamlJsDataProvider({
  projectRoot: './test/api/',
  api: 'api.raml',
  verbose: true
});
prev.start()
.then(port => console.log('Web socket server is running on port: ' + port));
