'use strict';

angular.module('ngValidateApp')
  .controller('MainCtrl', function ($scope, ngValidation) {
  	var code = document.querySelectorAll('code');
  	for(var i=0, j=code.length; i<j; i++) {
		hljs.highlightBlock(code[i]);
  	}
  });
