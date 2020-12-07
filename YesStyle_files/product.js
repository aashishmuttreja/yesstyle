/*
 * Copyright (C) 2016 YesAsia.com (Hong Kong) Limited
 * 
 * For production, assume no ng-controller
 */
define(['angularjs',
        'common'], 
    function(angular, $log) {
		var app = angular.module('product', 
				['common',
				 'ngMaterial',
				 'ngAnimate',
				 'youtube-embed']);

		// product page
		app.directive("ysProduct", function($location, $http, $templateCache, $anchorScroll, $timeout, $window, $mdDialog, $mdToast, $mdMedia) {
			return {
				restrict: "AE",
				controller: function($scope, $attrs, CommonService, angularGridInstance, SavedItemService, BasketItemService, EmarsysService, ReviewService, DynamicYieldService){
					$scope.productData = ysApp.product;

					var absUrl = $location.absUrl();
					var isGalleryAnchor = false;
                    if (absUrl && absUrl.endsWith('galleryAnchor')) {
                        isGalleryAnchor = true;
                    }

					$scope.gtsm=$mdMedia('gt-sm');
					$scope.gtxs=$mdMedia('gt-xs');
					var unregister = $scope.$watch(function(){
						return $mdMedia('sm');
					}, function(screen){
						$scope.gtsm=$mdMedia('gt-sm');
						$scope.gtxs=$mdMedia('gt-xs');

						if ($scope.gtsm) {
							$scope.sectionTab='all';
							$scope.emarsysSimilarItemAlsoBrought='show';
						} else {
							$scope.sectionTab=($scope.productData.isSellable || isGalleryAnchor) ? 'gallery' : 'similar';
							$scope.emarsysSimilarItemAlsoBrought='';
						}
						
						unregister();
					});
					
					$scope.isNotMobile = CommonService.isNotMobile();
					
					if (!$scope.gtsm){
				        var assignLoadMore = $scope.loadmoreDownward = function() {
				        	var viewportHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
				 	        var footerTopOffset = angular.element(document.querySelector("footer"))[0].getBoundingClientRect().top - 40; 
							if (!EmarsysService.getLoadMoreLock() && footerTopOffset  <= viewportHeight) {
					        	$scope.downwardLoader = true; 
					        	EmarsysService.setLoadMoreLock(true);
					        	$scope.$broadcast('emarsysLoadMore');
					        } else {
					        	$scope.downwardLoader = false;
					        }
				        };
				        angular.element($window).bind("scroll", assignLoadMore);
					}

                    angular.element(document).ready(function(){
                        if (isGalleryAnchor) {
                            $scope.anchorTo("galleryAnchor");
                        }
                    });
					
					$scope.productDataStatus={};
					$scope.productDataStatus.initialLoad=true;
					$scope.productOptionStatus={};
					$scope.productOptionStatus.showMissingProductOptionAlert = false;
					$scope.productOptionStatus.showAlreadyInBagAlert = false;
					
					$scope.productVideosData = ysApp.productVideos;

					$scope.productReviewData = ysApp.productReview;
					
					$scope.addToBagButtonStatus={};
					$scope.addToBagButtonStatus.isStickyAddToBag=false;
					
					$scope.reviewsData = ysApp.reviews;
					setSelectedReviewerRating();

					$scope.reviewsStatus = {};
					$scope.reviewsStatus.isSortedResult = false;

					$scope.playerVars = {
						rel: 0,
						iv_load_policy: 3,
						color: 'white',
						showinfo: 0,
						autohide: 1,
					    autoplay: 1
					};

		    	    $scope.dynamic = {
		    	        video: "", 
		    	        videoTitle: "",
		    	        change: function (targetVideoId, videoTitle) {
	    	                $scope.dynamic.video = targetVideoId;
	    	                $scope.dynamic.videoTitle = videoTitle;
		    	        }
		    	    };

		    	    $scope.dateSplit = new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ');
		    	    $scope.timezoneName = ($scope.dateSplit.length >= 3 ? $scope.dateSplit[2] : "");
					
					$scope.isOnSimilarItemsLoadMore = function() {
						return EmarsysService.getLoadMoreLock();
					}
					
					$scope.switchToProductDetailsSectionTab = function() {
						if ($scope.gtsm) {
							$scope.sectionTab='all';
						} else {
							$scope.sectionTab='details';
						}
					}
					
					$scope.refreshProductData = function(url) {
						if (url) {
							$http.get(url).success(function(data){
								$scope.productData = data;
								$scope.productDataStatus.initialLoad=false;
				    		});
						}
					}
					
					$scope.showProductOptionsDialog = function() {
						// init all status
						$scope.productOptionStatus={};
						
						$mdDialog.show({
					      targetEvent: null,
					      fullscreen: true,
					      controller:DialogController,
					      scope: $scope.$new(),
					      preserveScope: true,
					      template: $templateCache.get('/panel/dialog/ProductOptions.html'),
					      parent: angular.element(document.body),
					      clickOutsideToClose: true
					    })
					    .then(function(anchor){
					    	if (anchor){
					    		$scope.anchorTo(anchor);
					    	}
					    });
					};
					
					function DialogController($scope, $mdDialog) {
						  $scope.hide = function() {
						    $mdDialog.hide();
						  };
						  $scope.cancel = function() {
						    $mdDialog.cancel();
						  };
						  $scope.anchor = function(anchor){
							  $mdDialog.hide(anchor);
						  }
					}
					
					$scope.refreshAngularGrid = function() {
						$timeout(function() {
							window.dispatchEvent(new Event("resize"));
						}, 300);
					};
					
					$scope.onSelectProductOption = function($event, productOption) {
						$scope.productOptionStatus={};
						
						$http({
				        	method: 'GET',
				        	url: $attrs.ysOnSelectProductOptionUrl,
				        	params: {
				        		productId : productOption.productId,
			        		}
			        	}).then(function successCallback(response) {
				            $scope.productData = response.data;
				            $scope.productDataStatus.initialLoad=false;
		        	 	});
					};
					
					$scope.onAddSelectedProductOptionToBag = function($event) {
						if ($scope.productData.selectedProductOption) {
							if ($scope.productData.selectedProductOption.isInShopperBag) {
								$scope.showAlreadyInBagAlert();
							} else {
								$http({
						        	method: 'POST',
						        	url: $attrs.ysOnAddProductOptionToBagUrl,
						        	data: {
						        		productId : $scope.productData.selectedProductOption.productId
					        		}
					        	}).then(function successCallback(response) {
					        		var result = response.data;
					        		if (result.misc.isSuccess) {
					        			CommonService.updateCookie(result.cookies);
					        			
										$mdDialog.hide();
										
										$scope.productData.selectedProductOption.isInShopperBag = true;
										$scope.productData.isInShopperBag = true;
										
										$scope.showAddBagToast();
										
										BasketItemService.add(result.misc.geatcTrack, $scope.productData.selectedProductOption.facebookConversionProduct);

										var product = result.misc.geatcTrack.ecommerce.add.products[0];
                                        DynamicYieldService.addToCart(product.price, result.misc.parentProductId, product.quantity);
					        		}
				        	 	});
							}
						} else {
							$scope.showMissingProductOptionAlert();
						}
					};
					
					$scope.showAlreadyInBagAlert = function() {
						$scope.productOptionStatus.showAlreadyInBagAlert = true;
					}
					
					$scope.showMissingProductOptionAlert = function() {
						$scope.productOptionStatus.showMissingProductOptionAlert = true;
					}
					
					$scope.onSaveSelectedProductOption = function($event) {
			        	$event.preventDefault();
						
						if ($scope.productData.selectedProductOption) {
							if ($scope.productData.selectedProductOption.isSavedItem) {
								$http({
						        	method: 'DELETE',
						        	url: $attrs.ysOnUnsaveProductOptionUrl,
						        	data: {
						        		productId : $scope.productData.selectedProductOption.productId
					        		}
					        	}).then(function successCallback(response) {
					        		var result = response.data;
					        		if (result.misc.isSuccess) {
					        			CommonService.updateCookie(result.cookies);
					        			
					        			$scope.productData.selectedProductOption.isSavedItem = false;
					        			$scope.productData.isSavedItem = false;
					        			
					        			SavedItemService.set(result.misc.updatedSavedItemProductIds);
					        		}
				        	 	});
							} else {
								$http({
						        	method: 'POST',
						        	url: $attrs.ysOnSaveProductOptionUrl,
						        	data: {
						        		productId : $scope.productData.selectedProductOption.productId
					        		}
					        	}).then(function successCallback(response) {
					        		var result = response.data;
					        		if (result.misc.isSuccess) {
					        			CommonService.updateCookie(result.cookies);
					        			
					        			$scope.productData.selectedProductOption.isSavedItem = true;
					        			$scope.productData.isSavedItem = true;
					        			
					        			SavedItemService.set(result.misc.updatedSavedItemProductIds);
					        		}
				        	 	});
							}
						} else {
							$scope.showMissingProductOptionAlert();
						}
					};
					
					$scope.onAddToBag = function($event, isStickyAddToBag) {
						$scope.addToBagButtonStatus.isStickyAddToBag = isStickyAddToBag;
						
						if ($scope.productData.selectedProductOption) {
							if ($scope.productData.isInShopperBag){
								$scope.showAlreadyInBagToast();
							} else {
								$http({
						        	method: 'POST',
						        	url: $attrs.ysOnAddProductOptionToBagUrl,
						        	data: {
						        		productId : $scope.productData.product.productId
					        		}
					        	}).then(function successCallback(response) {
					        		var result = response.data;
					        		if (result.misc.isSuccess) {
					        			CommonService.updateCookie(result.cookies);
										
										$scope.productData.isInShopperBag = true;
										
										$scope.showAddBagToast();
										
										BasketItemService.add(result.misc.geatcTrack, $scope.productData.selectedProductOption.facebookConversionProduct);

										var product = result.misc.geatcTrack.ecommerce.add.products[0];
                                        DynamicYieldService.addToCart(product.price, result.misc.parentProductId, product.quantity);
					        		}
				        	 	});
							}
						} else {
							$scope.showProductOptionsDialog();
						}
					};
					
					$scope.showAlreadyInBagToast = function() {
						var wrapperClass;
						if ($scope.addToBagButtonStatus.isStickyAddToBag) {
							wrapperClass = "InBagToastStickyWrapper";
						} else {
							wrapperClass = "InBagToastWrapper";
						}
						
						$mdToast.show({
							hideDelay   : 0,
							position    : 'top right',
							parent      :  angular.element(document.getElementsByClassName(wrapperClass)),
							template	: $templateCache.get('/panel/toast/AlreadyInBagToast.html'),
							controller  : function($scope, $mdToast, $mdDialog) {
								$scope.closeToast =function() {$mdToast.hide()}
							}
						});
					};

					$scope.showAddBagToast = function() {
						var wrapperClass;
						if ($scope.addToBagButtonStatus.isStickyAddToBag) {
							wrapperClass = "AddBagToastStickyWrapper";
						} else {
							wrapperClass = "AddBagToastWrapper";
						}
						
						$mdToast.show({
							hideDelay   : 0,
							position    : 'top right',
							parent      :  angular.element(document.getElementsByClassName(wrapperClass)),
							template	: $templateCache.get('/panel/toast/AddToBagToast.html'),
							controller  : function($scope, $mdToast, $mdDialog) {
								$scope.closeToast =function() {$mdToast.hide()}
							}
						});
					};
					
					$scope.onSaveItem = function($event) {
						if ($scope.productData.isSavedItem) {
							$http({
					        	method: 'DELETE',
					        	url: $attrs.ysOnUnsaveProductOptionUrl,
					        	data: {
					        		productId : $scope.productData.product.productId
				        		}
				        	}).then(function successCallback(response) {
				        		var result = response.data;
				        		if (result.misc.isSuccess) {
				        			CommonService.updateCookie(result.cookies);
				        			
				        			$scope.productData.isSavedItem = false;
									
									if ($scope.productData.productOptions) {
										for (i=0; i<$scope.productData.productOptions.length; i++) {
											$scope.productData.productOptions[i].isSavedItem = false;
										}
									}
									
									SavedItemService.set(result.misc.updatedSavedItemProductIds);
				        		}
			        	 	});
						} else {
							$http({
					        	method: 'POST',
					        	url: $attrs.ysOnSaveProductOptionUrl,
					        	data: {
					        		productId : $scope.productData.product.productId
				        		}
				        	}).then(function successCallback(response) {
				        		var result = response.data;
				        		if (result.misc.isSuccess) {
				        			CommonService.updateCookie(result.cookies);
				        			
				        			$scope.productData.isSavedItem = true;
				        			
				        			SavedItemService.set(result.misc.updatedSavedItemProductIds);
				        		}
			        	 	});
						}
					};
					
					$scope.anchorTo = function(targetID) {						
						$location.hash(targetID);
						$anchorScroll();
						$anchorScroll.yOffset = angular.element(document.querySelector('header'))[0].offsetHeight;
					};
					
			        angular.element($window).bind("scroll", function() {
					    var header = angular.element(document.querySelector('header'))[0].offsetHeight;
			        	var spyTop = getCoords(angular.element(document.getElementsByClassName('ysTabsSection'))[0]).top - header;
					    var wayPoint = getCoords(angular.element(document.getElementsByClassName('wayPoint'))[0]).top - header - angular.element(document.getElementsByClassName('scrollspyNav'))[0].offsetHeight;
					    var scrollTop = $window.pageYOffset;
					    if (scrollTop > spyTop) {
							$scope.sticky = true;
						} else if (scrollTop <= spyTop){
							$scope.sticky = false;
						}
						if (scrollTop > wayPoint) {
							$scope.animatedChart = true;
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
			        
					$scope.productStickyAnchor = function() {
						var scrollspyNav = angular.element(document.getElementsByClassName('scrollspyNav'));
						if (scrollspyNav.hasClass("sticky")) {
							$scope.anchorTo("productAnchor");
						}
					};
					
					//Customer Reviews - Report This
					$scope.reportThis = function($event) {
						var thisTarget = angular.element($event.currentTarget);
						thisTarget.removeClass("activePulse");
						$timeout(function() {thisTarget.addClass("activePulse");}, 0);
					};
					
					// Rating Star - Display in Percentage Range
					$scope.ratingPercent=function(percentage){
						return ReviewService.getRatingPercent(percentage);
					};
					
					// Show Hidden Pulldown Menu - Click Trigger Handler
					$scope.showPulldownMenu = function($event) {
						var thisTarget = angular.element($event.currentTarget);
						thisTarget.parent().find('md-select').triggerHandler('click');
					};

					// Count Videos and control the load more button
					$scope.showMoreVideo = false;
					$scope.initShowMoreVideo = function(){
						angular.element(document).ready(function(){
							if (document.querySelector('.galleryVideoList').querySelectorAll('.itemContainer').length > 12) {
								$scope.showMoreVideo = true;
							}
						});
					}

					$scope.reviewDynamic = {
                        changeImages: function (images, index) {
                            $scope.dialogImages = {};
                            $scope.activeValue = index;
                            $scope.dialogImages = images;
                        },
                        changeVideo: function (videoUrl) {
                            $scope.youtubeUrl = {};
                            $scope.youtubeUrl = videoUrl;
                        }
                    };
					
					$scope.loadMoreReviewerReviews=function(){
						
						// Cache the current Scroll Height
						var scrollHeight = $window.pageYOffset;
						//console.log("cache YOffset:" + scrollHeight);
						
						$http({
				        	method: 'GET',
				        	url: $attrs.ysReviewerReviewsUrl,
				        	params: {
				        		reviewProductId : $scope.reviewsData.reviewProductId,
				        		pageNum : $scope.reviewsData.currentPageNum + 1,
				        		sortByOptionId : $scope.reviewsData.sortByOptionId,
				        		reviewerRatingFilterOptionId : $scope.selectedReviewerRatingId
			        		}
			        	}).then(function successCallback(response) {
			        		var result = response.data;

			        		Array.prototype.push.apply($scope.reviewsData.reviewerReviews, result.reviewerReviews);
			        		
			        		$scope.reviewsData.currentPageNum = result.currentPageNum;
			        		
			        		$scope.reviewsData.hasNext = result.hasNext;

			        		// Apply the current Scroll Height after Pushing Reviews
							$timeout(function() {
							  $window.scrollTo(0, scrollHeight);
							}, 200);
		        	 	});
					};
					
					$scope.onChangeReviewsFilterOption=function(){
						$http({
				        	method: 'GET',
				        	url: $attrs.ysReviewerReviewsUrl,
				        	params: {
				        		reviewProductId : $scope.reviewsData.reviewProductId,
				        		pageNum : 1,
				        		sortByOptionId : $scope.reviewsData.sortByOptionId,
				        		reviewerRatingFilterOptionId : $scope.selectedReviewerRatingId
			        		}
			        	}).then(function successCallback(response) {
			        		$scope.reviewsStatus.isSortedResult = true;

			        		$timeout(function() {
								$scope.reviewsData = response.data;

								setSelectedReviewerRating();

								angularGridInstance['masonry'].refresh();

								window.dispatchEvent(new Event("resize"));
							}, 500);
		        	 	});
					};

                    function setSelectedReviewerRating() {
                        if ($scope.reviewsData.reviewerRatingFilterOptions) {
                            for (i=0; i<$scope.reviewsData.reviewerRatingFilterOptions.length; i++) {
                                var reviewerRating = $scope.reviewsData.reviewerRatingFilterOptions[i];

                                if (reviewerRating.isSelected) {
                                    $scope.selectedReviewerRatingId = reviewerRating.id;
                                    $scope.selectedReviewerRatingName = reviewerRating.name;
                                }
                            }
                        }
                    }

                    $scope.showAdventCalendarDialog = function () {
                        $mdDialog.show({
                          targetEvent: null,
                          fullscreen: true,
                          controller: DialogController,
                          scope: $scope.$new(),
                          preserveScope: true,
                          template: $templateCache.get('/panel/productpage/winanadventcalendar/winAnAdventCalendar.html'),
                          parent: angular.element(document.body),
                          clickOutsideToClose: true,
                        });
                    }
				}
			}
		});
		
		app.directive("ysHelpfulVoteNReportThis", function($location, $http, $templateCache, $anchorScroll, $timeout, $window, $mdDialog, $mdToast, $mdMedia) {
			return {
				restrict: "AE",
				scope: true, 
				controller: function($scope, $attrs){
					$scope.isShowVotedHelpfulNote = false;
					$scope.reportThis={};
					$scope.isShowReportedSuccess = false;
					
					if ($attrs.ysReviewObserve) {
						$attrs.$observe('ysReviewId', function(ysReviewId) {
							$scope.reviewId = parseInt(ysReviewId);
							$scope.reportThis.reviewId=$scope.reviewId;
						});
						$attrs.$observe('ysReviewProductId', function(ysReviewProductId) {
							$scope.reportThis.productId=parseInt(ysReviewProductId);
						});
						$attrs.$observe('ysReviewVotedHelpful', function(ysReviewVotedHelpful) {
							$scope.isVotedHelpful = (ysReviewVotedHelpful === 'true');
						});
						$attrs.$observe('ysReviewVotedNotHelpful', function(ysReviewVotedNotHelpful) {
							$scope.isVotedNotHelpful = (ysReviewVotedNotHelpful === 'true');
						});
					} else {
						$scope.reviewId = parseInt($attrs.ysReviewId);
						$scope.reportThis.reviewId=$scope.reviewId;
						$scope.reportThis.productId=parseInt($attrs.ysReviewProductId);
						$scope.isVotedHelpful = ($attrs.ysReviewVotedHelpful === 'true');
						$scope.isVotedNotHelpful = ($attrs.ysReviewVotedNotHelpful === 'true');
					}
					
					$scope.voteHelpful = function(isHelpful) {
						if (isHelpful) {
							if (!$scope.isVotedHelpful) {
								$http({
						        	method: 'POST',
						        	url: $attrs.ysCustomerReviewHelpfulVoteUrl,
						        	data: {
						        		reviewId : $scope.reviewId
					        		}
					        	}).then(function successCallback(response) {
					        		var result = response.data;
					        		if (result.misc && result.misc.isSuccess) {
										$scope.isVotedHelpful = true;
										$scope.isVotedNotHelpful = false;
										$scope.isShowVotedHelpfulNote = true;
										$timeout(function() {
											$scope.isShowVotedHelpfulNote = false;
										}, 4000);
					        		}
				        	 	});
							}
						} else {
							if (!$scope.isVotedNotHelpful) {
								$http({
						        	method: 'DELETE',
						        	url: $attrs.ysCustomerReviewHelpfulVoteUrl,
						        	data: {
						        		reviewId : $scope.reviewId
					        		}
					        	}).then(function successCallback(response) {
					        		var result = response.data;
					        		if (result.misc && result.misc.isSuccess) {
										$scope.isVotedNotHelpful = true;
										$scope.isVotedHelpful = false;
										$scope.isShowVotedHelpfulNote = true;
										$timeout(function() {
											$scope.isShowVotedHelpfulNote = false;
										}, 4000);
					        		}
				        	 	});
							}
						}
					};
					
					$scope.reportReview = function(form) {
						if (form.$valid) {
							$http({
						    	method: 'POST',
						    	url: $attrs.ysCustomerReviewReportThisUrl,
						    	data: $scope.reportThis
							}).then(function successCallback(response) {
								var result = response.data;
								if (result.misc && result.misc.isSuccess) {
									$scope.isShowReportedSuccess = true;
								}
						 	});
						}
					}
					
					$scope.showReportThisDialog = function(ev) {
						$mdDialog.show({
					      targetEvent: ev,
					      fullscreen: true,
					      controller:DialogController,
					      scope: $scope.$new(),
					      template: $templateCache.get('/product/ReportThis.html'),
					      parent: angular.element(document.body),
					      clickOutsideToClose: false
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
				}
			}
		});
		
		app.directive("ysProductWriteAReviewButton", function($http, $templateCache, $mdDialog, $window) {
			return {
				restrict: "AE",
				scope: true, 
				controller: function($scope, $attrs){
					$scope.writeReviewForm = {};
					$scope.status = {};
					$scope.status.invalidPhrase = false;
					$scope.status.isShowReportedSuccess = false;
					
					$scope.onSelectRatingStar = function(ratingClass, reviewRatingId) {
						$scope.writeReviewForm.ratingId = reviewRatingId;
						$scope.rating = ratingClass;
						
					}
					
					$scope.onShowWriteAReview = function(ev) {
						$scope.writeReviewForm = {};
						$scope.status = {};
						$scope.errors = {};
						$scope.rating = null;
						
						$mdDialog.show({
					      targetEvent: ev,
					      fullscreen: true,
					      controller:DialogController,
					      scope: $scope.$new(),
					      template: $templateCache.get('/product/WriteAReview.html'),
					      parent: angular.element(document.body),
					      clickOutsideToClose: false,
					      disableParentScroll: true
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
					
					$scope.onWriteAReview = function() {
						$scope.writeReviewForm.productId = $attrs.reviewProductId;
						if ($scope.writeReviewForm.checkTermsRead) {
							$http({
								method: 'POST',
								url: $attrs.ysWriteAReviewUrl,
								data: $scope.writeReviewForm
							}).then(function successCallback(response) {
								var result = response.data;
								
								$scope.errors = {};
								
								if (result.errors) {
					            	angular.forEach(result.errors,
				            			function(value, key) {
					            			$scope.errors[value.fieldName + value.errorCode] = true;
					            		}
					            	);
				            	}
								
						        if (result.misc) {
						        	if (result.misc.invalidPhrase) {
										$scope.status.isInvalidPhrase = true;
										$scope.status.isShowReportedSuccess = false;
									}
						        	
									if (result.misc.isSuccess) {
										$scope.status.isInvalidPhrase = false;
										$scope.status.isShowReportedSuccess = true;
									}
					            }
						        
						        // reset captcha everytime after submit
						        if ($window.grecaptcha) {
						        	$window.grecaptcha.reset();
								}
							});
						}
					}
				}
			}
		});

		app.directive("ysSubmitSponsoredProductLink", function($http, $templateCache, $mdDialog, $window) {
        	return {
                restrict: "C",
                scope: true,
                controller: function($scope, $attrs){
                    $scope.onShowLinkSubmissionForm = function(ev) {
                        $mdDialog.show({
                          targetEvent: ev,
                          fullscreen: true,
                          controller:DialogController,
                          scope: $scope.$new(),
                          template: $templateCache.get('/panel/SubmitSponsoredProductLink.html'),
                          parent: angular.element(document.body),
                          clickOutsideToClose: true,
                          disableParentScroll: true,
                          locals: {
                            sponsoredProductTags: $attrs.tags
                          }
                        });

                        function DialogController($scope, $mdDialog, sponsoredProductTags) {
                            $scope.sponsoredProductTags = sponsoredProductTags;
                            $scope.hide = function() {
                              $mdDialog.hide();
                            };
                            $scope.cancel = function() {
                              $mdDialog.cancel();
                            };
                        }
                    }

                    $scope.onSubmitLink = function(link) {
                        $http({
                            method: 'POST',
                            url: $attrs.ysSubmitSponsoredProductLinkUrl,
                            data: {
                                productId: $attrs.productId,
                                link: link
                            }
                        }).then(function successCallback(response) {
                            if (response.data.isSuccess) {
                                $scope.submitted = true;
                                $scope.hasError = false;
                            } else {
                                $scope.hasError = true;
                            }
                        });
                    }
                }
        	}
        });

		// Crop Text Paragraph
		// Using in: Product Page - Major Ingredients
        app.directive("ysCropParagraph", ["$mdMedia", "$timeout", function($mdMedia, $timeout) {
			return {
				restrict: "A",
				link: function($scope, element, attrs){
					element.ready(function() {
						$timeout(function() {
							var headingDes = angular.element(element)[0];
						    var desHeight = headingDes.offsetHeight;
						    if (desHeight > 76) {
						    	$scope.cropDes = true;
						    }
						});
						$scope.entireDec = function() {
					    	$scope.fullContent = 1;
				        };
					});
				}
			}
		}]);

		app.directive("ysReviewTranslate", ["$window", function($window) {
            return {
                scope: true,
                restrict: "A",
                controller: function($scope, $http, $attrs, $element, $log) {
                    $scope.translateUrl = ysApp.productReview.reviewTranslateUrl;

                    $scope.isShowTranslate = false;

                    $scope.domTranslateTitle = angular.element($element[0].querySelector("[ys-translate-title]"));
                    $scope.domTranslateSubmitDate = angular.element($element[0].querySelector("[ys-translate-submit-date]"));
                    $scope.domTranslateComment = angular.element($element[0].querySelector("[ys-translate-comment]"));

                    $scope.apiResponse = {};
                    $scope.apiErrors = {};

                    $scope.showTranslate = function(ev) {
                        ev.stopPropagation();

                        if (angular.equals($scope.apiResponse, {})) {
                            $http({
                                method: 'GET',
                                url: $scope.translateUrl,
                                params: {
                                    reviewId : $attrs.ysReviewId
                                }
                            }).then(function successCallback(response) {
                                $scope.apiResponse = response.data;

                                if ($scope.apiResponse.errors) {
                                    angular.forEach($scope.apiResponse.errors,
                                        function(value, key) {
                                            $scope.apiErrors[value.fieldName + value.errorCode] = true;
                                        }
                                    );
                                } else {
                                    $scope.domTranslateTitle.text($scope.apiResponse.title);
                                    $scope.domTranslateComment.text($scope.apiResponse.comment);

                                    $scope.isShowTranslate = true;
                                }
                            });
                        } else {
                            if (angular.equals($scope.apiErrors, {})) {
                                $scope.isShowTranslate = true;
                            } else {
                                $scope.isShowTranslate = false;
                            }
                        }
                    };

                    $scope.hideTranslate = function(ev) {
                        ev.stopPropagation();
                        $scope.isShowTranslate = false;
                    };
                }
            }
        }]);

        app.directive("ysAdventCalendarGameDialog", function($http, $timeout, $window) {
            return {
                restrict: "A",
                controller: function($scope, $attrs){
                    $scope.selectedIndex =0;

                    $scope.mcqFormDataModel = [];

                    $scope.initMcqFormDataModel = function(questionIndex) {
                        $scope.mcqFormDataModel[questionIndex] = {}
                        $scope.mcqFormDataModel[questionIndex].questionId = questionIndex + 1;
                    }

                    $scope.changeTab = function(tabIndex) {
                        $scope.selectedIndex = tabIndex;
                    }

                    $scope.signInToPlay = function() {
                        $window.location.href = $attrs.signInUrl;
                    }

                    $scope.openLuggage = function() {
                        if ($scope.startedLoading) {
                            return;
                        }

                        $scope.startedLoading=true;
                        $scope.rendering=true;
                        $scope.waiting=true;

                        $http({
                            method: 'GET',
                            url: $attrs.actionUrl,
                            params: {
                                gameTypeId: $attrs.gameTypeId
                            }
                        }).then(function successCallback(response) {
                            var result = response.data;

                            if (result.isGameSubmitted) {
                                $scope.gotPrize(result, false);
                            }
                        });
                    }

                    $scope.spinWheel = function() {
                        if ($scope.startedLoading) {
                            return;
                        }

                        $scope.startedLoading=true;
                        $scope.rendering=true;
                        $scope.waiting=true;

                        $http({
                            method: 'GET',
                            url: $attrs.actionUrl,
                            params: {
                                gameTypeId: $attrs.gameTypeId
                            }
                        }).then(function successCallback(response) {
                            var result = response.data;

                            if (result.isGameSubmitted) {
                                $scope.gotPrize(result, true);
                            }
                        });
                    }

                    $scope.gotPrize=function(prize, isSpinWheel){
                        $scope.waiting=false;
                        if (!$scope.spinDone){
                            $scope.rendering=false;

                            if (isSpinWheel) {
                                let spinDegree = Math.floor(Math.random()*58);

                                if (Math.random() >= 0.5) {
                                    spinDegree += 180;
                                }

                                if (prize.isFreeGiftGamePrize) {
                                    spinDegree += 60;
                                } else if (prize.isCouponGamePrize) {
                                    spinDegree += 120;
                                }

                                $scope.prize1="transform: rotate("+(spinDegree+3601)+"deg)";
                            }
                            $scope.spinDone=true;
                            $timeout(function(){
                                ysApp.product.winAnAdventCalendar = prize;
                            },isSpinWheel ? 6000 : 1680);
                        }
                    }

                    $scope.submitMcqGameForm = function() {
                        $scope.rendering=true;

                        // check answers
                        if (!isMcqFormCompleted()) {
                            return;
                        }

                        var data = {
                            'mcqSelectedJsonData' : $scope.mcqFormDataModel
                        };

                        $http({
                            method: 'POST',
                            url: $attrs.actionUrl,
                            data: data
                        }).then(function successCallback(response) {
                            var result = response.data;

                            if (result.isGameSubmitted) {
                                $scope.rendering=false;

                                ysApp.product.winAnAdventCalendar = result;
                            }
                        });
                    }

                    $scope.startPicking = false;

                    $scope.pickupGift = function(){
                        $scope.startPicking = true;
                        $scope.randomAnimate();
                    }

                    var randomBox, disableRndBox, ACBox;
                    var boxImages=[];

                    $scope.stopLoop = function(){
                        $timeout.cancel(randomBox);
                        $timeout.cancel(disableRndBox);
                    }

                    $scope.randomAnimate = function(){
                        $scope.stopLoop();
                        if ($scope.startPicking){
                            randomBox = $timeout(function(){
                                if (typeof boxImages !=='undefined' && boxImages.length == 0){
                                    preloadImage();
                                }
                                var imagesHover = document.querySelectorAll(".pickboxes img");
                                angular.forEach(imagesHover, function(tag){
                                    var tempSrc = tag.src;
                                    tag.onmouseover = function(){
                                        tag.src = tag.src.replace(".jpg",".gif");
                                    }
                                    tag.onmouseout = function(){
                                        tag.src=tempSrc;
                                    }
                                });
                                randomAnimate();
                            },10);
                        }
                    }

                    $scope.submitPickedBox = function() {
                        $scope.rendering=true;
                        $scope.stopLoop();

                        $http({
                            method: 'GET',
                            url: $attrs.pickGiftUrl,
                        }).then(function successCallback(response) {
                            var result = response.data;

                            if (result.isGameSubmitted) {
                                $scope.rendering=false;
                                $scope.startPicking = false;

                                ysApp.product.winAnAdventCalendar = result;
                            }
                        });
                    }

                    function preloadImage() {
                        var path = document.querySelector("img[alt='Box 1']").src;
                        var n = path.lastIndexOf("/");
                        var slicedPath = path.substr(0,n+1);
                        for (var i=1; i<=24; i++){
                            temp = (i < 10) ? "0"+i : i;
                            boxImages[i] = new Image();
                            boxImages[i].src = slicedPath+temp+".gif";
                        }
                    }

                    function randomAnimate() {
                        var newBox = Math.floor((Math.random() * 24) + 1);
                        ACBox = newBox != ACBox ? newBox : (newBox + 1 > 24) ? newBox-1 : newBox+1;
                        var selectedImg = document.querySelector("img[alt='Box "+ACBox+"']");
                        var tempSrc = selectedImg.src;
                        selectedImg.src = selectedImg.src.replace(".jpg",".gif");
                        disableRndBox = $timeout(function(){
                            selectedImg.src = tempSrc;
                            randomAnimate();
                        },3000);
                    }

                    function isMcqFormCompleted() {
                        var result = true;

                        if ($scope.mcqFormDataModel.length != 3) {
                            result = false;
                        } else {
                            for (index in $scope.mcqFormDataModel) {
                                if (typeof $scope.mcqFormDataModel[index].questionId == 'undefined'
                                        || typeof $scope.mcqFormDataModel[index].selectedAnswerId == 'undefined') {
                                    result = false;
                                    break;
                                }
                            }
                        }

                        return result;
                    }
                }
            }
        });

	    return app;
	}
);