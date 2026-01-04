// __tests__/Dumper.test.js
const EventEmitter = require('node:events');
const Dumper = require('../lib/Dumper');

// Mock node-opcua
jest.mock('node-opcua', () => ({
  ObjectIds: {
    85: 'Objects'
  },
  ObjectTypeIds: {
    61: 'FolderType'
  },
  ReferenceTypeIds: {
    35: 'Organizes',
    47: 'HasComponent',
    46: 'HasProperty'
  }
}));

describe('Dumper', () => {
  let mockSession;
  let dumper;

  beforeEach(() => {
    mockSession = {
      browse: jest.fn(),
      read: jest.fn(),
      getArgumentDefinition: jest.fn()
    };

    dumper = new Dumper(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should extend EventEmitter', () => {
      expect(dumper).toBeInstanceOf(EventEmitter);
    });

    it('should initialize with session', () => {
      expect(dumper).toBeInstanceOf(Dumper);
    });
  });

  describe('browse', () => {
    it('should emit start and finish events and return references on success', async () => {
      const mockReferences = [
        { isForward: true, nodeId: 'ns=1;i=123' }
      ];
      mockSession.browse.mockResolvedValue({
        statusCode: { isGoodish: () => true },
        references: mockReferences
      });

      const startSpy = jest.fn();
      const finishSpy = jest.fn();
      dumper.on('start', startSpy);
      dumper.on('finish', finishSpy);

      const result = await dumper.browse('ns=0;i=85');

      expect(startSpy).toHaveBeenCalledWith('ns=0;i=85');
      expect(finishSpy).toHaveBeenCalled();
      expect(result).toBe(mockReferences);
      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
    });

    it('should emit warning and return empty array on bad status code', async () => {
      const mockStatusCode = {
        isGoodish: () => false,
        toString: () => 'BadStatus'
      };
      mockSession.browse.mockResolvedValue({
        statusCode: mockStatusCode,
        references: []
      });

      const warningSpy = jest.fn();
      const startSpy = jest.fn();
      const finishSpy = jest.fn();
      dumper.on('warning', warningSpy);
      dumper.on('start', startSpy);
      dumper.on('finish', finishSpy);

      const result = await dumper.browse('ns=0;i=85');

      expect(startSpy).toHaveBeenCalledWith('ns=0;i=85');
      expect(warningSpy).toHaveBeenCalledWith(mockStatusCode);
      expect(finishSpy).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should emit finish even when browse throws an error', async () => {
      mockSession.browse.mockRejectedValue(new Error('Browse failed'));

      const startSpy = jest.fn();
      const finishSpy = jest.fn();
      dumper.on('start', startSpy);
      dumper.on('finish', finishSpy);

      await expect(dumper.browse('ns=0;i=85')).rejects.toThrow('Browse failed');
      expect(startSpy).toHaveBeenCalledWith('ns=0;i=85');
      expect(finishSpy).toHaveBeenCalled();
    });
  });

  describe('read', () => {
    it('should emit start and finish events and return read results', async () => {
      const mockReadResults = [
        { value: { dataType: 11, value: 'test' } }
      ];
      mockSession.read.mockResolvedValue(mockReadResults);

      const startSpy = jest.fn();
      const finishSpy = jest.fn();
      dumper.on('start', startSpy);
      dumper.on('finish', finishSpy);

      const nodeIds = ['ns=1;i=123', 'ns=1;i=456'];
      const result = await dumper.read(nodeIds);

      expect(startSpy).toHaveBeenCalledWith(nodeIds);
      expect(finishSpy).toHaveBeenCalled();
      expect(result).toBe(mockReadResults);
      expect(mockSession.read).toHaveBeenCalledWith([
        { nodeId: 'ns=1;i=123' },
        { nodeId: 'ns=1;i=456' }
      ]);
    });

    it('should emit finish even when read throws an error', async () => {
      mockSession.read.mockRejectedValue(new Error('Read failed'));

      const startSpy = jest.fn();
      const finishSpy = jest.fn();
      dumper.on('start', startSpy);
      dumper.on('finish', finishSpy);

      const nodeIds = ['ns=1;i=123'];
      await expect(dumper.read(nodeIds)).rejects.toThrow('Read failed');
      expect(startSpy).toHaveBeenCalledWith(nodeIds);
      expect(finishSpy).toHaveBeenCalled();
    });
  });

  describe('toRootObject', () => {
    it('should create default root object when no arguments provided', () => {
      const result = dumper.toRootObject();

      expect(result).toEqual({
        class: 'Object',
        ns: 0,
        id: 'i=85',
        name: 'Objects',
        type: 'FolderType'
      });
    });

    it('should merge provided arguments with default root', () => {
      const arg = {
        ns: 1,
        id: 'i=123',
        name: 'CustomObject',
        type: 'CustomType'
      };

      const result = dumper.toRootObject(arg);

      expect(result).toEqual({
        class: 'Object',
        ns: 1,
        id: 'i=123',
        name: 'CustomObject',
        type: 'CustomType'
      });
    });

    it('should throw error when argument is not an object', () => {
      expect(() => {
        dumper.toRootObject('not-an-object');
      }).toThrow('Not an object: not-an-object');
    });

    // Note: This test reflects the bug in the original code
    it('should throw error with undefined reference due to bug in original code', () => {
      expect(() => {
        dumper.toRootObject({ class: 'Variable' });
      }).toThrow("root is not defined");
    });

    it('should use default values appropriately', () => {
      const arg = {
        ns: 1,
        id: 'i=123'
      };

      const result = dumper.toRootObject(arg);

      expect(result).toEqual({
        class: 'Object',
        ns: 1,
        id: 'i=123',
        name: undefined, // Since ns0id mock returns undefined for non-ns=0 nodes
        type: 'FolderType' // Default type
      });
    });
  });

  describe('loadObject', () => {
    it('should process object with forward references', async () => {
      // Create a reference object with proper string nodeId
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=35', // Organizes
        nodeClass: 'Object',
        nodeId: 'ns=1;o=123', // This should be a string
        browseName: { namespaceIndex: 1, name: 'ChildObject' },
        typeDefinition: 'ns=0;i=61',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId, // Keep as string
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          };
        }
      };

      // Prevent infinite recursion
      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [] // Empty references to stop recursion
      });

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      };

      await dumper.loadObject(parent);

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
      expect(parent.Organizes).toBeDefined();
      expect(parent.Organizes).toHaveLength(1);
    });

    it('should process methods and get argument definitions (lines 86-92)', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=47', // HasComponent
        nodeClass: 'Method',
        nodeId: 'ns=1;m=789',
        browseName: { namespaceIndex: 1, name: 'TestMethod' },
        typeDefinition: 'ns=0;i=0',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          };
        }
      };

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [] // Stop recursion
      });

      // Mock getArgumentDefinition to return method arguments
      mockSession.getArgumentDefinition.mockResolvedValue({
        inputArguments: [{ name: 'input1', dataType: 11 }],
        outputArguments: [{ name: 'output1', dataType: 11 }]
      });

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      };

      await dumper.loadObject(parent);

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
      expect(mockSession.getArgumentDefinition).toHaveBeenCalled();
      expect(parent.HasComponent).toBeDefined();
      expect(parent.HasComponent[0]).toEqual(
        expect.objectContaining({
          class: 'Method',
          name: 'TestMethod',
          inputArguments: [{ name: 'input1', dataType: 11 }],
          outputArguments: [{ name: 'output1', dataType: 11 }]
        })
      );
    });

    it('should process variables and read their values (lines 113-121)', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=47', // HasComponent
        nodeClass: 'Variable',
        nodeId: 'ns=1;i=456',
        browseName: { namespaceIndex: 1, name: 'TestVariable' },
        typeDefinition: 'ns=0;i=63',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          };
        }
      };

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [] // Stop recursion
      });

      // Mock read to return variable values
      mockSession.read.mockResolvedValue([
        { value: { dataType: 11, value: 'testValue' } }
      ]);

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      };

      await dumper.loadObject(parent);

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
      expect(mockSession.read).toHaveBeenCalledWith([{ nodeId: 'ns=1;i=456' }]);
      expect(parent.HasComponent).toBeDefined();
      expect(parent.HasComponent[0]).toEqual(
        expect.objectContaining({
          class: 'Variable',
          name: 'TestVariable',
          dataType: 11,
          value: 'testValue'
        })
      );
    });

    it('should process variables with null values (line 103 false branch)', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=47', // HasComponent
        nodeClass: 'Variable',
        nodeId: 'ns=1;i=456',
        browseName: { namespaceIndex: 1, name: 'TestVariable' },
        typeDefinition: 'ns=0;i=63',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          };
        }
      };

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [] // Stop recursion
      });

      // Mock read to return variable with null value
      mockSession.read.mockResolvedValue([
        { value: { dataType: 11, value: null } }
      ]);

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      };

      await dumper.loadObject(parent);

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
      expect(mockSession.read).toHaveBeenCalledWith([{ nodeId: 'ns=1;i=456' }]);
      expect(parent.HasComponent).toBeDefined();
      expect(parent.HasComponent[0]).toEqual(
        expect.objectContaining({
          class: 'Variable',
          name: 'TestVariable',
          dataType: 11
        })
      );
      // value should not be set when it's null (this covers line 103 false branch)
      expect(parent.HasComponent[0]).not.toHaveProperty('value');
    });

    it('should process variables with undefined values (line 103 false branch)', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=47', // HasComponent
        nodeClass: 'Variable',
        nodeId: 'ns=1;i=456',
        browseName: { namespaceIndex: 1, name: 'TestVariable' },
        typeDefinition: 'ns=0;i=63',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          };
        }
      };

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [] // Stop recursion
      });

      // Mock read to return variable with undefined value
      mockSession.read.mockResolvedValue([
        { value: { dataType: 11, value: undefined } }
      ]);

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      };

      await dumper.loadObject(parent);

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
      expect(mockSession.read).toHaveBeenCalledWith([{ nodeId: 'ns=1;i=456' }]);
      expect(parent.HasComponent).toBeDefined();
      expect(parent.HasComponent[0]).toEqual(
        expect.objectContaining({
          class: 'Variable',
          name: 'TestVariable',
          dataType: 11
        })
      );
      // value should not be set when it's undefined (this covers line 103 false branch)
      expect(parent.HasComponent[0]).not.toHaveProperty('value');
    });

    it('should ignore backward references', async () => {
      const mockReference = {
        isForward: false, // Backward reference - should be ignored
        referenceTypeId: 'ns=0;i=35',
        nodeClass: 'Object',
        nodeId: 'ns=0;i=84', // This should be a string
        browseName: { namespaceIndex: 0, name: 'Parent' },
        typeDefinition: 'ns=0;i=61',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId, // Keep as string
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          };
        }
      };

      // Prevent infinite recursion
      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [] // Empty references to stop recursion
      });

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      };

      await dumper.loadObject(parent);

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
      expect(parent.Organizes).toBeUndefined(); // Should not be set
    });
  });

  describe('dump', () => {
    it('should create root object and load it', async () => {
      // Mock browse to return empty references to prevent recursion
      mockSession.browse.mockResolvedValue({
        statusCode: { isGoodish: () => true },
        references: []
      });

      const result = await dumper.dump();

      expect(result).toEqual({
        class: 'Object',
        ns: 0,
        id: 'i=85',
        name: 'Objects',
        type: 'FolderType'
      });
    });

    it('should accept custom root arguments', async () => {
      // Mock browse to return empty references to prevent recursion
      mockSession.browse.mockResolvedValue({
        statusCode: { isGoodish: () => true },
        references: []
      });

      const customArg = {
        ns: 1,
        id: 'i=123',
        name: 'CustomRoot'
      };

      const result = await dumper.dump(customArg);

      expect(result).toEqual({
        class: 'Object',
        ns: 1,
        id: 'i=123',
        name: 'CustomRoot',
        type: 'FolderType'
      });
    });
  });
});

