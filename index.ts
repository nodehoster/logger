import * as winston from 'winston'
import { LoggingWinston, LOGGING_TRACE_KEY } from '@google-cloud/logging-winston'
import { ulid } from 'ulid'
import * as als from 'async-local-storage'

let _logger
let _service: string
als.enable()

export default {
  // init can happen on every request or on service startup
  init: (service, enabledTransports = ['console'], options = {}) => {
    let transports = []

    enabledTransports.map(transport => {
      switch(transport) {
        case 'console':
          transports.push(new winston.transports.Console({
            format: winston.format.simple()
          }))
          break
        case 'mysql':
          const mysqlTransport = require('winston-mysql')
          transports.push(new mysqlTransport(options['mysql']))  
          break
        case 'mongo':
          require('winston-mongodb')
          // @ts-ignore
          transports.push(new winston.transports.MongoDB(options['mongo']))
        case 'stackdriver':
          transports.push(new LoggingWinston({
            serviceContext: { service }
          }))
          break
      }
    })

    _service = service
    _logger = winston.createLogger({
      level: 'info',
      transports,
      defaultMeta: {
        service
      }
    })
  },

  // used to link all the following logs to the correlation id and eventually if on GAE to the trace ID
  linkRequest: (headers) => {
    const requestID = headers['x-request-id'] || _service +'-'+ ulid()
    als.set('request_id', requestID)

    let gTrace = {}
    if(process.env.GOOGLE_CLOUD_PROJECT) {
      const gTraceHeader = headers['x-cloud-trace-context']
      const gTraceID = gTraceHeader ? gTraceHeader.split('/')[0] : ''
      gTrace = {
        LOGGING_TRACE_KEY: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/traces/${gTraceID}`
      }
      als.set('g-trace', gTrace[LOGGING_TRACE_KEY])
    } else {
      als.set('g-trace', '')
    }
  },

  log: async (level: string, message: string, event: string, scope: string, meta: any = {}) => {
    // trace id linking (if too slow, check env GOOGLE_CLOUD_PROJECT instead of getting als)
    let gTrace = als.get('g-trace')
    gTrace = gTrace !== '' ? {
      LOGGING_TRACE_KEY: gTrace
    } : {}

    _logger.log(level, message, { ...meta, context: {
      ...meta.context,
      id: als.get('request_id'),
      event,
      scope: scope.replace(' ', '').split(',')
    },
    ...gTrace
    })
  }
}
