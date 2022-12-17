// This function asks the server for a "service" and converts the response to text. 
function loadJSON(service, callback) {   
    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', service, false);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }

 function nav_bar(this_product_key, products_data) {
    // This makes a navigation bar to other product pages
    document.write(`
      <li>
        <form class='nav-link' action='index.html' method='get'>
          <a href='#' onclick='this.parentNode.submit();'>HOME</a>
        </form>
      </li>
    `);
    for (let products_key in products_data) {
      if (products_key == this_product_key) continue;
      document.write(`
        <li>
          <form class='nav-link' action='./products_display.html' method='get'>
            <input type='hidden' name='products_key' value='${products_key}'>
            <a href='#' onclick='this.parentNode.submit();'>${products_key}</a>
          </form>
        </li>
      `);
    }
    document.write(`
      <li>
        <form class='nav-link' action='cart.html' method='get'>
          <a href='#' onclick='this.parentNode.submit();'>
            You have <span id='cart_total'>0</span> items in your shopping cart: View Cart
          </a>
        </form>
      </li>
    `);
  }
  