// // __tests__/Dumper.test.js
// const EventEmitter = require('node:events');
// const Dumper = require('../lib/Dumper');

// // Mock node-opcua
// jest.mock('node-opcua', () => ({
//   ObjectIds: {
//     85: 'Objects'
//   },
//   ObjectTypeIds: {
//     61: 'FolderType'
//   },
//   ReferenceTypeIds: {
//     35: 'Organizes',
//     47: 'HasComponent',
//     46: 'HasProperty'
//   }
// }));

// describe('Dumper', () => {
//   let mockSession;
//   let dumper;

//   beforeEach(() => {
//     mockSession = {
//       browse: jest.fn(),
//       read: jest.fn(),
//       getArgumentDefinition: jest.fn()
//     };

//     dumper = new Dumper(mockSession);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('constructor', () => {
//     it('should extend EventEmitter', () => {
//       expect(dumper).toBeInstanceOf(EventEmitter);
//     });

//     it('should initialize with session', () => {
//       expect(dumper).toBeInstanceOf(Dumper);
//     });
//   });

//   describe('browse', () => {
//     it('should emit start and finish events and return references on success', async () => {
//       const mockReferences = [
//         { isForward: true, nodeId: 'ns=1;i=123' }
//       ];
//       mockSession.browse.mockResolvedValue({
//         statusCode: { isGoodish: () => true },
//         references: mockReferences
//       });

