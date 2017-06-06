'use strict'

var app = angular.module('tdQuery', []);

app.factory( 'Query', function() {


	//=====================================================
	//============================ parce properties to find
	//=====================================================

	// function parceFind( _levelA ) {
		
	// //+++++++++++++++++++++++++++++++++++ work over Array
	// //++++++++++++++++++++++++++++++++++++++++++++++++++++
		 
	// 	var propsA = _levelA.map( function( currentValue, index ) {
			
	// 		var itemX = _levelA[index];
			
	// 		if ( itemX instanceof Query ){
	// 			return itemX.toString();
	// 		} else if ( !Array.isArray( itemX ) && 'object' === typeof itemX ) {
	// 			var propsA = Object.keys( itemX );
	// 			if ( 1 !== propsA.length ) {
	// 				throw new RangeError( 'Alias objects should only have one value. was passed: ' + JSON.stringify(itemX) );
	// 			}
	// 			var propS = propsA[0];
	// 			var item = itemX[propS];
	// 			// contributor: https://github.com/charlierudolph/graphql-query-builder/commit/878328e857e92d140f5ba6f7cfe07837620ec490
	// 			if ( Array.isArray( item ) ) {
	// 				return new Query( propS ).find( item )
	// 			}
	// 			return propS + ' : ' + item + ' '
	// 		} else if ( 'string' === typeof itemX ) {
	// 			return itemX;
	// 		} else {
	// 			throw new RangeError( 'cannot handle Find value of ' + itemX );
	// 		}
	// 	});
		
	// 	return propsA.join(',');
	// };

	function parseValues( valuesA ) {
		
		//+++++++++++++++++++++++++++ work over "Values" Array
		//++++++++++++++++++++++++++++++++++++++++++++++++++++
		 
		var propsA = valuesA.map( function( currentValue, index ) {
			
			var itemX = valuesA[index];
			
			if ( !Array.isArray( itemX ) && 'object' === typeof itemX ) {
				var itemO
				if ( itemX.func ) {
					var itemO = queryFunction( itemX );
					return queryToString( itemO );
				} else {
					if ( itemX.alias ) {
						// HANDLE LONGFORM { alias: 'alias_name', value: 'value_name' }
						if ( !itemX.value && !itemX.values )
							throw new RangeError( 'Alias objects must have "value" String or "values" Array. was passed: ' + JSON.stringify(itemX) );
						else if ( itemX.value && 'string' !== typeof itemX.value )
							throw new RangeError( 'Alias objects should only have one String for "value". was passed: ' + JSON.stringify(itemX) );
						else if ( itemX.values ) {
							console.log( itemX.values );
							if ( !Array.isArray(itemX.values) && 'string' !== typeof itemX.values )
								throw new TypeError( '"values" must be an Array with single value or single String value' );
							else if ( Array.isArray(itemX.values) && itemX.values.length > 1 )
								throw new RangeError( '"values" Array should only have one value. was passed: ' + JSON.stringify(itemX) );
						}
						var propS = itemX.alias;
						// HANDLES value: String, values: [ String ], OR values: String 
						var valS = itemX.value ? itemX.value : Array.isArray( itemX.values ) ? itemX.values[0] : itemX.values;
					} else {
						// HANDLES SHORTHAND FOR { alias_name: 'value_name' }
						var propsA = Object.keys( itemX );
						if ( 1 !== propsA.length ) {
							throw new RangeError( 'Alias objects should only have one value. was passed: ' + JSON.stringify(itemX) );
						}
						var propS = propsA[0];
						var valS = itemX[propS];
					}

					return propS + ':' + valS;
				}

			} else if ( 'string' === typeof itemX ) {
				return itemX;
			} else {
				throw new RangeError( 'cannot handle value type of ' + itemX );
			}
		});
		
		return propsA.join(',');
	};

	//=====================================================
	//=================================== get GraphQL Value
	//=====================================================


	function getGraphQLValue( value ) {
		if ( 'string' === typeof value ) {
			value = JSON.stringify(value);
		} else if ( Array.isArray(value) ) {
			value = value.map( function( item ) {
			return getGraphQLValue( item );
			} ).join();
			value = '[' + value + ']';
		} else if ( 'object' === typeof value ) {
			value = objectToString(value);
		}
		return value;
	};

	function functionFilters( filtersO ) {
		var filtersA = [];

		for ( var propS in filtersO ) {
			if ( 'function' === typeof filtersO[propS] ) {
				continue;
			}

			var val = getGraphQLValue( filtersO[propS] );
			if ( '{}' === val ) {
				continue;
			}
			filtersA.push( propS + ':' + val );
		} 

		return filtersA;
	};

	//=====================================================
	//=================================== string formatting
	//=====================================================

	function objectToString( obj ) {
		
		var sourceA = [];
		
		for ( var prop in obj ) {
			if ( 'function' === typeof obj[prop] ) {
				continue;
			}

			sourceA.push( prop + ':' + getGraphQLValue( obj[prop] ) );
		}

		return '{' + sourceA.join() + '}';
	};


	function queryToString ( queryO ) {
		if ( undefined === queryO.bodyS ) {
			throw new ReferenceError( 'return properties are not defined. use the "values" object to defined them' );
		}
		
		return ( queryO.aliasS ? queryO.aliasS + ':' : '' ) + queryO.fnNameS + ( 0 < queryO.filtersA.length ? '(' + queryO.filtersA.join(',') + ')' : '' ) + '{' + queryO.bodyS + '}';
	};

	//=====================================================
	//=========================== Create new query function
	//=====================================================

	function queryFunction( queryO ) {

		//+++++++++++++++++++ work over Query object and return GQL structure
		var queryFuncO = {};
		// CHECK FORMATS FOR ERRORS
		if ( !queryO.func || 'string' !== typeof queryO.func )
			throw new TypeError( '"name" has been sent as a non-string value' );
		queryFuncO.fnNameS = queryO.func;
		
		if ( queryO.alias ) {
			if ( 'string' !== typeof queryO.alias ) 
				throw new TypeError( 'Alias must be a String value' );
			queryFuncO.aliasS = queryO.alias;
		}
		if ( queryO.filters ) {
			if ( 'object' !== typeof queryO.filters || Array.isArray( queryO.filters ) )
				throw new TypeError( 'Function filters must be passed as object with key values' );
			queryFuncO.filtersA = functionFilters( queryO.filters );
		}
		if ( !queryO.values || !queryO.values.length )
			throw new TypeError( '"values" can not be >>falsy<< value' );
		else if ( !Array.isArray( queryO.values ) && 'string' !== queryO.values )
			throw new TypeError( '"values" must be an Array of values or single String value' );
		// IF ARRAY WORK OVER AND PARSE NESTED VALUES > OTHERWISE JUST RETURN STRING
		queryFuncO.bodyS = Array.isArray( queryO.values ) ? parseValues( queryO.values ) : queryO.values;

		return queryFuncO;
	}

	//=====================================================
	//========================================= Query Class
	//=====================================================

	function Query( data_obj ) {
		
		if ( undefined === data_obj || 'object' !== typeof data_obj ) {
			throw new TypeError( 'Query data must be an object or array of query objects' );
			return;
		}
		// IF SINGLE OBJECT CREATE SINGLE INDEX ARRAY
		var $this = this;
		if ( !Array.isArray(data_obj) ) data_obj = [data_obj];
		var queriesA = data_obj;
		var query_stringsA = [];
		
		// _fnNameS, _aliasS_OR_Filter
		
		// ======== QUERY BUILDER Query FUNCTIONS > MOVE TO GLOBAL

		// this.filter = function( filtersO ) {
	 
		// 	for ( var propS in filtersO ) {
		// 		if ( 'function' === typeof filtersO[propS] ) {
		// 			continue;
		// 		}
		// 		var val = getGraphQLValue( filtersO[propS] );
		// 		if ( '{}' === val ) {
		// 			continue;
		// 		}
		// 		$this.headA.push( propS + ':' + val );
		// 	} 
		// 	return this;
		// };
		// this.setAlias = function( _aliasS ) {
		// 	this.aliasS = _aliasS;
		// 	return this;
		// };
		// this.find = function( findA ) { // THIS NEED TO BE A 'FUNCTION' to scope 'arguments'
		// 	if( !findA ){
		// 		throw new TypeError( 'find value can not be >>falsy<<' );
		// 	}
		// 	// if its a string.. it may have other values
		// 	// else it sould be an Object or Array of maped values
		// 	this.bodyS = parceFind( ( Array.isArray(findA) ) ? findA : Array.from(arguments) );
		// 	return this;
		// };

		// ======= TD QUERY PARSE OBJECT AND BUILD
		// =======================================

		queriesA.forEach( function( query ) {
			// START QUERY STRING CREATION OF EACH TOP LEVEL OBJECT
			var query_stringO = queryFunction( query );
			query_stringsA.push( queryToString( query_stringO ) );
		});

		return '{' + query_stringsA.join(' ') + '}';

	};

	//=====================================================
	//===================================== Query prototype
	//=====================================================

	// Query.prototype = {
		
	// 	toString: function() {
	// 		if ( undefined === this.bodyS ) {
	// 			throw new ReferenceError('return properties are not defined. use the "find" function to defined them');
	// 		}
			
	// 		return ( this.aliasS ? this.aliasS + ':' : '' ) + this.fnNameS + ( 0 < this.headA.length ? '(' + this.headA.join(',') + ')' : '' ) + '{' + this.bodyS + '}';
	// 	}
	// };

	return Query;
});