# raml-js-data-provider

A npm module to run web socket server, observe changes to a RAML project folder
(and any file in it) and to update connected clients with RAML JS data
after change.

## Example

```javascript
const {RamlJsDataProvider} = require('raml-js-data-provider');

const prev = new RamlJsDataProvider({
  projectRoot: '/path/to/api/directory/',
  api: 'api.raml',
  verbose: true
});
prev.start()
.then(port => console.log('Web socket server is running on port: ' + port));
```

Script above runs a web socket server and observes `/path/to/api/directory/`
path for any change. If content of the directory change then clients connected
to the server receive an update.

### Options

| Option | Type | Default | Description |
| ---- | ---- | ---- | ---- |
| `api` | `String` | `api.raml` | The RAML entry point file. |
| `host` | `String` | `127.0.0.1` | Host name for the web socket server. |
| `port` | `Number` | `undefined` | Port name for the web socket server. If not set it uses first available port from range `<49152, 65535>`. |
| `projectRoot` | `String` | Current working directory | API project folder location. |
| `verbose` | `Boolean` | `false` | Prints debug messages |

## The protocol

Web socket server do not listen for any incoming messages since there's nothing
to pull from the server. It only sends information to clients.

Incoming to clients message is a string of stringified JavaScript object.
After parsing it to an object each message contains `payload` property describing
the purpose of the message.

Currently supported payloads are:

-   raml - when receiving API spec
-   generating-json - when serve started generating a JSON data from the RAML spec and clients should expect RAML data shortly.
-   error - when error occurred while parsing RAML data.

The `raml` payload comes with `data` property containing parsed RAML data as JavaScript object.
`generating-json` does not carry any other properties.

The `error` message contains `level` and `message` properties. Currently `level`
is either `critical` or undefined.

### Example

```javascript
...
// Initializes web socket
init(host, port) {
  var socket = new WebSocket(`ws://${host}:${port}`);
  socket.addEventListener('message', this.onMessage.bind(this));
}
// Handler for the `message` event of web socket connection.
onMessage(event) {
  var message = JSON.parse(event.data);
  switch (message.payload) {
    case 'raml':
      this.useRamlData(message.data);
      break;
    case 'generating-json':
      this.openLoader();
      break;
    case 'error':
      this.notifyError(message.level, message.message);
      break;
    default:
      console.log('Unknown payload received', message.payload);
  }
}
```
