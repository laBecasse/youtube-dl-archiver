class TimeoutError extends Error {
  constructor(message) {
    super(message)
  }
}

export default {
  build: function(ms, promise) {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        const error = new TimeoutError('Timed out in '+ ms + 'ms.')
        reject(error)
      }, ms)
    })

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      promise,
      timeout
    ])
  },

  isTimeoutError: function(e) {
    return e instanceof TimeoutError
  }
}

