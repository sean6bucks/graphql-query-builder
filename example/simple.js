'use strict'

require('./stubs/window');
var Query = require('../sk-query.js');


var user = Query({
  func: "user",
  values: [ "uri", "width", "height" ]
});

console.log("Basic Query: ", user+"");

/*
query={
 user {
    uri,
    width,
    height
  }
}
*/

var FetchLeeAndSam = Query({
  func: "FetchLeeAndSam",
  values: [
    {
      alias: 'lee',
      func: 'user',
      filters: { id: '1' },
      values: ['name', 'id' ]
    },
    {
      alias: 'sam',
      func: 'user',
      filters: { id: '2' },
      values: ['name', 'id' ]
    }
  ]
});
  
console.log('Nested Functions: ', FetchLeeAndSam+"");

/*
query={
  FetchLeeAndSam{
    lee: user(id:"1"){
      name
    },
    sam: user(id:"2"){
      name
    }
  }
}
*/

var reusable = function( model, year ) {
  return {
    alias: model,
    func: 'vehicle',
    filters: { year: year },
    values: [
      "num_produced",
      "horsepower"
    ]
  };
};

var CarCatalog = Query([
  reusable( 'Mustang', '1964' ),
  reusable( 'Camero', '1988' )
]);

console.log( 'Reusable Objects: ', CarCatalog+"" );

/*
query={
  Mustang:vehicle(year:"1964"){
    num_produced,
    horsepower
  } 
  Camero:vehicle(year:"1988"){
    num_produced,
    horsepower
  }
}
*/