//       const startSpy = jest.fn();
//       const finishSpy = jest.fn();
//       dumper.on('start', startSpy);
//       dumper.on('finish', finishSpy);

//       const result = await dumper.browse('ns=0;i=85');

//       expect(startSpy).toHaveBeenCalledWith('ns=0;i=85');
//       expect(finishSpy).toHaveBeenCalled();
//       expect(result).toBe(mockReferences);
//       expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
//     });

//     it('should emit warning and return empty array on bad status code', async () => {
//       const mockStatusCode = {
//         isGoodish: () => false,
//         toString: () => 'BadStatus'
//       };
//       mockSession.browse.mockResolvedValue({
//         statusCode: mockStatusCode,
//         references: []
//       });

//       const warningSpy = jest.fn();
//       const startSpy = jest.fn();
//       const finishSpy = jest.fn();
//       dumper.on('warning', warningSpy);
//       dumper.on('start', startSpy);
//       dumper.on('finish', finishSpy);

//       const result = await dumper.browse('ns=0;i=85');

//       expect(startSpy).toHaveBeenCalledWith('ns=0;i=85');
//       expect(warningSpy).toHaveBeenCalledWith(mockStatusCode);
//       expect(finishSpy).toHaveBeenCalled();
//       expect(result).toEqual([]);
//     });

