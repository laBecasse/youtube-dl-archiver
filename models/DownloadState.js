const STATES = {}

class State {
  constructor(id) {
    this.id = id
  }
}

function register(state) {
  STATES[state.id] = state
}

module.exports = {
  create: function (id) {
    const state = new State(id)
    register(state)
    return state
  },
  get: function (id) {
    return STATES[id]
  }
}
