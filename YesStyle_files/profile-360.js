var Profile360Storage = (function() {
  let sessionStorageName = "profile360";
  let limitWebActivities = 6; // limit to last 6 records
  let limitShoppingCart = 6; // limit to last 6 records
  
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
    _renderWebActivities();
    _renderShoppingCart();
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
  
  // open/collapse link/button
  function _addToggle() {
    $(".profile-toogle-btn-open").click(function() {
      // open profile clicked
      $(this).addClass("hide");
      $(".profile-toogle-btn-close").removeClass("hide");
      $("#" + uiContainerId).find(".container").eq(1).removeClass("hide");
      $("#" + uiContainerId).css("height", "100%");
    });
    
    $(".profile-toogle-btn-close").click(function() {
      // close profile clicked
      $(this).addClass("hide");
      $(".profile-toogle-btn-open").removeClass("hide");
      $("#" + uiContainerId).find(".container").eq(1).addClass("hide");
      $("#" + uiContainerId).css("height", "fit-content");
    });
  }
  
  function _addRefresh() {
    $(".refresh-btn").click(function() {
      _render();
    });
  }
  
  return {
    render: _render
  };
})();

$(document).ready(function(){
  Profile360Storage.init();
  Profile360.render();
  /*
  setInterval(function() {
    Profile360.render();  
  }, 1000);
  */
});