const {OPCUAClient, OPCUAServer, ReferenceTypeIds, NodeClass} = require ('node-opcua')

const Dumper = require ('../lib/Dumper')
const dump = require ('./data/dump.json')
const init = require ('./lib/init')

const port = 4840, enpointUrl = `opc.tcp://localhost:${port}/`
const server = new OPCUAServer ({endpoints: [{port}]})
const client = OPCUAClient.create ({endpointMustExist: false})

let dumper

describe ('Dumper', () => {

  beforeAll (async () => {
    await server.initialize ()    
    init (server)
    await server.start ()
  })

  beforeEach (async () => {
    await client.connect (enpointUrl)
    dumper = new Dumper (await client.createSession ())
  })

  afterEach (async () => {
    dumper = undefined
    await client.disconnect ()
  })

  afterAll (async () => {
    await server.shutdown ()
  })  

  describe ('dump', () => {    
    
    it ('should fetch the equivalent of the pre recorded dump', async () => {

      const snapshot = await dumper.dump ({ns: 1, id: 'i=5001'})

      expect (snapshot.Organizes [0]).toEqual (dump)

    })

    it ('should fetch a leaf object because contained node types are not yet supported', async () => {

      const snapshot = await dumper.dump ({ns: 0, id: 'i=24'})

      expect (snapshot).toEqual ({
        class: 'Object',
        ns: 0,
        id: 'i=24',
        type: 'FolderType'
      })

    })

    it ('should carp and find nothing', async () => {

      const a = []; dumper.on ('warning', _ => a.push (String (_)))

      const snapshot = await dumper.dump ({ns: 1, id: 'i=5002'})

      expect (snapshot.Organizes).toBeUndefined ()

      expect (a).toEqual (['BadNodeIdUnknown (0x80340000)'])

    })

  })

  describe ('ingoring unknown things', () => {    

    it ('should cover the non-`HasComponent` nor `Organizes` case for a reference', async () => {

      for (const referenceTypeId in ReferenceTypeIds) if (referenceTypeId !== 'HasComponent' && referenceTypeId !== 'Organizes') {

        const child = await dumper.loadReference (referenceTypeId, 1, 'ns=1;i=5001', '?', 'Variable')

        expect (child).toBeUndefined ()

      }

    })

    it ('should cover the non-`Variable` nor `Method` case for the `HasComponent` type reference', async () => {

      for (const nodeClass in NodeClass) if (nodeClass !== 'Method' && nodeClass !== 'Variable') {

        const child = await dumper.loadReferenceHasComponent ({}, nodeClass)

        expect (child).toBeUndefined ()

      }

    })

    it ('should cover the non-`Object` case for the `Organizes` type reference', async () => {

      for (const nodeClass in NodeClass) if (nodeClass !== 'Object') {

        const child = await dumper.loadReferenceOrganizes ({}, nodeClass)

        expect (child).toBeUndefined ()

      }

    })

  })

})