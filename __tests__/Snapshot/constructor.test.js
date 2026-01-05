const Snapshot = require('../../lib/Snapshot')

describe('Snapshot', () => {
  describe('constructor', () => {
    it('should store the root object', () => {
      const customRoot = { test: 'data' }
      const newSnapshot = new Snapshot(customRoot)
      expect(newSnapshot).toBeInstanceOf(Snapshot)
    })
  })
})
