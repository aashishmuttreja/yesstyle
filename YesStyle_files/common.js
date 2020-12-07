/*
 * Copyright (C) 2016 YesAsia.com (Hong Kong) Limited
 */
define(['angularjs',
        'plugin_lib'], 
    function(angular, $log) {
		'use strict';
		
		var app = angular.module('common', 
				['ngMaterial', 
				 'noCAPTCHA', 
				 'ngFileUpload']);
		
		app.config(function($logProvider){
			if (typeof ysDebug === 'undefined') {
				$logProvider.debugEnabled(false);
			}
		});
		
		app.config(['noCAPTCHAProvider', function (noCaptchaProvider) {
		    noCaptchaProvider.setSiteKey(ysApp.config.reCaptchaPublicKey);
		    noCaptchaProvider.setTheme('clean');
		}]).controller('frontendCaptchaController', ['$scope', function($scope){
	          $scope.captchaControl = {};
	          $scope.resetCaptcha = function(){
	            if(captchaControl.reset){
	              captchaControl.reset();
	            }
	          };
	        }]);

		// config mdDialog
		// TODO consider to move the html out of the template 
		app.config(function($mdDialogProvider) {
			
			$mdDialogProvider.addPreset('showPresetDialog', {
			  options: function() {
			    return {
			      template:
			    	'<md-dialog aria-label="{{title}}">' +
				      '<md-toolbar>' +
				        '<div class="md-toolbar-tools toolbarGradient">' +
				          '<h2>{{title}}</h2>' +
				          '<span flex></span>' +
				          '<md-button class="md-icon-button closeButton" ng-click="cancel()" aria-label="Close Dialog">&times;</md-button>' +
				        '</div>' +
				      '</md-toolbar>' +
				      '<md-dialog-content>' +
				        '<div class="md-dialog-content" ng-bind-html="content | unsafe"></div>' +
				      '</md-dialog-content>' +
				      '<md-dialog-actions layout="row" ng-if="showAction && showClose">' +
				        '<md-button ng-if="showAction" class="md-raised md-primary" ng-click="hide()">Shop Now!</md-button>' +
				        '<md-button ng-if="showClose" ng-click="cancel()">Close</md-button>' +
				      '</md-dialog-actions>' +
				    '</md-dialog>',
			      controller: function($scope, $rootScope, $mdDialog, locals) {					  
			    	  $scope.title = locals.title;
			    	  
			    	  $scope.content = locals.content;

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

		// Autofocus doesn't focusing input on ios 10
        // Related Discussion: https://github.com/angular/material/issues/10080
        // Official Document: https://material.angularjs.org/latest/api/service/$mdGestureProvider
        app.config(function($mdGestureProvider) {
           $mdGestureProvider.skipClickHijack();
        });
		
		app.filter('unsafe', function($sce) {
		    return function(val) {
		        return $sce.trustAsHtml(val);
		    };
		});
		
		// service to manage the security
		app.factory('ReviewService', ['$injector', '$log', function($injector, $log) {
		    var reviewService = {};
			
		    reviewService.getRatingPercent = function (percentage) {
		    	var starWidth=16.65;
				var spaceWidth=5;
				return {"width":(starWidth*5*percentage/100) + parseInt(percentage/20-0.1)*spaceWidth +"px"};
			}
		    
		    return reviewService;
		}]);
		
		// service to manage the security
		app.factory('CommonService', ['$injector', '$log', function($injector, $log) {
		    var commonService = {};
		    
		    var loadingErrorLock = false;
		    commonService.showLoadingError = function() {
		        // ref.: http://hk-system-s01/content_bugzilla/show_bug.cgi?id=70300
                if (!ysApp.config.skipLoadingError) {
                    if (!loadingErrorLock) {
                        var $mdBottomSheet = $injector.get('$mdBottomSheet');
                        var $templateCache = $injector.get('$templateCache');
                        $mdBottomSheet.show({
                            template: $templateCache.get('errorSheet'),
                            clickOutsideToClose: false,
                            controller: function($scope, $mdBottomSheet){
                                $scope.hide=function(){
                                    $mdBottomSheet.hide();

                                    loadingErrorLock = false;
                                }
                            }
                        });
                        loadingErrorLock = true;
                    }
                }
			}
		    
		    var loadingLock = false;
		    var panelRef;
			var loading = {};
			var loadingCtrl = function ($scope, mdPanelRef){
				loading.closeDialog = function() {
					setTimeout(function(){
						mdPanelRef && mdPanelRef.close();
					}, 1);
				}
			};
			commonService.showLoadingPanel = function ($event){
				if (!loadingLock) {
					loadingLock = true;
					var $mdPanel = $injector.get('$mdPanel');
					var $templateCache = $injector.get('$templateCache');
					
					var config = {
		    	      attachTo: angular.element(document.body),
		    	      controller: loadingCtrl,
		    	      controllerAs: 'ctrl',
		    	      targetEvent: $event,
		    	      zIndex: 81,
		    	      template: $templateCache.get('contentLoading'),    	      
		    	      hasBackdrop: false,
		    	      fullscreen: true,
		    	      clickOutsideToClose: false,
		    	      escapeToClose: false,
		    	      focusOnOpen: true
		    	    }
					
				    $mdPanel.open(config).then(function(result) {
				      panelRef = result;
			        });
				}
			}
			commonService.hideLoadingPanel = function () {
				if (loading.closeDialog) {
					loading.closeDialog();
				}
				
				loadingLock = false;
			}
			
			
			commonService.updateCookie = function (cookieJsonDatas) {
	            if (cookieJsonDatas) {
	            	angular.forEach(cookieJsonDatas, 
            			function(value, key) {
	            			//$log.debug('cookie: key=' + key + ', name=' + value.key + ', value=' + value.value + ', domain=' + value.domain + ', path=' + value.path + ', secure=' + value.secure + ', expire=' + value.expiresInSec);
	            		    var cookieValue = value.key + '=' +  value.value;
	            			if (value.domain) {
	            				cookieValue += ';domain=' + value.domain;
	            			}
	            			
	            			if (value.path) {
	            				cookieValue += ';path=' + value.path;
	            			}
	            			
	            			if (value.secure) {
	            				cookieValue += ';secure=' + value.secure;
	            			}
	            			
	            			if (value.expiresInSec && value.expiresInSec >= 0) {
	            				var expiresDate = new Date();
	            				expiresDate.setTime(expiresDate.getTime()+(value.expiresInSec*1000));
	            				cookieValue += ';expires=' + expiresDate.toUTCString();
	            			}	
	            			
	            			document.cookie = cookieValue;
	            		}
	            	);
	            }
			}
			
			var backToTopUrl = "";
			commonService.setBackToTopUrl = function(url) {
				backToTopUrl = url;
			}
			
			commonService.getBackToTopUrl = function() {
				return backToTopUrl;
			}
			
		    // Checking of Mobile Device
		    // Usage: 
			//   1. Tooltips will be hidden for mobile device
			//   2. Navigation menu beauty tab will not link to beauty page for mobile device
		    // Related Panels: Brand.html, ProductHeading.html, Details.html, NavigationMenu.html
			commonService.isNotMobile = function() {
				var check = false;
				(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
				return !check;
			}

			commonService.pushDataLayer = function(ecommerceJson) {
                if(typeof dataLayer != 'undefined'){
                    // always unescape
                    dataLayer.push(ecommerceJson);
                }

                // do nth if dataLayer is not fine
			}

			commonService.getCoords = function(elem) {
                var box = elem.getBoundingClientRect();
                var body = document.body;
                var docEl = document.documentElement;
                var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
                var clientTop = docEl.clientTop || body.clientTop || 0;
                var top  = box.top +  scrollTop - clientTop;
                return {top: Math.round(top)};
            }

		    return commonService;
		}]);

        app.factory('UserAgentService', ['$injector', '$log', function($rootScope, $injector, $log) {
            var userAgentService = {};

            userAgentService.isInAppBrowser = function() {
                // detect Facebook and Instagram in-app browser
                // ref.: https://developers.whatismybrowser.com/useragents/explore/software_type_specific/in-app-browser/
                var ua = navigator.userAgent;
                if (ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1 || ua.indexOf('Instagram') > -1) {
                    return true;
                }

                return false;
            }

            return userAgentService;
        }]);

		// service to manage the saved item
		app.factory('SavedItemService', ['$injector', '$log', function($rootScope, $injector, $log) {
		    var savedItemService = {};
		    savedItemService.savedItemProductIds = ysApp.savedItemProductIds;

		    savedItemService.get = function() {
		    	return savedItemService.savedItemProductIds;
		    }

		    savedItemService.add = function(productIds) {
		    	if (productIds && productIds.length > 0) {
			    	for (var i = 0; i < productIds.length; i++) {
			    		if (savedItemService.savedItemProductIds) {
			    			savedItemService.savedItemProductIds.push(productIds[i]);
			    		}
			    	}
		    	}
		    };

		    savedItemService.set = function(savedItemProductIds) {
		    	savedItemService.savedItemProductIds = savedItemProductIds;
		    };

		    savedItemService.isSavedItem = function(productId, childProducts) {
		    	if (savedItemService.savedItemProductIds && savedItemService.savedItemProductIds.indexOf(productId) >= 0) {
		    		return true;
		    	}

		    	if (childProducts && childProducts.length > 0) {
			    	for (var i = 0; i < childProducts.length; i++) {
			    		if (savedItemService.savedItemProductIds && savedItemService.savedItemProductIds.indexOf(childProducts[i]) >= 0) {
			    			return true;
			    		}
			    	}
		    	}

		    	return false;
		    }

		    return savedItemService;
		}]);

		// service to manage the saved item
		app.factory('LoadingService', ['$injector', '$log', function($rootScope, $injector, $log) {
		    var loadingService = {};
		    loadingService.blockAjaxLoading = false;

		    loadingService.isBlockAjaxLoading = function() {
		    	return loadingService.blockAjaxLoading;
		    }

		    loadingService.setBlockAjaxLoading = function(blockAjaxLoading) {
		    	loadingService.blockAjaxLoading = blockAjaxLoading;
		    }

		    return loadingService;
		}]);

		app.factory('EmarsysService', ['$injector', '$log', function($rootScope, $injector, $log) {
			var emarsysService = {};

			emarsysService.loadMoreLock = false;

			emarsysService.getLoadMoreLock = function() {
		    	return emarsysService.loadMoreLock;
		    }

			emarsysService.setLoadMoreLock = function(isLocked) {
				emarsysService.loadMoreLock = isLocked;
		    };

		    return emarsysService;
		}]);

		app.factory('UploadService', ['$rootScope', '$injector', '$log', '$http', 'Upload', function($rootScope, $injector, $log, $http, Upload) {
			var uploadService = {};

			// Set the max file uploaded
			var max = 4;

			var uploadedObjectKeys = [];

			uploadService.getMaxCount = function() {
				return max;
			};

			uploadService.requestForUpload = function(file,
					ysAmazonS3ConfigurationUrl) {
				return $http({
		        	method: 'GET',
		        	url: ysAmazonS3ConfigurationUrl,
		        	params: {
		        		fileName: file.name,
		        		fileType: file.type
		        	}
	        	});
			};

			uploadService.upload = function(file, bucketUploadUrl,
					configOptionsJsonData) {
				configOptionsJsonData['file'] = file;

				return Upload.upload({
					  url: bucketUploadUrl,
					  method: 'POST',
	            	  data: configOptionsJsonData
            	});
			};

			uploadService.addUploadedObjectKey = function(objectKey) {
				uploadedObjectKeys.push(objectKey);
			};

			uploadService.removeUploadedObjectKey = function(index) {
				uploadedObjectKeys.splice(index, 1);
			};

			uploadService.getUploadedObjectKeysString = function(index) {
				var result = "";

				if (uploadedObjectKeys == null) {
					return result;
				}

				angular.forEach(uploadedObjectKeys, function(value, key) {
					result += (key == 0 ? value : "," + value);
		        });

				return result;
			};

			uploadService.resetUploadedObjectKeys = function() {
				uploadedObjectKeys = [];
			};

			var igPhotoObjectKeys = [];

			uploadService.addUploadedIgPhotoObjectKey = function(objectKey) {
                igPhotoObjectKeys.push(objectKey);
            };

            uploadService.removeUploadedIgPhotoObjectKey = function() {
                igPhotoObjectKeys = [];
            };

            uploadService.getUploadedIgPhotoObjectKeysString = function(index) {
                var result = "";

                if (igPhotoObjectKeys == null) {
                    return result;
                }

                angular.forEach(igPhotoObjectKeys, function(value, key) {
                    result += (key == 0 ? value : "," + value);
                });

                return result;
            };

			return uploadService;
		}]);

		app.factory('BasketItemService', ['$rootScope', '$injector', '$log', 'CommonService', 'DynamicYieldService', function($rootScope, $injector, $log, CommonService, DynamicYieldService) {
		    var basketItemService = {};
		    basketItemService.basketItemProductsCount = ysApp.basketItemProductsCount;

		    basketItemService.get = function() {
		    	return basketItemService.basketItemProductsCount;
		    }

		    basketItemService.add = function(geData, facebookConversionProduct) {
		    	basketItemService.basketItemProductsCount++;

		    	CommonService.pushDataLayer(geData);

		    	if (typeof fbq !== 'undefined' && typeof facebookConversionProduct !== 'undefined') {
		    		fbq('track', 'AddToCart', facebookConversionProduct);

                    if(typeof dataLayer != 'undefined'){
                        dataLayer.push({'event':'page_view',
                                'product_sku': facebookConversionProduct.contents,
                                'product_price': facebookConversionProduct.value
                        });
                    }
		    	}

		    	if (typeof snaptr !== 'undefined') {
		    	    snaptr('track', 'ADD_CART');
		    	}

		    	//  add pinterest pixel ref.: http://hk-system-s01/content_bugzilla/show_bug.cgi?id=63156
                if (typeof pintrk !== 'undefined') {
                    pintrk('track', 'addtocart');
                }

                if (typeof branch !== 'undefined') {
                    if (typeof ysApp.config.feature !== 'undefined' && ysApp.config.feature) {
                        var product = geData.ecommerce.add.products[0];

                        // branch io phrase 2 starts
                        var event_and_custom_data = {
                            "productId": product.id,
                            "productName": product.name,
                            "productBrand": product.brand,
                            "quantity" : product.quantity,
                        };

                        var content_items = [
                            {
                                "$sku": product.id,
                                "$product_name": product.name,
                                "$product_brand": product.brand,
                                "$quantity" : product.quantity,
                             }
                        ];

                        branch.logEvent(
                           "ADD_TO_CART",
                           event_and_custom_data,
                           content_items,
                           function(err) {  }
                        );
                    }
                }

		    };

		    basketItemService.delete = function() {
		    	basketItemService.basketItemProductsCount--;
		    };

		    basketItemService.delete = function(geData, quantity) {
		    	basketItemService.basketItemProductsCount
		    			= basketItemService.basketItemProductsCount - quantity;

                CommonService.pushDataLayer(geData);
		    };

		    basketItemService.set = function(count) {
		    	basketItemService.basketItemProductsCount = count;
		    };

		    basketItemService.pushScarabQueue = function(externalShopperId, basketLineItems) {
                if (externalShopperId){
                    ScarabQueue.push(['setCustomerId', externalShopperId]);
                }

                var items = [];
                for (var i = 0; i < basketLineItems.length; i++ ){
                    var item = basketLineItems[i];
                    items.push({item: item.parentProductId, price: item.emarsysSellPrice * item.quantity,
                            quantity: item.quantity});
                }
                ScarabQueue.push(['cart', items]);
                ScarabQueue.push(['go']);
		    }

		    return basketItemService;
		}]);

		app.factory('BranchIoService', ['$rootScope', '$injector', '$log', 'CommonService', function($rootScope, $injector, $log, CommonService) {
            var branchIoService = {};

            branchIoService.get = function() {
                return branchIoService;
            }

            branchIoService.set = function(deeplinkPath, branchioKey) {
                branchIoService.deeplinkPath = deeplinkPath;
                branchIoService.branchioKey = branchioKey;
            };

            return branchIoService;
        }]);

        app.factory('DynamicYieldService', [function() {
            var dynamicYieldService = {};

            dynamicYieldService.addToCart = function(value, sku, quantity) {
                if (typeof value !== 'undefined' && typeof sku !== 'undefined' && typeof quantity !== 'undefined') {
                    // cast price to float
                    if (typeof value !== "float") {
                        value = parseFloat(value);
                    }

                    // validation
                    if (Number.isNaN(value) || value <= 0 || sku == '' || quantity < 0) {
                        console.log('value failure');
                        return;
                    }

                    // prepare track event properties
                    var properties = {
                        dyType: "add-to-cart-v1",
                        value: value,
                        currency: "USD",
                        productId: sku,
                        quantity: quantity
                    };

                    // DY track event
                    dynamicYieldService.trackEvent("Add to Cart", properties);
                }

                return;
            }

            dynamicYieldService.itemDidChangeQuantity = function(oldQuantity, newQuantity, unitPrice, productId) {
                if (typeof oldQuantity == 'undefined' || typeof newQuantity == 'undefined' || typeof unitPrice == 'undefined'
                    || oldQuantity < 0 || newQuantity < 0 || newQuantity == oldQuantity) {
                    return;
                }

                var diffQuantity = newQuantity - oldQuantity;
                if (diffQuantity > 0) {
                    // add to cart
                    dynamicYieldService.addToCart(diffQuantity * unitPrice, productId.toString(), diffQuantity);
                } else {
                    // remove from cart
                    dynamicYieldService.removeFromCart(-diffQuantity * unitPrice, productId.toString(), -diffQuantity);
                }
            }

            dynamicYieldService.login = function(externalShopperId) {
                if (typeof externalShopperId !== 'undefined' && externalShopperId != '') {
                    var properties = {
                        dyType: "login-v1",
                        cuid: externalShopperId,
                        cuidType: "External Shopper Id"
                    };

                    dynamicYieldService.trackEvent("Login", properties);
                }

                return;
            }

            dynamicYieldService.ncPurchase = function(properties) {
                dynamicYieldService.trackEvent("NC order", properties);

                return;
            }

            dynamicYieldService.purchase = function(properties) {
                properties.dytype = "purchase-v1";
                dynamicYieldService.trackEvent("Purchase", properties);

                return;
            }

            dynamicYieldService.removeFromCart = function(totalValue, sku, quantity) {
                if (typeof totalValue !== 'undefined' && typeof sku !== 'undefined' && typeof quantity !== 'undefined') {
                    // cast price to float
                    if (typeof totalValue !== "float") {
                        totalValue = parseFloat(totalValue);
                    }

                    // validation
                    if (Number.isNaN(totalValue) || totalValue <= 0 || sku == '' || quantity < 0) {
                        console.log('value failure');
                        return;
                    }

                    // prepare track event properties
                    var properties = {
                        dyType: "remove-from-cart-v1",
                        value: totalValue,
                        currency: "USD",
                        productId: sku,
                        quantity: quantity
                    };

                    // DY track event
                    dynamicYieldService.trackEvent("Remove From Cart", properties);
                }

                return;
            }

            dynamicYieldService.signup = function(externalShopperId) {
                if (typeof externalShopperId !== 'undefined' && externalShopperId != '') {
                    var properties = {
                        dyType: "signup-v1",
                        cuid: externalShopperId,
                        cuidType: "External Shopper Id"
                    };

                    dynamicYieldService.trackEvent("Signup", properties);
                }

                return;
            }

            dynamicYieldService.trackEvent = function(eventName, properties) {
                if (typeof eventName !== 'undefined' && eventName != '' && typeof properties !== 'undefined') {
                    if (typeof DY !== 'undefined') {
                        DY.API("event", {
                            name: eventName,
                            properties: properties
                        });
                    }
                }

                return;
            }

            return dynamicYieldService;
        }]);

		// service to manage the security
		app.factory('SessionService', ['$cookies', '$q', '$injector', '$log', function($cookies, $q, $injector, $log) {
			var token = ysApp.config.security;

		    var sessionService = {};
		    sessionService.maxRetryCount = 0;

		    sessionService.getMaxRetryCount = function() {
		    	return sessionService.maxRetryCount;
		    }

		    sessionService.addMaxRetryCount = function() {
		    	sessionService.maxRetryCount++;
		    }

		    function doAuthenticate() {
		    	// defer until we can re-request a new token
                var deferred = $q.defer();

                $injector.get("$http").get(ysApp.config.authUrl).then(function(response) {
                	deferred.resolve(response);

                	token = response.data;
                }, function(response) {
                	deferred.reject();

                    return;
                });

                return deferred.promise;
		    };

		    sessionService.authenticate = function() {
		    	return doAuthenticate();
		    };

		    sessionService.getToken = function() {
		        return token;
		    };

		    sessionService.isInitializated = function() {
		    	if (angular.isObject(token)) {
		    		return true
		    	} else {
		    		return false;
		    	}
		    };

		    return sessionService;
		}]);

		app.factory('sessionInjector', ['SessionService', 'CommonService', 'LoadingService', '$q', '$injector', '$log', function(SessionService, CommonService, LoadingService, $q, $injector, $log) {
			var token = null;

			var sessionInjector = {
			    request: function(config) {
					// quick fix
					// ref : http://stackoverflow.com/questions/23021416/how-to-use-angularjs-interceptor-to-only-intercept-specific-http-requests
			    	// temporarily stop show loading for emarsys
					if (config.url.indexOf("/rest/") >= 0
							&& !ysApp.config.emarsysLoadingLock
							&& !LoadingService.isBlockAjaxLoading()) {
						CommonService.showLoadingPanel();
					}

					if (config.notoken === undefined || !config.notoken) {
					    config.headers = SessionService.getToken();
					}

			        return config;
			    },
			    requestError: function(rejectReason) {
			    	CommonService.showLoadingError();

			    	CommonService.hideLoadingPanel();

			    	$log.error('request error');

			    	return $q.reject(rejectReason);
		        },
		        response: function(response){
					if (response.config.url.indexOf("/rest/") >= 0) {
						CommonService.hideLoadingPanel();
					}

		        	return response;
		        },
		        responseError: function(response) {
		            if (response.status == 440){
		                var SessionService = $injector.get('SessionService');
		                var $http = $injector.get('$http');
		                var deferred = $q.defer();

		                SessionService.addMaxRetryCount();

		                if (SessionService.getMaxRetryCount() && SessionService.getMaxRetryCount() >= 5) {
		                	CommonService.showLoadingError();
		                } else {
			                // recover the session using the current credentials
			                SessionService.authenticate().then(deferred.resolve, deferred.reject);

			                // call back the original request again
			                return deferred.promise.then(function() {
			                    return $http(response.config);
			                });
		                }
		            } else {
		            	CommonService.showLoadingError();
		            }

		            CommonService.hideLoadingPanel();

		            return $q.reject(response);
		        }
		    };

			return sessionInjector;
		}]);

		// config same https service ...
		app.config(function($httpProvider) {
			$httpProvider.interceptors.push(function(sessionInjector) {
				return sessionInjector;
			});
		});

		// Directive
		app.directive("ysForm", function($window) {
			return {
				scope: true,
				restrict: "A",
//				require: "ngModel",
				controller: function($scope, $http, $attrs, $log, CommonService, UploadService, DynamicYieldService) {
					$scope.form = {};
					$scope.status = {};

					$scope.submitForm=function(){
				        var data=$scope.form;

				        data.uploadedObjectKeys = UploadService.getUploadedObjectKeysString();

				        $log.debug(data);

				        // disable submit event to prevent duplicated form submit
				        $scope.disableSubmit = true;

				        // get the dynamic form submit url
				        var url=$attrs.actionUrl;
				        $http({
				        	method: 'POST',
				        	url: url,
				        	data: data
			        	}).then(function successCallback(response) {
				            var result = response.data;

				            // reset all errors
				            $scope.errors = {};

				            if (result.errors) {
				            	angular.forEach(result.errors,
			            			function(value, key) {
				            			$log.debug('error code: fieldName=' + value.fieldName + ', errorCode=' + value.errorCode + ', shorMessage=' + value.shortMessage);

				            			$scope.errors[value.fieldName + value.errorCode] = true;

				            			// upload file error
				            			if (value.errorCode == 7000) {
				            				$scope.resetFiles();
				            			}
				            		}
				            	);
			            	}

				            // add or update cookie(s) if needed
				            if (result.cookies) {
				            	angular.forEach(result.cookies,
			            			function(value, key) {
				            		    //$log.debug('cookie: key=' + key + ', name=' + value.key + ', value=' + value.value + ', domain=' + value.domain + ', path=' + value.path + ', secure=' + value.secure + ', expire=' + value.expiresInSec);

				            		    var cookieValue = value.key + '=' +  value.value;
				            			if (value.domain) {
				            				cookieValue += ';domain=' + value.domain;
				            			}

				            			if (value.path) {
				            				cookieValue += ';path=' + value.path;
				            			}

				            			if (value.secure) {
				            				cookieValue += ';secure=' + value.secure;
				            			}

				            			if (value.expiresInSec && value.expiresInSec >= 0) {
				            				var expiresDate = new Date();
				            				expiresDate.setTime(expiresDate.getTime()+(value.expiresInSec*1000));
				            				cookieValue += ';expires=' + expiresDate.toUTCString();
				            			}

				            			document.cookie = cookieValue;
				            		}
				            	);
				            }

				            // handle misc
				            if (result.misc) {
				            	$scope.misc = {};

				            	$scope.misc = result.misc;

                                // Google tag tracking - Sign in successful
                                if (result.misc.gecssicTrack) {
                                    CommonService.pushDataLayer(result.misc.gecssicTrack);
                                }

                                if (result.misc.gecssitTrack) {
                                    CommonService.pushDataLayer(result.misc.gecssitTrack);
                                }

                                // DY - track login
                                if (result.misc.externalShopperIdForTrackLogin) {
                                    DynamicYieldService.login(result.misc.externalShopperIdForTrackLogin);
                                }

                                if (result.misc.externalShopperIdForTrackSignup) {
                                    DynamicYieldService.signup(result.misc.externalShopperIdForTrackSignup);
                                }
				            }

				            // redirect if needed
							if (result.redirectUrl) {
								CommonService.showLoadingPanel();

								$window.location.href = result.redirectUrl;
								return false;
							}

							// reset captcha everytime after submit
							if ($scope.captchaControl) {
							  $scope.captchaControl.reset();
							}

							$scope.disableSubmit = false;

							UploadService.resetUploadedObjectKeys();

							// reset password fields
                            $scope.$broadcast('reset-ys-form-password');

		        	 	});
				    }

					$scope.enableSignInAsDifferentUser = function() {
						$scope.form.isSignInAsDifferentUser = false;
					}

					$scope.resetFiles = function() {
						$scope.$broadcast('ys-upload-reset-files');
					}
				}
			}

		});

		app.directive("ysWriteAReviewButton", function($http, $templateCache, $mdDialog, $window) {
            return {
                restrict: "AE",
                scope: true,
                controller: function($scope, $attrs, UploadService){
                    $scope.writeReviewForm = {};
                    $scope.videoReviewStatus = {};
                    $scope.videoReviewStatus.isInvalidPhrase = false;
                    $scope.videoReviewStatus.isShowReportedSuccess = false;
                    $scope.videoReviewStatus.isOnHold = false;
                    $scope.videoReviewStatus.isPending = false;

                    $scope.generalReviewStatus = {};
                    $scope.generalReviewStatus.isInvalidPhrase = false;
                    $scope.generalReviewStatus.isShowReportedSuccess = false;
                    $scope.generalReviewStatus.isOnHold = false;
                    $scope.generalReviewStatus.isPending = false;

                    $scope.reviewSubmitted = false;

                    $scope.onSelectRatingStar = function(ratingClass, reviewRatingId) {
                        $scope.writeReviewForm.ratingId = reviewRatingId;
                        $scope.rating = ratingClass;

                    }

                    $scope.onShowWriteAReview = function(ev) {
                        $scope.writeReviewForm = {};
                        $scope.status = {};
                        $scope.errors = {};
                        $scope.rating = null;
                        $scope.generalReviewStatus.isShowReportedSuccess = false;
                        $scope.generalReviewStatus.isOnHold = false;
                        $scope.generalReviewStatus.isPending = false;
                        $scope.generalReviewStatus.isInvalidPhrase = false;
                        $scope.videoReviewStatus.isInvalidPhrase = false;
                        $scope.videoReviewStatus.isShowReportedSuccess = false;
                        $scope.videoReviewStatus.isOnHold = false;
                        $scope.videoReviewStatus.isPending = false;
                        UploadService.resetUploadedObjectKeys();
                        UploadService.removeUploadedIgPhotoObjectKey();
                        $scope.reviewExtraInformationFormSetting = ysApp.reviewExtraInformationFormSetting;
                        if ($scope.reviewExtraInformationFormSetting) {
                            $scope.reviewExtraInformationFormSetting.supportProfileSection = $attrs.supportProfileSection;
                        }

                        $mdDialog.show({
                          targetEvent: ev,
                          fullscreen: true,
                          controller:DialogController,
                          scope: $scope.$new(),
                          template: $templateCache.get('/review/WriteAReview.html'),
                          parent: angular.element(document.body),
                          clickOutsideToClose: false,
                          disableParentScroll: true
                        });

                        function DialogController($scope, $mdDialog) {
                          $scope.hide = function() {
                            $mdDialog.hide();

                            if ($scope.reviewSubmitted && $scope.orders) {
                                $scope.updateOrders();
                            }
                          };
                          $scope.cancel = function() {
                            $mdDialog.cancel();

                            if ($scope.reviewSubmitted && $scope.orders) {
                                $scope.updateOrders();
                            }
                          };
                        }
                    }

                    $scope.onChangeCustomerProfileOpt = function() {

                        if ($scope.writeReviewForm.productUsageAnswer != undefined
                                && $scope.writeReviewForm.productUsageAnswer != null
                                && $scope.writeReviewForm.productUsageAnswer == '214') { // 214 means 'Selfuse'
                            if ($scope.reviewExtraInformationFormSetting.beautyProfileGenderAnswer != undefined
                                    && $scope.reviewExtraInformationFormSetting.beautyProfileGenderAnswer != null) {
                                $scope.writeReviewForm.genderAnswer
                                        = $scope.reviewExtraInformationFormSetting.beautyProfileGenderAnswer.key;
                            }

                            if ($scope.reviewExtraInformationFormSetting.beautyProfileAgeRangeAnswer != undefined
                                    && $scope.reviewExtraInformationFormSetting.beautyProfileAgeRangeAnswer != null) {
                                $scope.writeReviewForm.ageRangeAnswer
                                        = $scope.reviewExtraInformationFormSetting.beautyProfileAgeRangeAnswer.key;
                            }

                            if ($scope.reviewExtraInformationFormSetting.beautyProfileSkinTypeAnswer != undefined
                                    && $scope.reviewExtraInformationFormSetting.beautyProfileSkinTypeAnswer != null) {
                                $scope.writeReviewForm.skinTypeAnswer
                                        = $scope.reviewExtraInformationFormSetting.beautyProfileSkinTypeAnswer.key;
                            }

                            if ($scope.reviewExtraInformationFormSetting.beautyProfileSkinToneAnswer != undefined
                                    && $scope.reviewExtraInformationFormSetting.beautyProfileSkinToneAnswer != null) {
                                $scope.writeReviewForm.skinToneAnswer
                                        = $scope.reviewExtraInformationFormSetting.beautyProfileSkinToneAnswer.key;
                            }

                        }

                        if ($scope.writeReviewForm.productUsageAnswer != undefined
                                && $scope.writeReviewForm.productUsageAnswer != null
                                && $scope.writeReviewForm.productUsageAnswer == '215') { // 215 means 'Others'
                            if ($scope.reviewExtraInformationFormSetting.beautyProfileGenderAnswer != undefined
                                    && $scope.reviewExtraInformationFormSetting.beautyProfileGenderAnswer != null) {
                                $scope.writeReviewForm.genderAnswer = null;
                            }

                            if ($scope.reviewExtraInformationFormSetting.beautyProfileAgeRangeAnswer != undefined
                                    && $scope.reviewExtraInformationFormSetting.beautyProfileAgeRangeAnswer != null) {
                                $scope.writeReviewForm.ageRangeAnswer = null;
                            }

                            if ($scope.reviewExtraInformationFormSetting.beautyProfileSkinTypeAnswer != undefined
                                    && $scope.reviewExtraInformationFormSetting.beautyProfileSkinTypeAnswer != null) {
                                $scope.writeReviewForm.skinTypeAnswer = null;
                            }

                            if ($scope.reviewExtraInformationFormSetting.beautyProfileSkinToneAnswer != undefined
                                    && $scope.reviewExtraInformationFormSetting.beautyProfileSkinToneAnswer != null) {
                                $scope.writeReviewForm.skinToneAnswer = null;
                            }

                        }

                    }

                    $scope.loadWriteMoreReview = function() {
                        $scope.writeMoreReviewData = [];

                        $http({
                            method: 'GET',
                            url: $attrs.ysWriteMoreReviewUrl,
                            params: {
                                skippedProductId : $attrs.reviewProductId
                            }
                        }).then(function successCallback(response) {
                            $scope.writeMoreReviewData = response.data;
                        });
                    }

                    $scope.onWriteGeneralReview = function() {
                        // disable submit event to prevent duplicated form submit
                        $scope.disableSubmit = true;
                        $scope.pleaseGetPhotoFromIG = false;
                        $scope.writeReviewForm.productId = $attrs.reviewProductId;
                        $scope.writeReviewForm.uploadedObjectKeys = UploadService.getUploadedObjectKeysString();
                        $scope.writeReviewForm.igPhotoObjectKeys = UploadService.getUploadedIgPhotoObjectKeysString();
                        $scope.writeReviewForm.orderInfoId = $attrs.reviewOrderInfoId;

                        // remind customer get photo from IG
                        if (typeof ($scope.writeReviewForm.igUploadUrl) != "undefined"
                            && $scope.writeReviewForm.igUploadUrl != ''
                            && $scope.writeReviewForm.igPhotoObjectKeys == '') {
                            $scope.pleaseGetPhotoFromIG = true;
                            $scope.disableSubmit = false;
                            return;
                        }

                        if ($scope.writeReviewForm.checkTermsRead) {
                            $scope.writeReviewForm.isShowInvalidPhrase = $scope.generalReviewStatus.isInvalidPhrase;

                            $http({
                                method: 'POST',
                                url: $attrs.ysWriteGeneralReviewUrl,
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
                                    $scope.generalReviewStatus.isShowReportedSuccess = false;
                                    $scope.generalReviewStatus.isOnHold = false;
                                    $scope.generalReviewStatus.isPending = false;
                                    $scope.generalReviewStatus.isInvalidPhrase = false;

                                    if (result.misc.invalidPhrase) {
                                        $scope.generalReviewStatus.isInvalidPhrase = true;
                                    }

                                    if (result.misc.isOnHold) {
                                        $scope.loadWriteMoreReview();

                                        $scope.generalReviewStatus.isOnHold = true;
                                        $scope.reviewSubmitted = true;
                                        if ($scope.productReviewData != null) {
                                            $scope.productReviewData.isWriteAReview = false;
                                            $scope.productReviewData.isWaitingApproval = true;
                                            $scope.productReviewData.isAddMoreReview = $scope.isShowAddMoreReviewButton();
                                        }

                                        UploadService.resetUploadedObjectKeys();
                                        UploadService.removeUploadedIgPhotoObjectKey();
                                    }

                                    if (result.misc.isPending) {
                                        $scope.generalReviewStatus.isPending = true;
                                        $scope.reviewSubmitted = true;
                                        if ($scope.productReviewData != null) {
                                            $scope.productReviewData.isAddMoreReview = $scope.isShowAddMoreReviewButton();
                                        }

                                        UploadService.resetUploadedObjectKeys();
                                        UploadService.removeUploadedIgPhotoObjectKey();
                                    }

                                    if (result.misc.isSuccess) {
                                        $scope.loadWriteMoreReview();

                                        $scope.generalReviewStatus.isShowReportedSuccess = true;
                                        $scope.reviewSubmitted = true;

                                        if ($scope.productReviewData != null) {
                                            $scope.productReviewData.isWriteAReview = false;
                                            $scope.productReviewData.isAddMoreReview = $scope.isShowAddMoreReviewButton();
                                        }

                                        UploadService.resetUploadedObjectKeys();
                                        UploadService.removeUploadedIgPhotoObjectKey();
                                    }
                                }
                            });
                        }

                        $scope.disableSubmit = false;
                    }

                    $scope.onWriteVideoReview = function() {
                        $scope.writeReviewForm.productId = $attrs.reviewProductId;
                        if ($scope.writeReviewForm.checkTermsRead) {
                            $scope.writeReviewForm.isShowInvalidPhrase = $scope.videoReviewStatus.isInvalidPhrase;

                            $http({
                                method: 'POST',
                                url: $attrs.ysWriteVideoReviewUrl,
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
                                    $scope.videoReviewStatus.isInvalidPhrase = false;
                                    $scope.videoReviewStatus.isShowReportedSuccess = false;
                                    $scope.videoReviewStatus.isOnHold = false;
                                    $scope.videoReviewStatus.isPending = false;

                                    if (result.misc.invalidPhrase) {
                                        $scope.videoReviewStatus.isInvalidPhrase = true;
                                    }

                                    if (result.misc.isOnHold) {
                                        $scope.videoReviewStatus.isOnHold = true;
                                        $scope.reviewSubmitted = true;

                                        if ($scope.productReviewData != null) {
                                            $scope.productReviewData.isWriteAReview = false;
                                            $scope.productReviewData.isWaitingApproval = true;
                                            $scope.productReviewData.isAddMoreReview = $scope.isShowAddMoreReviewButton();
                                        }
                                    }

                                    if (result.misc.isPending) {
                                        $scope.reviewSubmitted = true;
                                        $scope.videoReviewStatus.isPending = true;
                                        if ($scope.productReviewData != null) {
                                            $scope.productReviewData.isAddMoreReview = $scope.isShowAddMoreReviewButton();
                                        }
                                    }

                                    if (result.misc.isSuccess) {
                                        $scope.reviewSubmitted = true;
                                        $scope.videoReviewStatus.isShowReportedSuccess = true;
                                        if ($scope.productReviewData != null) {
                                            $scope.productReviewData.isWriteAReview = false;
                                            $scope.productReviewData.isAddMoreReview = $scope.isShowAddMoreReviewButton();
                                        }
                                    }
                                }
                            });
                        }
                    }

                    $scope.isShowAddMoreReviewButton = function() {
                        $scope.productReviewData.approvedReviewCount++;
                        return ($scope.productReviewData.approvedReviewCount < 3);
                    }
                }
            }
        });

        app.directive("ysCheckout", function() {
            return {
                restrict: "A",
            	controller: function($scope) {
					$scope.$watch(function() {
					  return angular.element(document.querySelector("html")).hasClass("translated-rtl");
					}, function(newValue){
					  if (newValue==true){
					    angular.element(document.querySelector("html")).attr("dir","rtl");
					  }else{
					    angular.element(document.querySelector("html")).attr("dir","ltr");
					  }
					});
            	}
            }
        })

		app.directive("ysUpload", function($window, $mdDialog) {
			return {
				restrict: "A",
				controller: function($scope, $attrs, $http, $timeout, $log, CommonService, UploadService, LoadingService) {
					$scope.files = [];
					$scope.remainSlots = UploadService.getMaxCount();
					// dummy arrays for the initialized cases
					$scope.availableSlots = Array.apply(null, Array(UploadService.getMaxCount())).map(Number.prototype.valueOf, 0);

				    $scope.uploadFiles = function(files, errFiles) {
				    	$scope.uploadError = false;
				    	$scope.remainSlots -= files.length;
				        $scope.errFiles = errFiles;

				        var fileUploadedCount = 0;
				        angular.forEach(files, function(file, key) {
				        	// Get the upload object from our server ?
				        	var requestForUpload = UploadService.requestForUpload(
				        			file, $attrs.ysAmazonS3ConfigurationUrl);

				        	requestForUpload.then(function successCallback(response) {
		        				var result = response.data;

		        				if (result.errors) {
                                    angular.forEach(result.errors,
                                        function(value, key) {
                                            $log.debug('error code: fieldName=' + value.fieldName + ', errorCode=' + value.errorCode + ', shorMessage=' + value.shortMessage);
                                        }
                                    );

                                    return;
                                }

                                // show loading panel
                                CommonService.showLoadingPanel();

                                file.upload = UploadService.upload(file,
                                        result.bucketUploadUrl,
                                        result.configOptionsJsonData);

                                file.upload.then(function (response) {
                                    $scope.files.push(file);

                                    $scope.availableSlots.splice(file.index, 1);

                                    UploadService.addUploadedObjectKey(result.configOptionsJsonData['key']);

                                    $timeout(function () {
                                        file.result = response.data;
                                    });

                                    fileUploadedCount++;
                                    if (fileUploadedCount == files.length) {
                                        CommonService.hideLoadingPanel();
                                    }
                                }, function (response) {
                                    // handle error
                                    $scope.uploadError = true;

                                    fileUploadedCount++;
                                    if (fileUploadedCount == files.length) {
                                        CommonService.hideLoadingPanel();
                                    }
                                }, function (evt) {

                                    // file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                                });
                            });
                        });
                    }

                    $scope.removeFile = function(index) {
                        $scope.files.splice(index, 1);
                        $scope.remainSlots += 1;
                        $scope.availableSlots.push(0);

                        UploadService.removeUploadedObjectKey(index);
                    }

                    $scope.$on('ys-upload-reset-files', function() {
                        $scope.files = [];
                        $scope.errFiles = [];
                        $scope.remainSlots = UploadService.getMaxCount();
                        // dummy arrays for the initialized cases
                        $scope.availableSlots = Array.apply(null, Array(UploadService.getMaxCount())).map(Number.prototype.valueOf, 0);
                        UploadService.resetUploadedObjectKeys();
                    });

                }
            }
        });

		app.directive("ysIgUpload", function($window, $mdDialog) {
            return {
                restrict: "A",
                controller: function($scope, $attrs, $http, $timeout, $log, CommonService, UploadService, LoadingService) {
                    $scope.files = [];
                    $scope.remainSlots = UploadService.getMaxCount();
                    // dummy arrays for the initialized cases
                    $scope.availableSlots = Array.apply(null, Array(UploadService.getMaxCount())).map(Number.prototype.valueOf, 0);

                    $scope.igImageUrl = '';
                    $scope.photoIsDownloaded = false;

                    $scope.uploadFiles = function(files, errFiles) {
                        $scope.uploadError = false;
                        $scope.remainSlots -= files.length;
                        $scope.errFiles = errFiles;

                        var fileUploadedCount = 0;
                        angular.forEach(files, function(file, key) {
                            // Get the upload object from our server ?
                            var requestForUpload = UploadService.requestForUpload(
                                    file, $attrs.ysAmazonS3ConfigurationUrl);

                            requestForUpload.then(function successCallback(response) {
                                var result = response.data;

                                if (result.errors) {
                                    angular.forEach(result.errors,
                                        function(value, key) {
                                            $log.debug('error code: fieldName=' + value.fieldName + ', errorCode=' + value.errorCode + ', shorMessage=' + value.shortMessage);
                                        }
                                    );

                                    return;
                                }

                                // show loading panel
                                CommonService.showLoadingPanel();

                                file.upload = UploadService.upload(file,
                                        result.bucketUploadUrl,
                                        result.configOptionsJsonData);

                                file.upload.then(function (response) {
                                    $scope.files.push(file);

                                    $scope.availableSlots.splice(file.index, 1);

                                    UploadService.addUploadedObjectKey(result.configOptionsJsonData['key']);

                                    $timeout(function () {
                                        file.result = response.data;
                                    });

                                    fileUploadedCount++;
                                    if (fileUploadedCount == files.length) {
                                        CommonService.hideLoadingPanel();
                                    }
                                }, function (response) {
                                    // handle error
                                    $scope.uploadError = true;

                                    fileUploadedCount++;
                                    if (fileUploadedCount == files.length) {
                                        CommonService.hideLoadingPanel();
                                    }
                                }, function (evt) {

                                    // file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                                });
                            });
                        });
                    }

                    $scope.removeFile = function(index) {
                        $scope.files.splice(index, 1);
                        $scope.remainSlots += 1;
                        $scope.availableSlots.push(0);

                        UploadService.removeUploadedObjectKey(index);
                    }

                    $scope.$on('ys-upload-reset-files', function() {
                        $scope.files = [];
                        $scope.errFiles = [];
                        $scope.remainSlots = UploadService.getMaxCount();
                        // dummy arrays for the initialized cases
                        $scope.availableSlots = Array.apply(null, Array(UploadService.getMaxCount())).map(Number.prototype.valueOf, 0);
                        UploadService.resetUploadedObjectKeys();
                    });

                    function b64toBlob(b64Data, contentType, sliceSize) {
                            contentType = contentType || '';
                            sliceSize = sliceSize || 512;

                            var byteCharacters = atob(b64Data);
                            var byteArrays = [];

                            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                                var slice = byteCharacters.slice(offset, offset + sliceSize);

                                var byteNumbers = new Array(slice.length);
                                for (var i = 0; i < slice.length; i++) {
                                    byteNumbers[i] = slice.charCodeAt(i);
                                }

                                var byteArray = new Uint8Array(byteNumbers);

                                byteArrays.push(byteArray);
                            }

                          var blob = new Blob(byteArrays, {type: contentType});
                          return blob;
                    }

                    $scope.uploadIgPhoto = function() {
                        $scope.pleaseGetPhotoFromIG = false;
                        $scope.invalidIgLink = false;
                        $scope.uploadIgPhotoError = false;

                        var igUploadUrl = $scope.writeReviewForm.igUploadUrl;

                        var imageIdsArray = igUploadUrl.match(/instagram.com\/p\/(.*)(?=\/)/);

                        // validate ig url
                        if (!igUploadUrl.match(/(https?:\/\/(www\.)?)?instagram\.com(\/p\/\w+\/?)/)
                                || imageIdsArray.length <= 1) {
                            $scope.invalidIgLink = true;
                            return;
                        }

                        var imageUrl = 'https://www.instagram.com/p/' + imageIdsArray[1] + '/media/?size=l';

                        // show loading panel
                        CommonService.showLoadingPanel();

                        var img = new Image();
                        img.setAttribute('crossOrigin', 'anonymous');

                        img.onload = function() {
                            var canvas = document.createElement("canvas");
                            canvas.width =this.width;
                            canvas.height =this.height;

                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(this, 0, 0);

                            var dataURL = canvas.toDataURL("image/jpeg");

                            var block = dataURL.split(";");
                            // Get the content type
                            var contentType = block[0].split(":")[1];// In this case "image/gif"
                            // get the real base64 content of the file
                            var realData = block[1].split(",")[1];// In this case "iVBORw0KGg...."

                            var blob = b64toBlob(realData, contentType)

                            var file = new File([blob], 'picture.jpg', {type: "image/jpeg"});

                            var requestForUpload = UploadService.requestForUpload(
                                    file, $attrs.ysAmazonS3ConfigurationUrl);

                            requestForUpload.then(function successCallback(response) {
                                var result = response.data;

                                if (result.errors) {
                                    angular.forEach(result.errors,
                                        function(value, key) {
                                            $log.debug('error code: fieldName=' + value.fieldName + ', errorCode='
                                                    + value.errorCode + ', shorMessage=' + value.shortMessage);
                                        }
                                    );

                                    return;
                                }

                                file.upload = UploadService.upload(file,
                                        result.bucketUploadUrl,
                                        result.configOptionsJsonData);

                                file.upload.then(function (response) {
                                    UploadService.addUploadedIgPhotoObjectKey(igUploadUrl);
                                    UploadService.addUploadedIgPhotoObjectKey(result.configOptionsJsonData['key']);

                                    $timeout(function () {
                                        file.result = response.data;
                                    });

                                    $scope.igImageUrl = dataURL;

                                    $scope.photoIsDownloaded = true;

                                    CommonService.hideLoadingPanel();
                                }, function (response) {
                                    // handle error
                                    $scope.uploadIgPhotoError = true;

                                    CommonService.hideLoadingPanel();
                                }, function (evt) {
                                    // file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                                });
                            });
                        }

                        img.onerror = function() {
                            $scope.invalidIgLink = true;
                            CommonService.hideLoadingPanel();

                            return;
                        }

                        img.src = imageUrl;
                    }

                    $scope.removeIgPhoto = function() {
                        UploadService.removeUploadedIgPhotoObjectKey();

                        $scope.igImageUrl = '';
                        $scope.photoIsDownloaded = false;
                    }

                }
            }
        });

		app.directive("ysFavoriteBrand", function($window, $mdDialog) {
			return {
				restrict: "A",
				controller: function($scope, $http, $attrs, $element, $log) {
					$scope.favoriteBrandAdded = ($attrs.ysFavoriteBrandAdded === 'true');
					$scope.favoriteBrandCount = $attrs.ysFavoriteBrandCount;
					$scope.showFavoriteBrandCount = ($attrs.ysShowFavoriteBrandCount === 'true');

					$scope.onToggleFavoriteBrand=function(ev){
						ev.stopPropagation();

						if ($scope.favoriteBrandAdded) {
					        var url=$attrs.actionUrl;
					        $http({
					        	method: 'DELETE',
					        	url: $attrs.ysFavoriteBrandDeleteUrl
				        	}).then(function successCallback(response) {
				        		var result = response.data;

					            if (result.misc && result.misc.isSuccess) {
					            	$scope.favoriteBrandAdded = false;
					            	$scope.favoriteBrandCount = result.misc.updatedCount;
					            	$scope.showFavoriteBrandCount = result.misc.showShopperFavoriteBrandCount;
					            }
				        	});
						} else {
							var url=$attrs.actionUrl;
					        $http({
					        	method: 'POST',
					        	url: $attrs.ysFavoriteBrandAddUrl
				        	}).then(function successCallback(response) {
		        				var result = response.data;

					            if (result.misc && result.misc.isSuccess) {
					            	$scope.favoriteBrandAdded = true;
					            	$scope.favoriteBrandCount = result.misc.updatedCount;
					            	$scope.showFavoriteBrandCount = result.misc.showShopperFavoriteBrandCount;
					            }
				        	});
						}
					}
				}
			}
		});

		// Confirm dialog button
		app.directive("ysConfirmDialog", function($window, $mdDialog) {
			return {
				restrict: "A",
				controller: function($scope, $attrs, $element, $log) {
					$scope.showDialog = function(ev, onConfirm) {
						ev.stopPropagation();

						$mdDialog.show($mdDialog.confirm()
		    	          .title(angular.element($element[0].querySelector("[ys-confirm-dialog-title]")).text())
		    	          .htmlContent(angular.element($element[0].querySelector("[ys-confirm-dialog-content]")).html())
		    	          .ariaLabel('Confirmation')
		    	          .ok(angular.element($element[0].querySelector("[ys-confirm-dialog-ok]")).text())
		    	          .cancel(angular.element($element[0].querySelector("[ys-confirm-dialog-cancel]")).text())
	    	            ).then(function() {
	    	            	if (onConfirm) {
	    	            		onConfirm();
	    	            	}
	    	    	    });
					}
				}
			}
		});

		app.directive("ysHelpDialog", function($window, $mdDialog) {
			return {
				scope: true,
				restrict: "A",
				controller: function($scope, $http, $attrs, $log) {
					$scope.show = function(ev) {
						ev.stopPropagation();

                        $http({
                            method: 'GET',
                            url: $attrs.ysHelpUrl
                        }).then(function successCallback(response) {
                            var result = response.data;

                            $mdDialog.show($mdDialog.showPresetDialog({
                                locals: {
                                    title: result.title,
                                    content: result.content
                                }
                            }));
                        });
					}
				}
			}
		});

		app.directive("ysBannedShipDialog", function($window, $mdDialog) {
            return {
                scope: true,
                restrict: "A",
                controller: function($scope, $http, $attrs, $log) {
                    $scope.show = function(ev) {
                        ev.stopPropagation();

                        $http({
                            method: 'GET',
                            url: $attrs.ysBannedShipUrl
                        }).then(function successCallback(response) {
                            var result = response.data;

                            $mdDialog.show($mdDialog.showPresetDialog({
                                locals: {
                                    title: result.title,
                                    content: result.content
                                }
                            }));
                        });
                    }
                }
            }
		});

		app.directive("ysDialog", function($window, $mdDialog, $templateCache, CommonService) {
			return {
				scope: true,
				restrict: "A",
				controller: function($scope, $http, $attrs, $log) {
					$scope.showDialog = function(ev) {
						ev.stopPropagation();

			        	$mdDialog.show({
						      targetEvent: ev,
						      fullscreen: true,
						      controller: DialogController,
						      scope: $scope.$new(),
						      preserveScope: true,
						      template: $templateCache.get($attrs.templateId),
						      parent: angular.element(document.body),
						      clickOutsideToClose: true
					    });

					    // support geData
                        if ($attrs.geData) {
                            var div = document.createElement('div');
                            div.innerHTML = $attrs.geData;
                            var result = div.innerText || div.textContent;
                            CommonService.pushDataLayer(angular.fromJson(result));
                        }

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

		app.directive("ysBrandDialog", function($window, $mdDialog, $templateCache) {
			return {
				scope: true,
				restrict: "A",
				controller: function($scope, $http, $log) {
					$scope.showDialog = function(ev) {
						ev.stopPropagation();

                        $scope.animateRatingBar = true;

			        	$mdDialog.show({
						      targetEvent: ev,
						      fullscreen: true,
						      controller: DialogController,
						      scope: $scope.$new(),
						      preserveScope: true,
						      template: $templateCache.get('/brand/BrandRatingDialog.html'),
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
				}
			}
		});

		app.directive("ysHtmlContentConfirmDialog", function($window, $mdDialog, $templateCache) {
			return {
				restrict: "A",
				controller: function($scope, $attrs, $element, $log) {
					$scope.showDialog = function(ev, onConfirm) {
						ev.stopPropagation();

						$mdDialog.show($mdDialog.confirm()
		    	          .title(angular.element($element[0].querySelector("[ys-confirm-dialog-title]")).text())
		    	          .htmlContent($templateCache.get($attrs.contentTemplateId))
		    	          .ariaLabel('Confirmation')
		    	          .ok(angular.element($element[0].querySelector("[ys-confirm-dialog-ok]")).text())
		    	          .cancel(angular.element($element[0].querySelector("[ys-confirm-dialog-cancel]")).text())
	    	            ).then(function() {
	    	            	if (onConfirm) {
	    	            		onConfirm();
	    	            	}
	    	    	    });
					}
				}
			}
		});

		// Simple toast box
		app.directive("ysToastBox", function($mdToast) {
			return {
				restrict: "A",
				controller: function($scope, $attrs, $element) {
					$scope.showSimpleToast=function(e){
			    	  var el=angular.element(document.querySelector(e));
			    	  $mdToast.show(
			    		$mdToast.simple()
			    		.textContent(el[0].getElementsByClassName("textContent")[0].innerText)
			    		.theme("ys")
			    		.position('end bottom')
			    		.hideDelay(5000)
			    	  );
					}
			    }
			}
		});

		// consider to move it to common.js
		app.directive("ysSearchableSelect", function() {
			return {
				restrict: "AE",
				controller: function($scope, $element) {
					$scope.searchTerm = '';

					$scope.clearSearchTerm = function() {
				        $scope.searchTerm = '';
			        };

					// The md-select directive eats keydown events for some quick select
				    // logic. Since we have a search input here, we don't need that logic.
				    $element.find('input').on('keydown', function(ev) {
				    	ev.stopPropagation();
				    });
				}
			}
		});

		// consider to move it to common.js
		app.filter('yskeyvaluefilter', function() {
		  return function(items, searchTerm) {
		        var result = {};
		        angular.forEach(items, function(value, key) {
		            if (value.toLowerCase().indexOf(searchTerm.toString().toLowerCase()) != -1) {
		                result[key] = value;
		            }
		        });
		        return result;
		    };
		});

		app.directive("ysProductGrid", function($http) {
			return {
				restrict: "A",
				scope: true,
				controller: function($scope, $attrs, CommonService, SavedItemService, LoadingService, ReviewService) {
					$scope.coverSize = "m";

                    // XXX trick to handle the limited deal percentages
					$scope.limitedDealPercentages = [];

					// XXX check undefined
					if (typeof $attrs.limitedDealPercentages != 'undefined') {
                        var vars = $attrs.limitedDealPercentages.split(',');
                        for (var i = 0; i < vars.length; i++) {
                            $scope.limitedDealPercentages.push(vars[i]);
                        }
					}

					$scope.last = function(productGridIdentifier){

						$scope.productgridspinner = true;

						// stop show loading before emarsys
						ysApp.config.emarsysLoadingLock = true;

						var nextPageNum = $scope.currentPageNum - 1;

						var target = document.getElementById(
								productGridIdentifier);

						var productIds = target.getAttribute(
								productGridIdentifier);

						if (!productIds) {
							$scope.productgridspinner = false;

							// stop show loading before emarsys
							ysApp.config.emarsysLoadingLock = false;

							$scope.lotinfoitems = {};
						} else {
							$http({
								method: 'POST',
								url: $attrs.loadmoreurl,
								data: {
									productIds: productIds.split(','),
									pageNum: nextPageNum,
									viewNum: target.getAttribute("viewNum")
								}
							 }).then(function successCallback(response) {
								 var result = response.data;

								 $scope.lotinfoitems = result.products;

								 $scope.currentPageNum-=1;

								 $scope.showPagingButton(result);

								 $scope.productgridspinner = false;

								// stop show loading before emarsys
								ysApp.config.emarsysLoadingLock = false;
							});
						}
					};

					$scope.next = function(productGridIdentifier){
						$scope.productgridspinner = true;

						// stop show loading before emarsys
						ysApp.config.emarsysLoadingLock = true;

						var nextPageNum = $scope.currentPageNum + 1;

						var target = document.getElementById(
								productGridIdentifier);

						var productIds = target.getAttribute(
								productGridIdentifier);

						if (!productIds) {
							$scope.productgridspinner = false;

							// stop show loading before emarsys
							ysApp.config.emarsysLoadingLock = false;

							$scope.lotinfoitems = {};
						} else {
							$http({
								method: 'POST',
								url: $attrs.loadmoreurl,
								data: {
									productIds: productIds.split(','),
									pageNum: nextPageNum,
									viewNum: target.getAttribute("viewNum")
								}
							}).then(function successCallback(response) {
								var result = response.data;

								$scope.lotinfoitems = result.products;

								$scope.currentPageNum+=1;

								$scope.showPagingButton(result);

								$scope.productgridspinner = false;

								// stop show loading before emarsys
								ysApp.config.emarsysLoadingLock = false;
							});
						}
					};

					$scope.showPagingButton = function(responseData) {
						if ($scope.currentPageNum == 1 && !responseData.isShowLoadMore) {
							$scope.disableLast = true;
					 		$scope.disableNext = true;
						 } else if ($scope.currentPageNum == 1 && responseData.isShowLoadMore) {
				 			$scope.disableLast = true;
					 		$scope.disableNext = false;
				 		 } else if (!responseData.isShowLoadMore) {
					 		$scope.disableLast = false;
					 		$scope.disableNext = true;
						 } else {
				 			 $scope.disableLast = false;
							 $scope.disableNext = false;
						 }
					}

					// init first page view
					$scope.init = function(productGridIdentifier) {
						$scope.currentPageNum = 0;

						$scope.next(productGridIdentifier);
					}

					// Rating Star - Display in Percentage Range
					$scope.ratingPercent=function(percentage){
						return ReviewService.getRatingPercent(percentage);
					};

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

					$scope.getLimitedDealPercentageClaimed = function (productId) {
                        for (var i = 0; i < $scope.limitedDealPercentages.length; i++) {
                            if ($scope.limitedDealPercentages[i].indexOf(productId + "_") > -1) {
                                var percentage = $scope.limitedDealPercentages[i].split("_");

                                return percentage[1];
                            }
                        }

					    return null;
					}
				}
			}
		});
		
		app.directive("ysEmarsysRecommendProductGrid", function($http, $timeout) {
			return {
				restrict: "A",
				scope: true,
				controller: function($rootScope, $scope, $attrs, CommonService, SavedItemService, EmarsysService, LoadingService, ReviewService) {
					$scope.coverSize = "m";
					
					$scope.lotinfoitems = {
					    "products":[], 
					    "isShowLoading":true
					};
					$scope.emarsysRecommend = new Map();
					$scope.currentPageNum = 0;
					
					$scope.last = function(productGridIdentifier){
						var logicProductIds = $scope.emarsysRecommend[$attrs.logic];
						if (logicProductIds && logicProductIds.length > 0) {
							ysApp.config.emarsysLoadingLock = true;
							
							var nextPageNum = $scope.currentPageNum - 1;
							
							$scope.productgridspinner = true;
							
							// stop show loading before emarsys
							ysApp.config.emarsysLoadingLock = true;
							
							$http({
								method: 'POST',
								url: $attrs.loadmoreurl,
								data: {
									productIds: logicProductIds, 
									pageNum: nextPageNum,
									viewNum: 6
								}
							 }).then(function successCallback(response) {
								 var result = response.data;
								 
								 $scope.lotinfoitems = result.products;
							
								 if ($scope.lotinfoitems) {
									 $scope.lotinfoitems.isShowLoadMore = result.isShowLoadMore;
									 
									 $scope.currentPageNum-=1;
									 
									 $scope.showPagingButton(result);
								 }
								 
								 $scope.productgridspinner = false;
								 
								 // resume show loading after emarsys 
								 ysApp.config.emarsysLoadingLock = false;
							});
						}
					};
					
					$scope.next = function(productGridIdentifier){
						var logicProductIds = $scope.emarsysRecommend[$attrs.logic];
						if (logicProductIds && logicProductIds.length > 0) {
							var nextPageNum = $scope.currentPageNum + 1;
							
							$scope.productgridspinner = true;
							
							// stop show loading before emarsys
							ysApp.config.emarsysLoadingLock = true;
							
							$http({
								method: 'POST',
								url: $attrs.loadmoreurl,
								data: {
									productIds: logicProductIds, 
									pageNum: nextPageNum,
									viewNum: 6
								}
							 }).then(function successCallback(response) {
								 var result = response.data;
								 
								 $scope.lotinfoitems = result.products;
								 
								 if ($scope.lotinfoitems) {
									 $scope.lotinfoitems.isShowLoadMore = result.isShowLoadMore;
									 
									 $scope.currentPageNum+=1;
									 
							 		 $scope.showPagingButton(result);
								 }
							 	
						 		 $scope.productgridspinner = false;
						 		
								 // resume show loading after emarsys 
								 ysApp.config.emarsysLoadingLock = false;
							});
						}
					};
					
					$scope.onLoadMoreButton = function(){
						var logicProductIds = $scope.emarsysRecommend[$attrs.logic];
						if (logicProductIds && logicProductIds.length > 0) {
							var nextPageNum = $scope.currentPageNum + 1;
							
							$scope.productgridspinner = true;
							
							// stop show loading before emarsys
							ysApp.config.emarsysLoadingLock = true;
							
							var sheetNumber = 8;
							$http({
								method: 'POST',
								url: $attrs.loadmoreurl,
								data: {
									productIds: logicProductIds, 
									pageNum: nextPageNum,
									viewNum: 6,
									sheetNum: sheetNumber
								}
							 }).then(function successCallback(response) {
								 var result = response.data;
								 
								 if (result.products) {
									 Array.prototype.push.apply($scope.lotinfoitems, result.products);
									 
									 if ($scope.lotinfoitems) {
										 $scope.lotinfoitems.isShowLoadMore = result.isShowLoadMore;
										 
										 $scope.currentPageNum += sheetNumber;
										 
								 		 $scope.showPagingButton(result);
									 }
								 }
							 	
						 		 $scope.productgridspinner = false;
						 		
								 // resume show loading after emarsys 
								 ysApp.config.emarsysLoadingLock = false;
							});
						}
					};
					
					$scope.showPagingButton = function(responseData) {
						if ($scope.currentPageNum == 1 && !responseData.isShowLoadMore) {
							$scope.disableLast = true;
					 		$scope.disableNext = true; 
						 } else if ($scope.currentPageNum == 1 && responseData.isShowLoadMore) {
				 			$scope.disableLast = true;
					 		$scope.disableNext = false; 
				 		 } else if (!responseData.isShowLoadMore) {
					 		$scope.disableLast = false;
					 		$scope.disableNext = true;
						 } else {
				 			 $scope.disableLast = false;
							 $scope.disableNext = false;
						 }
					}
					
					$scope.loadMore = function(){
						var logicProductIds = $scope.emarsysRecommend[$attrs.logic];
						if (logicProductIds && logicProductIds.length > 0 && !$scope.disableNext) {
							var nextPageNum = $scope.currentPageNum + 1;
							$scope.productgridspinner = true;
							
							// stop show loading before emarsys
							ysApp.config.emarsysLoadingLock = true;
							
							$http({
								method: 'POST',
								url: $attrs.loadmoreurl,
								data: {
									productIds: logicProductIds, 
									pageNum: nextPageNum,
									viewNum: 24
								}
							 }).then(function successCallback(response) {
								 var result = response.data;
								 
								 if (result.products) {
									 Array.prototype.push.apply($scope.lotinfoitems, result.products);
									 
									 $scope.lotinfoitems.isShowLoadMore = result.isShowLoadMore;
									 
									 $scope.currentPageNum+=1;
									 
									if ($scope.currentPageNum == 1 && !result.isShowLoadMore) {
										$scope.disableLast = true;
								 		$scope.disableNext = true; 
									 } else if ($scope.currentPageNum == 1 && result.isShowLoadMore) {
							 			$scope.disableLast = true;
								 		$scope.disableNext = false; 
							 		 } else if (!result.isShowLoadMore) {
								 		$scope.disableLast = false;
								 		$scope.disableNext = true;
									 } else {
							 			 $scope.disableLast = false;
										 $scope.disableNext = false;
									 }
								 }
							 	
						 		 $scope.productgridspinner = false;
						 		
								 // resume show loading after emarsys 
								 ysApp.config.emarsysLoadingLock = false;
								 
								 EmarsysService.setLoadMoreLock(false);
							});
						} else {
							EmarsysService.setLoadMoreLock(false);
						}
					};
					
				    $scope.$on('emarsysLoadMore', function() {
			    	  if ($attrs.supportLoadMore) {
			    		  $scope.loadMore();
			    	  }
			        });
					
					var unregister = $scope.$watch(function(){
						return ysApp.emarsysRecommend;
					}, function(){
						$scope.emarsysRecommend = ysApp.emarsysRecommend;
						if ($scope.emarsysRecommend && $scope.emarsysRecommend[$attrs.logic]) {
							unregister();
							$scope.next();
						}
					}, true);
					
					// Rating Star - Display in Percentage Range
					$scope.ratingPercent=function(percentage){
						return ReviewService.getRatingPercent(percentage);
					};
					
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
				}
			}
		});
		
		app.directive("ysSupportBrowserWarning", function() {
			return {
				restrict: "AE",
				controller: function($scope, $attrs, $http, CommonService) {
					$scope.browser=[];
					$scope.browser.support=true;

					var detectBrowser = (function(){
					    var ua= navigator.userAgent, tem,
					    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
					    if(/trident/i.test(M[1])){
					        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
					        return 'IE '+(tem[1] || '');
					    }
					    if(M[1]=== 'Chrome'){
					        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
					        if(tem!= null){
					        	tem[1] = tem[1].replace('OPR', 'Opera');
					        	return tem.slice(1);
					        }
					    }
					    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
					    if((tem= ua.match(/version\/(\d+)/i))!= null){
					    	M.splice(1, 1, tem[1]);
					    }
					    return M;
					})();
					var supportVersion = {
						"Firefox": 47,
						"Chrome": 44,
						"Safari": 9.1,
						"Opera": 39
					};
					if (supportVersion[detectBrowser[0]] && supportVersion[detectBrowser[0]] > detectBrowser[1]) {
						$scope.browser.family = detectBrowser[0];		
						$scope.browser.version = detectBrowser[1];
						$scope.browser.support=false;
					}
				}
			}
			
		});

		app.directive("ysGeClick", function() {
			return {
				restrict: "A",
				scope: {
                  geData: "@"
                },
				controller: function($scope, $element, $sce, CommonService) {
				    if (!$scope.geData) {
				        return;
                    }

                    $element.on("click", function() {
                        // trick to unescape html ...
                        var div = document.createElement('div');
                        div.innerHTML = $scope.geData;
                        var result = div.innerText || div.textContent;

                        CommonService.pushDataLayer(angular.fromJson(result));
                    });
				}
			}

		});

		app.directive("ysFormPassword", function() {
            return {
                restrict: "A",
                scope: {modelValue: '=ngModel'},
                controller: function($scope) {
                    $scope.$on('reset-ys-form-password', function() {
                        $scope.modelValue = "";
                    });
                }
            }
        });

        app.directive("ysBranchio", function() {
            return {
                restrict: "A",
                controller: function($window, $scope, $attrs, $cookies, $log, BranchIoService) {
                    $scope.config = ysApp.config.branchio;

                    $scope.prefixAssociateCode = 'ac_';
                    $scope.prefixMedium = 'medium_';
                    $scope.prefixRco = 'rco_';
                    $scope.prefixSoruce = 'source_';

                    $scope.initOption = {
                        'no_journeys' : (typeof $scope.config.noJourneys !== 'undefined' ? $scope.config.noJourneys : false)
                    };

                    $scope.viewData = {
                        'data' : {},
                        'tags' : [],
                    };

                    $scope.branchInit = function() {
                        if (typeof $scope.config.key !== 'undefined' && $scope.config.key != ""
                            && (typeof branch !== 'undefined')) {
                           branch.init($scope.config.key, $scope.initOption, $scope.errorCallback);
                        }
                    }

                    $scope.branchListener = function(eventName, data) {
                        switch(eventName) {
                            case 'didShowJourney':
                            case 'didClickJourneyCTA':
                            case 'didClickJourneyClose':
                                $scope.branchLogEvent(eventName, data);
                                break;
                        }
                    }

                    $scope.branchLogEvent = function(eventName, eventAndCustomData) {
                        if (typeof branch !== 'undefined') {
                            branch.logEvent(eventName, eventAndCustomData, [], function(err) {});
                        }
                    };

                    $scope.branchLogin = function(externalShopperId) {
                        if (typeof branch !== 'undefined') {
                            branch.setIdentity(externalShopperId, $scope.errorCallback);
                        }
                    };

                    $scope.branchLogout = function() {
                        if (typeof branch !== 'undefined') {
                            branch.logout();
                        }
                    };

                    $scope.branchSetViewData = function() {
                        // branch set view data
                        if (typeof branch !== 'undefined') {
                            branch.setBranchViewData($scope.viewData);
                        }
                    };

                    $scope.errorCallback = function(err, data) {
//                        console.log(err, data);
                    };

                    $scope.getDeeplinkPath = function() {
                       // Window.location is a read-only Location object
                       // window.location.origin only compatible on few version.
                       var deeplinkPath = $window.location.pathname;

                       if ($window.location.hash != '') {
                           deeplinkPath += '?';

                           deeplinkPath += $window.location.hash.substr(2); // sub "#/" character
                       } else {
                           if ($window.location.search != '') {
                                deeplinkPath += $window.location.search;
                           }
                       }

                       return deeplinkPath;
                    }

                    $scope.init = function() {
                        // branch add listener
                        branch.addListener($scope.branchListener);

                        // branch init
                        $scope.branchInit();

                        // initialize view data object
                        $scope.refreshAndSetViewData();

                        // set login
                        if (typeof ysApp.config.isSignout !== 'undefined' && ysApp.config.isSignout) {
                            $scope.branchLogout();
                        } else {
                            if (typeof $scope.config.ysExternalShopperId !== 'undefined'
                                && $scope.config.ysExternalShopperId != "") {
                               $scope.branchLogin($scope.config.ysExternalShopperId);
                            }
                        }

                        // listen hash change for deep link path
                        $window.addEventListener('hashchange', function(){
                             $scope.refreshAndSetViewData();

                             $scope.branchInit();
                        }, false);

                        BranchIoService.set($scope.viewData.data.$deeplink_path, $attrs.ysBranchioKey);

                        $scope.postInit();
                    };

                    $scope.initBranchViewData = function() {
                        // utm related
                        var ysUtmCampaign = $cookies.get('ysutmcampaign');
                        var ysUtmContent = $cookies.get('ysutmcontent');
                        var ysUtmMedium = $cookies.get('ysutmmeidum');
                        var ysUtmSource = $cookies.get('ysutmsource');
                        var ysUtmTerm = $cookies.get('ysutmterm');

                        // rco
                        var ysRco = (typeof $scope.config.ysRco !== 'undefined' && $scope.config.ysRco != "" ?
                            $scope.config.ysRco : "");

                        if (ysUtmCampaign && !$scope.viewData.data.utm_campaign) {
                            $scope.viewData.data.utm_campaign = ysUtmCampaign;
                            $scope.viewData.tags.push(ysUtmCampaign);
                        }

                        if (ysUtmContent && !$scope.viewData.data.utm_content) {
                            $scope.viewData.data.utm_content = ysUtmContent;
                            $scope.viewData.tags.push(ysUtmContent);
                        }

                        if (ysUtmMedium && !$scope.viewData.data.utm_medium) {
                            $scope.viewData.data.utm_medium = ysUtmMedium;
                            $scope.viewData.tags.push(ysUtmMedium);
                        }

                        if (ysUtmSource && !$scope.viewData.data.utm_source) {
                            $scope.viewData.data.utm_source = ysUtmSource;
                            $scope.viewData.tags.push(ysUtmSource);
                        }

                        if (ysUtmTerm && !$scope.viewData.data.utm_term) {
                            $scope.viewData.data.utm_term = ysUtmTerm;
                            $scope.viewData.tags.push(ysUtmTerm);
                        }

                        if (ysRco && !$scope.viewData.data.rco) {
                            $scope.viewData.data.rco = $scope.prefixRco + ysRco;
                            $scope.viewData.tags.push($scope.prefixRco + ysRco);
                        }

                        $cookies.remove('ysutmsource');

                        // deep link path
                        $scope.viewData.data.$deeplink_path = $scope.getDeeplinkPath();

                        // set channel
                        var associateCode = $cookies.get('AssocLinkCode');
                        if (ysUtmSource || ysUtmMedium) {
                            $scope.viewData.channel =
                                ("undefined"==typeof ysUtmSource ? "" : ysUtmSource.replace($scope.prefixSoruce, ""))
                                + "-"
                                + ("undefined"==typeof ysUtmMedium ? "" : ysUtmMedium.replace($scope.prefixMedium, ""));
                        } else if (associateCode) {
                            $scope.viewData.channel = $scope.prefixAssociateCode + associateCode;
                        }

                        // set stage
                        if (ysUtmTerm) {
                            $scope.viewData.stage = ysUtmTerm;
                        }

                        // $log.debug($scope.viewData);
//                         console.log($scope.viewData);
                    };

                    $scope.refreshAndSetViewData = function() {
                        // initialize view data object
                        $scope.initBranchViewData();

                        // branch set view
                        $scope.branchSetViewData();

//                        console.log($scope.viewData);
                    };

                    $scope.postInit = function() {
                        // after branch init

                        // do track purchase / NC purchase
                        if (typeof branchioPurchaseConfig !== 'undefined') {
                            var eventName = branchioPurchaseConfig.eventName;
                            var eventAndCustomData = branchioPurchaseConfig.eventAndCustomData;
                            if (typeof eventName !== 'undefined' &&
                                    typeof eventAndCustomData !== 'undefined') {
                                $scope.branchLogEvent(eventName, eventAndCustomData);
                            }
                        }
                    };
                }
            };
        });

        app.directive("ysDynamicyield", function() {
            return {
                restrict: "A",
                controller: function($scope, $log, $attrs, DynamicYieldService) {
                    $scope.init = function() {
                        if (typeof ysDynamicYieldEventContext !== 'undefined' && ysDynamicYieldEventContext != '') {
                            switch(ysDynamicYieldEventContext.action) {
                                case 'purchase':
                                    DynamicYieldService.purchase(ysDynamicYieldEventContext.properties);

                                    if (ysDynamicYieldEventContext.isNewCustomer) {
                                        DynamicYieldService.ncPurchase(ysDynamicYieldEventContext.properties);
                                    }
                                    break;
                            }

                        }

                        if (typeof $attrs.trackLoginId !== 'undefined') {
                            DynamicYieldService.login($attrs.trackLoginId);
                        }
                    };

                }
            };
        });
		
	    return app;
	}
);