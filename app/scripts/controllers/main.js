'use strict';

angular.module('ngValidateApp')
  .controller('MainCtrl', function ($scope, ngValidation) {

    // Grab all code elements on the page.
  	var code = document.querySelectorAll('code');

    // Set up highlighting
  	for(var i=0, j=code.length; i<j; i++) {
		  hljs.highlightBlock(code[i]);
  	}

    // Add rules
    ngValidation.add_rule('form_3', {
      exempt: ['.exempt', '#exempt']
    }).add_rule('form_4', {
      groups: [
        {name: 'radios', container: false, required: 'input[name="group1"]', number_required: 1},
        {name: 'checkboxes', container: '#checkboxes', required: 'input[type="checkbox"]', number_required: 1}
      ]
    }).add_rule('form_5', {
      scenarios: [{name: 'password', options: {ui: '#pw1'}}]
    }).add_rule('form_6', {
      scenarios: [{name: 'password', options: {ui: '#pw2', acceptance: 'medium'}}]
    }).add_rule('form_7', {
      scenarios: [{name: 'comparator', options: {master: ['#master'], slaves: ['.slave'], fields: ['input[type="email"]'], ui:{element:'#message'}}}]
    }).init();
  });
