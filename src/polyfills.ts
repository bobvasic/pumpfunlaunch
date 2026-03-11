// Buffer polyfill for browser compatibility
import buffer from 'buffer'

const Buffer = buffer.Buffer

if (typeof window !== 'undefined') {
  window.Buffer = Buffer
}

if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer
}

// For legacy compatibility
if (typeof global !== 'undefined') {
  global.Buffer = Buffer
}

export { Buffer }
export default Buffer