//     it('should emit finish even when browse throws an error', async () => {
//       mockSession.browse.mockRejectedValue(new Error('Browse failed'));

//       const startSpy = jest.fn();
//       const finishSpy = jest.fn();
//       dumper.on('start', startSpy);
//       dumper.on('finish', finishSpy);

//       await expect(dumper.browse('ns=0;i=85')).rejects.toThrow('Browse failed');
//       expect(startSpy).toHaveBeenCalledWith('ns=0;i=85');
//       expect(finishSpy).toHaveBeenCalled();
//     });
//   });

//   describe('read', () => {
//     it('should emit start and finish events and return read results', async () => {
//       const mockReadResults = [
//         { value: { dataType: 11, value: 'test' } }
//       ];
//       mockSession.read.mockResolvedValue(mockReadResults);

//       const startSpy = jest.fn();
//       const finishSpy = jest.fn();
//       dumper.on('start', startSpy);
//       dumper.on('finish', finishSpy);

//       const nodeIds = ['ns=1;i=123', 'ns=1;i=456'];
//       const result = await dumper.read(nodeIds);

//       expect(startSpy).toHaveBeenCalledWith(nodeIds);
//       expect(finishSpy).toHaveBeenCalled();
//       expect(result).toBe(mockReadResults);
//       expect(mockSession.read).toHaveBeenCalledWith([
//         { nodeId: 'ns=1;i=123' },
//         { nodeId: 'ns=1;i=456' }
//       ]);
//     });

//     it('should emit finish even when read throws an error', async () => {
//       mockSession.read.mockRejectedValue(new Error('Read failed'));

//       const startSpy = jest.fn();
//       const finishSpy = jest.fn();
//       dumper.on('start', startSpy);
//       dumper.on('finish', finishSpy);

//       const nodeIds = ['ns=1;i=123'];
//       await expect(dumper.read(nodeIds)).rejects.toThrow('Read failed');
//       expect(startSpy).toHaveBeenCalledWith(nodeIds);
//       expect(finishSpy).toHaveBeenCalled();
//     });
//   });

//   describe('toRootObject', () => {
//     it('should create default root object when no arguments provided', () => {
//       const result = dumper.toRootObject();

//       expect(result).toEqual({
//         class: 'Object',
//         ns: 0,
//         id: 'i=85',
//         name: 'Objects',
//         type: 'FolderType'
//       });
//     });

//     it('should merge provided arguments with default root', () => {
//       const arg = {
//         ns: 1,
//         id: 'i=123',
//         name: 'CustomObject',
//         type: 'CustomType'
//       };

//       const result = dumper.toRootObject(arg);

//       expect(result).toEqual({
//         class: 'Object',
//         ns: 1,
//         id: 'i=123',
//         name: 'CustomObject',
//         type: 'CustomType'
//       });
//     });

//     it('should throw error when argument is not an object', () => {
//       expect(() => {
//         dumper.toRootObject('not-an-object');
//       }).toThrow('Not an object: not-an-object');
//     });

