(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['exports'], factory);
	} else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
		// CommonJS
		factory(exports);
	} else {
		// Browser globals
		factory((root.commonJsStrict = {}));
	}
}(this, function (exports) {
	'use strict';


	//=====================================================
	//================= parse data and build nested strings
	//=====================================================

	function parseValues( valuesA, is_mutationB ) {
		
		//+++++++++++++++++++++++++++ work over "Values" Array
		//++++++++++++++++++++++++++++++++++++++++++++++++++++
		 
		var propsA = valuesA.map( function( currentValue, index ) {
			
			var itemX = valuesA[index];
			
			if ( !Array.isArray( itemX ) && 'object' === typeof itemX ) {
				var itemO
				if ( itemX.func ) {
					var itemO = queryFunction( itemX, is_mutationB );
					return queryToString( itemO );
				} else {
					if ( itemX.alias ) {
						// HANDLE LONGFORM { alias: 'alias_name', value: 'value_name' }
						if ( !itemX.value && !itemX.values )
							throw new RangeError( 'Alias objects must have "value" String or "values" Array. was passed: ' + JSON.stringify(itemX) );
						else if ( itemX.value && 'string' !== typeof itemX.value )
							throw new RangeError( 'Alias objects should only have one String for "value". was passed: ' + JSON.stringify(itemX) );
						else if ( checkForInt( itemX.alias ) )
							throw new RangeError( 'Alias cannot be a stringified Integer: ' + JSON.stringify(itemX));
						else if ( itemX.values ) {
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
	}

	function checkForInt( string ) {
		if (/^(\-|\+)?([0-9]+|Infinity)$/.test( string ))
			return true;
		return false;
	}

	//=====================================================
	//=================================== get GraphQL Value
	//=====================================================


	function getGraphQLValue( value ) {
		if ( 'string' === typeof value ) {
			// IF NOT ENUM ADD QUOTES
			value = value.indexOf('e$')===0 ? value.substring(2) : JSON.stringify(value);
		} else if ( Array.isArray(value) ) {
			value = value.map( function( item ) {
			return getGraphQLValue( item );
			} ).join();
			value = '[' + value + ']';
		} else if ( 'object' === typeof value ) {
			value = objectToString(value);
		}
		return value;
	}

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
	}

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
	}


	function queryToString ( queryO ) {
		queryO.bodyS = queryO.bodyS ? '{' + queryO.bodyS + '}' : '';
		
		return ( queryO.aliasS ? queryO.aliasS + ':' : '' ) + queryO.fnNameS + ( queryO.filtersA && queryO.filtersA.length > 0 ? '(' + queryO.filtersA.join(',') + ')' : '' ) + queryO.bodyS;
	}

	//=====================================================
	//=========================== Create new query function
	//=====================================================

	function queryFunction( queryO, is_mutationB ) {

		//+++++++++++++++++++ work over Query object and return GQL structure
		var queryFuncO = {};
		// CHECK FORMATS FOR ERRORS
		if ( !queryO.func || 'string' !== typeof queryO.func )
			throw new TypeError( '"name" has been sent as a non-string value' );
		queryFuncO.fnNameS = queryO.func;
		// CREATE ALIAS FOR FUNCTION
		if ( queryO.alias ) {
			if ( 'string' !== typeof queryO.alias ) 
				throw new TypeError( 'Alias must be a String value' );
			if ( checkForInt( queryO.alias ) )
				throw new TypeError( 'Alias cannot be a stringified Integer');

			queryFuncO.aliasS = queryO.alias;
		}
		// ADD VARIABLES FOR FUNCTION
		if ( queryO.filters ) {
			if ( 'object' !== typeof queryO.filters || Array.isArray( queryO.filters ) )
				throw new TypeError( 'Function filters must be passed as object with key values' );
			queryFuncO.filtersA = functionFilters( queryO.filters );
		}
		// SET RETURN VALUES FOR QUERY ( IF MUTATION NOT REQUIRED )
		if ( !is_mutationB || queryO.values ) {
			if ( !queryO.values || !queryO.values.length )
				throw new TypeError( '"values" can not be >>falsy<< value' );
			else if ( !Array.isArray( queryO.values ) && 'string' !== typeof queryO.values )
				throw new TypeError( '"values" must be an Array of values or single String value' );
		}
		// IF ARRAY WORK OVER AND PARSE NESTED VALUES > OTHERWISE JUST RETURN STRING
		queryFuncO.bodyS = Array.isArray( queryO.values ) ? parseValues( queryO.values, is_mutationB ) : queryO.values;

		return queryFuncO;
	}

	function globalOptions( optionsO ) {
		var query_options = {
			prefix: ''
		};
		if ( optionsO && !Array.isArray( optionsO ) && 'object' === typeof optionsO ) {
			if ( optionsO.prefix ) {
				if ( 'string' !== typeof optionsO.prefix )
					throw new TypeError( '"prefix" option must be a String value' );
				query_options.prefix = optionsO.prefix;
			}
		}
		return query_options;
	}

	//=====================================================
	//====================================== Query Function
	//=====================================================

	function Query( data_obj, options ) {
		
		if ( undefined === data_obj || 'object' !== typeof data_obj ) {
			throw new TypeError( 'Query data must be an object or array of query objects' );
			return;
		}

		var global_options = globalOptions( options );

		// IF SINGLE OBJECT CREATE SINGLE INDEX ARRAY
		var $this = Query;
		if ( !Array.isArray(data_obj) ) data_obj = [data_obj];
		var queriesA = data_obj;
		var query_stringsA = [];
		
		// ======= TD QUERY PARSE OBJECT AND BUILD
		// =======================================

		queriesA.forEach( function( query ) {
			// START QUERY STRING CREATION OF EACH TOP LEVEL OBJECT
			var is_mutationB = global_options.prefix && global_options.prefix == 'mutation' ? true : false;
			var query_stringO = queryFunction( query, is_mutationB );
			query_stringsA.push( queryToString( query_stringO ) );
		});
		return global_options.prefix + '{' + query_stringsA.join(' ') + '}';

	}

	exports.Query = window.Query = Query;

	if ( typeof module === 'object' && !!module.exports ) {
		module.exports = Query;
	}

	//=====================================================
	//==================== Create parsable Enumeration vals
	//=====================================================

	function Enum( key ) {
		return 'e$' + key;
	}
	
	exports.Enum = window.Enum = Enum;

	if ( typeof module === 'object' && !!module.exports ) {
		module.exports = Enum;
	}
	
}));