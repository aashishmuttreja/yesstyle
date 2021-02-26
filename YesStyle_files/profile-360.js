var Profile360Storage = (function() {
  let sessionStorageName = "profile360";
  let limitWebActivities = 10; // limit to last 10 records
  let limitShoppingCart = 10; // limit to last 10 records
  
  let _initStorage = function() {
    if(!sessionStorage.getItem(sessionStorageName)) {
      _resetStorage();
    }
  };
  
  let _resetStorage = function() {
    sessionStorage.setItem(sessionStorageName, JSON.stringify({
      "shoppingCart": {
        "list": [],
        "total": 0
      },
      "webActivities": {
        "list": []
      }
    }));
  };
  
  let _getCart = function() {
    return ShoppingCart.retrieveCart();
  };
  
  /*
  expects param "activity": {
    "event": "",
    "type": "",
    "object": ""
  }
  */
  let _addWebActivity = function(activity) {
    let session = JSON.parse(sessionStorage.getItem(sessionStorageName));
    let webActivitesSession = session.webActivities.list;
    
    if(webActivitesSession.length >= limitWebActivities) {
      webActivitesSession.shift(); // remove first element
    }
    
    webActivitesSession.push(activity); // add to last element
    
    sessionStorage.setItem(sessionStorageName, JSON.stringify(session));
  };
  
  // returns an array of web activities
  let _getWebActivities = function() {
    let session = JSON.parse(sessionStorage.getItem(sessionStorageName));
    return session.webActivities.list.reverse();
  };
  
  return {
    init: _initStorage,
    addWebActivity: _addWebActivity,
    getWebActivities: _getWebActivities,
    getShoppingCart: _getCart
  };
})();

var Profile360 = (function() {
  let uiContainerId = "profile-360";
  
  
  function _render() {
    _renderUI();
    _renderProfile();
    _renderWebActivities();
    _renderShoppingCart();
    _renderRsysWebPushInfo();
    _addEvents();
  }
  
  function _addEvents() {
    _addToggle();
    _addRefresh();
  }
  
  function _renderUI() {
    let uiTemplate = $("#profile-360-tpl").html();
    let uiContainer = $("#" + uiContainerId);
      
    uiContainer.html(_.template(uiTemplate));  
  }
  
  function _renderProfile() {
    // todo: streamline this
    let fn = localStorage.firstname ? localStorage.firstname : '';
    let ln = localStorage.lastname ? localStorage.lastname : '';
    let email = localStorage.email ? localStorage.email : 'ANONYMOUS';
    $("#profile-name").text(fn + ' ' + ln);
    $("#profile-email").text(email);
  }

  function _renderWebActivities() {
    let activities = Profile360Storage.getWebActivities();
    for(let i = 0; i < activities.length; i++) {
      $("#webActivityTbl").find("tbody").eq(0).append("<tr>" +
                                                        "<td>" + activities[i].event + "</td>"+
                                                        "<td>" + activities[i].type + "</td>"+
                                                        "<td class='wrap-tbl-col-txt'>" + activities[i].object + "</td>"+
                                                        "</tr>");
    }
  }
  
  function _renderShoppingCart() {
    let shoppingCart = Profile360Storage.getShoppingCart();
    $("#items-total").find("p").eq(0).text("$" + shoppingCart.total);
    $("#items-value").find("p").eq(0).text(shoppingCart.list.length);
    for(let i = 0; i < shoppingCart.list.length; i++) {
      $("#shoppingCartTbl").find("tbody").eq(0).append("<tr>" +
                                                        "<td class='wrap-tbl-col-txt'>" + shoppingCart.list[i].displayName + "</td>"+
                                                        "<td>$" + shoppingCart.list[i].subtotal + "</td>"+
                                                        "<td>" + shoppingCart.list[i].qty + "</td>"+
                                                        "</tr>");
    }
  };
  
  // ref: requires responsys webpush sdk embedded
  function _renderRsysWebPushInfo() {
    let uid = "", vid = "", notificationPermision = "", optinStatus = "";
    
    try {
      if(webPushManagerAPI.getUserId() != null && webPushManagerAPI.getUserId().length > 0) {
        uid = webPushManagerAPI.getUserId();
      }
    } catch (e) { console.error(e); }
    
    try {
      if(webPushManagerAPI.getVisitorId() != null && webPushManagerAPI.getVisitorId().length > 0) {
        vid = webPushManagerAPI.getVisitorId();
      }
    } catch (e) { console.error(e); }
    
    try {
      notificationPermision = webPushManagerAPI.getNotificationPermission();
    } catch (e) { console.error(e); }
    
    try {
      optinStatus = webPushManagerAPI.getOptInOptOutStatus();
    } catch (e) { console.error(e); }
    
    if (status === "I")
      optinStatus = "Opt In (I)";
    else 
      optinStatus = "Opt Out (O)";
    
    // User ID
    $("#wp-uid").text(uid);
    // Visitor ID
    $("#wp-vid").text(vid);
    // Notification Permission
    $("#wp-notify-perm").text(notificationPermision);
    // Opt-in Status
    $("#wp-optin-status").text(optinStatus);
  };

  // open/collapse link/button
  function _addToggle() {
    $(".profile-toogle-btn-open").off().click(function() {
      // open profile clicked
      $(this).addClass("hide");
      $(".profile-toogle-btn-close").removeClass("hide");
      $("#" + uiContainerId).find(".container").eq(1).removeClass("hide");
      $("#" + uiContainerId).css("height", "100%");
    });
    
    $(".profile-toogle-btn-close").off().click(function() {
      // close profile clicked
      $(this).addClass("hide");
      $(".profile-toogle-btn-open").removeClass("hide");
      $("#" + uiContainerId).find(".container").eq(1).addClass("hide");
      $("#" + uiContainerId).css("height", "fit-content");
    });
  }
  
  function _addRefresh() {
    $(".refresh-btn").off().click(function() {
      _render();
    });
  }
  
  return {
    render: _render
  };
})();

$(document).ready(function(){
  setTimeout(function() {
    Profile360Storage.init();
    Profile360.render();
  }, 3000);
  
  /*
  setInterval(function() {
    Profile360.render();  
  }, 1000);
  */
});