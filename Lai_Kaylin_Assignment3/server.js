/* author: kaylin lai
this is the server for my webstore for server side processes including various validations */
/* CREDIT: code from various previous labs, assignment 1, 2 and 3 example code, and code modified from Momoka Michimoto F21*/

// load product data
var products = require(__dirname + '/products.json');
var express = require('express');
var app = express();
var fs = require('fs')

// get session, assignment 3 code examples
var session = require('express-session');
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));

// get cookie, https://www.tutorialspoint.com/expressjs/expressjs_cookies.htm
var cookieParser = require('cookie-parser');
const { request } = require('http');
app.use(cookieParser());

// node mailer https://www.w3schools.com/nodejs/nodejs_email.asp
var nodemailer = require('nodemailer');

// user info JSON file
var filename = 'user_data.json';

// is nonnegint function
function isNonNegInt(userQuantityInput, returnErrors = false) {
   errors = []; // assume no errors
   if (userQuantityInput == '') userQuantityInput = 0  //blank means 0
   if (Number(userQuantityInput) != userQuantityInput) errors.push('<font color="red">Not a number</font>'); //check if value is a number
   if (userQuantityInput < 0) errors.push('<font color="red">Negative value</font>'); // Check if it is non-negative
   if (parseInt(userQuantityInput) != userQuantityInput) errors.push('<font color="red">Not an integer</font>'); // Check if it is an integer

   return returnErrors ? errors : (errors.length == 0);
}

// from lab 14 file i/o
if (fs.existsSync(filename)) {
   var data = fs.readFileSync(filename, 'utf-8');
   var users = JSON.parse(data);
} else {
   console.log(`${filename} doesn't exist :(`);
}

// get the body
app.use(express.urlencoded({ extended: true }));

// login process
app.post("/process_login", function (request, response) {
   var errors = {};
   // login form
   var user_email = request.body['email'].toLowerCase();
   var the_password = request.body['password']

   // if user already exists, check password for a match, lab 14 file i/o
   if (typeof users[user_email] != 'undefined') {
      // does password match stored password
      if (users[user_email].password == the_password) {
         response.cookie('user_cookie', users[user_email]['name'], { maxAge: 900 * 1000 }); // !!!!cookie expires in 15 minutes!!!!!
         request.session.email = request.body['email'].toLowerCase(); // user email for invoice
         console.log(request.session.email);
         // redirect to cart, the the cart is empty then the user will be redirected to the shop
         response.redirect('./cart.html');
         return;
      } else {
         // password doesn't match one that's stored
         errors['login_err'] = `Incorrect Password`;
      }
   } else {
      // email doesn't exist
      errors['login_err'] = `Incorrect Email`;
   }
   // if errors present, go back to login page
   let params = new URLSearchParams(errors);
   params.append('email', user_email); //put email into params
   response.redirect(`./login.html?` + params.toString());
});

// registering new users process
app.post("/register", function (request, response) {
   var registration_errors = {};
   // check email format
   var reg_email = request.body['email'].toLowerCase();
   var user_email = request.body['email'].toLowerCase();
   var the_password = request.body['password'];

   // validate email format X@Y.Z
   // regex credit: https://stackoverflow.com/questions/24980174/regex-to-validate-emails-which-allows-only-these-two-special-symbols-before
   if (/^[a-zA-Z0-9._]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,3}$/.test(request.body.email)) {

   } else {
      registration_errors['email'] = 'Please enter a valid email address';
   }
   // if email box is empty
   if (reg_email.length == 0) {
      registration_errors['email'] = `Enter an email address`;
   }
   // if email is already in use
   if (typeof users[reg_email] != 'undefined') {
      registration_errors['email'] = `This email has already been registered`;
   }

   // validate password length (assignment 2 requirement: minimum 10 characters maximum 16)
   if (request.body.password.length < 10) {
      registration_errors['password'] = `Password must be at least 10 characters`;
   } else if (request.body.password.length == 0) { //nothing entered
      registration_errors['password'] = `Enter a password`;
      // max 16 characters
   } else if (request.body.password.length > 16) {
      registration_errors['password'] = `Please limit your password to 16 or less characters`
   }

   // validate password and repeated password
   if (request.body['password'] != request.body['repeat_password']) {
      registration_errors['repeat_password'] = `The passwords do not match, please try again`;
   }

   // full name validation
   // regex credit: https://stackoverflow.com/questions/6067592/regular-expression-to-match-only-alphabetic-characters
   if (/^[A-Za-z, ]+$/.test(request.body['fullname'])) {  
   } else {
      registration_errors['fullname'] = `Please enter your full name`;
   }
   // checks fullname length (assignment 2 requirement: maximum 3 characters, minimum 2 characters)
   if (request.body['fullname'].length > 30) {
      registration_errors['fullname'] = `Please enter less than 30 characters`;
       // checks if fullname is minimum 2 characters
      } else if (request.body['fullname'].length < 2) {
         registration_errors['fullname'] = `Please enter more than 2 characters`; 
      }

   // from assignment 2 code examples     
   // save user registration data to JSON file
   if (Object.keys(registration_errors).length == 0) {
      console.log('no registration errors') // check for any errors
      users[reg_email] = {};
      users[reg_email].password = request.body.password;
      users[reg_email].name = request.body.fullname;

      fs.writeFileSync(filename, JSON.stringify(users), "utf-8");
      response.cookie('user_cookie', users[user_email]['name'], { maxAge: 900 * 1000 }); // cookie expires in 15 minutes
         request.session.email = request.body['email'].toLowerCase(); // user email for invoice
         console.log(request.session.email);
         // redirect to cart, if the cart is empty the user will be redirected back to the shop
         response.redirect('./cart.html');
         return;
   } else { 
      request.body['registration_errors'] = JSON.stringify(registration_errors);
      let params = new URLSearchParams(request.body);
      response.redirect("./registration.html?" + params.toString());
   }
});