//     // Note: This test reflects the bug in the original code
//     it('should throw error with undefined reference due to bug in original code', () => {
//       expect(() => {
//         dumper.toRootObject({ class: 'Variable' });
//       }).toThrow("root is not defined");
//     });

//     it('should use default values appropriately', () => {
//       const arg = {
//         ns: 1,
//         id: 'i=123'
//       };

//       const result = dumper.toRootObject(arg);

//       expect(result).toEqual({
//         class: 'Object',
//         ns: 1,
//         id: 'i=123',
//         name: undefined, // Since ns0id mock returns undefined for non-ns=0 nodes
//         type: 'FolderType' // Default type
//       });
//     });
//   });

//   describe('loadObject', () => {
//     it('should process object with forward references', async () => {
//       // Create a reference object with proper string nodeId
//       const mockReference = {
//         isForward: true,
//         referenceTypeId: 'ns=0;i=35', // Organizes
//         nodeClass: 'Object',
//         nodeId: 'ns=1;o=123', // This should be a string
//         browseName: { namespaceIndex: 1, name: 'ChildObject' },
//         typeDefinition: 'ns=0;i=61',
//         toJSON: function() {
//           return {
//             referenceTypeId: this.referenceTypeId,
//             nodeClass: this.nodeClass,
//             nodeId: this.nodeId, // Keep as string
//             browseName: this.browseName,
//             typeDefinition: this.typeDefinition
//           };
//         }
//       };

//       // Prevent infinite recursion
//       mockSession.browse.mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [mockReference]
//       }).mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [] // Empty references to stop recursion
//       });

//       const parent = {
//         ns: 0,
//         id: 'i=85',
//         name: 'Root'
//       };

//       await dumper.loadObject(parent);

//       expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
//       expect(parent.Organizes).toBeDefined();
//       expect(parent.Organizes).toHaveLength(1);
//     });

//     it('should process methods and get argument definitions (lines 86-92)', async () => {
//       const mockReference = {
//         isForward: true,
//         referenceTypeId: 'ns=0;i=47', // HasComponent
//         nodeClass: 'Method',
//         nodeId: 'ns=1;m=789',
//         browseName: { namespaceIndex: 1, name: 'TestMethod' },
//         typeDefinition: 'ns=0;i=0',
//         toJSON: function() {
//           return {
//             referenceTypeId: this.referenceTypeId,
//             nodeClass: this.nodeClass,
//             nodeId: this.nodeId,
//             browseName: this.browseName,
//             typeDefinition: this.typeDefinition
//           };
//         }
//       };

//       mockSession.browse.mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [mockReference]
//       }).mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [] // Stop recursion
//       });

//       // Mock getArgumentDefinition to return method arguments
//       mockSession.getArgumentDefinition.mockResolvedValue({
//         inputArguments: [{ name: 'input1', dataType: 11 }],
//         outputArguments: [{ name: 'output1', dataType: 11 }]
//       });

//       const parent = {
//         ns: 0,
//         id: 'i=85',
//         name: 'Root'
//       };

//       await dumper.loadObject(parent);

//       expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
//       expect(mockSession.getArgumentDefinition).toHaveBeenCalled();
//       expect(parent.HasComponent).toBeDefined();
//       expect(parent.HasComponent[0]).toEqual(
//         expect.objectContaining({
//           class: 'Method',
//           name: 'TestMethod',
//           inputArguments: [{ name: 'input1', dataType: 11 }],
//           outputArguments: [{ name: 'output1', dataType: 11 }]
//         })
//       );
//     });

//     it('should process variables and read their values (lines 113-121)', async () => {
//       const mockReference = {
//         isForward: true,
//         referenceTypeId: 'ns=0;i=47', // HasComponent
//         nodeClass: 'Variable',
//         nodeId: 'ns=1;i=456',
//         browseName: { namespaceIndex: 1, name: 'TestVariable' },
//         typeDefinition: 'ns=0;i=63',
//         toJSON: function() {
//           return {
//             referenceTypeId: this.referenceTypeId,
//             nodeClass: this.nodeClass,
//             nodeId: this.nodeId,
//             browseName: this.browseName,
//             typeDefinition: this.typeDefinition
//           };
//         }
//       };

//       mockSession.browse.mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [mockReference]
//       }).mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [] // Stop recursion
//       });

