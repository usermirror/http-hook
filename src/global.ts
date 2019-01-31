let Global = null

if (
  typeof WorkerGlobalScope !== 'undefined' &&
  self instanceof WorkerGlobalScope
) {
  Global = self
} else if (typeof global !== 'undefined') {
  Global = global
} else {
  Global = window
}

export default Global
