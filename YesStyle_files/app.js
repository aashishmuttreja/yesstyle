/*
 * Copyright (C) 2016 YesAsia.com (Hong Kong) Limited
 * 
 * For production, assume no ng-controller
 */
define(['angularjs',
        'common',
        'plugin_lib'],
    function(angular, common, $log) {
		var app = angular.module('app', 
				['common',
				 'ngAnimate', 
				 'ngAria', 
				 'ngMaterial', 
				 'ui.bootstrap',
				 'vAccordion',
				 'img-lazy-load',
				 'ngClickCopy',
				 'countdownTimer',
				 'rzModule', 
				 'angularGrid',
				 'ngCookies',
				 'ngMessages',
				 'ngSanitize',
				 'youtube-embed']);

		// anchorScroll Header Top Offset
		app.run(["$anchorScroll", function($anchorScroll) {
		  $anchorScroll.yOffset = document.querySelector("header").offsetHeight;
		}]);

		// config mdTheming
		app.config(function($mdThemingProvider) {
			$mdThemingProvider.theme("default").primaryPalette("green",{"default":"500"}).accentPalette("grey");
			$mdThemingProvider.theme("ys");
		});
		
		// config mdDialog
		// TODO consider to move the html out of the template
		app.config(function($mdDialogProvider) {
			
			$mdDialogProvider.addPreset("showDialog", {
			  options: function() {
			    return {
			      template:
			    	'<md-dialog aria-label="{{title}}">' +
				      '<md-toolbar>' +
				        '<div class="md-toolbar-tools">' +
				          '<h2>{{title}}</h2>' +
				          '<span flex></span>' +
				          '<md-button class="md-icon-button closeButton" ng-click="cancel()" aria-label="Close Dialog">&times;</md-button>' +
				        '</div>' +
				      '</md-toolbar>' +
				      '<md-dialog-content>' +
				        '<div class="md-dialog-content" ng-bind-html="content"></div>' +
				      '</md-dialog-content>' +
				      '<md-dialog-actions layout="row">' +
				        '<md-button ng-if="showAction" class="md-raised md-primary" ng-click="hide()">Shop Now!</md-button>' +
				        '<md-button ng-if="showClose" ng-click="cancel()">Close</md-button>' +
				      '</md-dialog-actions>' +
				    '</md-dialog>',
			      controller: function($scope, $rootScope, $mdDialog, locals) {					  
			    	  $scope.title = locals.title;
			    	  
			    	  $scope.content = locals.content;
			    	  //console.log(locals.showAction);
			    	  $scope.showAction = locals.showAction;
			    	  
			    	  $scope.showClose = locals.showClose;
			    	  
					  $scope.hide = function() {
						  $mdDialog.hide();
					  };
					  $scope.cancel = function() {
						  $mdDialog.cancel();
					  };
				  },
			      bindToController: true,
			      clickOutsideToClose: true,
			      escapeToClose: true,
			      fullscreen: true
			    };
			  }
			});
		});

		app.directive("ysFooter", function($location, $http, $templateCache, $anchorScroll, $timeout, $window, $mdDialog, $mdToast, $mdMedia) {
            return {
                restrict: "AE",
                controller: function($scope, $attrs, CommonService, angularGridInstance, SavedItemService, BasketItemService, EmarsysService, ReviewService){
                    $scope.yscmda = ysApp.yscmda;

                    $scope.manageCookieForm = {};
                    $scope.manageCookieForm.strictly = true;
                    $scope.manageCookieForm.advertising = !($scope.yscmda == "true");

                    $scope.hideCookiePolicy = false;

                    $scope.closeCookiePolicy = function() {
                        $scope.hideCookiePolicy = true;
                    };

                    $scope.onManageCookie = function() {
                        $scope.closeCookiePolicy();
                        $scope.showManageCookieDialog();
                    }

                    $scope.showManageCookieDialog = function() {
                        $mdDialog.show({
                              targetEvent: null,
                              fullscreen: true,
                              controller: DialogController,
                              scope: $scope.$new(),
                              preserveScope: true,
                              template: $templateCache.get('/panel/CookiesManage.html'),
                              parent: angular.element(document.body),
                              clickOutsideToClose: true
                        });

                        function DialogController($scope, $mdDialog) {

                          $scope.hide = function() {
                            $mdDialog.hide();
                          };
                          $scope.cancel = function() {
                            $mdDialog.cancel();
                          };
                        }
                    }

                    $scope.saveSettings = function(targetUrl) {
                        $http({
                            method: 'POST',
                            url: targetUrl,
                            data: $scope.manageCookieForm
                        }).then(function successCallback(response) {
                            var result = response.data;
                            CommonService.updateCookie(result.cookies);
                            if (result.misc && result.misc.isSuccess) {
                                CommonService.updateCookie(result.cookies);
                                $mdDialog.hide();
                            }
                        });
                    }
                }
            };
        });

        app.directive("ysHalloween", function($location, $http, $templateCache, $anchorScroll, $timeout, $window, $mdDialog, $mdToast, $mdMedia) {
            return {
                restrict: "AE",
                controller: function($scope, $attrs, CommonService, angularGridInstance, SavedItemService, BasketItemService, EmarsysService, ReviewService){
                    $scope.startAnimation = false;
                    $scope.endAnimation = true;
                    angular.element(document).ready(function(){
                        $timeout(function() {
                            $scope.startAnimation = true;
                        }, 0).then(function() {
                            $timeout(function() {
                                $scope.endAnimation = false;
                            }, 4000);
                        });
                    });
                }
            };
        });

		app.directive("ysScroll", function($window, $rootScope) {
		    return {
				restrict: "A",
		    	link: function($scope, element, attrs) {
					$scope.lastScrollTop = 0;
					$rootScope.anchorClick = 0;
			        angular.element($window).bind("scroll", function() {
						$scope.st = this.pageYOffset;
						var bd=angular.element(document).find("md-backdrop").length;
						var sm=document.getElementsByClassName("md-scroll-mask").length;
						if ($scope.st < $scope.lastScrollTop && $scope.st > 0 && !$rootScope.anchorClick){
							$scope.applyFixClass = true;
						}else if(!bd && !sm && !$scope.lastScrollMask){
							$scope.applyFixClass = false;
						}
						$scope.lastScrollTop = $scope.st;
						$scope.lastScrollMask = sm;
			            $scope.$apply();
			        });
		    	}
		    };
		});

		app.directive("firebaseCloudMessaging", function($window, $rootScope) {
            return {
                restrict: "A",
                controller: function($scope, $attrs, $http, $cookies, $cookieStore, CommonService, LoadingService) {
                    if ("Notification" in window && firebase.messaging.isSupported()) {
                        // Retrieve Firebase Messaging object.
                        const messaging = firebase.messaging();
                        var subscriptionEcommerceData = ysApp.config.gewns;
                        if (!subscriptionEcommerceData) {
                        subscriptionEcommerceData = {};
                        }

                        // Add the public key generated from the console here.
                      messaging.usePublicVapidKey("BD3XeHoGXW7OCpOtqWEfJzVfFwxvBrOBCLaQzAuwBoT5kwM1XnAxy0zMb0Nd1HQg0lR5HBzil3yxDGYRIvXuAeU");

                        // cookie for skip request notification permission
                        var skipDialogCookieName = 'srnp';
                        var oldPermission = Notification.permission;
                        if (oldPermission === 'granted' || (oldPermission === 'default' && !$cookies.getObject(skipDialogCookieName))) {
                          messaging.requestPermission().then(function() {
                            var newPermission = Notification.permission;
                            if (newPermission === 'granted') {
                                if (oldPermission === 'default') {
                                    // log click allow event
                                    subscriptionEcommerceData['notification_subscription_action'] = 'allow';
                                    CommonService.pushDataLayer(subscriptionEcommerceData);
                                }

                                $cookies.remove(skipDialogCookieName);
                                // Get Instance ID token. Initially this makes a network call, once retrieved
                                // subsequent calls to getToken will return from cache.
                                messaging.getToken().then(function(currentToken) {
                                  if (currentToken) {
                                      LoadingService.setBlockAjaxLoading(true);
                                        $http({
                                            method: 'POST',
                                            url: $attrs.subscribeNotificationUrl,
                                            data: {
                                              fcmToken : currentToken
                                            }
                                        }).then(function successCallback(response) {
                                            LoadingService.setBlockAjaxLoading(false);
                                            var result = response.data;

                                            if (result.misc && result.misc.isSuccess) {
                                                const notificationOptions = {
                                                    body: 'Thanks for subscribing to push notifications',
                                                    icon: 'https://ddvql06zg3s2o.cloudfront.net/Assets/res/imgs/ys_logo.png',
                                                };
                                                var notification = new Notification('Welcome to YesStyle.com', notificationOptions);
                                                notification.onclick = function(event) {
                                                    event.preventDefault(); // prevent the browser from focusing the Notification's tab
                                                    window.open('https://www.yesstyle.com/en/women.html' , '_blank');
                                                    notification.close();
                                                }
                                            }
                                        });
                                  }
                                }).catch(function(error) {
                                    console.log(error);
                                });
                            } else if (newPermission === 'default') {
                                var expireDate = new Date();
                                expireDate.setDate(expireDate.getDate() + 30);
                                $cookies.put(skipDialogCookieName, true, {'expires': expireDate});
                            }
                          }).catch(function(error) {
                              var newPermission = Notification.permission;
                              if (newPermission === 'default') {
                                  // log click close event
                                  subscriptionEcommerceData['notification_subscription_action'] = 'close';
                                  CommonService.pushDataLayer(subscriptionEcommerceData);

                                  var expireDate = new Date();
                                  expireDate.setDate(expireDate.getDate() + 30);
                                  $cookies.put(skipDialogCookieName, true, {'expires': expireDate});
                              } else if (newPermission === 'denied') {
                                  // log click block event
                                  subscriptionEcommerceData['notification_subscription_action'] = 'block';
                                  CommonService.pushDataLayer(subscriptionEcommerceData);
                              }
                          });
                        }

                        messaging.onMessage(function(payload) {
                            if (("Notification" in window) && Notification.permission === "granted") {
                                // If it's okay let's create a notification
                                var notificationTitle = payload.notification.title;
                                var notificationOptions = {
                                  body: payload.notification.body,
                                  icon: payload.notification.icon,
                                  image: payload.notification.image,
                                  requireInteraction: payload.notification.requireInteraction,
                                };
                                var notification = new Notification(notificationTitle,notificationOptions);
                                notification.onclick = function(event) {
                                    event.preventDefault(); // prevent the browser from focusing the Notification's tab
                                    window.open(payload.notification.click_action, '_blank');
                                    notification.close();
                                }
                            }
                        });
                    }
                }
            };
        });

		// Affix Element
		app.directive("ysAffix", function ($window, $mdMedia,$timeout){
			return {
				restrict: "A",
				link: function($scope, element, attrs){
					var lastScrollTop = 0;
					var win=angular.element($window);
					var affixOffset=parseInt(attrs.ysAffixOffset) || 0;
					var affixBottom=attrs.ysAffixBottom || "footer";
					var fixCondition=attrs.ysAffix;
					var scrollheight=document.body.scrollHeight;
					var eleY, eleYfix, eleYo;
					function affixElement() {
						if (window.getComputedStyle(document.querySelector("body"), null).getPropertyValue("position")!="fixed"){							
							var diff = (scrollheight!=document.body.scrollHeight) ? document.body.scrollHeight-scrollheight : 0;
							var h=document.querySelector("header");
							var f=document.querySelector(affixBottom);
							var shipdest=(document.querySelector("shipdest"))? document.querySelector("shipdest").offsetHeight : 0; 
							var ele = element[0];
							var hiddenElements = angular.element(document.querySelectorAll(".breadcrumbs, .pageHeading, aside"));
							eleY = eleY || getCoords(ele).top;
							eleYo = (eleY!=eleYo && !hiddenElements.hasClass("hidden")) ? eleY : eleYo;
							eleY = (eleY && hiddenElements.hasClass("hidden")) ? eleY : eleYo;
							var style = f.currentStyle || window.getComputedStyle(f);						
							if (this.pageYOffset > eleY - (h.offsetHeight+shipdest) - affixOffset && document.body.scrollHeight - (eleY-diff) > (h.offsetHeight+shipdest) + ele.offsetHeight + (document.body.scrollHeight-f.offsetTop)+ (parseInt(style.marginTop) || 0)){															
								// console.log("if body scroll height long enough and no fixed body");
								var affixStyle={"top":(h.offsetHeight+shipdest)+affixOffset+"px","bottom":"auto","position":"fixed","width":ele.offsetWidth+"px"};							
								eleYfix=getCoords(ele).top;
								if (this.pageYOffset > f.offsetTop - ele.offsetHeight - (h.offsetHeight+shipdest) - affixOffset && window.pageYOffset+window.innerHeight >= getCoords(f).top){
									// console.log("if object over the footer");
									angular.element(element).css({"position":"fixed","width":ele.offsetWidth+"px","top":"auto","bottom":(document.body.scrollHeight-f.offsetTop) - (document.body.scrollHeight - this.pageYOffset - window.innerHeight)+affixOffset +"px"}).removeClass("affix");
								}else if (window.innerHeight-(h.offsetHeight+shipdest) >= ele.offsetHeight){
									// console.log("if view area longer than object");
									angular.element(element).css(affixStyle).addClass("affix");
								}else{
									// console.log("if view area shorter than object");
									if (this.pageYOffset > lastScrollTop){
										// console.log("scroll down");
										if (this.pageYOffset - eleYfix > ele.offsetHeight - window.innerHeight){
											// console.log("fix to footer");
											angular.element(element).css({"position":"fixed","width":ele.offsetWidth+"px","top":"auto","bottom":affixOffset+"px"}).addClass("affix scrolldown").removeClass("scrollup");
										}else  if (!angular.element(element).hasClass("scrolldown") || !angular.element(element).hasClass("affix")) {										
											// console.log("follow scroll down");
											angular.element(element).css({"position":"absolute","width":ele.offsetWidth+"px","top":eleYfix+"px","bottom":"auto"}).removeClass("affix scrollup");
										}
										lastScrollTop = this.pageYOffset;
									}else{
										// console.log("scroll up");
										if (eleYfix - (h.offsetHeight+shipdest) > this.pageYOffset){
											 // console.log("fix to header");
											angular.element(element).css(affixStyle).addClass("affix scrollup").removeClass("scrolldown");
										}else  if (!angular.element(element).hasClass("scrollup") || !angular.element(element).hasClass("affix")){
											// console.log("follow scroll up");
											angular.element(element).css({"position":"absolute","width":ele.offsetWidth+"px","top":eleYfix+"px","bottom":"auto"}).removeClass("affix scrolldown");
										}
										lastScrollTop = this.pageYOffset;
									}
								}
							}else{
								// return to normal							
								angular.element(element).removeAttr("style").removeClass("affix");
								eleY=null;
							}						
							scrollheight=document.body.scrollHeight;
						}
					}
					// Cross Browser Version - Get Coordination
					function getCoords(elem) {
					    var box = elem.getBoundingClientRect();

					    var body = document.body;
					    var docEl = document.documentElement;

					    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
					    var clientTop = docEl.clientTop || body.clientTop || 0;
					    var top  = box.top +  scrollTop - clientTop;

					    return {top: Math.round(top)};
					}
					$scope.$watch(function() {
				      return ($mdMedia(fixCondition));
				    }, function(boolean) {
				    	if (boolean){
				    		win.bind("scroll", affixElement);
				    	}else{
				    		angular.element(element).removeAttr("style").removeClass("affix");
				    		win.unbind("scroll", affixElement);
				    	};
				    });						
				}
			}							
		});

		// Dynamic Image Source
		app.directive("ysImageSource", function($window, $mdMedia){
			return{
				restrict: "A",
				scope: {
					ysSrcXs:'@',
					ysSrcGtXs:'@',
					ysSrcSm:'@',
					ysSrcGtSm:'@',
					ysSrcMd:'@'
				},
				link: function($scope, elem, attrs) {
					var size = ["xs","sm","md","gt-md"];
					var source = ["ysSrcXs","ysSrcGtXs","ysSrcSm","ysSrcGtSm","ysSrcMd"];
					var cases = {
							"xs" : function(){changeSrc(["ysSrcXs"])},
							"sm" : function(){changeSrc(["ysSrcSm","ysSrcGtXs"])},
							"md" : function(){changeSrc(["ysSrcMd","ysSrcGtSm","ysSrcGtXs"])},
							"gt-md" : function(){changeSrc(["ysSrcMd","ysSrcGtSm","ysSrcGtXs"])}
						}					
					$scope.$watch(function(){
						for (i in size){
							if ($mdMedia(size[i])){
								return size[i];
							};
						}
					},function(newValue, oldValue){
						if (newValue!==oldValue){
							determineSrc(newValue);
						}
					});					
					
					function determineSrc(v){
						if (v && cases[v]){	
							cases[v]();
						}else{
							for (i in size){
								if ($mdMedia(size[i])){
									cases[size[i]]();
								};
							}							
						}
					}
					
					function changeSrc(arr){
						for (i in arr){
							if ($scope[arr[i]]!=""){
								elem.attr("src",$scope[arr[i]]);
							}
						}
					}
					
					determineSrc();
				}
			}
		});
		
		app.animation(".slideDown", function($animateCss) {
		  return {
		    enter: function(element) {
		      var height = element[0].offsetHeight;
		      return $animateCss(element, {
		        from: { height:"0px", overflow:"hidden" },
		        to: { height:height + "px" },
		        duration: 0.3,
		        cleanupStyles: true
		      });
		    },
		    leave: function(element){
		      var height = element[0].offsetHeight;
		      return $animateCss(element, {
		        from: { height:height + "px", overflow:"hidden" },
		        to: { height:"0px" },
		        duration: 0.3,
		        cleanupStyles: true
		      });
		    }
		  }
		});		
		
		// rotate the topbar every 5 seconds (responsive)
		app.directive("ysTopbar", function($window, $mdMedia){
			return {
				restrict: "A",
				link: function($scope, element, attrs){
					$scope.$watch(function() {
				      return $mdMedia("gt-sm");
				    }, function(screen) {
				      $scope.myInterval= (screen) ? 0:5000;	
				    });			

				}
			}
		});
		
		// put the menu at the top left (responsive)
		app.directive("ysBody", function($window, $mdMedia, $mdSidenav) {
			return {
				restrict: "A",
				link: function($rootScope, $scope, element, attrs){
					// site alert message
					$rootScope.siteAlert = !navigator.cookieEnabled;
					
					angular.element($window).bind("resize", function(){
						$rootScope.$watch(function() {
					      return ($mdMedia("gt-sm") && $rootScope.isSideNav);					      
					    }, function(screen) {
					      if (screen){
					    	  $mdSidenav("left").toggle();
					      }					      
					    });			
					});
				}
			}
		});
		
		// navigation menu
		app.directive("ysNavigationMenu", function($window, $mdMedia, $mdSidenav, $timeout) {
			return {
				restrict: "A",
				controller: function($rootScope, $scope, CommonService) {
					$scope.isSideNav = false;
					$scope.subcat = {name:false};
					
					$scope.toggleLeft = function(){
						$mdSidenav("left").toggle();
					}										
					
					$scope.click2Go = function(e){
						var el=angular.element(e.currentTarget);
						e.currentTarget.href= (el.parent().hasClass("md-active") && !$rootScope.isSideNav) ? el.attr("data-href"):"javascript:void(0)";
					}
					
					$scope.isNotMobile = CommonService.isNotMobile();
					
					$scope.pc2Go = function(e){
						var el=angular.element(e.currentTarget);
						e.currentTarget.href= ($scope.isNotMobile && !$rootScope.isSideNav) ? el.attr("data-href"):"javascript:void(0)";
					}

					$scope.$watch("isSideNav", function(){
						$rootScope.isSideNav = $scope.isSideNav;
					});
					
//					$scope.$watch('searchbar', function(updated,old){
//						$timeout(function() {
//							var s=angular.element(document).find("md-autocomplete").find("input")[0];
//							if (updated){			
//								s.focus();
//							}else{
//								s.blur();
//							}
//						},(updated)?300:10);
//						
//						$rootScope.searchbar = $scope.searchbar;
//					});
					
					var navtimer, subcattimer;
					$scope.mousetab = function(e, action){
						if ($scope.isNotMobile){
							if (action=="stay"){
								$timeout.cancel(navtimer);
							}else if (action=="in"){
								$timeout.cancel(navtimer);
								var me=angular.element(e.currentTarget).parent();
								$timeout(function(){					
									me.triggerHandler("click");
									$scope.subcat.name=false;
								},10);
							}else{
								var mo=angular.element(document).find("header").find("md-tabs").attr("md-selected");			
								navtimer = $timeout(function(){
									angular.element(document).find("header").find("md-tab-item").eq(mo).triggerHandler("click");
								},500);
							}
						}
					}
					
					$scope.subcatmouse = function(e, action){
						$timeout.cancel(subcattimer);
						if ($mdMedia("gt-sm")){		
							subcattimer = $timeout(function(){
								if (action=="out" || !action){
									$scope.subcat.name = false;
									angular.element(document).find("md-backdrop").remove();
								}else{
									$scope.subcat.name = e;
									$scope.subcat.subname = action;						
									if (!angular.element(document).find("md-backdrop").length && action){						
										angular.element(document).find("body").append("<md-backdrop class='md-opaque' onClick='action=\"\"'></md-backdrop>");
									}
								}
							}, 300);
						}
					}
					
					$scope.$watch(function() {
					  return angular.element(document.querySelector("html")).hasClass("translated-rtl");
					}, function(newValue){
					  var siden=angular.element(document.getElementsByTagName("header")).find("md-sidenav");
					  if (newValue==true){
					    angular.element(document.querySelector("html")).attr("dir","rtl");
					    siden.removeClass("md-sidenav-left").addClass("md-sidenav-right");
					  }else{
					    angular.element(document.querySelector("html")).attr("dir","ltr");
					    siden.removeClass("md-sidenav-right").addClass("md-sidenav-left");
					  }
					});
				},
				link: function($scope, element, attrs){
					// do nth
				}
			}
		});
		
		app.directive("ysSignoutDialog", function($window, $mdDialog, $timeout, $templateCache) {
			return {
				restrict: "A",
				controller: function($scope, $attrs, $element, $log) {
					if (ysApp.config.isSignout) {
					    $element.ready(function() {
						    $timeout(function() {
								$mdDialog.show({
									controller: DialogController,
									scope: $scope.$new(),
									template: $templateCache.get("signOutTemplate"),
									parent: angular.element(document.body),
									clickOutsideToClose: true
								});
								
								function DialogController($scope, $mdDialog) {
									  $scope.hide = function() {
									    $mdDialog.hide();
									  };
									  $scope.cancel = function() {
									    $mdDialog.cancel();
									  };
								}
								
						    });
					    });
					    
					    $scope.hide = function() {
					    	$mdDialog.hide();
						};
					}
				}
			}
		});

		app.directive("ysFriendsRewardsDialog", function($window, $mdDialog, $timeout, $templateCache) {
        	return {
        		restrict: "A",
        		controller: function($scope, $attrs, $element, $log) {
        			if (ysApp.config.showRewardCodeShareDialog) {
        				$element.ready(function() {
        					$timeout(function() {
        						$mdDialog.show({
        							controller: DialogController,
        							scope: $scope.$new(),
        							template: $templateCache.get("friendsRewardsTemplate"),
        							parent: angular.element(document.body),
        							clickOutsideToClose: true
        						});

        						function DialogController($scope, $mdDialog) {
        							  $scope.hide = function() {
        								$mdDialog.hide();
        							  };
        						      $scope.cancel = function() {
        							    $mdDialog.cancel();
        							  };
        						}

        					});
        				});

        				$scope.hide = function() {
        					$mdDialog.hide();
        				};
        			}
        		}
        	}
        });

		app.directive("ysTitleContentDialog", function($window, $mdDialog) {
			return {
				restrict: "A",
				controller: function($scope, $attrs, $element, $log) {
					$scope.showDialog = function(ev, fullscreen, showAction, showClose) {
						ev.stopPropagation();
						
		    			$mdDialog.show($mdDialog.showPresetDialog({
		    				locals: {
		    					title: angular.element($element[0].querySelector("[ys-dialog-title]")).text(),
		    					content: angular.element($element[0].querySelector("[ys-dialog-content]")).html(),
		    					showAction: showAction,
		    					showClose: showClose
		    				},
		    				fullscreen: fullscreen
		    			}));
					}
				}
			}
		});

		app.directive("ysInfluencerRecruitment", function($window, $mdDialog, $templateCache) {
			return {
				restrict: "A",
				controller: function($scope, $attrs, $element, $log, $timeout) {
                    $element.ready(function() {
                        $timeout(function() {
                            $mdDialog.show({
                                controller: DialogController,
                                scope: $scope.$new(),
                                template: $templateCache.get($attrs.ysInfluencerRecruitmentTemplateId),
                                parent: angular.element(document.body),
                                clickOutsideToClose: true
                            });

                            function DialogController($scope, $mdDialog) {
                                  $scope.hide = function() {
                                    $mdDialog.hide();
                                  };
                                  $scope.cancel = function() {
                                    $mdDialog.cancel();
                                  };
                            }

                        });
                    });
				}
			}
		});
		
		// Checkout Floating Button
		app.directive("checkoutFloatingButton", function() {
		    return {
				restrict: "A",
                controller: function($scope, $attrs, $element, $window) {
					angular.element(document).ready(function(){
						var viewportHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
						if (document.getElementsByClassName('checkoutSection').length){
                            var targetOffset = getCoords(document.getElementsByClassName('checkoutSection')[0]).top;
                            // If Checkout panel already shows with viewport
                               /* targetOffset < viewportHeight */
                            if (targetOffset < viewportHeight){
                                $element.parent().addClass("collapse");
                            } else {
                                $element.parent().removeClass("collapse");
                            }
						}

						var lastOffset = 0;
                        $window.addEventListener("scroll", function() {
                            if (document.getElementsByClassName('checkoutSection').length && document.getElementsByClassName('summarySection').length){
                                var viewportHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
                                var targetOffset = getCoords(document.getElementsByClassName('checkoutSection')[0]).top;
                                var wayPointBegin = targetOffset - viewportHeight;
                                var wayPointEnd = getCoords(document.getElementsByClassName('summarySection')[0]).top;
                                var currentOffset = $window.pageYOffset;

                                // Check if Checkout panel top position enter the vieiwport
                                   /* currentOffset < wayPointBegin */

                                // Check if Checkout panel bottom position enter the vieiwport
                                   /* currentOffset > wayPointEnd */

                                // Check Scroll Up Direction - Compare current and last offset
                                   /* currentOffset < lastOffset */
                                if (currentOffset < wayPointBegin || currentOffset > wayPointEnd && currentOffset < lastOffset) {
                                    $element.parent().removeClass("collapse");
                                } else {
                                    $element.parent().addClass("collapse");
                                }

                                // Reset current scroll position for Scroll Direction
                                lastOffset = currentOffset;
                            }
                        });

                        function getCoords(elem) {
                            var box = elem.getBoundingClientRect();
                            var body = document.body;
                            var docEl = document.documentElement;
                            var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
                            var clientTop = docEl.clientTop || body.clientTop || 0;
                            var top  = box.top +  scrollTop - clientTop;
                            return {top: Math.round(top)};
                        }
					});
                }
		    };
		});

		// Smooth Anchor Scroll
		app.directive('anchorSmoothScroll', function($location) {
		    'use strict';
		    return {
		        restrict: 'A',
		        replace: false,
		        scope: {
		            'anchorSmoothScroll': '@'
		        },
		        link: function($scope, $element, $attrs) {
		            initialize();
		            function initialize() {
		                createEventListeners();
		            }
		            // Event Listeners
		            function createEventListeners() {
		                $element.on('click', function() {
		                    $location.hash($scope.anchorSmoothScroll);
		                    scrollTo($scope.anchorSmoothScroll);
		                });
		            }

		            // Scroll To
		            function scrollTo(eID) {
		                var i;
		                var startY = currentYPosition();
		                var stopY = elmYPosition(eID);
		                var distance = stopY > startY ? stopY - startY : startY - stopY;
		                if (distance < 100) {
		                    scrollTo(0, stopY); return;
		                }
		                var speed = Math.round(distance / 100);
		                if (speed >= 20) speed = 20;
		                var step = Math.round(distance / 25);
		                var leapY = stopY > startY ? startY + step : startY - step;
		                var timer = 0;
		                if (stopY > startY) {
		                    for (i = startY; i < stopY; i += step) {
		                        setTimeout('window.scrollTo(0, '+leapY+')', timer * speed);
		                        leapY += step; if (leapY > stopY) leapY = stopY; timer++;
		                    } return;
		                }
		                for (i = startY; i > stopY; i -= step) {
		                    setTimeout('window.scrollTo(0, '+leapY+')', timer * speed);
		                    leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
		                }
		            }

		            // Current Y Position
		            function currentYPosition() {
		                // Firefox, Chrome, Opera, Safari
		                if (window.pageYOffset) {
		                    return window.pageYOffset;
		                }
		                // Internet Explorer 6 - standards mode
		                if (document.documentElement && document.documentElement.scrollTop) {
		                    return document.documentElement.scrollTop;
		                }
		                // Internet Explorer 6, 7 and 8
		                if (document.body.scrollTop) {
		                    return document.body.scrollTop;
		                }
		                return 0;
		            }

		            // Scroll To
		            function elmYPosition(eID) {
		                var elm = document.getElementById(eID);
		                var y = elm.offsetTop;
		                var node = elm;
		                while (node.offsetParent && node.offsetParent != document.body) {
		                    node = node.offsetParent;
		                    y += node.offsetTop;
		                } return y;
		            }
		        }
		    };
		});

		// Toggle Class : ys-toggle-class="ClassName"
		app.directive("ysToggleClass", function() {
		    return {
		        restrict: "A",
		        link: function(scope, element, attrs) {
		            element.bind("click", function() {
		                element.toggleClass(attrs.ysToggleClass);
		            });
		        }
		    };
		});
		
		// Back to Top
		app.directive("backTop", ["$templateCache", "CommonService", function($templateCache, CommonService) {
			return {
				restrict: "E",
				transclude: true,
				replace: true,
				template: $templateCache.get("backToTopTemplate"),
				scope: {speed: "@scrollSpeed"},
				controller: function($window, $scope, $element, CommonService) {
			      $scope.speed = parseInt($scope.speed, 10) || 300;
					  
				  var self = this;
				  $scope.currentYPosition = function() {
					if (self.pageYOffset)
					  return self.pageYOffset;
					if (document.documentElement && document.documentElement.scrollTop)
					  return document.documentElement.scrollTop;
					if (document.body.scrollTop)
					  return document.body.scrollTop;
					return 0;
				  };
				  
				  $scope.smoothScroll = function() {
					var startY = $scope.currentYPosition();
					var stopY = 0;
					var distance = stopY > startY ? stopY - startY : startY - stopY;
					if (distance < 100) {
					  scrollTo(0, stopY);
					  return;
					}
					var speed = Math.round($scope.speed / 100);
					var step = Math.round(distance / 25);
					var leapY = stopY > startY ? startY + step : startY - step;
					var timer = 0;
					if (stopY > startY) {
					  for (var i = startY; i < stopY; i += step) {
						setTimeout("window.scrollTo(0, " + leapY + ")", timer * speed);
						leapY += step;
						if (leapY > stopY) leapY = stopY;
						timer++;
					  }
					  return;
					}
					for (var j = startY; j > stopY; j -= step) {
					  setTimeout("window.scrollTo(0, " + leapY + ")", timer * speed);
					  leapY -= step;
					  if (leapY < stopY) leapY = stopY;
					  timer++;
					}
				  };
		
				  $window.addEventListener("scroll", function() {
					if ($window.pageYOffset > 1000) {
					  $element.addClass("fadeIn");
					} else {
					  $element.removeClass("fadeIn");
					}
				  });
				  
				  $scope.backToTop = function() {
					$scope.smoothScroll();
					$element.removeClass("fadeIn");					
				  }
				  
				  $scope.backToTopUrl = function() {
					if (CommonService.getBackToTopUrl()) {
						setTimeout(function(){$window.location.href = CommonService.getBackToTopUrl();},5);
					} else {
						$scope.backToTop();
					}
				  }
				}
			};
		}]);
		
		app.directive("ysShippingDestination", function() {
			return {
				restrict: "A",
				controller: function($scope, $attrs, $http, $cookies, CommonService) {
					$scope.hideShippingDestination = function() {
						
					  var url=$attrs.actionUrl;
					  $http({
						method: "POST",
						url: url
				      }).then(function successCallback(response) {				       	
			            var result = response.data;
			            if (result.cookies) {
			            	CommonService.updateCookie(result.cookies);
					       	$scope.hideShippingDesintation = true; 
			            }
			            
				      })
				    };
				}
			}
		});

		app.directive("ysLanguageAlert", function() {
            return {
                restrict: "A",
                controller: function($scope, $attrs, $http, $cookies, CommonService) {
                    $scope.isHideLanguageAlert = false;
                    $scope.hideLanguageAlert = function() {

                      var url=$attrs.actionUrl;
                      $http({
                        method: "POST",
                        url: url
                      }).then(function successCallback(response) {
                        var result = response.data;
                        if (result.cookies) {
                            CommonService.updateCookie(result.cookies);
                             $scope.isHideLanguageAlert = true;
                        }

                      })
                    };
                }
            }
        });

        app.directive("ysGermanLanguageAlert", function() {
            return {
                restrict: "A",
                controller: function($scope, $attrs, $http, $cookies, CommonService) {
                    $scope.isHideGermanLanguageAlert = false;
                    $scope.hideGermanLanguageAlert = function() {

                      var url=$attrs.actionUrl;
                      $http({
                        method: "POST",
                        url: url
                      }).then(function successCallback(response) {
                        var result = response.data;
                        if (result.cookies) {
                            CommonService.updateCookie(result.cookies);
                             $scope.isHideGermanLanguageAlert = true;
                        }

                      })
                    };
                }
            }
        });

        app.directive("ysSpanishLanguageAlert", function() {
            return {
                restrict: "A",
                controller: function($scope, $attrs, $http, $cookies, CommonService) {
                    $scope.isHideSpanishLanguageAlert = false;
                    $scope.hideSpanishLanguageAlert = function() {

                      var url=$attrs.actionUrl;
                      $http({
                        method: "POST",
                        url: url
                      }).then(function successCallback(response) {
                        var result = response.data;
                        if (result.cookies) {
                            CommonService.updateCookie(result.cookies);
                             $scope.isHideSpanishLanguageAlert = true;
                        }

                      })
                    };
                }
            }
        });

        app.directive("ysJapaneseLanguageAlert", function() {
            return {
                restrict: "A",
                controller: function($scope, $attrs, $http, $cookies, CommonService) {
                    $scope.isHideJapaneseLanguageAlert = false;
                    $scope.hideJapaneseLanguageAlert = function() {

                      var url=$attrs.actionUrl;
                      $http({
                        method: "POST",
                        url: url
                      }).then(function successCallback(response) {
                        var result = response.data;
                        if (result.cookies) {
                            CommonService.updateCookie(result.cookies);
                             $scope.isHideJapaneseLanguageAlert = true;
                        }

                      })
                    };
                }
            }
        });
		
		app.controller("ysShowRegionSetting", function($mdDialog, $scope) {
		      $scope.showPanelDialog = function(ev, content) {
			    $mdDialog.show({
			      targetEvent: ev,
			      fullscreen: false,
			      scope: $scope.$new(),
			      preserveScope: true,
			      contentElement: content,
			      parent: angular.element(document.body),
			      clickOutsideToClose: true
			    })
			    .then(function(anchor, $scope){
			    	if (anchor){
			    		$scope.anchorTo(anchor);
			    	}
			    });
			  };
		});

        // ref.: http://hk-system-s01/content_bugzilla/show_bug.cgi?id=60703
		app.directive("ysLanguageSelection", function() {
		    return {
				restrict: "A",
                controller: function($scope, $attrs, $element, $http, $cookies, $window, CommonService) {
                    $scope.redirectGoogleTranslate = function(langId) {
                      var url=$attrs.googleTranslateActionUrl;
                      var canonicalUrl = [ysApp.config.canonicalUrl];

                      var languageData = {
                        canonicalUrl: canonicalUrl[0],
                        googleTranslateLanguageId: langId
                      };

                      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

                      $http({
                        method: "POST",
                        url: url,
                        data: languageData
                      }).then(function successCallback(response) {
                        var result = response.data;

                        if (result.cookies) {
                            CommonService.updateCookie(result.cookies);
                        }

                        // redirect if needed
                        if (result.redirectUrl) {
                            CommonService.showLoadingPanel();
                            setTimeout(function(){$window.location.href = result.redirectUrl;},5);
                            return false;
                        }

                      })
                    };
                }
		    };
		});
		
		app.directive("ysRegionSetting", function() {
			return {
				restrict: "A",
				controller: function($mdDialog, $log, $window, $scope, $element, $attrs, $http, $cookies, $filter, CommonService) {
					// all variables
					$scope.init = function() {
						// get dropdown list option data
						$scope.countries = ysApp.config.regionSetting.countries;
						$scope.currencies = ysApp.config.regionSetting.currencies;

						// pre-select option
						$scope.form = ysApp.config.regionSetting.shopperSitePreference;
					}
					
					// input the term to filter the list of countries
					$scope.searchCountryTerm;
				    $scope.clearSearchCountryTerm = function() {
				    	$scope.searchCountryTerm = "";
				    };
				    // input the search term to trigger the filtering 
				    $element.find("input").on("keydown", function(ev) {
			          ev.stopPropagation();
		            });
				    
				    $scope.cancel = function() {
				    	$mdDialog.cancel();
				    };
					  
				    $scope.anchor = function(anchor){
				    	$mdDialog.hide(anchor);
				    };
					  
				    $scope.submitForm=function(){
				    	var canonicalUrl = [];
				    	canonicalUrl.push({
				    		canonicalUrl : ysApp.config.canonicalUrl
				    	});
				        var data=angular.merge($scope.form, canonicalUrl[0]);

				        $log.debug(data);

				        // disable submit event to prevent duplicated form submit
				        $scope.disableSubmit = true;
				        
				        // get the dynamic form submit url
				        var url=$attrs.actionUrl;
				        $http({
				        	method: "POST",
				        	url: url,
				        	data: data
			        	}).then(function successCallback(response) {
				            var result = response.data;

				            // add or update cookie(s) if needed
				            if (result.cookies) {
				            	CommonService.updateCookie(result.cookies);
				            }
					            
				            // redirect if needed
							if (result.redirectUrl) {
								CommonService.showLoadingPanel();
						    	setTimeout(function(){$window.location.href = result.redirectUrl;},5);
								return false;
							}
				            
				            $scope.disableSubmit = false;
		        	 	}, function errorCallback(response) {
		        	 		$scope.disableSubmit = false;
			        	 		
				        	$log.warn("ng form submit error hit!");
				        });   
				    }
					  
				    $scope.changeDefaultCurrencyLanguage=function() {
				    	if ($scope.regionForm.currencySelect.$pristine) {
				    		$scope.form.selectedCurrency = $filter("filter")($scope.countries, {id: $scope.form.selectedCountry}, true)[0].currencyCode;
				    	}
				    }
				}
			}
		});
		
		app.filter('ysCdnImageFilter', function() {
		    return function(val) {
		    	// TODO if the vlaue start with http, no need to append
//		    	console.log(val.indexOf('http://'));
//		    	if (val.indexOf('http://') == 0) {
//		    		return val;
//		    	}
		    	return ysApp.config.cdnBaseUrl + val;
		    };
		});
		
		app.directive("ysSavedItemButton", function($location, $http, $templateCache) {
			return {
				restrict: "AE",
				controller: function($scope, $attrs, SavedItemService){
					$scope.getSavedItemsCount = function() {
						if (SavedItemService.savedItemProductIds) {
			        		var result = SavedItemService.savedItemProductIds.length;
			        		if (result <= 0) {
			        			return 0;
			        		}
			        		if (result > 99) {
			        			return 99;
			        		} else {
			        			return result;
			        		}
						}
					}
				}
			};
		});
		
		app.directive("ysBasketItemButton", function($location, $http, $templateCache) {
			return {
				restrict: "AE",
				controller: function($scope, $attrs, BasketItemService){
					$scope.getBasketItemsCount = function() {
						if (BasketItemService.basketItemProductsCount) {
							var result = BasketItemService.basketItemProductsCount;
			        		if (result <= 0) {
			        			return 0;
			        		}
			        		if (result > 99) {
			        			return 99;
			        		} else {
			        			return result;
			        		}
						}
					}
				}
			};
		});
		
		app.controller('moreIdeaController', ['CommonService', 'LoadingService', 'ReviewService', '$scope', '$http', '$compile', '$templateCache', '$timeout', '$window', '$attrs', '$log', function(CommonService, LoadingService, ReviewService, $scope, $http, $compile, $templateCache, $timeout, $window, $attrs, $log) {
			$scope.coverSize = "m";
			$scope.showEmarsysRecommend = false;
			$scope.showRecentlyViewed = false;
			$scope.sliderProductIdsReady = false;
			$scope.emarsysRecommend = new Map();
			$scope.moreIdeaProducts = {};
			
			var isInit = true;
			var identifier = $attrs.id;

			var unregister = $scope.$watch(function(){
				return ysApp.emarsysRecommend;
			}, function(){
				$scope.emarsysRecommend = ysApp.emarsysRecommend;
				
				if ($scope.emarsysRecommend && $scope.emarsysRecommend[$attrs.logic]) {
					unregister();
					
					// Assume it MUST be FOUR by Stanley
					var productIds = [];
					
					var logicProducts = $scope.emarsysRecommend[$attrs.logic];
					
					if (logicProducts 
							&& logicProducts.length > 0
							&& logicProducts[0]) {
						$scope.showEmarsysRecommend = true;
						$scope.tab = "Recommendations";
						
						var logicProductIds = logicProducts.slice(0, 2);
						
						productIds.push.apply(productIds, 
								logicProductIds);
					}
					
					var target = document.getElementById(identifier);
					var recenlyViewedProducts = target.getAttribute(identifier);
					var recenlyViewedProductIds = recenlyViewedProducts.split(',', 2);
					if (recenlyViewedProductIds 
							&& recenlyViewedProductIds.length > 0 
							&& recenlyViewedProductIds[0]) {
						$scope.showRecentlyViewed = true;
						if (!$scope.tab) {
							$scope.tab = "RecentlyViewed";
						}
						
						if (logicProductIds && logicProductIds.length > 0) {
							productIds.push.apply(productIds, 
									recenlyViewedProductIds);
						}
					}
					
					LoadingService.setBlockAjaxLoading(true);
					$http({
						method: 'POST',
						url: $attrs.loadmoreurl,
						data: {
							productIds: productIds,
							pageNum: 1,
							viewNum: 4
						}
					}).then(function successCallback(response) {
						var result = response.data;
						
						if (result && result.products && result.products.length > 0) {
							$scope.moreIdeaProducts = result.products;
							
							$scope.sliderProductIdsReady = true;
						}
						
						LoadingService.setBlockAjaxLoading(false);
					});
				}
			}, true);
			
			// Rating Star - Display in Percentage Range
			$scope.ratingPercent=function(percentage){
				return ReviewService.getRatingPercent(percentage);
			};
			
			// Product Stack - Show Recommendation and Recently Viewed - Click Trigger Handler
			$scope.showStackContent = function () {
				$scope.disableSubmit = true;
				$scope.showMoreIdeaButtonLoading = true;
				
				var scrollTop = $window.pageYOffset;
				var viewPort = angular.element(document.getElementsByTagName('body'));
				
				if (isInit) {
					isInit = false;
				
					if ($scope.showEmarsysRecommend) {
						$scope.$broadcast('app-recommendation-controller-init');
					}
					
					if ($scope.showRecentlyViewed) {
						if ($scope.showEmarsysRecommend) {
							$scope.$broadcast('app-recently-viewed-controller-init');				
						} else {
							$scope.$broadcast('app-recently-viewed-controller-no-emarsys-init');
						}
					}
				} else {
					angular.element(document.getElementsByTagName('body')).addClass("viewportLock showStackContent");
				}
				
				$scope.hideStackContent = function () {
					$scope.disableSubmit=false;
					$scope.showMoreIdeaButtonLoading = false;
					viewPort.removeClass("viewportLock showStackContent");
					$window.scrollTo(0, scrollTop);
				};
			};
			
			// Scroll to container top by "Class Name"
			$scope.scrollToContainer = function() {
				angular.element(document.getElementsByClassName('slicer'))[0].scrollTo(0,0);
			};
			
			$scope.shuffleArray = function(array) {
			    for (var i = array.length - 1; i > 0; i--) {
			        var j = Math.floor(Math.random() * (i + 1));
			        var temp = array[i];
			        array[i] = array[j];
			        array[j] = temp;
			    }
			    return array;
			}
		}]);
		
		app.controller('recommendationController', ['CommonService', 'SavedItemService', 'LoadingService', '$scope', '$http', '$compile', '$templateCache', '$timeout', '$window', '$attrs', '$log', function(CommonService, SavedItemService, LoadingService, $scope, $http, $compile, $templateCache, $timeout, $window, $attrs, $log) {
			$scope.coverSize = "m";
			$scope.lotinfoitems = {};
			
			var isRereshFirstTime = true;
			var currentPageNum = 1;
			var isLoadMore;
			var loadingLock = false;
			var identifier = $attrs.id;
			
		    $scope.$on('app-recommendation-controller-init', function(event) {
		    	// replace with template
		    	if (isRereshFirstTime) {
					lotInfoItemTemplate = $templateCache.get("moreIdeaLotInfoItemTemplate");
					lotInfoItemTemplate = lotInfoItemTemplate.replace(/<wicket:panel unwrap>/g, "");
					lotInfoItemTemplate = lotInfoItemTemplate.replace(/<\/wicket:panel>/g, "");
					lotInfoItemElement = document.querySelector("browseResultRecommendationProducts").parentNode;
					lotInfoItemElement.innerHTML = "";
					angular.element(lotInfoItemElement).append($compile(lotInfoItemTemplate)($scope));
					
					isRereshFirstTime = false;
		    	}
		    	
		    	$scope.getEmarsysRecommendationProducts();
		    });
		    
		    angular.element(document.getElementById(identifier)).bind(
		    		"scroll", function() {
    			if (isLoadMore && !loadingLock) {
    				loadingLock = true;
    				
    				var element = document.getElementById(identifier);
    				
    				if (element.scrollTop == (element.scrollHeight - element.offsetHeight)) {
    					currentPageNum += 1;
    					$scope.getEmarsysRecommendationProducts();
    				} else {
    					loadingLock = false;
    				}
    			}
    		});
		    
		    $scope.getEmarsysRecommendationProducts = function() {
		    	var logicProductIds = $scope.emarsysRecommend[$attrs.logic];
		    	if (logicProductIds) {
		    		LoadingService.setBlockAjaxLoading(true);
		    		$scope.showProgressBar = true;
		    		$http({
		    			method: 'POST',
		    			url: $attrs.loadmoreurl,
		    			data: {
		    				productIds: logicProductIds.slice(0,200),
		    				pageNum: currentPageNum,
		    				viewNum: 72
		    			}
		    		}).then(function successCallback(response) {
		    			var result = response.data;
		    			
		    			isLoadMore = result.isShowLoadMore;
		    			
		    			if (currentPageNum == 1) {
		    				$scope.lotinfoitems = result.products;
		    			} else {
		    				$scope.lotinfoitems.push.apply($scope.lotinfoitems, 
		    						result.products);
		    			}
		    			
		    			$scope.showProgressBar = false;
		    			LoadingService.setBlockAjaxLoading(false);
		    			loadingLock = false;
		    			
		    			angular.element(document.getElementsByTagName('body'))
		    					.addClass("viewportLock showStackContent");
		    		});
		    	}
		    }
		    
	        $scope.onSaveSelectedProductOption = function($event, productId, childProducts) {
	        	$event.preventDefault();
	        	
				LoadingService.setBlockAjaxLoading(true);

	        	if (SavedItemService.isSavedItem(productId, childProducts)) {
	        		$http({
			        	method: 'DELETE',
			        	url: $attrs.deleteSavedItemUrl,
			        	data: {
			        		productId : productId
		        		}
		        	}).then(function successCallback(response) {
		        		var result = response.data;
		        		if (result.misc.isSuccess) {
		        			CommonService.updateCookie(result.cookies);
		        			
		        			SavedItemService.set(result.misc.updatedSavedItemProductIds);
		        		}
		        		LoadingService.setBlockAjaxLoading(false);
	        	 	});
	        	} else {
	        		$http({
			        	method: 'POST',
			        	url: $attrs.createSavedItemUrl,
			        	data: {
			        		productId : productId
		        		}
		        	}).then(function successCallback(response) {
		        		var result = response.data;
		        		if (result.misc.isSuccess) {
		        			CommonService.updateCookie(result.cookies);
		        			
		        			SavedItemService.set(result.misc.updatedSavedItemProductIds);
		        		}
		        		LoadingService.setBlockAjaxLoading(false);
	        	 	});
	        	}
			};
			
			$scope.isSavedItem = function(productId, childProducts) {
		      return SavedItemService.isSavedItem(productId, childProducts);
		    }
		}]);
		
		app.controller('recentlyViewedController', ['CommonService', 'SavedItemService', 'LoadingService', '$scope', '$http', '$compile', '$templateCache', '$timeout', '$window', '$attrs', '$log', function(CommonService, SavedItemService, LoadingService,  $scope, $http, $compile, $templateCache, $timeout, $window, $attrs, $log) {
			$scope.coverSize = "m";
			$scope.lotinfoitems = {};
			
			var isRereshFirstTime = true;
			var identifier = $attrs.id;
			var isLoadMore;
			var loadingLock = false;
			var currentPageNum = 1;
			var target = document.getElementById(identifier);
			var recenlyViewedProductIds = target.getAttribute(identifier);
			
		    $scope.$on('app-recently-viewed-controller-init', function(event) {
		    	$scope.replaceElement();
		    	
		    	$scope.getRecentlyViewedProducts(false);
		    });
		    
		    $scope.$on('app-recently-viewed-controller-no-emarsys-init', function(event) {
		    	$scope.replaceElement();
		    	
		    	$scope.getRecentlyViewedProducts(true);
		    });
		    
		    $scope.replaceElement = function () {
		    	// replace with template
		    	if (isRereshFirstTime) {
					lotInfoItemTemplate = $templateCache.get("recentlyViewLotInfoItemTemplate");
					lotInfoItemTemplate = lotInfoItemTemplate.replace(/<wicket:panel unwrap>/g, "");
					lotInfoItemTemplate = lotInfoItemTemplate.replace(/<\/wicket:panel>/g, "");
					lotInfoItemElement = document.querySelector("browseResultRecentViewedProducts").parentNode;
					lotInfoItemElement.innerHTML = "";
					angular.element(lotInfoItemElement).append($compile(lotInfoItemTemplate)($scope));
					
					isRereshFirstTime = false;
		    	}
		    }
		    
		    angular.element(document.getElementById(identifier)).bind(
		    		"scroll", function() {
    			if (isLoadMore && !loadingLock) {
    				loadingLock = true;
    				
    				var element = document.getElementById(identifier);
    				
    				if (element.scrollTop == (element.scrollHeight - element.offsetHeight)) {
    					currentPageNum += 1;
    					$scope.getRecentlyViewedProducts();
    				} else {
    					loadingLock = false;
    				}
    			}
    		});
			
		    $scope.getRecentlyViewedProducts = function(showPanel) {
				if (recenlyViewedProductIds) {
					LoadingService.setBlockAjaxLoading(true);
					$scope.showProgressBar = true;
					$http({
						method: 'POST',
						url: $attrs.loadmoreurl,
						data: {
							productIds: recenlyViewedProductIds.split(',').slice(0,200), 
							pageNum: currentPageNum,
							viewNum: 72
						}
					}).then(function successCallback(response) {
						var result = response.data;
						
						isLoadMore = result.isShowLoadMore;
						
						if (currentPageNum == 1) {
							$scope.lotinfoitems = result.products;
						} else {
							$scope.lotinfoitems.push.apply($scope.lotinfoitems, 
									result.products);
						}
						
						$scope.showProgressBar = false;
						LoadingService.setBlockAjaxLoading(false);
						loadingLock = false;
						
						// TODO waht is it used ... ?
						if (showPanel) {
							angular.element(document.getElementsByTagName('body'))
									.addClass("viewportLock showStackContent");
						}
					});
				}
		    }
		    
	        $scope.onSaveSelectedProductOption = function($event, productId, childProducts) {
	        	$event.preventDefault();
	        	
				LoadingService.setBlockAjaxLoading(true);

	        	if (SavedItemService.isSavedItem(productId, childProducts)) {
	        		$http({
			        	method: 'DELETE',
			        	url: $attrs.deleteSavedItemUrl,
			        	data: {
			        		productId : productId
		        		}
		        	}).then(function successCallback(response) {
		        		var result = response.data;
		        		if (result.misc.isSuccess) {
		        			CommonService.updateCookie(result.cookies);
		        			
		        			SavedItemService.set(result.misc.updatedSavedItemProductIds);
		        		}
		        		LoadingService.setBlockAjaxLoading(false);
	        	 	});
	        	} else {
	        		$http({
			        	method: 'POST',
			        	url: $attrs.createSavedItemUrl,
			        	data: {
			        		productId : productId
		        		}
		        	}).then(function successCallback(response) {
		        		var result = response.data;
		        		if (result.misc.isSuccess) {
		        			CommonService.updateCookie(result.cookies);
		        			
		        			SavedItemService.set(result.misc.updatedSavedItemProductIds);
		        		}
		        		LoadingService.setBlockAjaxLoading(false);
	        	 	});
	        	}
			};
			
			$scope.isSavedItem = function(productId, childProducts) {
		      return SavedItemService.isSavedItem(productId, childProducts);
		    }
		}]);
		
		// favorite brands dialog panel
		app.directive("ysFavoriteBrandDialog", function() {
			return {
				restrict: "A",
				controller: function($scope, $filter, $http, $attrs, $cookies) {
					$scope.favorites = ysApp.config.favoriteBrands;
					$scope.favoritesBrands = ysApp.config.favoriteBrands.addedBrands;
					
					$scope.changeSorting = function() {
						var url=$attrs.actionUrl;
						var data =
						{
								'sortingType':$scope.favorites.sortingOption,
						};
						$http({
							method: 'POST',
							url: url,
							data: data
						}).then(function successCallback(response) {
							$scope.favoritesBrands = response.data.addedBrands;
						});
					}
				}
			}
		});
		
		app.directive("ysNewSubscription", function() {
		    return {
				restrict: "A",
				controller: function($scope, CommonService) {
		    		$scope.isNotMobile = CommonService.isNotMobile();
		    	}
		    };
		});
		
		app.directive("ysCrossSellingShowMoreButton", function() {
			return {
				restrict: "A",
				controller: function($scope, $attrs) {
					$scope.promotionClipping = false;


					try {
					    var promotionSizeInt = parseInt($attrs.promotionSize);
                        var clippingSizeInt = parseInt($attrs.clippingSize);
					} catch (e) {
					    var promotionSizeInt = NaN;
					    var clippingSizeInt = NaN;
					}

					if (!isNaN(promotionSizeInt) && !isNaN(clippingSizeInt) && promotionSizeInt >= clippingSizeInt) {
				      $scope.promotionClipping = true; 
					}

					$scope.showAllPromotion = function() {
						$scope.promotionClipping = false;
				    };		    		
				}
			}
			
		});
		
		app.directive("ysOpenNewTabButton", function() {
			return {
				restrict: "A",
				controller: function($scope, $window) {
					// Open in New Tab
				    $scope.openNewTab = function($event) {
				    	$event.preventDefault();
				    	$window.open(angular.element($event.currentTarget).parent().parent().attr("href"), '_blank');
				    };
					
				}
			}
		});

        app.directive("ysShare", function() {
            return {
                restrict: "AE",
                scope: true,
                controller: function($scope, $attrs, $http, $window, BranchIoService, CommonService) {
                    // Return shortened url if found; full url otherwise.
                    $scope.getDisplayUrl = function() {
                        return $scope.shortenedUrl ? $scope.shortenedUrl : $attrs.ysFullUrl;
                    };

                    $scope.shortenUrl = function() {
                        // Don't do anything if the referral link is already shortened
                        if (!$scope.shortenedUrl) {
                            $http({
                                method: "POST",
                                url: $attrs.ysCreateShortDynamicLinkUrl,
                                data: {
                                    fullUrl: $attrs.ysFullUrl
                                }
                            }).then(function successCallback(response) {
                                var result = response.data;

                                if (result.isSuccess) {
                                    // store short dynamic link if it is created successfully
                                    $scope.shortenedUrl = result.firebaseShortDynamicLink;

                                    $scope.shortencode = true;
                                }
                            });
                        }
                    }
                    $scope.branchShortenLink = function() {
                        CommonService.showLoadingPanel();

                        var linkData = {
                            "branch_key": $scope.viewData.branch_key,
                            "data": {
                                "$deeplink_path": $attrs.ysFullUrl,
                                "$fallback_url": $attrs.ysFullUrl
                            }
                        }

                        branch.link(linkData, function(err, link) {
                            CommonService.hideLoadingPanel();
                            $scope.shortenedUrl = link;
                        });
                    }

                }
            }
        });

        app.directive("ysInfluencerIntroduction", function($window) {
            return {
                restrict: "AE",
                controller: function($scope, $attrs, $http, $cookies, CommonService, UserAgentService) {
                    $scope.isInAppBrowser = UserAgentService.isInAppBrowser();

                    $scope.ysInfluencerFormPopUp = function() {
                        var url = $attrs.actionUrl;
                        $http({
                            method: "POST",
                            url: url
                        }).then(function successCallback(response) {
                            var result = response.data;
                            if (result.cookies) {
                                CommonService.updateCookie(result.cookies);

                                setTimeout(function(){$window.location.href = $attrs.targetUrl;},5);                            }
                        });
                    };
                }
            }
        });

        app.directive("ysInfluencerSponsoredProducts", function($window, $mdDialog, $templateCache) {
            return {
                restrict: "AE",
                controller: function($scope, $attrs, $http) {
                    $scope.checkRedeemEligibility = function($event) {
                        $http({
                            method: 'GET',
                            url: $attrs.checkRedeemEligibilityLinkUrl,
                            params: {
                                productId: $attrs.currentProductId
                            }
                        }).then(function successCallback(response) {
                            var result = response.data;

                            if (result.isEligible) {
                                showRedeemForm($event);
                            } else {
                                showRedeemPopupMessage($event, result.redeemPopupTitle, result.redeemPopupContent);
                            }
                        });
                    }

                    function showRedeemForm($event) {
                        $event.stopPropagation();

                        $mdDialog.show({
                          parent: angular.element(document.body),
                          targetEvent: $event,
                          scope: $scope.$new(),
                          template: $templateCache.get("panel/influencerpage/redeemsponsoredproduct/sponsoredproductredeemform/SponsoredProductRedeemForm.html"),
                          controller: DialogController,
                          clickOutsideToClose: true
                       });
                       function DialogController($scope, $mdDialog) {
                          $scope.hide = function() {
                              $mdDialog.hide();
                          };
                          $scope.cancel = function() {
                              $mdDialog.cancel();
                          };
                       }

                       $scope.submitRedeemForm = function(agreeToTNC) {
                           $http({
                               method: 'PUT',
                               url: $attrs.submitRedeemFormLinkUrl,
                               data: {
                                   productId: $attrs.currentProductId,
                                   isAgreeToTNC: agreeToTNC
                               }
                           }).then(function successCallback(response) {
                               var result = response.data;

                               if (result.isSuccess) {
                                    $scope.isInBag = true;
                               } else {
                                    showRedeemPopupMessage($event, result.redeemPopupTitle, result.redeemPopupContent);
                               }

                               $scope.cancel();
                           });
                       }
                   }

                    function showRedeemPopupMessage($event, redeemPopupTitle, redeemPopupContent) {
                        $event.stopPropagation();

                        $mdDialog.show({
                          parent: angular.element(document.body),
                          targetEvent: $event,
                          scope: $scope.$new(true),
                          template: $templateCache.get("panel/influencerpage/redeemsponsoredproduct/redeempopupmessage/RedeemPopupDialog.html"),
                          locals: {
                            redeemPopupTitle: redeemPopupTitle,
                            redeemPopupContent: redeemPopupContent
                          },
                          controller: DialogController,
                          clickOutsideToClose: true
                       });
                       function DialogController($scope, $mdDialog, redeemPopupTitle, redeemPopupContent) {
                          $scope.redeemPopupTitle = redeemPopupTitle;
                          $scope.redeemPopupContent = redeemPopupContent;
                          $scope.hide = function() {
                              $mdDialog.hide();
                          };
                          $scope.cancel = function() {
                              $mdDialog.cancel();
                          };
                       }
                   }
                }
            }
        });

		app.directive("igCelebration", function() {
            return {
                restrict: "AE",
                controller: function($scope, $attrs, $http, $mdDialog, $templateCache) {
                    $scope.showIgCelebrationDialog = function(restrictedCountry) {
                        $mdDialog.show({
                          parent: angular.element(document.body),
                          scope: $scope.$new(),
                          template: $templateCache.get("/panel/frontpage/women/igcelebration/IgCelebrationTemplate.html"),
                          locals: {
                            restrictedCountry: restrictedCountry,
                          },
                          controller: DialogController,
                          clickOutsideToClose: false
                       });
                       function DialogController($scope, $mdDialog, restrictedCountry) {
                          $scope.restrictedCountry = restrictedCountry;
                          $scope.hide = function() {
                              $mdDialog.hide();
                          };
                          $scope.cancel = function() {
                              $mdDialog.cancel();
                          };
                       }
                   }

                   $scope.directToBoxPickingPage = function() {
                        $scope.selectedIndex = 1;
                   }

                   $scope.getCelebrationGift = function() {
                        $http({
                            method: 'GET',
                            url: $attrs.ysGetIgCelebrationGamePrizeUrl,
                        }).then(function successCallback(response) {
                            var result = response.data;
                            $scope.isFreeGiftGamePrize = result.isFreeGiftGamePrize;

                            $scope.selectedIndex = 2;
                        });
                   }
                }
            }
        });

// Collapsed content controller
        app.directive("ysTruncateOverflow", ["$timeout", function($timeout) {
			return {
				restrict: "A",
				link: function($scope, element, attrs){
				    function determineContent() {
                        var content = angular.element(document.querySelector(".truncate-overflow"),element)[0];
                        $scope.controlButton = (content.scrollHeight > content.clientHeight)? true : false;
                    }
                    element.ready(function(){determineContent()});
                    $scope.$watchGroup([
                        function() { return element[0].offsetWidth; },
                        function() { return element[0].offsetHeight; }
                    ],  function(values) {
                          determineContent();
                    });
				}
			}
		}]);

		//for enter screen animation
        app.directive('animateView', function($window, $timeout) {
            return {
                restrict: 'A',
                link: function(scope, elm, attr) {

                function addAnimateClass(){
                    var elemFirst = elm[0];
                    var elementFirstBoundary = elemFirst.getBoundingClientRect();
                    var top = elementFirstBoundary.top;
                    var bottom = elementFirstBoundary.bottom;
                    var height = elementFirstBoundary.height;

                    if ( elemFirst.classList.contains('partially-view-animation')) {
                      //Partially visible in viewport - small grid mobile view
                        if((top + height >= 0) && (height + window.innerHeight >= bottom)){
                        elm.addClass('page-animation');
                        }
                    } else {
                       //fully visible in viewport
                       if((top >= 0) && (bottom <= window.innerHeight)){
                        elm.addClass('page-animation');
                       }
                    }
                }

                //run animation for upper part once for enter the page
                $timeout(function() { addAnimateClass(); },500,false);

                angular.element($window).bind("scroll", function(){
                   addAnimateClass();
                 });
               }
            }
        });

		return app;
	}
);