var express = require('express');
var app = express();
var myParser = require("body-parser");
var session = require('express-session');
const CookieParser = require('cookie-parser');
var products = require('./products.json'); // initializes products array from products.json
var nodemailer = require('nodemailer');
var fs = require('fs');
const querystring = require('node:querystring'); // module for parsing and formatting URL query strings

app.use(myParser.urlencoded({ extended: true })); // parses incoming requests
app.use(session({ secret: "ITM352 rocks!", resave: false, saveUninitialized: true })); //Window session storage
app.use(CookieParser());

var errors = {}; // Initializes errors array
var loginerrors = {}; // Initializes login errors array
const emailregex = /^([a-zA-Z0-9_\.]+)@([a-zA-Z0-9\.]+)\.([a-zA-Z]{2,3})$/gm; // Email regex
const passwordregex = /^(\S{10,16})$/gm; // Password regex

// user info JSON file
var userfile = "./user_data.json";
// Product info JSON file
var productfile = "./products.json";

// Converts user info file to a string
if (fs.existsSync(userfile)) {
    var stats = fs.statSync(userfile);
    data = fs.readFileSync(userfile, 'utf-8');
    // assigns user data to variable
    users_reg_data = JSON.parse(data);
} else {
    console.log(userfile + ' does not exist!');
    users_reg_data = {};
}

// Converts product data file to a string
if (fs.existsSync(productfile)) {
    var statsOne = fs.statSync(productfile);
    dataOne = fs.readFileSync(productfile, 'utf-8');
    // Assigns product data to variable
    products_data = JSON.parse(dataOne);
} else {
    console.log(productfile + ' does not exist!');
    products_data = {};
}

// function to check if quantity is a non-number/negative number/ or non-integer. Code from Lab: Using and Creating Functions
function isNonNeg(q, returnErrors = false) {
    errors = []; // assume no errors at first
    if (q < 0) errors.push('a negative value!'); // Check if it is non-negative
    return returnErrors ? errors : (errors.length == 0); // Returns error array
}

// function to check if attempted quantity purchase is above product available quantity
function isAboveQuantity(q, qan, returnQuanErrors = false) {
    quanerror = []; // assume no errors at first
    if (q > qan) quanerror.push('quantity available!'); // Check if value is above available quantity
    return returnQuanErrors ? quanerror : (quanerror.length == 0); // Returns quanerror array
}

