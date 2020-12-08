var ShoppingCart = (function() {
  // Initialize session storage to store cart information
  let _initCart = function() {
    if (sessionStorage.getItem("cart") === null) {
      _resetCart();
    }  
  };
  
  let _resetCart = function() {
    sessionStorage.setItem("cart", JSON.stringify({"list":[]}));
  }
  
  // Retrieve and compute the shopping cart information
  let _retrieveCart = function() {
    let shoppingCart = {
      "list": [],
      "total": 0
    };
    
    // compute total
    let session = JSON.parse(sessionStorage.getItem("cart"));
    for(let i = 0; i < session.list.length; i++) {
      let unitPrice = session.list[i].price; 
      let qty = session.list[i].qty;
      let subTotal = qty * unitPrice;
      
      shoppingCart.list.push({
        "sku": session.list[i].sku,
        "qty": qty,
        "displayName": session.list[i].displayName,
        "displayImg": session.list[i].displayImg,
        "unitPrice": unitPrice,
        "subtotal": subTotal
      });
      
      shoppingCart.total += subTotal;
    }
    
    return shoppingCart;
  };
  
  // Add to cart
  let _addCart = function(product) {
    let cart = JSON.parse(sessionStorage.getItem("cart"));
    
    let isAdded = false;
    
    for(let i = 0; i < cart.list.length; i++) {
      if (cart.list[i].sku === product.sku) {
        cart.list[i].qty += product.qty
        isAdded = true;
        break;
      }
    }
    
    if (!isAdded) {
      cart.list.push(product);
    }
    
    sessionStorage.setItem("cart", JSON.stringify(cart));
      
    console.log(cart.list);  
  };
  
  return {
    initCart: _initCart,
    resetCart: _resetCart,
    retrieveCart: _retrieveCart,
    addCart: _addCart
  };
})();