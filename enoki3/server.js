var express = require('express'); // referenced from lab14 server lab
var app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var session = require('express-session');
var products_data = require('./products.json');
var user_data = require("./user_data.json");
var nodemailer = require("nodemailer");


order_str = "";


app.use(session(
    {secret: "MySecretKey", 
    resave: true, 
    saveUninitialized: true,
    cookie: {
        maxAge: 50000,
        httpOnly: true,
        secure: false,
        signed: true
    }
}));


const crypto = require('crypto'); // used to encrypt password, taken from my assignment2
const algorithm = 'aes-256-cbc'; // defines the encryption algorithm
const key = 'asdfasdfasdfasdfasdfasdfasdfasdf'; // defines the key used in the algorithm, it is set so that each unique password has a specified encryption attached to it
const iv = 'asdfasdfasdfasdf'; // defines the initializing variable at its initial state, this is set instead of a randomByte method so that everytime you enter the same password, it will encyrpt as the same encrytion data. Used to match passwords when logging in

function encrypt(text) { // this function encrypts text such as passwords
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv); // defines the variable cipher to the encryption algorithm using the key and iv
    let encrypted = cipher.update(text); // updates the text with the encryption, basically encrypting the password
    encrypted = Buffer.concat([encrypted, cipher.final()]); // uses concatenation to link the series of text so that it may be output
    return encrypted.toString('hex'); // returns the encrypted password as a string so that it can be compared to the user input password
}

//Taken from the Stor1 WOD
//check if there are any invalid quantity inputs
function checkQuantity(quantityString, returnErrors = false) {
    errors = []; // assume no errors at first
    if (Number(quantityString) != quantityString) {
        errors.push('Not a number!'); // Check if string is a number value
    } else if (Number(quantityString) < 0) {
        errors.push('Negative value!'); // Check if it is non-negative
    } else if (parseInt(quantityString) != quantityString) {
        errors.push('Not an integer!'); // Check that it is an integer
    } else if(quantityString == '') {
        quantityString = 0
    }
    if (returnErrors) {
        return errors;
    } else if (errors.length == 0) {
        return true;
    } else {
        return false;
    }
};


// routes all other GET requests to files in the public folder
app.use(express.static(__dirname + '/public'));

// gives the server access to the request packet
app.use(express.urlencoded({ extended: true }));

for (let key in products_data) {
    products_data[key].forEach((prod) => {prod.total_sold = 0});
}
var fs = require('fs');
var fname = "user_data.json";

if (fs.existsSync(fname)) {
    var data = fs.readFileSync(fname, 'utf-8');
    var users = JSON.parse(data);
    console.log(users);
} else {
    console.log("Sorry file " + fname + " does not exist.");
}

// creates the response for all requests
app.all('*', function (request, response, next) {
    if(typeof request.session.cart == 'undefined') { request.session.cart = {}; } 
    next();
});

app.get("/get_users", function (request, response) {
    response.json(user_data);
});

app.get("/get_cookies", function (request, response) {
    response.json(request.cookies);
});

app.get("/use_session", function (request, response){
    response.send("welcome, your session ID is: " + request.session.id);
    request.session.destroy();
});


