### Usage:


1. Require the package
```
const logger = require('service-logger');
```

2. Initialize the library
```
logger.init('name-of-the-service')
```

3. Link to current request
```
// headers object containing current request headers
logger.linkRequest(headers)
```

4. Log
```
logger.log('level', 'message', 'event', 'scope1,scope2,scope3', metadataObject)
```