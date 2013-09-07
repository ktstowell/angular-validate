'use strict';

/*******************************************************************************************************
 * ANGULAR VALIDATION RULES
 *******************************************************************************************************
 *
 * @description File that holds all form rules.
 * @author Ken Stowell
 */
 angular.module('ng-validation').factory('ngValidationRules', function() {

  /*******************************************************************************************************
   * RULES
   *******************************************************************************************************
   * @description Object literal with rule definitions.
   */
  var Rules = {
    /**
     * DEFAULT RULE
     * @description This rule gets loaded if no custom rule provided - you can edit to your hearts content,
     *              just DO NOT remove it and make sure it returns true/false.
     * @param  {DOM} sel
     * @param  {DOM} el
     * @param  {Object} e
     * @return {Boolean}
     */
    default: {
      // default rule, *LEAVE HERE IF YOU WANT THIS LIBRARY TO WORK*
      rule: function(sel, el, e) {
        var self = this;
        // Check failed array
        if(this.failed.length > 0 || this.groups_failed.length > 0) {
          return false;
        } else {
          return true;
        }
      }
    },
    /**
     * FORM 3 RULE
     * @type {Object}
     */
    form_3: {
      exempt: ['.exempt', '#exempt']
    },
    /**
     * FORM 4 RULE
     * @type {Object}
     */
    form_4: {
      groups: [
        {name: 'radios', container: false, required: 'input[name="group1"]', number_required: 1},
        {name: 'checkboxes', container: '#checkboxes', required: 'input[type="checkbox"]', number_required: 1}
      ]
    },
    /**
     * FORM 5 RULE
     * @type {Object}
     */
    form_5: {
      scenarios: [{name: 'password', options: {ui: '#pw1'}}]
    },
    /**
     * FORM 6 RULE
     * @type {Object}
     */
    form_6: {
      scenarios: [{name: 'password', options: {ui: '#pw2', acceptance: 'medium'}}]
    },
    /**
     * FORM 7 RULE
     * @type {Object}
     */
    form_7: {
      scenarios: [{name: 'comparator', options: {master: ['#master'], slaves: ['.slave'], fields: ['input[type="email"]'], ui:{element:'#message'}}}]
    }
  };

  // Return the rules object
  return Rules;
 });
