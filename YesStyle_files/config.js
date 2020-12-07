/*
 * Copyright (C) 2016 YesAsia.com (Hong Kong) Limited
 */
require.config({waitSeconds: 150});

if (typeof define !== 'function') {
  // to be able to require file from node
  var define = require('amdefine')(module);
}

define({
	//urlArgs: "bust=" + (new Date()).getTime(),
	baseUrl: ysApp.config.jsBaseUrl,
    paths: {
        'angularjs' : 'lib/angular.min',
        'domready' : 'domReady',
        'plugin_lib' : 'lib/lib',
        'paypal' : '//www.paypalobjects.com/api/checkout.min',
        'duScroll' : 'lib/angular-scroll-1.0.2.min'
    },
    shim: {
    	'angularjs' : {'exports' : 'angular'},
    	'domready' : {'exports' : 'domready'},
    	'plugin_lib' : {'deps' :['angularjs']},
    	'paypal' : {'exports' : 'paypal'},
    	'duScroll' : {'deps':['angularjs']}
    }
});

requirejs.onError = function (err) {
    if (err.requireType === 'timeout' && err.requireModules) {
    	for (var i = 0; i < err.requireModules.length; i++) {
    		var module = err.requireModules[i];
	      
	        require.undef(module);
	        
	        require([module]);
	    }
    }

    throw err;
}