app.get("/login", function (request, response) {
    // Give a simple login form
    if (typeof request.session.last_login != 'undefined'){
        login_time = "last login was" + request.session.last_login;
        request.session.cart;
    } else {
        login_time = "first login";
    }
    if (typeof request.cookies.email != 'undefined') {
        my_cookie_name = request.cookies["name"]; // "grabbing" the cookie to be used
    } else {
        my_cookie_name = "No user";
    }

    var params = new URLSearchParams(request.query); // use search params to find the params within the document    
    console.log(params);
    

    str = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="homepage.css" rel="stylesheet">
    <title>Login</title>
</head>

<body>
<ul>
<li><a href="./index.html">Home</a></li>
<li><a id="login-link" href="/login">Login</a></li>
<li><a href="/register">Register</a></li>
<li class="dropdown">
  <a href="javascript:void(0)" class="dropbtn">Products</a>
  <div class="dropdown-content">
    <script>
    document.write('<a href='./products.html?products_key=keyboards'>Keyboards');
    document.write('<a href='./products.html?products_key=switches'>Switches');
    document.write('<a href='./products.html?products_key=keycaps'>Keycaps');
</script>
  </div>
</li>
<li style="float:right"><a class="active" href="./cart.html">Cart</a></li>
</ul>
    <form action="/login" method="POST">
        login info: ${login_time} by ${my_cookie_name}<br>
        <input type="text" name="email" size="40" placeholder="enter email"><br />
        <input type="password" name="password" size="40" placeholder="enter password"><br />
        <input type="submit" value="Submit" id="submit">
        <button type="button" style="position: absolute;" id="return_shopping"
            onclick="window.location.href = './products.html?products_key=keyboards'">Return to shopping</button>
    </form>
</body>
</html>`;
    response.send(str);
 });


app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    let POST = request.body;
    user_email = POST["email"].toLowerCase();
    var user_pass = encrypt(request.body.password); // uses my encryption function to encrypt the users entered password
    loggedIn = false;
    

    
    console.log("User email=" + user_email + " password=" + user_pass);
    
    if (users[user_email] != undefined) {
        if (users[user_email].password == user_pass) {
            if (typeof request.session.last_login != 'undefined'){
            var msg = `you last logged in: ${request.session.last_login}`;
            var now = new Date();
            loggedIn=true;
        } else {
            var msg = ''
            var now = " first visit";
            loggedIn=true;
        }
        request.session.last_login = now; // creating a variable in the session, lives in the session
        response.cookie('email', user_email, {maxAge: 50000});
        response.cookie('loggedIn', loggedIn, {maxAge: 50000});
        response.cookie('cart', request.session.cart, {maxAge: 50000});
        response.redirect('./index.html');        
    } else {
        response.redirect('login');
    }
}
});

app.get('/logout', (request, response) => {
  // Destroy the cookie's created from login
  response.clearCookie('email');
  response.clearCookie('loggedIn');
  response.clearCookie('cart');
  // Destroy the session
  request.session.destroy(() => {
    // Redirect the user to the login page
    response.redirect('./index.html');
  });
});

app.get("/register", function (request, response) {
    // Give a simple register form
    let str = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="homepage.css" rel="stylesheet">
        <title>Login</title>
    </head>
<body onload='errorMessage()'>
<script>
var params = (new URL(document.location)).searchParams;
function errorMessage() {
    if (params.has('registerError')) {
        var errors = JSON.parse(params.get('registerError'));
        for (i = 0; i < register.elements.length; i++) {
            register[i].value = params.get(register[i].name);
            if (typeof errors[register[i].name] != 'undefined') {
              document.getElementById(register[i].name + '_error').innerHTML = errors[register[i].name];
            }
          }
          alert('Please fix errors on form.');
      }
    }
</script>
<ul>
<li><a href="./index.html">Home</a></li>
<li><a id="login-link" href="/login">Login</a></li>
<li><a href="/register">Register</a></li>
<li class="dropdown">
  <a href="javascript:void(0)" class="dropbtn">Products</a>
  <div class="dropdown-content">
    <script>
    document.write('<a href='./products.html?products_key=keyboards'>Keyboards');
    document.write('<a href='./products.html?products_key=switches'>Switches');
    document.write('<a href='./products.html?products_key=keycaps'>Keycaps');
</script>
  </div>
</li>
<li style="float:right"><a class="active" href="./cart.html">Cart</a></li>
</ul>
<form action="/register" method="POST" name="register">
<h1>Create your account here!</h1>

<label for="name"><b>Username</b></label>
<div id='name_error' style='color: red;'></div>
<input type="text" id="name" name="name" size="40" placeholder="enter username" ><br>

<label for="password"><b>Password</b></label>
<div id='password_error' style='color: red;'></div>
<input type="password" id="password" name="password" size="40" placeholder="enter password"><br>

<label for="repeatPassword"><b>Repeat Password</b></label>
<div id='repeatPassword_error' style='color: red;'></div>
<input type="password" id="repeatPassword" name="repeatPassword" size="40" placeholder="enter password again"><br>

<label for="email"><b>Email</b></label>
<div id='email_error' style='color: red;'></div>
<input type="email" id="email" name="email" size="40" placeholder="enter email"><br>


<button type="submit" value="Submit" id="submit">Register</button>
</form>
</body>
</html>
    `;
    response.send(str);
 });

 app.post("/register", function (request, response) {
    // process a simple register form
    var registerError = {};
    var register_name = request.body.name.toLowerCase();
    var user_email = request.body['email'].toLowerCase();
    var register_email = request.body['email'].toLowerCase();
    var loggedIn = false;
    
    // validate username
    if (/^[0-9a-zA-Z]+$/.test(request.body.name)) { // validates if their username only has letters and numbers. ref: https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
    } else {
        registerError['name'] = 'Username can only contain numbers and letters.'
    }
    
    if (request.body.name > 20 || request.body.name < 2){ // validates if the username if of sufficient length
        registerError['name'] = 'Username must be at least 2 characters and less than 30.'; // validates the username is long enough but not too long
    }
    
    if (typeof users[register_name] != 'undefined') {
        registerError['name'] = 'Username taken!'; // validates if there already is a user registered with that username
    }
    
    if (typeof users[register_name] == "") {
        registerError['name'] = 'Please enter a username.'; // makes sure they enter a username if they left it blank
    }
    
    // validate email
    // if statement below is used to ensure the email is formatted correctly by only allowing certain letters and symbols, such as the @ symbol
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(request.body.email)) { // ref: https://www.w3resource.com/javascript/form/email-validation.php ; used their validation expression
    } else {
        registerError['email'] = 'Enter valid email.'; // pushes error if they entered an invalid email
    }

    if (typeof users[register_email] != 'undefined') {
        registerError['email'] = 'Email already in use!'; // validates if there already is a user registered with that email
    }
    
    // validate password
    if (request.body.password < 10) {
        registerError['password'] = 'Password must be longer than 10 characters'; // can't have a password less than 10 letters
    }

    // IR2 & 3
    // strong password filter refrenced from: https://stackoverflow.com/questions/12090077/javascript-regular-expression-password-validation-having-special-characters
    if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,16}$/.test(request.body.password)) {
    } else {
        registerError['password'] = "Password must include at least one number and one special character"; //Error message pops upp if password does not contain at least one number or special character
    }
    
    if (request.body.password > 16) {
        registerError['password'] = 'Password can not be longer than 16 characters.'; // validates that the password isn't longer than 16 letters
    }
    
    if (request.body.password != request.body.repeatPassword) {
        registerError['repeatPassword'] = 'Passwords do not match.'; // makes sure the password and repeated password match
    }

   
    // used object.keys for the array to check that errors equal to zero
    // ref for objectkeys: https://www.w3schools.com/jsref/jsref_object_keys.asp
    if (Object.keys(registerError).length == 0) { // validates that the array that is being returned, which is the errors, is 0. If it is, redirect to invoice
        users[register_email] = {};
        users[register_email]["name"] = request.body["name"];
        users[register_email]["password"] = encrypt(request.body['password']);
        users[register_email].num_loggedIn = 0;
        users[register_email].last_login = Date();
        console.log("name: " + request.body["name"]);
        loggedIn=true;
        
        
        // this creates a string using are variable fname which is from users and then JSON will stringify the data "users"
        fs.writeFileSync(fname, JSON.stringify(users), "utf-8"); 
        response.cookie('email', user_email, {maxAge: 50000});
        response.cookie('loggedIn', loggedIn, {maxAge: 50000});
        response.cookie('cart', request.session.cart, {maxAge: 50000});
        // redirect to login page if all registered data is good, we want to keep the name enter so that when they go to the invoice page after logging in with their new user account
        response.redirect('./index.html') 
    } else {
        request.body['registerError'] = JSON.stringify(registerError); // if there are errors we want to create a string 
        let params = new URLSearchParams(request.body);
        response.redirect('/register?' + params.toString()); // then we will redirect them to the register if they have errors
        console.log(params.toString());
    }
    });

