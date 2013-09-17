'use strict';

angular.module('ngValidateApp', ['ng-validation'])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
      // $locationProvider.html5Mode(true).hashPrefix('!');
  });