// Generates invoice page
app.get("/invoice", function (request, response) {
    let loguser = request.cookies['username']; // requests username cookie
    let noCookiestr = ""; // Initializes string
    noCookiestr += `Sorry! Your login has expired! <a href="/login" class="w3-bar-item w3-button w3-padding-16">Login/Register</a>`;
    // Checks if user is logged in to display invoice. If not then it will display a login/register button
    if (loguser == null) {
        response.send(noCookiestr);
    }
    else {
        let continuecode = "";
    }

    let str = ""; // Initializes string
    str += `<head>
    <title>Shopping Cart</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    <link rel="stylesheet" href="https://www.w3schools.com/lib/w3-theme-black.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css">
    <!-- Calling for products data -->
    <!--<script src="./products.js" type="text/javascript"></script> -->
    <script src="./functions.js"></script>
    <script>
        var products_data;
        loadJSON('get_products_data', function (response) {
            // Parsing JSON string into object
            products_data = JSON.parse(response);
        });
        loadJSON('get_cart', function (response) {
            // Parsing JSON string into object
            shopping_cart = JSON.parse(response);
        });
        </script>
</head>

<body>
    <!-- Header -->
    <header class="w3-container w3-theme w3-padding" id="myHeader">
        <div class="w3-container">
            <div class="w3-bar w3-theme">
                <a href="index.html" class="w3-bar-item w3-button w3-padding-16">Home</a>
                <div class="w3-dropdown-hover">
                    <button class="w3-button w3-padding-16">
                        Mice <i class="fa fa-caret-down"></i>
                    </button>
                    <div class="w3-dropdown-content w3-card-4 w3-bar-block">
                        <script>`;

    str += '    document.write(`'

    str += `<form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Razer">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Razer Mice</button>
    </form>
    <form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Logitech">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Logitech Mice</button>
    </form>
    <form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Steelseries">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Steelseries Mice</button>
    </form>`;
    str += '`);'
    str += `  </script>

                    </div>
                </div>
                <p class="w3-right">
                    <a href='./cart.html'><i class="fa fa-shopping-cart w3-margin-right w3-xlarge"></i></a>
                </p>
                <a href="#" class="w3-bar-item w3-button w3-padding-16">Logged In: ${loguser}</a>
            </div>
        </div>
        <div class="w3-center">
            <h1 class="w3-xxxlarge w3-animate-bottom">Christopher's Mouse Store</h1>
        </div>
    </header>
        </form>
        <form class="w3-container" action="edituserinfo" method="POST">
    <div class="w3-center">
    <h2>Purchase Invoice for: ${loguser}</h2>
    <p>Click Here to Edit User Info: <button class="w3-button w3-theme" type="submit" value="editinfo">Edit</button></p>
    </form>
        </div>
    <div class="w3-responsive w3-card-4">
        <table class="w3-table w3-striped w3-bordered">
            <thead>
                <tr class="w3-theme">
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Extended Price</th>
                </tr>
            </thead>

            <tbody>
                <script>
                    var subtotal = 0
                    // Sales tax rate
                    var salestax = 0.0575;
                    for (product_key in products_data) {
                        for (i = 0; i < products_data[product_key].length; i++) {
                            if (typeof shopping_cart[product_key] == 'undefined') continue;
                            qty = shopping_cart[product_key][i];
                            let extended_price = (products_data[product_key][i].price * qty); // calculates extended price
                            subtotal += extended_price; // adds extendedprice to collective subtotal
                            if (qty > 0) {`;
    str += 'document.write(`';
    str += '<tr><td>${products_data[product_key][i].name}</td><td>${qty}</td><td>${products_data[product_key][i].price}</td><td>${extended_price}</td><tr>';
    str += '`);';
    str += `}
                        }
                    }
                    var taxedamount = salestax * subtotal; // calculates tax amount
                    //Shipping
                    if (subtotal < 50) {
                        shipping = 2;
                    } else if (subtotal < 100) {
                        shipping = 5;
                    } else {
                        shipping = 0.05 * subtotal;
                    }
                    // Total amount that needs to be paid
                    var grandtotal = taxedamount + subtotal + shipping;`;
    str += 'document.write(`';
    str += `<tr>
                        <td colspan="4" width="100%">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;" colspan="3" width="67%">Sub-total</td>
                        <td width="54%">$`;
    str += '${subtotal}</td>';
    str += `</tr>
                    <tr>
                        <td style="text-align: center;" colspan="3" width="67%"><span style="font-family: arial;">Tax @
                                5.75%</span></td>
                        <td width="54%">$`;
    str += '${taxedamount.toFixed(2)}</td>';
    str += `</tr>
                    <tr>
                        <td style="text-align: center;" colspan="3" width="67%"><span
                                style="font-family: arial;">Shipping</span></td>
                        <td width="54%">$`;
    str += '${shipping.toFixed(2)}</td>';
    str += `</tr>
                    <tr>
                        <td style="text-align: center;" colspan="3" width="67%"><strong>Total</strong></td>
                        <td width="54%"><strong>$`;
    str += '${grandtotal.toFixed(2)}</strong></td>';
    str += `</tr>
                    </tbody>
        </table>
        <form class="w3-container" action="confirmorder" method="POST">
<div class="w3-center">
<p>Please Click Here to Confirm your Order: <button class="w3-button w3-theme" type="submit" value="confirmOrder">Confirm</button></p>
</form>
            <br><br><br>
</body>


<!-- Shipping pricing disclaimer -->
<b>OUR SHIPPING POLICY IS:A subtotal $0 - $49.99 will be $2 shipping
    A subtotal $50 - $99.99 will be $5 shipping
    Subtotals over $100 will be charged 5% of the subtotal amount <b>
<br><br><br><br><br><br><br><br><br>

<!-- Footer -->
    <footer class="w3-center w3-container w3-theme-dark w3-padding-16">
      <h3>Your one stop shop for computer mice!</h3>
    </footer>


</html>`;
    str += '`);';
    str += `</script>`;
    response.send(str); // Sends invoice page 
});

