# SK GraphQL Query Builder

### An even simpler Javascript, ES5 friendly, GraphQL query builder
**No need for multiple functions, commands, or es5 compatible compiling. Just create a single Query with an options object and get a GraphQL ready query string in return.**

*Forked from https://github.com/codemeasandwich/graphql-query-builder - a simple ES6 graphql query builder*

**info:**

[![npm version](https://badge.fury.io/js/sk-query-builder.svg)](https://badge.fury.io/js/sk-query-builder)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://doge.mit-license.org)
[![pull requests welcome](https://img.shields.io/badge/Pull%20requests-welcome-pink.svg)](https://github.com/sean6bucks/sk-gql-query-builder/pulls)
[![GitHub stars](https://img.shields.io/github/stars/sean6bucks/sk-gql-query-builder.svg?style=social&label=Star)](https://github.com/sean6bucks/sk-gql-query-builder)

<!--
**tests:**

[![build](https://api.travis-ci.org/codemeasandwich/graphql-query-builder.svg)](https://travis-ci.org/codemeasandwich/graphql-query-builder)
[![Coverage Status](https://coveralls.io/repos/github/codemeasandwich/graphql-query-builder/badge.svg?branch=master)](https://coveralls.io/github/codemeasandwich/graphql-query-builder?branch=master) -->

<!--
**quality:**

[![Code Climate](https://codeclimate.com/github/codemeasandwich/graphql-query-builder/badges/gpa.svg)](https://codeclimate.com/github/codemeasandwich/graphql-query-builder)
[![bitHound Overall Score](https://www.bithound.io/github/codemeasandwich/graphql-query-builder/badges/score.svg)](https://www.bithound.io/github/codemeasandwich/graphql-query-builder)
[![Issue Count](https://codeclimate.com/github/codemeasandwich/graphql-query-builder/badges/issue_count.svg)](https://codeclimate.com/github/codemeasandwich/graphql-query-builder)
[![Known Vulnerabilities](https://snyk.io/test/npm/graphql-query-builder/badge.svg)](https://snyk.io/test/npm/graphql-query-builder) -->

### If this was helpful, [★ it on github](https://github.com/sean6bucks/sk-gql-query-builder)


## Install

`npm install sk-query-builder`

## Query function:
Query is available out of the box on the Window object, but can also be required to prevent namespace interference.

``` js
var Query = require('sk-query-builder');
```

### Use:
Query can be called with a single arguement of either a single query object or an array of query objects and will return a GraphQL formatted string to be attached to query.

``` js
var query = Query( query_obj[, options ] );
```

### Query Constructor:
Single query object or an array of multiple queries to turn into a GQL query string.

| Key Value | Argument | Description |
|--- |--- |--- |
| func: | String | the name of the query function |
| alias: | String | alias value that result will be returned under |
| filters: | Object | An object mapping attribute to values |
| value: | String or Object | Attribute name or nested query you want returned.<br> ***Can be an array of multiple values with the values: key***  |
| values: | Array | An Array of value items ( String or Obj ) to return multiple values |

##### Example: ( get the sum of users in given timeframe )
``` js
var sumQuery = Query({
  func: "sum",
  alias: "total_sum",
  filters: { from: 0, to: 1501234567890 },
  value: "count"
});
``` 
##### Output: ( returns formatted string )
``` js
"{total_sum: sum(from: 0,to: 1501234567890){count}}"
```
### Additional Options:

| Key Value | Argument | Description |
|--- |--- |--- |
| prefix | String | prefix string before query obj ( i.e. "mutation" ) |

##### Example:
``` js
var prefixQuery = Query({
  func: 'update',
  filters: { id: 1, value: 3 },
  value: [ "id", "value" ]
}, { prefix: 'mutation' );

console.log( prefixQuery );
// "mutation{update(id:1,value:3){id,value}}"
``` 

<br>
## Enum Values:
This library also creates an Enum function on the Window object that can be used to create enumeration values in the query string.

### Use:
Add Enum values inside query objects buy either the Enum() function with a string to represent the final value or by simply using any string starting with "e$"

``` Enum( 'VALUE' ) == 'e$VALUE' ```

| Argument (one)  | Description |
|--- |--- |
| String | the name of the query function |

##### Example: ( get the sum of users in given timeframe )
``` js
var eventQuery = Query({
  alias: 'event_123',
  func: 'event',
  filters: {
    frequency: Enum( 'DAILY' ), // can also be "e$DAILY"
    value: Enum( 'CLICKS' )
  },
  values: [ 'timestamp', 'value' ]
});

console.log( eventQuery );
// "{event_123:event(frequency:DAILY,value:CLICKS){timestamp,value}}"
``` 

<br>

## Examples:
#### Nested query values

``` js 
var FetchLeeAndSam = Query({
  alias: 'FetchLeeAndSam',
  func: 'users',
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

console.log( FetchLeeAndSam );
//"{FetchLeeAndSam:users{lee:user(id:"1"){name,id},sam:user(id:"2"){name,id}}}"
```

#### Multiple query array with reusable values

``` js 
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

console.log( CarCatalog );
//"{Mustang:vehicle(year:"1964"){num_produced,horsepower} Camero:vehicle(year:"1988"){num_produced,horsepower}}"
```

### run Examples

``` bash
node example/simple.js
```
