const Snapshot = require('../../lib/Snapshot')

describe('Snapshot', () => {
  let mockRoot
  let snapshot

  beforeEach(() => {
    mockRoot = {
      Organizes: [
        {
          name: 'Objects',
          Organizes: [
            {
              name: 'Server',
              HasProperty: [
                {
                  name: 'NamespaceArray',
                  value: ['http://opcfoundation.org/UA/', 'http://example.com/namespace']
                }
              ]
            },
            {
              name: 'OtherFolder',
              Organizes: []
            }
          ]
        },
        {
          name: 'OtherRootFolder',
          Organizes: []
        }
      ]
    }

    snapshot = new Snapshot(mockRoot)
  })

  describe('objectsFolder', () => {
    it('should return the Organizes array of the Objects folder', () => {
      const result = snapshot.objectsFolder
      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Server')
      expect(result[1].name).toBe('OtherFolder')
    })

    it('should throw error when Objects folder is not found', () => {
      const invalidRoot = {
        Organizes: [
          { name: 'Types', Organizes: [] },
          { name: 'Views', Organizes: [] }
        ]
      }

      const invalidSnapshot = new Snapshot(invalidRoot)
      expect(() => invalidSnapshot.objectsFolder).toThrow()
    })
  })
})
