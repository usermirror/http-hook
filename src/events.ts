const ignoreProp = (str: string) => /returnValue|totalSize|position/.test(str)

export const proxyEvents = function(events, src, dst) {
  const p = event =>
    function(e) {
      const clone = {}
      //copies event, with dst emitter inplace of src
      for (let k in e) {
        if (ignoreProp(k)) {
          continue
        }
        const val = e[k]
        clone[k] = val === src ? dst : val
      }
      //emits out the dst
      return dst.dispatchEvent(event, clone)
    }
  //dont proxy manual events
  for (let event of Array.from(events)) {
    if (dst._has(event)) {
      src[`on${event}`] = p(event)
    }
  }
}

//create fake event
export const fakeEvent = function(type) {
  // on some platforms like android 4.1.2 and safari on windows, it appears
  // that new Event is not allowed
  try {
    return new Event(type)
  } catch (error) {
    return { type }
  }
}

//tiny event emitter
export const EventEmitter = function(isNode?: boolean) {
  //private
  let events: any = {}
  const listeners = event => events[event] || []
  //public
  const emitter: any = {}

  emitter.addEventListener = function(event, callback, i) {
    events[event] = listeners(event)
    if (events[event].indexOf(callback) >= 0) {
      return
    }
    i = i === undefined ? events[event].length : i
    events[event].splice(i, 0, callback)
  }
  emitter.removeEventListener = function(event, callback) {
    //remove all
    if (event === undefined) {
      events = {}
      return
    }
    //remove all of type event
    if (callback === undefined) {
      events[event] = []
    }
    //remove particular handler
    const i = listeners(event).indexOf(callback)
    if (i === -1) {
      return
    }
    listeners(event).splice(i, 1)
  }
  emitter.dispatchEvent = function() {
    const args = [].slice.call(arguments)
    const event = args.shift()
    if (!isNode) {
      args[0] = { ...args[0], ...fakeEvent(event) }
    }
    const legacylistener = emitter[`on${event}`]
    if (legacylistener) {
      legacylistener.apply(emitter, args)
    }
    const iterable = listeners(event).concat(listeners('*'))
    for (let i = 0; i < iterable.length; i++) {
      const listener = iterable[i]
      listener.apply(emitter, args)
    }
  }
  emitter._has = event => !!(events[event] || emitter[`on${event}`])
  //add extra aliases
  if (isNode) {
    emitter.listeners = event => [].slice.call(listeners(event))
    emitter.on = emitter.addEventListener
    emitter.off = emitter.removeEventListener
    emitter.fire = emitter.dispatchEvent
    emitter.once = function(e, fn) {
      var fire = function() {
        emitter.off(e, fire)
        return fn.apply(null, arguments)
      }
      return emitter.on(e, fire)
    }
    emitter.destroy = () => (events = {})
  }

  return emitter
}

export default EventEmitter