//       // Mock read to return variable values
//       mockSession.read.mockResolvedValue([
//         { value: { dataType: 11, value: 'testValue' } }
//       ]);

//       const parent = {
//         ns: 0,
//         id: 'i=85',
//         name: 'Root'
//       };

//       await dumper.loadObject(parent);

//       expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
//       expect(mockSession.read).toHaveBeenCalledWith([{ nodeId: 'ns=1;i=456' }]);
//       expect(parent.HasComponent).toBeDefined();
//       expect(parent.HasComponent[0]).toEqual(
//         expect.objectContaining({
//           class: 'Variable',
//           name: 'TestVariable',
//           dataType: 11,
//           value: 'testValue'
//         })
//       );
//     });

//     it('should process variables with null values', async () => {
//       const mockReference = {
//         isForward: true,
//         referenceTypeId: 'ns=0;i=47', // HasComponent
//         nodeClass: 'Variable',
//         nodeId: 'ns=1;i=456',
//         browseName: { namespaceIndex: 1, name: 'TestVariable' },
//         typeDefinition: 'ns=0;i=63',
//         toJSON: function() {
//           return {
//             referenceTypeId: this.referenceTypeId,
//             nodeClass: this.nodeClass,
//             nodeId: this.nodeId,
//             browseName: this.browseName,
//             typeDefinition: this.typeDefinition
//           };
//         }
//       };

//       mockSession.browse.mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [mockReference]
//       }).mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [] // Stop recursion
//       });

//       // Mock read to return variable with null value
//       mockSession.read.mockResolvedValue([
//         { value: { dataType: 11, value: null } }
//       ]);

//       const parent = {
//         ns: 0,
//         id: 'i=85',
//         name: 'Root'
//       };

//       await dumper.loadObject(parent);

//       expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
//       expect(mockSession.read).toHaveBeenCalledWith([{ nodeId: 'ns=1;i=456' }]);
//       expect(parent.HasComponent).toBeDefined();
//       expect(parent.HasComponent[0]).toEqual(
//         expect.objectContaining({
//           class: 'Variable',
//           name: 'TestVariable',
//           dataType: 11
//         })
//       );
//       // value should not be set when it's null
//       expect(parent.HasComponent[0].value).toBeUndefined();
//     });

//     it('should ignore backward references', async () => {
//       const mockReference = {
//         isForward: false, // Backward reference - should be ignored
//         referenceTypeId: 'ns=0;i=35',
//         nodeClass: 'Object',
//         nodeId: 'ns=0;i=84', // This should be a string
//         browseName: { namespaceIndex: 0, name: 'Parent' },
//         typeDefinition: 'ns=0;i=61',
//         toJSON: function() {
//           return {
//             referenceTypeId: this.referenceTypeId,
//             nodeClass: this.nodeClass,
//             nodeId: this.nodeId, // Keep as string
//             browseName: this.browseName,
//             typeDefinition: this.typeDefinition
//           };
//         }
//       };

//       // Prevent infinite recursion
//       mockSession.browse.mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [mockReference]
//       }).mockResolvedValueOnce({
//         statusCode: { isGoodish: () => true },
//         references: [] // Empty references to stop recursion
//       });

//       const parent = {
//         ns: 0,
//         id: 'i=85',
//         name: 'Root'
//       };

//       await dumper.loadObject(parent);

//       expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85');
//       expect(parent.Organizes).toBeUndefined(); // Should not be set
//     });
//   });

//   describe('dump', () => {
//     it('should create root object and load it', async () => {
//       // Mock browse to return empty references to prevent recursion
//       mockSession.browse.mockResolvedValue({
//         statusCode: { isGoodish: () => true },
//         references: []
//       });

//       const result = await dumper.dump();

//       expect(result).toEqual({
//         class: 'Object',
//         ns: 0,
//         id: 'i=85',
//         name: 'Objects',
//         type: 'FolderType'
//       });
//     });

//     it('should accept custom root arguments', async () => {
//       // Mock browse to return empty references to prevent recursion
//       mockSession.browse.mockResolvedValue({
//         statusCode: { isGoodish: () => true },
//         references: []
//       });

//       const customArg = {
//         ns: 1,
//         id: 'i=123',
//         name: 'CustomRoot'
//       };

//       const result = await dumper.dump(customArg);

//       expect(result).toEqual({
//         class: 'Object',
//         ns: 1,
//         id: 'i=123',
//         name: 'CustomRoot',
//         type: 'FolderType'
//       });
//     });
//   });
// });