// Generates confirmation order page
app.get("/genConfirmOrder", function (request, response) {
    let loguser = request.cookies['username']; // Requests username cookie
    let noCookiestr = ""; // Initializes string
    noCookiestr += `Sorry! Your login has expired! <a href="/login" class="w3-bar-item w3-button w3-padding-16">Login/Register</a>`;
    // Checks if user is logged in to display order confirmation page. If not then it will display a login/register button
    if (loguser == null) {
        response.send(noCookiestr);
    }
    else {
        let continuecode = "";
    }
    let user_email = users_reg_data[loguser].email; // Fetches user email
    var shopping_cart = request.session.cart; // Initializes shopping cart variable to the values in session cart
    let emailinvoice = ""; // Initializes email string
    let str = ""; // Initializes string
    let sendstr = ""; // Initializes string

    str += `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Order Confirmed</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    <link rel="stylesheet" href="https://www.w3schools.com/lib/w3-theme-black.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css">
    <!-- Calling for products data -->
    <script src="/products.js"></script>
    </head>
    <body>
    
    
    
    <!-- Header -->
        <header class="w3-container w3-theme w3-padding" id="myHeader">
            <div class="w3-container">
                <div class="w3-bar w3-theme">
                    <a href="index.html" class="w3-bar-item w3-button w3-padding-16">Home</a>
                    <div class="w3-dropdown-hover">
                        <button class="w3-button w3-padding-16">
                            Mice <i class="fa fa-caret-down"></i>
                        </button>
                        <div class="w3-dropdown-content w3-card-4 w3-bar-block">
                            <script>`;
    str += 'document.write(`'
    str += `<form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Razer">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Razer Mice</button>
    </form>
    <form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Logitech">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Logitech Mice</button>
    </form>
    <form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Steelseries">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Steelseries Mice</button>
    </form>`;
    str += '`);'
    str += `</script>
                            
                        </div>
                    </div>
                    <p class="w3-right">
                        <a href='./cart.html'><i class="fa fa-shopping-cart w3-margin-right w3-xlarge"></i></a>
                        The are <span id="cart_total">0</span> items in cart
                    </p>
                    <a href="#" class="w3-bar-item w3-button w3-padding-16">Login/Register</a>
                </div>
            </div>
            <div class="w3-center">
                <h1 class="w3-xxxlarge w3-animate-bottom">Christopher's Mouse Store</h1>
            </div>
        </header>
    <br>
    <h1 class="w3-center">Order Confirmed</h1>
    </div>
    
    <div class="w3-row-padding">
        `;
    str += '<script>';
    str += `
    var quantities = []; // initializes empty quantities array
    // Code is from personal Store1 WOD invoice.html
    var params = (new URL(document.location)).searchParams
    for (let i = 0; i < products.length; i++) {
    `;
    str += ' quantities.push(params.get(`';
    str += `quantity$`;
    str += '{i}`));';
    str += `
    }
    console.log(quantities);
    `;
    str += 'document.write(`';
    str += `<body>
    <p>
    <h2>Thank you, ${loguser} for your purchase!</h2>
    <br><br>
    <h2>Product sent to: <br>
    Name: ${users_reg_data[loguser].name}
    <br>
    Email: ${users_reg_data[loguser].email}
    </h2></p>
    <br><br>
    <p>Click Here to get back Home: <button class="w3-button w3-theme" value="toProdDisplay" onclick="window.location.href='/index.html';">Shop</button>
    </p>
    </body>`;
    str += '`);</script>';

    sendstr += `
    </div>
    
    <br><br><br><br><br><br>

    <!-- Footer -->
    <footer class="w3-center w3-container w3-theme-dark w3-padding-16">
    <h3>Your one stop shop for computer mice!</h3>
    </footer>


    </body>
    </html>`;



    emailinvoice += `<table class="w3-table w3-striped w3-bordered">
            <thead>
                <tr class="w3-theme">
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Extended Price</th>
                </tr>
            </thead>
            <tbody>`;
    // Initializes subtotal at 0
    var subtotal = 0
    // Sales tax rate
    var salestax = 0.0575;
    // Loops through products to print out invoice table
    for (product_key in products_data) {
        for (i = 0; i < products_data[product_key].length; i++) {
            if (typeof shopping_cart[product_key] == 'undefined') continue; // skips printing out row if 0 quantity
            qty = shopping_cart[product_key][i]; // gets quantity
            let extended_price = (products_data[product_key][i].price * qty); // calculates extended price
            subtotal += extended_price; // adds extendedprice to collective subtotal
            // Prints row if quantity is greater than 0
            if (qty > 0) {
                emailinvoice += `<tr><td>${products_data[product_key][i].name}</td><td>${qty}</td><td>${products_data[product_key][i].price}</td><td>${extended_price}</td><tr>`;
            }
        }
    }
    var taxedamount = salestax * subtotal; // calculates tax amount
    //Shipping
    if (subtotal < 50) {
        shipping = 2;
    } else if (subtotal < 100) {
        shipping = 5;
    } else {
        shipping = 0.05 * subtotal;
    }
    // Total amount that needs to be paid
    var grandtotal = taxedamount + subtotal + shipping;

    emailinvoice += `<tr>
                        <td colspan="4" width="100%">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;" colspan="3" width="67%">Sub-total</td>
                        <td width="54%">$`;
    emailinvoice += `${subtotal}</td>`;
    emailinvoice += `</tr>
                    <tr>
                        <td style="text-align: center;" colspan="3" width="67%"><span style="font-family: arial;">Tax @
                                5.75%</span></td>
                        <td width="54%">$`;
    emailinvoice += `${taxedamount.toFixed(2)}</td>`;
    emailinvoice += `</tr>
                    <tr>
                        <td style="text-align: center;" colspan="3" width="67%"><span
                                style="font-family: arial;">Shipping</span></td>
                        <td width="54%">$`;
    emailinvoice += `${shipping.toFixed(2)}</td>`;
    emailinvoice += `</tr>
                    <tr>
                        <td style="text-align: center;" colspan="3" width="67%"><strong>Total</strong></td>
                        <td width="54%"><strong>$`;
    emailinvoice += `${grandtotal.toFixed(2)}</strong></td>`;
    emailinvoice += `</tr>
                    </tbody>
        </table>`;
    // Emailer code is used from Assignment 3 code example website: https://dport96.github.io/ITM352/morea/180.Assignment3/reading-code-examples.html
    // Initializes transporter variable with port and host email data
    var transporter = nodemailer.createTransport({
        host: "mail.hawaii.edu",
        port: 25,
        secure: false, // use TLS
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        }
    });

    // Initializes email sender information and strings to send
    var mailOptions = {
        from: 'chrisY@mice.com',
        to: user_email,
        subject: 'Order Invoice',
        html: emailinvoice
    };

    // Sends email to customer along with invoice information
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            str += '<br>There was an error and your invoice could not be emailed.';
        } else {
            str += `<br>Your invoice was mailed to ${user_email}`;
        }
        users_reg_data[loguser].page = "index.html"; // Sets last visited page to home page
        fs.writeFileSync(userfile, JSON.stringify(users_reg_data)); // writes user page to user data file
        response.cookie('username', "undefined", { "maxAge": -1 }); // Logs out user after checkout
        request.session.cart = ""; // Clears session cart
        response.send(str + sendstr); // Send order confirmation page
    });
});

