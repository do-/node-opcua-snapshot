const Snapshot = require('../../lib/Snapshot')

describe('Snapshot', () => {
  describe('nodeId', () => {
    it('should generate correct node ID string from namespace and id', () => {
      const result = Snapshot.nodeId({ ns: 2, id: 'i=12345' })
      expect(result).toBe('ns=2;i=12345')
    })

    it('should handle string id values', () => {
      const result = Snapshot.nodeId({ ns: 1, id: 's=MyNode' })
      expect(result).toBe('ns=1;s=MyNode')
    })

    it('should handle different namespace numbers', () => {
      const result = Snapshot.nodeId({ ns: 0, id: 'i=85' })
      expect(result).toBe('ns=0;i=85')
    })
  })
})
