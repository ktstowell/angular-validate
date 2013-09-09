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
    }
  };

  // Return the rules object
  return Rules;
 });
