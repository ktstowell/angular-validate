angular.module('ngValidateApp').directive('version', function() {
  return {
    restrict: 'E',
    templateUrl: 'scripts/directives/templates/version.html',
    controller: function($scope, ngValidation) {
      $scope.version = ngValidation.version;
    }
  }
})