// Prints out editing user page
function editingUser() {
    let loguser = request.cookies['username']; // Fetches username cookie
    let str = "";
    str += `
            <!DOCTYPE html>
    <html>
    <head>
    <title>Editing User Information</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    <link rel="stylesheet" href="https://www.w3schools.com/lib/w3-theme-black.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css">
    </head>
    <body>
    
    
    
    <!-- Header -->
    <header class="w3-container w3-theme w3-padding" id="myHeader">
      <div class="w3-center">
          <h1 class="w3-xxxlarge w3-animate-bottom">Christopher's Mouse Store</h1>
      </div>
    </header>
    <br>
    <h1 class="w3-center">Editing your Account</h1>
    </div>
    
    <div class="w3-row-padding">
        `;
    str += '<script> document.write(`';
    str += `<body>
    <form class="w3-container" action="/changedinfo" method="POST">
      <h2>User Information Form</h2>
      <div class="w3-section">   
        <input class="w3-input" type="text" name="username" value="${loguser}">
        <label for="username">Username</label>
        ${(typeof errors['no_username'] != 'undefined') ? errors['no_username'] : ''}
        ${(typeof errors['username_taken'] != 'undefined') ? errors['username_taken'] : ''}
      </div>
      <div class="w3-section">      
        <input class="w3-input" type="text" name="fullname" value="${users_reg_data[loguser].name}">
        <label for="fullname">Full Name</label>
        ${(typeof errors['no_fullname'] != 'undefined') ? errors['no_fullname'] : ''}
        ${(typeof errors['fullname_taken'] != 'undefined') ? errors['fullname_taken'] : ''}
      </div>
      <div class="w3-section">      
        <input class="w3-input" type="text" name="email" value="${users_reg_data[loguser].email}">
        <label for="email">Email</label>
        ${(typeof errors['fail_email'] != 'undefined') ? errors['fail_email'] : ''}
      </div>
      <div class="w3-section">
        <input class="w3-input" type="password" name="password">
        <label for="password">Password</label>
        ${(typeof errors['fail_password'] != 'undefined') ? errors['fail_password'] : ''}
      </div>
      <div class="w3-section">
        <input class="w3-input" type="password" name="passwordconfirm">
        <label for="passwordconfirm">Please enter password again</label>
        ${(typeof errors['password_mismatch'] != 'undefined') ? errors['password_mismatch'] : ''}
      </div>
      <button class="w3-button w3-theme" type="submit" value="regb">Edit Info</button>
      </div>
      <div class="w3-row"></div>
    </form>
    </body>`;
    str += '`);</script>';
    str += `

    </div>
    <br><br><br><br><br><br><br><br><br><br><br><br><br>

    <!-- Footer -->
    <footer class="w3-center w3-container w3-theme-dark w3-padding-16">
      <h3>Your one stop shop for computer mice!</h3>
    </footer>
    
    
    </body>
    </html>`;
    return str; // Returns editing user page
}