app.get("/get_products_data", function (request, response) {
    response.json(products_data);
});

app.get("/add_to_cart", function (request, response) {
    let valid = true;  //going to use the boolean to verify if the quantity entered is less than the qty_available 
    let valid_num= true;   
    let qty_name = 'quantity'; //name of textbox in products_data.html
    let qtys = request.query[qty_name]; //gets the quantities of the entered data 
    let product = request.query['products_key'];
    let zero_qty = false;
    for (i = 0; i < products_data[product].length; i++) { // Runs loop for all products and their respective entered quantities
        let qty = qtys[i];
        if(qty == 0 || qty =='') continue; //if no inputs are entered into a product quantity textbox, then continue to the next product in the qty array.
            if (checkQuantity(qty) && Number(qty) <= products_data[product][i].qty_available && Number(qty)>0) {
            //if the qty meets the above criteria, then update the product's qty sold and available with the respective product quantities entered   
            } else if(checkQuantity(qty) != true) { // if quantities is not equal to a valid number than it is false 
                valid_num = false;
            } else if(Number(qty) >= products_data[product][i].qty_available) { // If the quantities enter are greater then the qty_available, then valid = false (returns)
                valid = false;
             } if(qty > 0) { //if quantities is greater than 0 than this statement returns true
                zero_qty = true;
             }
            }
    //from Lab 13 info_server.new.js. For Individual Requirement 4 Assignment 1 (Erin)
    /*if the number entered is not a valid number as identified through the checkQuantity(qty) or did not meet the other conditions set in the if statement,
    then redirect user back to the products_display page and set the submit_button parameter to the respective error message*/
    if(valid_num == false){ 
        response.redirect(`products_display.html?products_key=${product}&error=Please Enter Valid Quantity`);
    /*if quantity available is less then the amount of quantity ordered, then redirect user back to the products_display page
    and set the submit_button parameter to the respective error message*/
    }else if(zero_qty == false) {
        response.redirect(`products_display.html?products_key=${product}&error=Need to select quantity to purchase`);
    }
    else if (valid == false) {
        response.redirect(`products_display.html?products_key=${product}&error=Not Enough Left In Stock!`);
    } else if (typeof qtys == "") {
        response.redirect(`products_display.html?products_key=${product}&error=Enter Quantity To Continue!`);
    } else {
        // If no errors are found, then redirect to the invoice page.
        products_key= request.query['products_key'];
        quantities = request.query['quantity'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
        request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
        console.log(request.session.cart[products_key])
        response.redirect('./cart.html');
    
    }
});

app.post("/update_cart",function(request, response){
    if(request.cookies.loggedIn == "true"){
        updated_qty = request.session.cart
        response.cookie('cart', updated_qty);
        response.redirect('./invoice.html')
    } else {
        response.redirect("/login")
    }
});

// Define the increaseQuantity() function and pass the products_key variable as an argument
function increaseQuantity(request, productId, product_key, products_data) {

      // Use the passed product_key variable to access the correct array of products in the products_data object
    var products = products_data[product_key];

    var index = products.findIndex(product => product.id === productId);

    // Use the passed products_key variable inside the function to update the quantity of the selected product in the request.session.cart array
    request.session.cart[product_key][index] += 1;
      }
  
  // Define the app.get() method and pass the products_key variable as an argument
  app.get("/increase_quantity", function(request, response) {
    // Get the index of the item from the request query string
    var productId = request.query.productId;

    // Get the product_key of the selected product from the request query string
    var product_key = request.query.product_key;
  
    // Increase the value of the item in the array by 1
    increaseQuantity(request, productId, product_key, products_data);
  
    // Redirect the user back to the shopping cart page
    response.redirect("./cart.html");
  });

// Define the increaseQuantity() function and pass the products_key variable as an argument
function decreaseQuantity(request, response, productId, product_key, products_data) {

    // Use the passed product_key variable to access the correct array of products in the products_data object
  var products = products_data[product_key];

  var index = products.findIndex(product => product.id === productId);

  // Use the passed products_key variable inside the function to update the quantity of the selected product in the request.session.cart array
  request.session.cart[product_key][index] -= 1;
  if (request.session.cart[product_key][index] == 0) {
    response.redirect("./products.html?products_key=keyboards");
  }
}


// Define the app.get() method and pass the products_key variable as an argument
app.get("/decrease_quantity", function(request, response) {
  // Get the index of the item from the request query string
  var productId = request.query.productId;

  // Get the product_key of the selected product from the request query string
  var product_key = request.query.product_key;

  // Increase the value of the item in the array by 1
  decreaseQuantity(request, response,  productId, product_key, products_data);

  // Redirect the user back to the shopping cart page
  response.redirect("./cart.html");
    
});

app.get("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

app.post("/get_to_cart", function (request, response){
    // Get the input element
    var quantityBox = document.getElementById("quantity-box");
    // Get the value from the input element
    var quantity = quantityBox.value;
    // Set the value in the session storage
    sessionStorage.setItem("quantity", quantity);
});

app.get('/checkout', function (request, response){
    var errors = {};
    var ifLoggedIn = request.cookies.loggedIn;
    if (!ifLoggedIn) {
        response.redirect(`/login`);
        return;
    }

    if (JSON.stringify(errors) === '{}') { // no errors, go to invoice
        var login_email = request.cookies.email;
        // put their name and email in url
        let params = new URLSearchParams();
        params.append('name', users[login_email]['name']); // get fullname for personalization
        response.redirect(`./invoice.html?` + params.toString()); // go to invoice
        console.log(user_email);
     } else {
        response.redirect(`./cart.html`);
     }
   
});

app.post("/complete_purchase", function (request, response){
       // Generate HTML invoice string
   subtotal = 0;
   var invoice_str = `Thank you for shopping with us!
<table border><th style="width:10%">Item</th>
<th class="text-right" style="width:15%">Quantity</th>
<th class="text-right" style="width:15%">Price</th>
<th class="text-right" style="width:15%">Extended Price</th>`;
   var shopping_cart = request.session.cart;
   for (product_key in shopping_cart) {
      for (i = 0; i < shopping_cart[product_key].length; i++) {
         if (typeof shopping_cart[product_key] == 'undefined') continue;
         qty = shopping_cart[product_key][i];
         let extended_price = qty * products_data[product_key][i].price;
         subtotal += extended_price;
         if (qty > 0) {
            invoice_str += `<tr><td>${products_data[product_key][i].item}</td>
            <td>${qty}</td>
            <td>$${products_data[product_key][i].price}</td>
            <td>$${extended_price}
            <tr>`;
            products_data[product_key][i].quantity_available -= Number(qty);
            products_data[product_key][i].total_sold += Number(qty);
         }
      }
   }
   var tax_rate = 0.0575;
   var tax = tax_rate * subtotal;

   // Compute shipping
   if (subtotal <= 500) {
       shipping = 35;
   } else {
       shipping = 0.04 * subtotal; // 4% of subtotal
   
   }
   // Compute grand total
   var total = subtotal + tax + shipping;

   invoice_str += `<tr>
        <tr><td colspan="4" align="right">Subtotal: $${subtotal.toFixed(2)}</td></tr>
        <tr><td colspan="4" align="right">Shipping: $${shipping.toFixed(2)}</td></tr>
        <tr><td colspan="4" align="right">Tax: $${tax.toFixed(2)}</td></tr>
        <tr><td colspan="4" align="right">Grand Total: $${total.toFixed(2)}</td></tr>
        </table>`;

   // from assignment 3 code examples
   // Set up mail server. Only will work on UH Network due to security restrictions
   var transporter = nodemailer.createTransport({
      host: "mail.hawaii.edu",
      port: 25,
      secure: false, // use TLS
      tls: {
         // do not fail on invalid certs
         rejectUnauthorized: false
      }
   });

   var user_email = request.session.email;
   var mailOptions = {
      from: 'enokij@hawaii.edu',
      to: user_email,
      subject: `Your invoice from Justin's Keyboard Store `,
      html: invoice_str
   };
   
   transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
         invoice_str += `<br>Error: Invoice failed to deliver to ${user_email}`;
      } else {
         invoice_str += `<br>Your invoice was emailed to ${user_email}`;
      }
      response.clearCookie('email');
      response.clearCookie('loggedIn');
      response.clearCookie('cart'); // log out
      response.send(`<script>alert('Your invoice has been sent!'); location.href="/index.html"</script>`);
      //response.send(invoice_str);
      request.session.destroy(); // clear cart
    });
});



app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));