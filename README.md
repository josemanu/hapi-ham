# hapi-ham
hapi answering machine

## Usage

```javascript
'use strict';

const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: 8000
});

// Register hapi-ham plugin
server.register({
  register: require('hapi-ham'),
  options: {
    provider: 'facebook-messenger',
    access_token: '<FB TOKEN>'
  }
}, (err) => {

  if (err) {
    throw err
  }

  // Add the route
  server.route({
    method: ['POST', 'GET'],
    path: '/',
    handler: function (request, reply) {
      const template = {
        message: {
          text: 'Hello ham!'
        }
      }
      return reply.message(template)
    }
  })

  // Start the server
  server.start((err) => {

    if (err) {
      throw err;
    }
    console.log('Server running at:', server.info.uri)
  })
})
```
