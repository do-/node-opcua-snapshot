const {ns0id} = require ('../lib/Dumper')

describe ('Dumper.ns0id', () => {

  it ('should...', () => {
    expect (ns0id ('Object', 'ns=0;i=85', 'Ids')).toBe ('ObjectsFolder')
    expect (ns0id ('Object', 'ns=0;i=85')).toBeUndefined ()
    expect (ns0id ('Object', 'ns=0;i=0', 'Ids')).toBeUndefined ()
    expect (ns0id ('0bject', 'ns=0;i=85', 'Ids')).toBeUndefined ()
  })

})