// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    .state('app.search', {
      url: "/search",
      views: {
        'menuContent' :{
          templateUrl: "templates/search.html"
        }
      }
    })
    .state('app.welcome', {
      url: "/welcome",
      views: {
          'menuContent' :{
              templateUrl: "templates/welcome.html",
              controller: "WelcomeController"
          }
      }
    })
    .state('app.welcomestatus', {
      url: "/welcome/:status",
      views: {
          'menuContent' :{
              templateUrl: "templates/welcome.html",
              controller: "WelcomeController"
          }
      }
    })
    .state('app.boardgenerate', {
      url: "/generate/:boardName",
      views: {
        'menuContent' :{
          templateUrl: "templates/board-generate.html",
          controller: 'BoardGenerateController'
        }
      }
    })
    .state('app.myideas', {
      url: "/my-ideas/:boardName",
      views: {
          'menuContent' :{
              templateUrl: "templates/my-ideas.html",
              controller: 'MyIdeasController'
          }
      }
    })
    .state('app.sessionoverview', {
      url: "/session-overview/:boardName",
      views: {
          'menuContent' :{
              templateUrl: "templates/session-overview.html",
              controller: 'SessionOverviewController'
          }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/welcome');
});

