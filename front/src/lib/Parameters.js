const PREFIX = 'param-'

export default class Parameters {
    constructor() {
        this.listeners = {}
    }

    put(key, value) {
        localStorage.setItem(PREFIX + key, value)
        if (this.listeners[key]) {
            this.listeners[key](value)
        }
    }

    get(key) {
        return localStorage.getItem(PREFIX + key)
    }

    remove(key) {
        return localStorage.removeItem(PREFIX + key)
    }

    
    setEventListenerOnKey(key, listener) {
        this.listeners[key] = listener
    }
}
