const {OPCUAClient, OPCUAServer, StatusCodes} = require ('node-opcua')

const Loader   = require ('../lib/Loader')
const Snapshot = require ('../lib/Snapshot')

const NS_ARRAY = ['http://opcfoundation.org/UA/', 'http://test.com/ns/']
const dump     = require ('./data/dump.json')

const port     = 4841, enpointUrl = `opc.tcp://localhost:${port}/`
const server   = new OPCUAServer ({endpoints: [{port}]})
const client   = OPCUAClient.create ({endpointMustExist: false})

let session

const calls = []

describe ('Loader', () => {

  beforeAll (async () => {
    await server.initialize ()
    const loader = new Loader (server)
    loader.on ('method', varMethod => {
      varMethod.bindMethod ((args, _, callback) => {
        calls.push ([varMethod.browseName.name, args])
        callback (null, {statusCode: StatusCodes.Good})
      })
    })
    await loader.load (Snapshot.from (NS_ARRAY, dump))
    await server.start ()
  })

  beforeEach (async () => {
    await client.connect (enpointUrl)
    session = await client.createSession ()
  })

  afterEach (async () => {
    await client.disconnect ()
  })

  afterAll (async () => {
    await server.shutdown ()
  })  

  describe ('load', () => {    
    
    it ('should read scalar values', async () => {

      const [v1, h1, unk] = await session.read (['ns=1;s=MyDevice.V1', 'ns=1;s=MyDevice.H1', 'ns=1;s=MyDevice.?'].map (nodeId => ({nodeId})))

      expect (v1.value.value).toBe ('String value')
      expect (unk.statusCode.name).toBe ('BadNodeIdUnknown')

    })

    it ('should set and then get a value', async () => {

      new Loader (server).setValue ('ns=1;s=MyDevice.V1', 'Modified value')

      const [v1] = await session.read (['ns=1;s=MyDevice.V1'].map (nodeId => ({nodeId})))

      expect (v1.value.value).toBe ('Modified value')

    })
    
    it ('should call a method', async () => {

      const result = await session.call ({
        objectId: 'ns=1;s=MyDevice',
        methodId: 'ns=1;s=MyDevice.M1',
      })

      expect (result.statusCode.name).toBe ('Good')
      expect (calls).toEqual ([['M1', []]])

    })

  })

})