// Generates user login page
app.get("/login", function (request, response) {
    let str = "";
    // Give a simple register form
    str += `
            <!DOCTYPE html>
<html>
<head>
<title>Login</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
<link rel="stylesheet" href="https://www.w3schools.com/lib/w3-theme-black.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css">
</head>
<body>



<!-- Header -->
        <header class="w3-container w3-theme w3-padding" id="myHeader">
            <div class="w3-container">
                <div class="w3-bar w3-theme">
                    <a href="index.html" class="w3-bar-item w3-button w3-padding-16">Home</a>
                    <div class="w3-dropdown-hover">
                        <button class="w3-button w3-padding-16">
                            Mice <i class="fa fa-caret-down"></i>
                        </button>
                        <div class="w3-dropdown-content w3-card-4 w3-bar-block">
                            <script>`;
    str += 'document.write(`';
    str += `<form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Razer">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Razer Mice</button>
    </form>
    <form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Logitech">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Logitech Mice</button>
    </form>
    <form action="/visitedpage" method"GET">
    <input type="hidden" name="visitingpage" value="Steelseries">
    <button class="w3-bar-item w3-button" type="submit" value="visit" name="Submit">Steelseries Mice</button>
    </form>`;
    str += '`);'
    str += `</script>
                            
                        </div>
                    </div>
                    <p class="w3-right">
                        <a href='./cart.html'><i class="fa fa-shopping-cart w3-margin-right w3-xlarge"></i></a>
                        The are <span id="cart_total">0</span> items in cart
                    </p>
                </div>
            </div>
            <div class="w3-center">
                <h1 class="w3-xxxlarge w3-animate-bottom">Christopher's Mouse Store</h1>
            </div>
        </header>
<br>
<h2 class="w3-center">Login to your account</h2>
</div>

<div class="w3-row-padding">

        `;
    str += '<script>';
    str += `
    `;
    str += 'document.write(`';
    str += `<body>
    <form class="w3-container" action="?" method="POST">  
      <h2>Login Form</h2>
      <div class="w3-section">      
        <input class="w3-input" type="text" name="username">
        <label for="username">Username</label>
        ${(typeof loginerrors['no_username'] != 'undefined') ? loginerrors['no_username'] : ''}
      </div>
      <div class="w3-section">
        <input class="w3-input" type="password" name="password">
        <label for="password">Password</label>
        ${(typeof loginerrors['wrong_password'] != 'undefined') ? loginerrors['wrong_password'] : ''}
      </div>
      <button class="w3-button w3-theme" type="submit" value="loginb">Login</button>
      </div>
      <div class="w3-row"></div>
    </form>
    </body>`;
    str += '`);</script>';
    str += `
    </div>
    
    
    <br><br><br><br>
    <div id="regb" class="w3-center">
      <h2>Don't have an account?</h2>
      <p>Click <a href="./register">here</a> to sign up!</p>
    </div>
    <br><br><br><br><br><br><br><br><br>
    
    
    <!-- Footer -->
    <footer class="w3-center w3-container w3-theme-dark w3-padding-16">
      <h3>Your one stop shop for computer mice!</h3>
    </footer>
    
    
    </body>
    </html>`;
    response.send(str); // Sends login page

});

