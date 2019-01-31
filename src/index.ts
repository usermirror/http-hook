import hookFetch from './fetch'
import { HttpHook, HookConfig } from './types'

const httpHook: HttpHook = { attach, reset }

function attach(input: HookConfig) {
  hookFetch.attach(input)
}

function reset() {
  hookFetch.reset()
}

export { HttpHook, HookConfig }

export default httpHook
