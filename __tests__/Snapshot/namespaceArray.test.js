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

  describe('namespaceArray', () => {
    it('should return the value of NamespaceArray property', () => {
      const result = snapshot.namespaceArray
      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(2)
      expect(result[0]).toBe('http://opcfoundation.org/UA/')
      expect(result[1]).toBe('http://example.com/namespace')
    })

    it('should throw error when Server folder is not found', () => {
      const invalidRoot = {
        Organizes: [
          {
            name: 'Objects',
            Organizes: [
              { name: 'OtherFolder', HasProperty: [] }
            ]
          }
        ]
      }

      const invalidSnapshot = new Snapshot(invalidRoot)
      expect(() => invalidSnapshot.namespaceArray).toThrow()
    })

    it('should throw error when NamespaceArray property is not found', () => {
      const invalidRoot = {
        Organizes: [
          {
            name: 'Objects',
            Organizes: [
              {
                name: 'Server',
                HasProperty: [
                  { name: 'OtherProperty', value: 'someValue' }
                ]
              }
            ]
          }
        ]
      }

      const invalidSnapshot = new Snapshot(invalidRoot)
      expect(() => invalidSnapshot.namespaceArray).toThrow()
    })
  })
})
