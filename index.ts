import * as winston from 'winston'
import { LoggingWinston, LOGGING_TRACE_KEY } from '@google-cloud/logging-winston'
import { ulid } from 'ulid'
import * as als from 'async-local-storage'

let _logger
let _service: string
als.enable()

export default {
  // init can happen on every request or on service startup
  init: (service) => {
    _service = service
    const stackdriverTransport = new LoggingWinston({
      serviceContext: { service }
    })

    _logger = winston.createLogger({
      level: 'info',
      transports: [
        stackdriverTransport
        // new winston.transports.Console({
        //   format: winston.format.simple()
        // })
      ],
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
