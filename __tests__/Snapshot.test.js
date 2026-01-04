const Snapshot = require('../lib/Snapshot');

describe('Snapshot', () => {
  let mockRoot;
  let snapshot;

  beforeEach(() => {
    // Create a mock root object with the expected structure
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
    };

    snapshot = new Snapshot(mockRoot);
  });

  describe('nodeId', () => {
    it('should generate correct node ID string from namespace and id', () => {
      const result = Snapshot.nodeId({ ns: 2, id: 'i=12345' });
      expect(result).toBe('ns=2;i=12345');
    });

    it('should handle string id values', () => {
      const result = Snapshot.nodeId({ ns: 1, id: 's=MyNode' });
      expect(result).toBe('ns=1;s=MyNode');
    });

    it('should handle different namespace numbers', () => {
      const result = Snapshot.nodeId({ ns: 0, id: 'i=85' });
      expect(result).toBe('ns=0;i=85');
    });
  });

  describe('objectsFolder', () => {
    it('should return the Organizes array of the Objects folder', () => {
      const result = snapshot.objectsFolder;
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Server');
      expect(result[1].name).toBe('OtherFolder');
    });

    it('should throw error when Objects folder is not found', () => {
      const invalidRoot = {
        Organizes: [
          { name: 'Types', Organizes: [] },
          { name: 'Views', Organizes: [] }
        ]
      };
      
      const invalidSnapshot = new Snapshot(invalidRoot);
      expect(() => invalidSnapshot.objectsFolder).toThrow();
    });
  });

  describe('namespaceArray', () => {
    it('should return the value of NamespaceArray property', () => {
      const result = snapshot.namespaceArray;
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('http://opcfoundation.org/UA/');
      expect(result[1]).toBe('http://example.com/namespace');
    });

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
      };

      const invalidSnapshot = new Snapshot(invalidRoot);
      expect(() => invalidSnapshot.namespaceArray).toThrow();
    });

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
      };

      const invalidSnapshot = new Snapshot(invalidRoot);
      expect(() => invalidSnapshot.namespaceArray).toThrow();
    });
  });

  describe('constructor', () => {
    it('should store the root object', () => {
      const customRoot = { test: 'data' };
      const newSnapshot = new Snapshot(customRoot);
      // We can't directly access #root, but we can test that the getters work with it
      expect(newSnapshot).toBeInstanceOf(Snapshot);
    });
  });
});