// Generates registration page
app.get("/register", function (request, response) {
    let params = new URLSearchParams(request.query); // fetches parmaters
    let str = "";
    // Give a simple register form
    str += `
            <!DOCTYPE html>
    <html>
    <head>
    <title>Registration</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    <link rel="stylesheet" href="https://www.w3schools.com/lib/w3-theme-black.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css">
    </head>
    <body>
    
    
    
    <!-- Header -->
        <header class="w3-container w3-theme w3-padding" id="myHeader">
            <div class="w3-container">
                <div class="w3-bar w3-theme">
                    <a href="index.html" class="w3-bar-item w3-button w3-padding-16">Home</a>
                    <div class="w3-dropdown-hover">
                        <button class="w3-button w3-padding-16">
                            Mice <i class="fa fa-caret-down"></i>
                        </button>
                        <div class="w3-dropdown-content w3-card-4 w3-bar-block">
                            <script>`;
    str += 'document.write(`';
    str += `<a href="products_display.html?products_key=Razer" class="w3-bar-item w3-button">Razer Mice</a>
                            <a href="products_display.html?products_key=Logitech" class="w3-bar-item w3-button">Logitech Mice</a>
                            <a href="products_display.html?products_key=Steelseries" class="w3-bar-item w3-button">Steelseries Mice</a>`;
    str += '`);'
    str += `</script>
                            
                        </div>
                    </div>
                    <p class="w3-right">
                        <a href='./cart.html'><i class="fa fa-shopping-cart w3-margin-right w3-xlarge"></i></a>
                        The are <span id="cart_total">0</span> items in cart
                    </p>
                </div>
            </div>
            <div class="w3-center">
                <h1 class="w3-xxxlarge w3-animate-bottom">Christopher's Mouse Store</h1>
            </div>
        </header>
    <br>
    <h1 class="w3-center">Create your account</h1>
    </div>
    
    <div class="w3-row-padding">
        `;
    str += '<script> document.write(`';
    str += `<body>
    <form class="w3-container" action="?${params.toString()}" method="POST">
      <h2>Registration Form</h2>
      <div class="w3-section">      
        <input class="w3-input" type="text" name="username">
        <label for="username">Username</label>
        ${(typeof errors['no_username'] != 'undefined') ? errors['no_username'] : ''}
        ${(typeof errors['username_taken'] != 'undefined') ? errors['username_taken'] : ''}
      </div>
      <div class="w3-section">      
        <input class="w3-input" type="text" name="fullname">
        <label for="fullname">Full Name</label>
        ${(typeof errors['no_fullname'] != 'undefined') ? errors['no_fullname'] : ''}
        ${(typeof errors['fullname_taken'] != 'undefined') ? errors['fullname_taken'] : ''}
      </div>
      <div class="w3-section">      
        <input class="w3-input" type="text" name="email">
        <label for="email">Email</label>
        ${(typeof errors['fail_email'] != 'undefined') ? errors['fail_email'] : ''}
      </div>
      <div class="w3-section">
        <input class="w3-input" type="password" name="password">
        <label for="password">Password</label>
        ${(typeof errors['fail_password'] != 'undefined') ? errors['fail_password'] : ''}
      </div>
      <div class="w3-section">
        <input class="w3-input" type="password" name="passwordconfirm">
        <label for="passwordconfirm">Please enter password again</label>
        ${(typeof errors['password_mismatch'] != 'undefined') ? errors['password_mismatch'] : ''}
      </div>
      <button class="w3-button w3-theme" type="submit" value="regb">Register</button>
      </div>
      <div class="w3-row"></div>
    </form>
    </body>`;
    str += '`);</script>';
    str += `

    </div>
    <br><br><br><br><br><br><br><br><br><br><br><br><br>

    <!-- Footer -->
    <footer class="w3-center w3-container w3-theme-dark w3-padding-16">
      <h3>Your one stop shop for computer mice!</h3>
    </footer>
    
    
    </body>
    </html>`;
    response.send(str); // Sends user registration page

});

