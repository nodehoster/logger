"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const logging_winston_1 = require("@google-cloud/logging-winston");
const ulid_1 = require("ulid");
const als = require("async-local-storage");
let _logger;
let _service;
als.enable();
exports.default = {
    // init can happen on every request or on service startup
    init: (service, enabledTransports = ['console'], options = {}) => {
        let transports = [];
        enabledTransports.map(transport => {
            switch (transport) {
                case 'console':
                    transports.push(new winston.transports.Console({
                        format: winston.format.simple()
                    }));
                    break;
                case 'mysql':
                    const mysqlTransport = require('winston-mysql');
                    transports.push(new mysqlTransport(options['mysql']));
                    break;
                case 'mongo':
                    require('winston-mongodb');
                    // @ts-ignore
                    transports.push(new winston.transports.MongoDB(options['mongo']));
                case 'stackdriver':
                    transports.push(new logging_winston_1.LoggingWinston({
                        serviceContext: { service }
                    }));
                    break;
            }
        });
        _service = service;
        _logger = winston.createLogger({
            level: 'info',
            transports,
            defaultMeta: {
                service
            }
        });
    },
    // used to link all the following logs to the correlation id and eventually if on GAE to the trace ID
    linkRequest: (headers) => {
        try {
            const requestID = headers['x-request-id'] || _service + '-' + ulid_1.ulid();
            als.set('request_id', requestID);
            let gTrace = {};
            if (process.env.GOOGLE_CLOUD_PROJECT) {
                const gTraceHeader = headers['x-cloud-trace-context'];
                const gTraceID = gTraceHeader ? gTraceHeader.split('/')[0] : '';
                gTrace = {
                    LOGGING_TRACE_KEY: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/traces/${gTraceID}`
                };
                als.set('g-trace', gTrace[logging_winston_1.LOGGING_TRACE_KEY]);
            }
            else {
                als.set('g-trace', '');
            }
        }
        catch (err) {
            console.error(err);
        }
    },
    log: (level, message, event, scope, meta = { context: {} }, context = {}) => __awaiter(this, void 0, void 0, function* () {
        try {
            meta.context = Object.assign({}, meta.context, context);
            // trace id linking (if too slow, check env GOOGLE_CLOUD_PROJECT instead of getting als)
            let gTrace = als.get('g-trace');
            gTrace = gTrace !== '' ? {
                LOGGING_TRACE_KEY: gTrace
            } : {};
            let parsedMessage;
            try {
                parsedMessage = message.replace(/{(.*?)}/g, (match) => {
                    // @ts-ignore
                    return meta.context[match.replace(/{|}/g, "")];
                });
            }
            catch (e) {
                parsedMessage = message;
            }
            _logger.log(level, parsedMessage, Object.assign({}, meta, { context: Object.assign({}, meta.context, { id: als.get('request_id'), event, scope: scope.replace(' ', '').split(',') }) }, gTrace));
        }
        catch (err) {
            console.error(err);
        }
    })
};
//# sourceMappingURL=index.js.map