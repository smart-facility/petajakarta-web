	/**
	 * Validate a parameter which should be a number, optionally with min and max values.
	 * @param {number} param Parameter to validate
	 * @param {number=} min Minimum value parameter can have and be valid
	 * @param {number=} max Maximum value parameter can have and be valid
	 */
	var validateNumberParameter = function(param, min, max) {
		var valid = true;
		if ( typeof param !== 'number' ) valid = false;
		if ( isNaN(param) ) valid = false;
		if ( min && param < min ) valid = false;
		if ( max && param > max ) valid = false;
		return valid;
	};