// Processes user registration information
app.post("/register", function (request, response) {
    // process a simple register form
    let username = request.body.username.toLowerCase();

    // check is username taken
    if (typeof users_reg_data[username] != 'undefined') {
        errors['username_taken'] = `Error: The username "${username}" is already registered!`;
    }
    // Checks if repeated password is the same as entered password
    if (request.body.password != request.body.passwordconfirm) {
        errors['password_mismatch'] = `Error: Repeated password is not the same!`;
    }
    // Checks if username is empty
    if (request.body.username == '') {
        errors['no_username'] = `Error: You need to enter a username!`;
    }
    // Checks if full name is empty
    if (request.body.fullname == '') {
        errors['no_fullname'] = `Error: You need to enter a Full Name!`;
    }
    // Checks if email passes regex
    if (emailregex.test(request.body.email) == false) {
        errors['fail_email'] = `Error: Your entered email is not valid!`;
    }
    // Checks if password passes regex
    if (passwordregex.test(request.body.password) == false) {
        errors['fail_password'] = `Error: Your entered password is not valid!`;
    }
    if (Object.keys(errors).length == 0) {
        // If there are no errors user information is initialized
        users_reg_data[username] = {};
        users_reg_data[username].name = request.body.fullname;
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;
        users_reg_data[username].page = "index.html";
        fs.writeFileSync(userfile, JSON.stringify(users_reg_data)); // Writes user information to user data file
        console.log("Saved: " + users_reg_data);
        // 5 minute login cookie sent to browser
        response.cookie('username', username, { "maxAge": 300000 });
        // Redirects user to home page
        response.redirect("/index.html");
    } else {
        // If there are errors then user is sent back to registration page along with errors
        response.redirect("./register?" + params.toString());

    }
});

// Processes login page information
app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    var the_username = request.body['username'].toLowerCase();
    var the_password = request.body['password'];
    if (typeof users_reg_data[the_username] != 'undefined') {
        if (users_reg_data[the_username].password == the_password) {
            // 5 minute login cookie sent to browser
            response.cookie('username', the_username, { "maxAge": 300000 });
            // IR 1 Requirement: Directs user to last product page visited when logging in
            response.redirect(users_reg_data[the_username].page); // Sends user to last visited product page
        } else {
            loginerrors['wrong_password'] = `Error: Wrong password!`;
            response.redirect('./login?');
        }
        return;
    } else {
        loginerrors['no_username'] = `Error: "${the_username}" does not exist`;
        response.redirect('./login?');
    }
});

// Processes editing user information page info
app.post("/edituserinfo", function (request, response) {
    var loguser = request.cookies['username'];
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    if (typeof users_reg_data[loguser] != 'undefined') {
        response.send(editingUser(the_username));
    } else {
        response.redirect('./products_display.html');
    }
});

// Processes edited user info page
app.post("/changedinfo", function (request, response) {
    // process a simple register form
    username = request.body.username.toLowerCase();
    let params = new URLSearchParams(request.query);
    var originuser = request.cookies['username'];

    // check is username taken
    if (request.body.password != request.body.passwordconfirm) {
        errors['password_mismatch'] = `Error: Repeated password is not the same!`;
    }
    // Checks if there is no username
    if (request.body.username == '') {
        errors['no_username'] = `Error: You need to enter a username!`;
    }
    // Checks if there is no full name
    if (request.body.fullname == '') {
        errors['no_fullname'] = `Error: You need to enter a Full Name!`;
    }
    // Checks if email passes email regex
    if (emailregex.test(request.body.email) == false) {
        errors['fail_email'] = `Error: Your entered email is not valid!`;
    }
    // Checks if password passes regex
    if (passwordregex.test(request.body.password) == false) {
        errors['fail_password'] = `Error: Your entered password is not valid!`;
    }
    if (Object.keys(errors).length == 0) {
        delete users_reg_data[originuser]; // Deletes user info that is being edited
        // If there are no errors user information is initialized
        users_reg_data[username] = {};
        users_reg_data[username].name = request.body.fullname;
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;
        users_reg_data[username].page = "index.html";
        fs.writeFileSync(userfile, JSON.stringify(users_reg_data)); // Writes user information to user data file
        console.log("Saved: " + users_reg_data);
        // 5 minute login cookie sent to browser
        response.cookie('username', username, { "maxAge": 300000 });
        response.redirect("./invoice"); // Redirects user back to invoice page
    } else {
        response.redirect("./register?" + params.toString()); // redirects user back to registration page if there are errors

    }
});

// Processes confirmation order information
app.post("/confirmorder", function (request, response) {
    let loguser = request.cookies['username']; // Requests username cookie
    let noCookiestr = ""; // Initializes string
    noCookiestr += `Sorry! Your login has expired! <a href="/login" class="w3-bar-item w3-button w3-padding-16">Login/Register</a>`;
    // Checks if user is logged in to display order confirmation page. If not then it will display a login/register button
    if (loguser == null) {
        response.send(noCookiestr);
    }
    else {
        let continuecode = "";
    }
    var shopping_cart = request.session.cart; // Assigns variable to shopping cart variable
    // Loops through products to print out invoice table
    for (product_key in products_data) {
        for (i = 0; i < products_data[product_key].length; i++) {
            if (typeof shopping_cart[product_key] == 'undefined') continue; // Skips calculating quantity available if 0 quantity
            var qty = shopping_cart[product_key][i]; // Assigns quantity value
            let quanAvil = products_data[product_key][i].quantity_available; // Initializes quantity available from products file
            let minusQuan = qty; // assigns minus quantity variable as quantity purchasing value
            products_data[product_key][i].quantity_available = (quanAvil - minusQuan); // Sets new products data file as updated quantity available number
        }
    }
    response.redirect("/genConfirmOrder"); // Sends user to confirmation order page
});

