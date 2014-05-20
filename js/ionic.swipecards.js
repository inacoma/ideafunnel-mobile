(function(ionic) {

  var SWIPE_TYPE_UP = "up";
  var SWIPE_TYPE_LEFT_RIGHT = "left-right";
  var SWIPE_TYPE_DOWN = "down";

  var VALID_SWIPE_TYPES = [SWIPE_TYPE_DOWN, SWIPE_TYPE_UP, SWIPE_TYPE_LEFT_RIGHT];

  // Get transform origin poly
  var d = document.createElement('div');
  var transformKeys = ['webkitTransformOrigin', 'transform-origin', '-webkit-transform-origin', 'webkit-transform-origin',
              '-moz-transform-origin', 'moz-transform-origin', 'MozTransformOrigin', 'mozTransformOrigin'];

  var TRANSFORM_ORIGIN = 'webkitTransformOrigin';
  for(var i = 0; i < transformKeys.length; i++) {
    if(d.style[transformKeys[i]] !== undefined) {
      TRANSFORM_ORIGIN = transformKeys[i];
      break;
    }
  }

  var transitionKeys = ['webkitTransition', 'transition', '-webkit-transition', 'webkit-transition',
              '-moz-transition', 'moz-transition', 'MozTransition', 'mozTransition'];
  var TRANSITION = 'webkitTransition';
  for(var i = 0; i < transitionKeys.length; i++) {
    if(d.style[transitionKeys[i]] !== undefined) {
      TRANSITION = transitionKeys[i];
      break;
    }
  }

  var SwipeableCardController = ionic.controllers.ViewController.inherit({
    initialize: function(opts) {
      this.cards = [];
      var ratio = window.innerWidth / window.innerHeight;
      this.maxWidth = window.innerWidth - (opts.cardGutterWidth || 0);
      this.maxHeight = opts.height || 300;
      this.cardGutterWidth = opts.cardGutterWidth || 10;
      this.cardPopInDuration = opts.cardPopInDuration || 400;
      this.cardAnimation = opts.cardAnimation || 'pop-in';
      this.swipeType = opts.swipeType || 'left-right';

    },
    setSwipeType: function(swipeType) {
        this.swipeType = swipeType;
    },
    /**
     * Push a new card onto the stack.
     */
    pushCard: function(card) {
      var self = this;

      this.cards.push(card);
      this.beforeCardShow(card);

      card.transitionIn(this.cardAnimation);
      setTimeout(function() {
        card.disableTransition(self.cardAnimation);
      }, this.cardPopInDuration + 100);
    },
    /**
     * Set up a new card before it shows.
     */
    beforeCardShow: function() {
      var nextCard = this.cards[this.cards.length-1];
      if(!nextCard) return;

      // Calculate the top left of a default card, as a translated pos
      var topLeft = window.innerHeight / 2 - this.maxHeight/2;

      var cardOffset = Math.min(this.cards.length, 3) * 5;

      // Move each card 5 pixels down to give a nice stacking effect (max of 3 stacked)
      nextCard.setPopInDuration(this.cardPopInDuration);
      nextCard.setZIndex(this.cards.length);
    },
    /**
     * Pop a card from the stack
     */
    popCard: function(animate) {
      var card = this.cards.pop();
      if(animate) {
        card.swipe();
      }
      return card;
    }
  });

  var SwipeableCardView = ionic.views.View.inherit({
    /**
     * Initialize a card with the given options.
     */
    initialize: function(opts) {
      opts = ionic.extend({
      }, opts);

      ionic.extend(this, opts);

      this.el = opts.el;
      this.swipeType = opts.swipeType;

      this.startX = this.startY = this.x = this.y = 0;

      this.bindEvents();
    },

    /**
     * Set the X position of the card.
     */
    setX: function(x) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + x + 'px,' + this.y + 'px, 0)';
      this.x = x;
      this.startX = x;
    },

    /**
     * Set the Y position of the card.
     */
    setY: function(y) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + 'px,' + y + 'px, 0)';
      this.y = y;
      this.startY = y;
    },

    /**
     * Set the Z-Index of the card
     */
    setZIndex: function(index) {
      this.el.style.zIndex = index;
    },

    /**
     * Set the width of the card
     */
    setWidth: function(width) {
      this.el.style.width = width + 'px';
    },

    /**
     * Set the height of the card
     */
    setHeight: function(height) {
      this.el.style.height = height + 'px';
    },

    /**
     * Set the duration to run the pop-in animation
     */
    setPopInDuration: function(duration) {
      this.cardPopInDuration = duration;
    },

    /**
     * Transition in the card with the given animation class
     */
    transitionIn: function(animationClass) {
      var self = this;

      this.el.classList.add(animationClass + '-start');
      this.el.classList.add(animationClass);
      this.el.style.display = 'block';
      setTimeout(function() {
        self.el.classList.remove(animationClass + '-start');
      }, 100);
    },

    /**
     * Disable transitions on the card (for when dragging)
     */
    disableTransition: function(animationClass) {
      this.el.classList.remove(animationClass);
    },

    /**
     * Swipe a card out programtically
     */
    swipe: function() {
      this.transitionOut();
    },

    /**
     * Fly the card out or animate back into resting position.
     */
    transitionOut: function() {
      var self = this;


        if (this.swipeType == SWIPE_TYPE_LEFT_RIGHT) {
            var threshold = window.innerWidth / 5;

            if(Math.abs(this.x) < threshold) {
                this.el.style[ionic.CSS.TRANSFORM] = "translate3d(" + this.startX + "px, " + this.startY + "px, 0)";
                this.el.style[TRANSITION] = '-webkit-transform ' + 0.5 + 's cubic-bezier(0.175, 0.885, 0.32, 1.275)';

                setTimeout(function() {
                    self.el.style[TRANSITION] = 'none';
                }, 500);
            } else {
                // Fly out
                var xTo = window.innerWidth * 2;

                if (this.x < this.startX) {
                    xTo = - xTo;
                }

                var rotateTo = (this.rotationAngle + (this.rotationDirection * 0.8)) || (Math.random() * 0.4);
                var duration = this.rotationAngle ? 0.4 : 0.5;
                this.el.style[TRANSITION] = '-webkit-transform ' + duration + 's ease-in-out';
                this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + xTo + 'px, 0px, 0) rotate(' + rotateTo + 'rad)';

                if (xTo < 0) {
                    // This was a left swipe
                    this.onLeftSwipe && this.onLeftSwipe();

                } else {
                    // This was a right swipe
                    this.onRightSwipe && this.onRightSwipe();
                }



                // Trigger destroy after card has swiped out
                setTimeout(function() {
                    self.onDestroy && self.onDestroy();
                }, duration * 1000);
            }


        } else if (this.swipeType == SWIPE_TYPE_DOWN) {
            if(this.y < 0) {
                this.el.style[ionic.CSS.TRANSFORM] = "translate3d(" + this.startX + "px, " + this.startY + "px, 0)";
                this.el.style[TRANSITION] = '-webkit-transform ' + 0.5 + 's cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                setTimeout(function() {
                    self.el.style[TRANSITION] = 'none';
                }, 500);
            } else {
                // Fly out
                var rotateTo = (this.rotationAngle + (this.rotationDirection * 0.4)) || (Math.random() * 0.4);
                var duration = this.rotationAngle ? 0.4 : 0.5;
                this.el.style[TRANSITION] = '-webkit-transform ' + duration + 's ease-in-out';
                this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + ',' + (window.innerHeight * 1.5) + 'px, 0) rotate(' + rotateTo + 'rad)';
                this.onDownSwipe && this.onDownSwipe();

                // Trigger destroy after card has swiped out
                setTimeout(function() {
                    self.onDestroy && self.onDestroy();
                }, duration * 1000);
            }
        } else if (this.swipeType == SWIPE_TYPE_UP) {
            if(this.y > 0) {
                this.el.style[ionic.CSS.TRANSFORM] = "translate3d(" + this.startX + "px, " + this.startY + "px, 0)";
                this.el.style[TRANSITION] = '-webkit-transform ' + 0.5 + 's cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                setTimeout(function() {
                    self.el.style[TRANSITION] = 'none';
                }, 500);
            } else {
                // Fly out
                var rotateTo = (this.rotationAngle + (-this.rotationDirection * 0.4)) || (Math.random() * 0.4);
                var duration = this.rotationAngle ? 0.4 : 0.5;
                this.el.style[TRANSITION] = '-webkit-transform ' + duration + 's ease-in-out';
                this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + ',' + (window.innerHeight * -1.5) + 'px, 0) rotate(' + rotateTo + 'rad)';
                this.onDownSwipe && this.onDownSwipe();

                // Trigger destroy after card has swiped out
                setTimeout(function() {
                    self.onDestroy && self.onDestroy();
                }, duration * 1000);
            }
        }



    },

    /**
     * Bind drag events on the card.
     */
    bindEvents: function() {
      var self = this;
      ionic.onGesture('dragstart', function(e) {
        var cx = window.innerWidth / 2;
        var cy = window.innerHeight / 2;
        if(e.gesture.touches[0].pageX < cx) {
          self._transformOriginRight();
        } else {
          self._transformOriginLeft();
        }
        window.rAF(function() { self._doDragStart(e) });
      }, this.el);

      ionic.onGesture('drag', function(e) {
        window.rAF(function() { self._doDrag(e) });
      }, this.el);

      ionic.onGesture('dragend', function(e) {
        window.rAF(function() { self._doDragEnd(e) });
      }, this.el);
    },

    // Rotate anchored to the left of the screen
    _transformOriginLeft: function() {
      this.el.style[TRANSFORM_ORIGIN] = 'left center';
      this.rotationDirection = 1;
    },

    _transformOriginRight: function() {
      this.el.style[TRANSFORM_ORIGIN] = 'right center';
      this.rotationDirection = -1;
    },

    _doDragStart: function(e) {
      var width = this.el.offsetWidth;
      var point = window.innerWidth / 2 + this.rotationDirection * (width / 2)
      var distance = Math.abs(point - e.gesture.touches[0].pageX);// - window.innerWidth/2);

      this.touchDistance = distance * 10;
    },

    _doDrag: function(e) {


      if (this.swipeType == "left-right") {
          var o = e.gesture.deltaY / 3;
          this.rotationAngle = Math.atan(o/this.touchDistance) * this.rotationDirection;



          this.x = this.startX + (e.gesture.deltaX * 0.6);

      } else if (this.swipeType == "down") {
          var o = e.gesture.deltaY / 3;
          this.rotationAngle = Math.atan(o/this.touchDistance) * this.rotationDirection;

          if(e.gesture.deltaY < 0) {
              this.rotationAngle = 0;
          }

          this.y = this.startY + (e.gesture.deltaY * 0.4);

      } else if (this.swipeType == "up") {
          var o = e.gesture.deltaY / 3;
          this.rotationAngle = Math.atan(o/this.touchDistance) * this.rotationDirection;


          this.y = this.startY + (e.gesture.deltaY * 0.4);
      }

      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + 'px, ' + this.y  + 'px, 0) rotate(' + (this.rotationAngle || 0) + 'rad)';



    },
    _doDragEnd: function(e) {
      this.transitionOut(e);
    }
  });


  angular.module('ionic.contrib.ui.cards', ['ionic'])

  .directive('swipeCard', ['$timeout', function($timeout) {
    return {
      restrict: 'E',
      template: '<div class="swipe-card" ng-transclude></div>',
      require: '^swipeCards',
      replace: true,
      transclude: true,
      scope: {
        onSwipe: '&',
        onDestroy: '&',
        onLeftSwipe: '&',
        onRightSwipe: '&',
        onUpSwipe: '&',
        onDownSwipe: '&'
      },
      compile: function(element, attr) {
        return function($scope, $element, $attr, swipeCards) {
          var el = $element[0];

          var swipeType = SWIPE_TYPE_DOWN;

          // What is the swipe type of the parent
          if (el.parentNode.attributes.swipeType) {
              var found = false;
              for (var i = 0; i < VALID_SWIPE_TYPES.length; i++) {

                  if (el.parentNode.attributes.swipeType.value == VALID_SWIPE_TYPES[i]) {
                      found = true;
                      break;
                  }

              }

              if (!found) {
                  console.error("Invalid swipe type", el.parentNode.attributes.swipeType.value);
              } else {
                  swipeType = el.parentNode.attributes.swipeType.value;
              }

          }

          // Instantiate our card view
          var swipeableCard = new SwipeableCardView({
            el: el,
            swipeType: swipeType,
            onSwipe: function() {
              $timeout(function() {
                $scope.onSwipe();
              });
            },
            onLeftSwipe: function() {
                if ($scope.onLeftSwipe) {
                    $timeout(function() {
                        $scope.onLeftSwipe();
                    });
                }
            },
            onRightSwipe: function() {
              if ($scope.onRightSwipe) {
                  $timeout(function() {
                      $scope.onRightSwipe();
                  });
              }
            },
            onUpSwipe: function() {
              if ($scope.onUpSwipe) {
                  $timeout(function() {
                      $scope.onUpSwipe();
                  });
              }
            },
            onDownSwipe: function() {
              if ($scope.onDownSwipe) {
                  $timeout(function() {
                      $scope.onDownSwipe();
                  });
              }
            },
            onDestroy: function() {
              $timeout(function() {
                $scope.onDestroy();
              });
            }
          });
          $scope.$parent.swipeCard = swipeableCard;
          swipeCards.pushCard(swipeableCard);

        }
      }
    }
  }])

  .directive('swipeCards', ['$rootScope', function($rootScope) {
    return {
      restrict: 'E',
      template: '<div class="swipe-cards" ng-transclude></div>',
      replace: true,
      transclude: true,
      scope: {
          swipeType: '@swipetype'
      },
      controller: function($scope, $element) {
        var swipeController = new SwipeableCardController({
        });


        $rootScope.$on('swipeCard.pop', function(isAnimated) {
          swipeController.popCard(isAnimated);
        });

        swipeController.setSwipeType($scope.swipeType);

        return swipeController;
      }
    }
  }])

  .factory('$ionicSwipeCardDelegate', ['$rootScope', function($rootScope) {
    return {
      popCard: function($scope, isAnimated) {
        $rootScope.$emit('swipeCard.pop', isAnimated);
      },
      getSwipebleCard: function($scope) {
        return $scope.$parent.swipeCard;
      }
    }
  }]);

})(window.ionic);
