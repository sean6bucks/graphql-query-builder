(function(window){
    'use strict';


	//=====================================================
	//================= parse data and build nested strings
	//=====================================================

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

	function globalOptions( optionsO ) {
		var query_options = {
			prefix: 'query='
		};
		if ( optionsO && !Array.isArray( optionsO ) && 'object' === typeof optionsO ) {
			if ( optionsO.prefix ) {
				if ( 'string' !== typeof optionsO.prefix )
					throw new TypeError( '"prefix" option must be a String value' );
				query_options.prefix = optionsO.prefix;
			}
		}
		console.log( query_options );
		return query_options;
	}

	//=====================================================
	//========================================= Query Class
	//=====================================================

	function Query( data_obj, options ) {
		
		if ( undefined === data_obj || 'object' !== typeof data_obj ) {
			throw new TypeError( 'Query data must be an object or array of query objects' );
			return;
		}
		console.log( options );
		if ( options )
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
			var query_stringO = queryFunction( query );
			query_stringsA.push( queryToString( query_stringO ) );
		});
		return global_options.prefix + '{' + query_stringsA.join(' ') + '}';

	};

	window.Query = Query;
}(window));