// Directs user to correct product display page
// IR 1 Requirement: Saves the last product page a user visits
app.get("/visitedpage", function (request, response, next) {
    let loguser = request.cookies['username']; // Fetches username cookie
    let pageOn = request.query['visitingpage']; // Fetches page that user will be directed to
    // Checks if user is logged in, if not then they are directed to desired product page
    if (loguser == null) {
        if (pageOn == 'Razer') {
            response.redirect("products_display.html?products_key=Razer");
        } else if (pageOn == 'Logitech') {
            response.redirect("products_display.html?products_key=Logitech");
        } else {
            response.redirect("products_display.html?products_key=Steelseries");
        }
    }
    else {
        // If user is logged in then visited page will be stored in user data
        if (pageOn == 'Razer') {
            users_reg_data[loguser].page = "products_display.html?products_key=Razer";
            fs.writeFileSync(userfile, JSON.stringify(users_reg_data));
            response.redirect("products_display.html?products_key=Razer");
        } else if (pageOn == 'Logitech') {
            users_reg_data[loguser].page = "products_display.html?products_key=Logitech";
            fs.writeFileSync(userfile, JSON.stringify(users_reg_data));
            response.redirect("products_display.html?products_key=Logitech");
        } else {
            users_reg_data[loguser].page = "products_display.html?products_key=Steelseries";
            fs.writeFileSync(userfile, JSON.stringify(users_reg_data));
            response.redirect("products_display.html?products_key=Steelseries");
        }
    }

});

// Logs user out
app.get("/logout", function (request, response, next) { 
    let loguser = request.cookies['username']; // Fetches username cookie
    if (loguser == null) {
        var doNothing = "";
    }
    else {
    response.cookie('username', "undefined", { "maxAge": -1 }); // Clears login cookie
    response.redirect("/index.html"); // redirects to home page
    }
});

app.all('*', function (request, response, next) {
    // need to initialize an object to store the cart in the session. We do it when there is any request so that we don't have to check it exists
    // anytime it's used
    if (typeof request.session.cart == 'undefined') { request.session.cart = {}; }
    request.session.save();
    next();
});

// processing products.js from initialized data 
// Code from Lab: Server Side Form Processing Exercise 4
app.get("/products.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products = ${JSON.stringify(products)};`;
    response.send(products_str);
});

// Fetches product data
app.get("/get_products_data", function (request, response) {
    response.json(products_data);
});

// Processes quantity values and checks for errors
app.get("/add_to_cart", function (request, response) {
    var shopping_cart = request.session.cart;
    var products_key = request.query['products_key']; // get the product key sent from the form post
    var quantities = request.query['quantity'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
    request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
    // Loops through product data
    for (product_key in products_data) {
        for (i = 0; i < products_data[product_key].length; i++) {
            if (typeof shopping_cart[product_key] == 'undefined') continue; // If a 0 quantity then skips quantity validation for specific product
            let page_key = products_key; // Initializes page_key for brand name
            let producterror = products_data[products_key][i].name; // Initializes product name
            // Checks for negative number
            if (isNonNeg(shopping_cart[products_key][i]) == false) {
                response.redirect("./products_display.html?products_key=" + `${page_key}` + `&error=Your entered value for ${producterror} is ${errors.join(" ")}`);
            }
            // checks if attempted quantity to purchase is above the inventory availability of the product
            if (isAboveQuantity(shopping_cart[products_key][i], products_data[products_key][i].quantity_available) == false) {
                let page_key = products_key
                // if check fails then user will be stay on the products display with an error message of the invalid value
                response.redirect("./products_display.html?products_key=" + `${page_key}` + `&error=The quantity for ${producterror} exceeds ${quanerror}`);
            }
        }
    }
    response.redirect('./cart.html'); // If no errors then they are directed to cart html page
});

// Gets session cart to send to request
app.get("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));