// edit user data 
app.post("/newpw", function (request, response) { 
   var reseterrors = {};

   let login_email = request.body['email'].toLowerCase();
   let login_password = request.body['password'];
// regex credit: https://stackoverflow.com/questions/24980174/regex-to-validate-emails-which-allows-only-these-two-special-symbols-before
   if (/^[a-zA-Z0-9._]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,3}$/.test(login_email) == false) {
      reseterrors['email'] = `Please enter a valid email`;
   } else if (login_email.length == 0) {
      reseterrors['email'] = 'Please enter an email';
   }
   // validate password and repeated password
   if (request.body['newpassword'] != request.body['repeatnewpassword']) {
      reseterrors['repeatnewpassword'] = `The passwords entered do not match`;
   }

   if (typeof users[login_email] != 'undefined') {
      if (users[login_email].password == login_password) {
         // minimum of 10 characters
         if (request.body.newpassword.length < 10) {
            reseterrors['newpassword'] = 'Password must have a minimum of 10 characters.';
         } else if (request.body.password.length == 0) {
            registration_errors['password'] = `Please enter a password`;
            // max 16 characters
         } else if (request.body.password.length > 16) {
            registration_errors['password'] = `Please limit your password to 16 or less characters`
         }
         // check if current password is correct
         if (users[login_email].password != login_password) {
            reseterrors['password'] = 'Incorrect password';
         }
         // new passwords must be the same
         if (request.body.newpassword != request.body.repeatnewpassword) {
            reseterrors['repeatnewpassword'] = 'Both passwords must match';
         }// new password cannot be same as current password
         if (request.body.newpassword && request.body.repeatnewpassword == login_password) {
            reseterrors['newpassword'] = `New password cannot be the same as your current password`;
         }
      } else { // any errors
         reseterrors['password'] = `Incorrect Password`;
      }
   } else { // user email isn't in system
      reseterrors['email'] = `Email has not been registered`;
   }
   // credit: code modified from Momoka Michimoto F21
   // no errors present
   // let params = new URLSearchParams(request.query);
   if (Object.keys(reseterrors).length == 0) {
      // write data and send to invoice.html
      // users[login_email] = {}, overwrite object
      users[login_email].password = request.body.newpassword

      // writes user information into file
      fs.writeFileSync(filename, JSON.stringify(users), "utf-8");

      response.redirect('./login.html'); 
      return;
   } else {
      // if there are errors, send back
      request.body['reseterrors'] = JSON.stringify(reseterrors);
      let params = new URLSearchParams(request.body);
      response.redirect(`./update_info.html?` + params.toString());
   }
});

// Routing 
app.get("/products.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products = ${JSON.stringify(products)};`;
   response.send(products_str);
});

// monitor all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   // cart session
   if (typeof request.session.cart == 'undefined') { 
      request.session.cart = {};
   } // email session
   if (typeof request.session.email == 'undefined') { 
      request.session.email = {};
   }
   next();
});

