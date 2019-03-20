### Usage:


1. Require the package
```
const logger = require('service-logger');
```

2. Initialize the library
```
logger.init('name-of-the-service', ['mysql', 'stackdriver'], {
  mysql: {
    host     : '',
    user     : '',
    password : '',
    database : '',
    table    : '',
    fields   : { level: 'mylevel', meta: 'metadata', message: 'source', timestamp: 'createdAt'}
  }
})
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

### Transports

#### MySQL
```
// SQL
CREATE TABLE `logtest`.`sys_logs_default` (
 `id` INT NOT NULL AUTO_INCREMENT,
 `level` VARCHAR(16) NOT NULL,
 `message` VARCHAR(512) NOT NULL,
 `meta` VARCHAR(1024) NOT NULL,
 `timestamp` DATETIME NOT NULL,
 PRIMARY KEY (`id`));

// Options
{
  host     : 'localhost',
  user     : 'logtest',
  password : 'log*test*pass',
  database : 'logtest',
  table    : 'sys_logs_custom',
  fields   : { level: 'mylevel', meta: 'metadata', message: 'source', timestamp: 'addDate'}
}
```

#### MongoDB
The MongoDB transport takes the following options. 'db' is required:

* __level:__ Level of messages that this transport should log, defaults to
'info'.
* __silent:__ Boolean flag indicating whether to suppress output, defaults to
false.
* __db:__ MongoDB connection uri, pre-connected `MongoClient` object or promise
which resolves to a pre-connected `MongoClient` object.
* __options:__ MongoDB connection parameters (optional, defaults to
`{poolSize: 2, autoReconnect: true, useNewUrlParser: true}`).
* __collection__: The name of the collection you want to store log messages in,
defaults to 'log'.
* __storeHost:__ Boolean indicating if you want to store machine hostname in
logs entry, if set to true it populates MongoDB entry with 'hostname' field,
which stores os.hostname() value.
* __label:__ Label stored with entry object if defined.
* __name:__ Transport instance identifier. Useful if you need to create multiple
MongoDB transports.
* __capped:__ In case this property is true, winston-mongodb will try to create
new log collection as capped, defaults to false.
* __cappedSize:__ Size of logs capped collection in bytes, defaults to 10000000.
* __cappedMax:__ Size of logs capped collection in number of documents.
* __tryReconnect:__ Will try to reconnect to the database in case of fail during
initialization. Works only if __db__ is a string. Defaults to false.
* __decolorize:__ Will remove color attributes from the log entry message,
defaults to false.
* __leaveConnectionOpen:__ Will leave MongoClient connected after transport shut down.
* __metaKey:__ Configure which key is used to store metadata in the logged info object.
Defaults to `'metadata'` to remain compatible with the [metadata format](https://github.com/winstonjs/logform/blob/master/examples/metadata.js)
* __expireAfterSeconds:__ Seconds before the entry is removed. Works only if __capped__ is not set.

*Metadata:* Logged as a native JSON object in 'meta' property.
