angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $rootScope, $ionicSideMenuDelegate) {
    $rootScope.URL_PREFIX = "http://ideafunnel.io/"
    $rootScope.forceLogin = false;

    $ionicSideMenuDelegate.canDragContent(false);


    $scope.forceLogin = function() {
        $rootScope.forceLogin = true;
    }
})

.controller('WelcomeController', function($scope, $rootScope, $stateParams, $state, $ionicLoading, $ionicPopup, $ionicModal, $http) {
    $scope.board = {boardName: ""};
    $scope.loadingQrScreen = false;
    $scope.loginModal = null;
    $scope.loginPage = 'start';
    $scope.newGuest = {name: ""};
    $scope.createGuestError = false;

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        if ($scope.loginModal) {
            $scope.loginModal.remove();
        }
    });

    if (window.localStorage['credentials'] && !$rootScope.forceLogin) {
        $rootScope.credentials = angular.fromJson(window.localStorage['credentials']);
    } else {
        $ionicModal.fromTemplateUrl('templates/login-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.loginModal = modal;
            $scope.loginModal.show();
        });
    }


    $scope.createGuest = function() {
        $ionicLoading.show({
            template: '<i class="ion-loading-c"></i> Creating your account'
        });

        $http.post($rootScope.URL_PREFIX + "api/sessions/create-guest", {name: $scope.newGuest.name})
            .success(function(data, status) {
                $scope.createGuestError = false;

                $rootScope.credentials = {
                    guest: {
                        id: data.data._id,
                        name: data.data.name
                    }
                }

                window.localStorage['credentials'] = angular.toJson($rootScope.credentials);

                $rootScope.forceLogin = false;
                $ionicLoading.hide();
                $scope.loginModal.hide();
            })
            .error(function(data, status) {
                $scope.createGuestError = true;
                $ionicLoading.hide();
            });



    }

    $scope.loadBoard = function(boardId) {
        $ionicLoading.show({
            template: '<i class="ion-loading-c"></i> Checking Board'
        });

        $scope.boardId = boardId;

        var viewData = {
            countUserIdeas: true
        };

        if ($rootScope.credentials.guest) {
            viewData.guestId = $rootScope.credentials.guest.id;
        }

        $http.post($rootScope.URL_PREFIX + "api/idea-boards/view/" + boardId, viewData)
            .success(function(data, status) {
                if (data.status == "ok") {

                    $rootScope.board = data.data;
                    $ionicLoading.hide();

                    window.location.href = '#/app/session-overview/' + $scope.boardId;
                } else {
                    $ionicLoading.hide();
                    $ionicLoading.show({
                        template: '<i class="ion-close-circled"></i> That board doesn\'t exist'
                    });

                    setTimeout(function() {
                        $ionicLoading.hide();
                    }, 1500);
                }

            })
            .error(function(data, status) {
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: '<i class="ion-close-circled"></i> Error accessing Idea Funnel'
                });

                setTimeout(function() {
                    $ionicLoading.hide();
                }, 1500);

            });



        if (false) {
            var alertPopup = $ionicPopup.alert({
                title: 'Invalid Session',
                template: 'The session code you entered was not recognised',
                okType: "button-energized button-no-border"
            });
        }

    }

    $scope.joinSession = function() {
        $scope.loadBoard($scope.board.boardName.toLowerCase());
    }

    $scope.scanForBarcode = function() {

        var SITE_PREFIX = "ideafunnel.io";

        $scope.loadingQrScreen = true;

        cordova.plugins.barcodeScanner.scan(
            function (result) {

                if (result.text.indexOf(SITE_PREFIX) >= 0) {
                    $scope.loadBoard(result.text.substr(SITE_PREFIX.length + 1));
                }

                $scope.loadingQrScreen = false;
                $scope.$apply();
            },
            function (error) {
                $scope.loadingQrScreen = false;
                $scope.$apply();
            }
        );
    }
})

