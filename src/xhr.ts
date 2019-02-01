import Global from './global'
import { EventEmitter, proxyEvents } from './events'
import { HookConfig, modifyRequest, modifyResponse } from './hooks'

let ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
let msie = parseInt((/msie (\d+)/.exec(ua.toLowerCase()) || [])[1])

if (isNaN(msie)) {
  msie = parseInt((/trident\/.*; rv:(\d+)/.exec(ua.toLowerCase()) || [])[1])
}

let _originalXHR = Global.XMLHttpRequest
let _hooks = {
  request: [],
  response: []
}

function HookFormData() {}

const READY_STATE = 'readyState',
  UPLOAD_EVENTS = ['load', 'loadend', 'loadstart'],
  COMMON_EVENTS = ['progress', 'abort', 'error', 'timeout']

function XHRWithHttpHook() {
  const ABORTED = -1
  const xhr = new _originalXHR()

  let status = null
  let hasError = undefined
  let transiting = undefined
  let response: any = {}
  let request: any = {}

  const readHead = function() {
    response.status = status || xhr.status
    if (status !== ABORTED || !(msie < 10)) {
      response.statusText = xhr.statusText
    }
    if (status !== ABORTED) {
      const object = getMapObject(xhr.getAllResponseHeaders())

      for (let key in object) {
        const val = object[key]
        if (!response.headers[key]) {
          const name = key.toLowerCase()
          response.headers[name] = val
        }
      }

      return
    }
  }

  const readBody = function() {
    if (!xhr.responseType || xhr.responseType === 'text') {
      response.text = xhr.responseText
      response.data = xhr.responseText
      try {
        response.xml = xhr.responseXML
      } catch (error) {}
    } else if (xhr.responseType === 'document') {
      response.xml = xhr.responseXML
      response.data = xhr.responseXML
    } else {
      response.data = xhr.response
    }
    if ('responseURL' in xhr) {
      response.finalUrl = xhr.responseURL
    }
  }

  const writeHead = function() {
    mockXHR.status = response.status
    mockXHR.statusText = response.statusText
  }

  const writeBody = function() {
    if ('text' in response) {
      mockXHR.responseText = response.text
    }
    if ('xml' in response) {
      mockXHR.responseXML = response.xml
    }
    if ('data' in response) {
      mockXHR.response = response.data
    }
    if ('finalUrl' in response) {
      mockXHR.responseURL = response.finalUrl
    }
  }

  const emitReadyState = function(n) {
    while (n > currentState && currentState < 4) {
      mockXHR[READY_STATE] = ++currentState
      if (currentState === 1) {
        mockXHR.dispatchEvent('loadstart', {})
      }
      if (currentState === 2) {
        writeHead()
      }
      if (currentState === 4) {
        writeHead()
        writeBody()
      }
      mockXHR.dispatchEvent('readystatechange', {})
      if (currentState === 4) {
        if (request.async === false) {
          emitFinal()
        } else {
          setTimeout(emitFinal, 0)
        }
      }
    }
  }

  var emitFinal = function() {
    if (!hasError) {
      mockXHR.dispatchEvent('load', {})
    }
    mockXHR.dispatchEvent('loadend', {})
    if (hasError) {
      mockXHR[READY_STATE] = 0
    }
  }

  var currentState = 0
  const setReadyState = async function(n) {
    if (n !== 4) {
      emitReadyState(n)
      return
    }

    let modifiedResponse = await modifyResponse(response, _hooks.response)

    response = modifiedResponse

    emitReadyState(4)
  }

  request.xhr = EventEmitter()

  let mockXHR = request.xhr

  xhr.onreadystatechange = function(event) {
    try {
      if (xhr[READY_STATE] === 2) {
        readHead()
      }
    } catch (error) {}
    if (xhr[READY_STATE] === 4) {
      transiting = false
      readHead()
      readBody()
    }

    setReadyState(xhr[READY_STATE])
  }

  const hasErrorHandler = function() {
    hasError = true
  }
  mockXHR.addEventListener('error', hasErrorHandler)
  mockXHR.addEventListener('timeout', hasErrorHandler)
  mockXHR.addEventListener('abort', hasErrorHandler)
  mockXHR.addEventListener('progress', function() {
    if (currentState < 3) {
      setReadyState(3)
    } else {
    }
  })

  if ('withCredentials' in xhr) {
    mockXHR.withCredentials = false
  }
  mockXHR.status = 0

  for (let event of Array.from(COMMON_EVENTS.concat(UPLOAD_EVENTS))) {
    mockXHR[`on${event}`] = null
  }

  mockXHR.open = function(method, url, async, user, pass) {
    currentState = 0
    hasError = false
    transiting = false
    request.headers = {}
    request.headerNames = {}
    request.status = 0
    response = {}
    response.headers = {}

    request.method = method
    request.url = url
    request.async = async !== false
    request.user = user
    request.pass = pass
    setReadyState(1)
  }

  mockXHR.send = async function(body) {
    let k, modk
    for (k of ['type', 'timeout', 'withCredentials']) {
      modk = k === 'type' ? 'responseType' : k
      if (modk in mockXHR) {
        request[k] = mockXHR[modk]
      }
    }

    request.body = body
    const send = async function() {
      proxyEvents(COMMON_EVENTS, xhr, mockXHR)
      if (mockXHR.upload) {
        proxyEvents(
          COMMON_EVENTS.concat(UPLOAD_EVENTS),
          xhr.upload,
          mockXHR.upload
        )
      }

      transiting = true
      xhr.open(
        request.method,
        request.url,
        request.async,
        request.user,
        request.pass
      )

      for (k of ['type', 'timeout', 'withCredentials']) {
        modk = k === 'type' ? 'responseType' : k
        if (k in request) {
          xhr[modk] = request[k]
        }
      }

      for (let header in request.headers) {
        const value = request.headers[header]
        if (header) {
          xhr.setRequestHeader(header, value)
        }
      }
      if (request.body instanceof HookFormData) {
        request.body = request.body.fd
      }
      xhr.send(request.body)
    }

    let modifiedRequest = await modifyRequest(request, _hooks.request)

    request = modifiedRequest

    send()
  }

  mockXHR.abort = function() {
    status = ABORTED
    if (transiting) {
    } else {
      mockXHR.dispatchEvent('abort', {})
    }
  }
  mockXHR.setRequestHeader = function(header, value) {
    const lName = header != null ? header.toLowerCase() : undefined
    const name = (request.headerNames[lName] =
      request.headerNames[lName] || header)
    if (request.headers[name]) {
      value = request.headers[name] + ', ' + value
    }
    request.headers[name] = value
  }
  mockXHR.getResponseHeader = function(header) {
    const name = header != null ? header.toLowerCase() : undefined
    return response.headers[name] || null
  }
  mockXHR.getAllResponseHeaders = () => getMapObject(response.headers) || null

  if (xhr.overrideMimeType) {
    mockXHR.overrideMimeType = function() {
      return xhr.overrideMimeType.apply(xhr, arguments)
    }
  }

  if (xhr.upload) {
    mockXHR.upload = request.upload = EventEmitter()
  }

  mockXHR.UNSENT = 0
  mockXHR.OPENED = 1
  mockXHR.HEADERS_RECEIVED = 2
  mockXHR.LOADING = 3
  mockXHR.DONE = 4

  mockXHR.response = ''
  mockXHR.responseText = ''
  mockXHR.responseXML = null
  mockXHR.readyState = 0
  mockXHR.statusText = ''

  return mockXHR
}

function getMapObject(strMap: Map<string, string>) {
  const obj = Object.create(null)

  for (let [k, v] of strMap) {
    obj[k] = v
  }

  return obj
}

export function attach(config: HookConfig) {
  if (config.request) {
    _hooks.request.push(config.request)
  }

  if (config.response) {
    _hooks.response.push(config.response)
  }

  if (config.globals) {
    Global.XMLHttpRequest = XHRWithHttpHook
  }
}

export function reset() {
  _hooks.request = []
  _hooks.response = []

  if (Global.XMLHttpRequest !== _originalXHR) {
    Global.XMLHttpRequest = _originalXHR
  }
}

export default { attach, reset, XHRWithHttpHook }
