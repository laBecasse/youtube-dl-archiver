const PREFIX = 'PARAMS_'

export default class Parameters {
    constructor() {
        this.listeners = {}
    }

    put(key, value) {
        if (this.listeners[key]) {
            return this.listeners[key](value)
                .then(() => {
                    localStorage.setItem(PREFIX + key, value)
                    return value
                })
        } else {
            localStorage.setItem(PREFIX + key, value)
            return Promise.resolve(value)
        }
    }

    get(key) {
        return localStorage.getItem(PREFIX + key)
    }

    remove(key) {
        return localStorage.removeItem(PREFIX + key)
    }

    /*
     * Defines a listener executed before 
     * each change of value of a key (the new value is passed)
     * assume to return a promise 
     * no change are applied, if the promise is rejected
     */
    setEventListenerOnKey(key, listener) {
        this.listeners[key] = listener
    }

    setDefaultFromEnv() {
        for (let key in process.env) {
            if (key.startsWith('VUE_APP_')) {
                const paramsKey = key.substr(8)
                if(!this.get(paramsKey)) {
                    this.put(paramsKey, process.env[key])
                }
            }
        }
    }
}
