import hookFetch from './fetch'
import hookXHR from './xhr'
import { HttpHook, HookConfig } from './hooks'

const httpHook: HttpHook = {
  attach,
  reset,
  fetch: hookFetch.FetchWithHttpHook,
  XMLHttpRequest: hookXHR.XHRWithHttpHook
}

const defaultHookConfig = { globals: true }

function attach(input: HookConfig = defaultHookConfig) {
  input = {
    ...defaultHookConfig,
    ...input
  }

  hookFetch.attach(input)
  hookXHR.attach(input)
}

function reset() {
  hookFetch.reset()
  hookXHR.reset()
}

export { HttpHook, HookConfig }

export default httpHook