.controller('BoardGenerateController', function($scope, $rootScope, $stateParams, $ionicGesture, $ionicBackdrop, $timeout, $http, $ionicLoading) {
    $scope.boardName = $stateParams.boardName;
    $scope.board = $rootScope.board;
    $scope.swipingCard = false;
    $scope.newCard = {content: ""};
    $scope.showDemo = false;

    var handMoveStopTop = 10;
    var swipeArea = angular.element(document.querySelector('#swipeArea'));

    $scope.sendIdeaToServer = function() {
        var formData = {
            description:  $scope.newCard.content
        }

        if ($rootScope.credentials.guest) {
            // We are sending as a guest
            formData.guestId = $rootScope.credentials.guest.id;
            formData.guestName = $rootScope.credentials.guest.name;
        }


        $http.post($rootScope.URL_PREFIX + "api/idea-boards/" + $scope.board._id + "/create", formData)
            .success(function(data, status) {
                if (data.status != "ok") {
                    $ionicLoading.hide();
                    $ionicLoading.show({
                        template: '<i class="ion-close-circled"></i> Error ' + data.error
                    });

                    setTimeout(function() {
                        $ionicLoading.hide();
                    }, 1500);
                } else {
                    // Do nothing
                    if ($scope.board.userIdeaCount) {
                        $scope.board.userIdeaCount ++;
                    } else {
                        $scope.board.userIdeaCount = 1;
                    }

                }


                console.log(data);
            })
            .error(function(data, status) {
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: '<i class="ion-close-circled"></i> There was an error sending your last idea'
                });

                setTimeout(function() {
                    $ionicLoading.hide();
                }, 1500);
            });
    }

    $scope.entryCardKeyPress = function(evt) {
        if (evt.keyCode == 13) {
            evt.stopPropagation();
            evt.preventDefault();
            $scope.startSendingCard();
        }

    }

    $scope.startSendingCard = function() {
        if (!$scope.swipingCard && $scope.newCard.content && $scope.newCard.content.trim() != "") {
            //document.getElementById("entryCard").blur();

            $scope.swipingCard = true;
            $scope.$apply();

            $scope.sendIdeaToServer();

            $timeout(function() {
                $scope.swipingCard = false;
                $scope.newCard.content = "";
                $scope.$apply();
                //document.getElementById("entryCard").focus();
            }, 600);
        }
    }

    $ionicGesture.on("swipeup", $scope.startSendingCard, swipeArea);

    $scope.$on('$destroy', function() {
        $ionicGesture.off("swipeup", $scope.startSendingCard, swipeArea);
    });

    // Do our initial hand demo
    $timeout(function() {
            $scope.showDemo = true;
            $scope.$apply();
        }, 100);

    $timeout(function() {
        document.getElementById('handDemo').className += ' hand-demo-move';
    }, 400);



    $timeout(function() {
        $scope.showDemo = false;
        $scope.$apply();
    }, 1800);



})