// adding items to cart from shop
// process purchase request, from assignment 3 code examples
app.post('/add_to_cart', function (request, response, next) {

   //assume no errors or no quantity
   var products_key = request.body['products_key'];
   var errors = {}; // empty
   var check_quantities = false;
   // check for nonnegint
   for (i in products[products_key]) {
      var quantities = request.body['quantity'];
      if (isNonNegInt(quantities[i]) == false) { //check i quantity
         errors['quantity_' + i] = `Please choose a valid quantity for ${products[products_key][i].item}.`;
      }
      if (quantities[i] > 0) { // check if any quantity is selected
         check_quantities = true;
      }
      if (quantities[i] > products[products_key][i].quantity_available) { // check if quantity is available
         errors['quantity_available' + i] = `I'm sorry, we don't have ${(quantities[i])} ${products[products_key][i].item} available.`;
      }
   }
   // check if quantity is selected
   if (!check_quantities) {
      errors['no_quantities'] = `Please select a quantity`;
   }
   let params = new URLSearchParams();
   params.append('products_key', products_key); 
   if (Object.keys(errors).length > 0) { // check errors

      params.append('errors', JSON.stringify(errors));
      response.redirect('./shop.html?' + params.toString());
      return;
   }
   else { // assignment 3 code examples
      if (typeof request.session.cart[products_key] == 'undefined') { //make array for each product category
         request.session.cart[products_key] = [];
      } // assignment 3 code examples 
      var quantities = request.body['quantity'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
      request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
      response.redirect('./cart.html');
      console.log(request.session.cart);
   }
});

app.post("/update_cart", function (request, response) {
   for (let pkey in request.session.cart) { // loop through cart products
      for (let i in request.session.cart[pkey]) { //loop through product's selected quantity
         if (typeof request.body[`qty${pkey}${i}`] != 'undefined') { // get quantity input
            // update cart data
            request.session.cart[pkey][i] = Number(request.body[`qty${pkey}${i}`]); // assign quantity to product key

         }
      }
   }  
   response.redirect("./cart.html"); // goes to cart
});

app.get("/checkout", function (request, response) {
   var errors = {};//check errors
   if (typeof request.cookie["email"] == 'undefined') { //check if logged in by checking for user cookie
      response.redirect(`./login.html`);
      return;
   }
   if (JSON.stringify(errors) === '{}') { // no errors, go to invoice
      let login_email = request.cookie['email'];
      // put their name and email in url
      let params = new URLSearchParams();
      params.append('fullname', users[login_email]['fullname']); // get fullname for personalization
      response.redirect(`./invoice.html?` + params.toString()); // go to invoice
      console.log(user_cookie);
   } else {
      response.redirect(`./cart.html`);
   }
});

app.post("/get_products_data", function (request, response) { //from assignment 3 code examples
   response.json(products);
});

app.post("/get_cart", function (request, response) { // from assignment 3 code examples
   response.json(request.session.cart);
});

app.post("/complete_purchase", function (request, response) { // from assignment 3 code examples
   // Generate HTML invoice string
   subtotal = 0;
   var invoice_str = `Thank you for your order!
<table border><th style="width:10%">Item</th>
<th class="text-right" style="width:15%">Quantity</th>
<th class="text-right" style="width:15%">Price</th>
<th class="text-right" style="width:15%">Extended Price</th>`;
   var shopping_cart = request.session.cart;
   for (product_key in shopping_cart) {
      for (i = 0; i < shopping_cart[product_key].length; i++) {
         if (typeof shopping_cart[product_key] == 'undefined') continue;
         qty = shopping_cart[product_key][i];
         let extended_price = qty * products[product_key][i].price;
         subtotal += extended_price;
         if (qty > 0) {
            invoice_str += `<tr><td>${products[product_key][i].item}</td>
            <td>${qty}</td>
            <td>$${products[product_key][i].price}</td>
            <td>$${extended_price}
            <tr>`;
         }
      }
   }
   // Compute tax
   var tax_rate = 0.045;
   var tax = tax_rate * subtotal;

   // Compute shipping
   if (subtotal <= 20) {
      shipping = 5;
   }
   else if (subtotal <= 50) {
      shipping = 8;
   }
   else {
      shipping = 0.1 * subtotal; // 10% of subtotal
   }
   // Compute grand total
   var grand_total = subtotal + tax + shipping;

   invoice_str += `<tr>
                     <tr><td colspan="4" align="right">Subtotal: $${subtotal.toFixed(2)}</td></tr>
                     <tr><td colspan="4" align="right">Shipping: $${shipping.toFixed(2)}</td></tr>
                     <tr><td colspan="4" align="right">Tax: $${tax.toFixed(2)}</td></tr>
                     <tr><td colspan="4" align="right">Grand Total: $${grand_total.toFixed(2)}</td></tr>
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
      from: 'klai9@hawaii.edu',
      to: user_email,
      subject: 'Your invoice from Kaylin\'s Kirby Cafe',
      html: invoice_str
   };
   
   transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
         invoice_str += `<br>Error: Invoice failed to deliver to ${user_email}`;
      } else {
         invoice_str += `<br>Your invoice was emailed to ${user_email}`;
      }
      response.clearCookie("user_cookie"); // log out
      response.send(`<script>alert('Your invoice has been sent!'); location.href="/index.html"</script>`);
      //response.send(invoice_str);
      request.session.destroy(); // clear cart

   });

});

// logout button
app.get("/logout", function (request, response, next) {
   response.clearCookie("user_cookie");
   request.session.destroy();
   // redirect to index.html
   response.send(`<script>alert('You are now logged out. We hope to see you again!'); location.href="/index.html"</script>`);
});

// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
