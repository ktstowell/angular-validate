'use strict';

angular.module('ngValidateApp')
  .directive('clearfix', function () {
    return {
      template: '<div class="clearfix"></div>',
      restrict: 'E',
      replace: true
    };
  });
