'use strict';

/*******************************************************************************************************
 * ANGULAR VALIDATION SCENARIOS
 *******************************************************************************************************
 *
 * @description Scenario loader
 * @author Ken Stowell
 */
 angular.module('ng-validation').factory('ngValidationScenarios', ['ngValidationScenariosPasswordStrength', 'ngValidationScenariosComparator', function(Password, Comparator) {

  /*******************************************************************************************************
   * Scenarios
   *******************************************************************************************************
   * @description Constructor for loading individual scenarios
   */
   var Scenarios = function(scenario, form, opts, root) {
    // Mapping object
    var scenarios = {
      password: Password, // Password Strength
      comparator: Comparator // Field comparison
    };

    // Load if available.
    if(scenarios.hasOwnProperty(scenario)) {
      new scenarios[scenario](form, opts, root);
    }
   };

   return Scenarios;
 }]);