.controller('LikeController', function($scope, $rootScope, $stateParams, $ionicGesture, $ionicBackdrop, $timeout, $http, $ionicLoading) {
    $scope.boardName = $stateParams.boardName;
    $scope.board = $rootScope.board;

    $scope.loadUnliked = function() {
        $scope.unlikedIdeas = null;

        $ionicLoading.show({
            template: '<i class="ion-loading-c"></i> Loading latest ideas'
        });

        var formData = {};

        if ($rootScope.credentials.guest) {
            formData.guestId = $rootScope.credentials.guest.id;
        }

        $http.post($rootScope.URL_PREFIX + "api/idea-boards/" + $scope.board._id + "/unliked", formData)
            .success(function(data, status) {
                $ionicLoading.hide();


                if (data.status != "ok") {
                    $ionicLoading.show({
                        template: '<i class="ion-close-circled"></i> Error ' + data.error
                    });

                    setTimeout(function() {
                        $ionicLoading.hide();
                    }, 1500);
                } else {
                    $scope.unlikedIdeas = data.data;

                }

            })
            .error(function(data, status) {
                $ionicLoading.hide();

                $ionicLoading.show({
                    template: '<i class="ion-close-circled"></i> There was an error loading unliked ideas'
                });

                setTimeout(function() {
                    $ionicLoading.hide();
                }, 1500);
            });

    }

    if ($rootScope.credentials) {
        $scope.loadUnliked();
    }

    // Gesture stuff
    var swipeArea = angular.element(document.querySelector('#swipeArea'));

    $scope.swipingCardLeft = false;
    $scope.swipingCardRight = false;

    $scope.applySwipe = function(direction) {
        ///api/idea-boards/:boardId/:ideaId/7

        if ($scope.unlikedIdeas) {

            var formData = {};

            if ($rootScope.credentials.guest) {
                formData.guestId = $rootScope.credentials.guest.id;
            }

            $http.post($rootScope.URL_PREFIX + "api/idea-boards/" + $scope.board._id + "/" + $scope.unlikedIdeas[0]._id + "/" + direction + "/", formData)
                .success(function(data, status) {
                    $ionicLoading.hide();

                    if (data.status != "ok") {
                        $ionicLoading.show({
                            template: '<i class="ion-close-circled"></i> Error saving your ' + direction
                        });

                        setTimeout(function() {
                            $ionicLoading.hide();
                        }, 1500);
                    }

                })
                .error(function(data, status) {
                    $ionicLoading.hide();

                    $ionicLoading.show({
                        template: '<i class="ion-close-circled"></i> Error saving your ' + direction
                    });

                    setTimeout(function() {
                        $ionicLoading.hide();
                    }, 1500);
                });

            $scope.unlikedIdeas.splice(0, 1);
        }
    }

    $scope.swipeLeft = function() {
        if (!$scope.swipingCardLeft) {
            $scope.swipingCardLeft = true;
            $scope.$apply();

            $timeout(function() {
                $scope.swipingCardLeft = false;
                $scope.applySwipe("dislike");
                $scope.$apply();
            }, 800);
        }
    }

    $scope.swipeRight = function() {
        if (!$scope.swipingCardRight) {
            $scope.swipingCardRight = true;
            $scope.$apply();


            $timeout(function() {
                $scope.swipingCardRight = false;
                $scope.applySwipe("like");
                $scope.$apply();
            }, 800);
        }
    }


    $ionicGesture.on("swipeleft", $scope.swipeLeft, swipeArea);
    $ionicGesture.on("swiperight", $scope.swipeRight, swipeArea);

    $scope.$on('$destroy', function() {
        $ionicGesture.off("swipeleft", $scope.swipeLeft, swipeArea);
        $ionicGesture.off("swiperight", $scope.swipeRight, swipeArea);
    });



})



.controller('SessionOverviewController', function($scope, $rootScope, $stateParams, $ionicGesture, $ionicBackdrop, $timeout, $http, $ionicLoading) {
        $scope.boardName = $stateParams.boardName;
        $scope.board = $rootScope.board;

        $scope.goToGenerate = function() {
            window.location.href = '#/app/generate/' + $scope.board._id;
        }

        $scope.goToMyIdeas = function() {
            window.location.href = '#/app/my-ideas/' + $scope.board._id;
        }

        $scope.goToLike = function() {
            window.location.href = '#/app/like/' + $scope.board._id;
        }

})

.controller('MyIdeasController', function($scope, $rootScope, $stateParams, $ionicGesture, $ionicBackdrop, $timeout, $http, $ionicLoading) {
    $scope.boardName = $stateParams.boardName;
    $scope.board = $rootScope.board;

    var formData = {};

    if ($rootScope.credentials.guest) {
        formData.guestId = $rootScope.credentials.guest.id;
    }

    $scope.myIdeas = null;

    $scope.loadMyIdeas = function() {
        $ionicLoading.show({
            template: '<i class="ion-loading-c"></i> Loading your ideas'
        });

        $http.post($rootScope.URL_PREFIX + "api/idea-boards/view/" + $scope.board._id + "/user-ideas", formData)
            .success(function(data, status) {
                $ionicLoading.hide();


                if (data.status != "ok") {
                    $ionicLoading.show({
                        template: '<i class="ion-close-circled"></i> Error ' + data.error
                    });

                    setTimeout(function() {
                        $ionicLoading.hide();
                    }, 1500);
                } else {
                    $scope.myIdeas = data.data;


                }

            })
            .error(function(data, status) {
                $ionicLoading.hide();

                $ionicLoading.show({
                    template: '<i class="ion-close-circled"></i> There was an error sending your last idea'
                });

                setTimeout(function() {
                    $ionicLoading.hide();
                }, 1500);
            });

    }

    $scope.loadMyIdeas();

})
