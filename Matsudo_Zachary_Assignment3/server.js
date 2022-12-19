// Zachary Matsudo Assignment 3 Server

// load product data 
// Taken from Assignment 1 steps page (https://dport96.github.io/ITM352/morea/130.Assignment1/experience-Assignment1.html)
var express = require('express');
var app = express();
app.use(express.urlencoded({ extended: true }));

// Routing
// Taken from A1 steps page
var products = require(__dirname + '/products.json');


// Routing
// Taken fron A1 steps page
app.get("/products.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products = ${JSON.stringify(products)};`;
   response.send(products_str);
});

// taken from Lab 14 Ex4 for user data
var fs = require('fs')
var filename = 'user_data.json';
// Checks if file exists
if (fs.existsSync(filename)) {
   var data = fs.readFileSync(filename, 'utf-8');
   // Parse user data from user_data.json
   var users = JSON.parse(data);
} else {
   console.log(users);
}

// Taken from A3 directions page, for emails
var nodemailer = require('nodemailer');

// Taken from Lab 15 for cookies
var cookieParser = require('cookie-parser');
const { request } = require('http');
app.use(cookieParser());

// Taken from Lab 15 for sessions
var session = require('express-session');
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));

/* Function referenced from Lab 8. Also referenced from Professor Kazmans and Ports Lab 12 repos for different formatting of function.
   Used to check if input is a positive, whole number. Negative values, decimals, letters and other characters will output an error message.
*/
function isNonNegativeInteger(q, returnErrors = false) {
   errors = []; // Function assumes there are no errors to start
   if (q == '') q = 0  // If no value is entered into a box it will be set to 0 
   if (Number(q) != q) errors.push('<font color="red">Not a number</font>'); // Check if string is a number
   if (q < 0) errors.push('<font color="red">Negative value</font>'); // Check if it is non-negative
   if (parseInt(q) != q) errors.push('<font color="red">Not an integer</font>'); // Check if it is an integer

   return returnErrors ? errors : (errors.length == 0);
}

// Referenced from A2 code examples
// Validates data that is entered when logging in.
app.post("/process_login", function (request, response) {
   // Assume no errors
   var errors = {};
   var user_email = request.body['email'].toLowerCase();
   var the_password = request.body['password']
   // Check that email exists
   if (typeof users[user_email] != 'undefined') {
      // Check email matches the password in user_data.json
      if (users[user_email].password == the_password) {
         // Security to log user out after 10 minutes of inactivity
         response.cookie('user_cookie', users[user_email]['name'], { maxAge: 600 * 1000 });
         // Email to send the invoice
         request.session.email = request.body['email'].toLowerCase();
         // Redirect back to hard candy page
         response.redirect('./products_page.html?products_key=hard');
         return;
      } else {
         // Password does not match email
         errors['InvalidLog'] = `Invalid Password`;
      }
   } else {
      // No such email
      errors['InvalidLog'] = `Invalid Email`;
   }
   // If any errors send back to login with error messages alert
   let params = new URLSearchParams(errors);
   // Put email into parameters
   params.append('email', user_email);
   response.redirect(`./login.html?` + params.toString());
});

// Referenced from A2 code examples
// Validates data when signing up
app.post("/process_signup", function (request, response) {
   var signup_error = {};
   // Set email to all lowercase (Makes email case insensitive)
   var new_email = request.body['email'].toLowerCase();

   // Validating email
   // Referenced from https://www.w3schools.blog/email-validation-javascript-js
   // Check email is in correct format
   if (/^([a-zA-Z0-9._-]+\@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3})$/.test(request.body.email)) {
   } else {
      // Error message for incorrect email formatting
      signup_error['email'] = "Invalid email format.";
   }

   // Extra validation to check if textbox is empty
   // This section referenced from https://www.javatpoint.com/javascript-form-validation
   if (request.body.email == "") {
      // Error message to enter email
      signup_error['email'] = "Email cannot be blank"
   }

   //check if email is already taken
   if (typeof users[new_email] != 'undefined') {
      signup_error['email'] = `Email is taken, choose a new one`;
   }

   // Validating full name
   // This section referenced from https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
   // Checks that name can only have captial/lower case letters and spaces, also checks if name is between 2-30 characters
   if (/^[A-Za-z, ]{2,30}$/.test(request.body.fullname)) {
   } else {
      // Error message to fix name and change name length
      signup_error['fullname'] = "Name must have letters only and be between 2-30 characters.";
   }

   // Extra validation to check if textbox is empty
   // This section referenced from https://www.javatpoint.com/javascript-form-validation
   if (request.body.fullname == "") {
      // Error message to enter email
      signup_error['fullname'] = "Name cannot be blank"
   }

   // Validating password
   // Section referenced from https://www.w3resource.com/javascript/form/password-validation.php 
   // Also referenced https://stackoverflow.com/questions/12090077/javascript-regular-expression-password-validation-having-special-characters 
   if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{10,16}$/.test(request.body.password)) {
   } else {
      // Error message to add a number and special character and be between 10-16 characters
      signup_error['password'] = "Must contain one number and one special character and be between 10-16 characters";
   }

   // Extra validation to check if textbox is empty
   // This section referenced from https://www.javatpoint.com/javascript-form-validation
   if (request.body.password == "") {
      // Error message to enter email
      signup_error['password'] = "Password cannot be blank"
   }

   // Validating the passwords match
   // Referenced from Lab 14 Ex4
   // If password and confirm_password textboxes do not match send error
   if (request.body.password !== request.body.confirm_password) {
      // Error message that passwords do not match
      signup_error['confirm_password'] = "Passwords do not match."
   }


   // Referenced from A2 code examples and Lab 14   
   // Save the data entered in sign up page to the user_data.json
   if (Object.keys(signup_error).length == 0) {
      // email is case insensitive
      let email = request.body['email'].toLowerCase();
      users[email] = {};
      // User data is added to user_data.json and saved there so users do not need to register again
      users[email]['name'] = request.body['fullname'];
      users[email]['password'] = request.body['password'];

      // Quantity from products page gets sent to cart page
      // Email added to JSON file
      fs.writeFileSync(filename, JSON.stringify(users), "utf-8");
      response.redirect('./cart.html');
   } else {
      // Errors are present, redirect to signup page with error messages
      request.body['signup_error'] = JSON.stringify(signup_error);
      let params = new URLSearchParams(request.body);
      response.redirect("./signup.html?" + params.toString());
   }
});

// Referenced from A2 code examples
// Also referenced Stackoverflow https://stackoverflow.com/questions/12090077/javascript-regular-expression-password-validation-having-special-characters 
// Also referenced W3 Schools https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php and https://www.w3schools.blog/email-validation-javascript-js
// Validates data when editing account information 
app.post("/update_info", function (request, response) {
   var new_errors = {};
   let login_email = request.body['email'].toLowerCase();
   let login_password = request.body['password'];

   // Check email is in correct format
   if (/^([a-zA-Z0-9._-]+\@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3})$/.test(request.body.email)) {
   } else {
      // Error message for incorrect email formatting
      new_errors['email'] = "Invalid email format.";
   }

   // Extra validation to check if textbox is empty
   // This section referenced from https://www.javatpoint.com/javascript-form-validation
   if (request.body.email == "") {
      // Error message to enter email
      new_errors['email'] = "Email cannot be blank"
   }

   // Check that new password and repeat new password matches
   if (request.body['newpassword'] != request.body['repeatnewpassword']) {
      new_errors['repeatnewpassword'] = `Passwords do not match`;
   }

   if (typeof users[login_email] != 'undefined') {
      if (users[login_email].password == login_password) {

         // Validating password
         // Section referenced from https://www.w3resource.com/javascript/form/password-validation.php 
         // Also referenced https://stackoverflow.com/questions/12090077/javascript-regular-expression-password-validation-having-special-characters 
         if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{10,16}$/.test(request.body.newpassword)) {
         } else {
            // Error message to add a number and special character and be between 10-16 characters
            new_errors['newpassword'] = "Must contain one number and one special character and be between 10-16 characters";
         }
         // Validate that correct password is being used
         if (users[login_email].password != login_password) {
            new_errors['password'] = 'Incorrect password';
         }
         // Validate that new password and repeat new password match
         if (request.body.newpassword != request.body.repeatnewpassword) {
            new_errors['repeatnewpassword'] = 'Passwords must match';
         }
         // Validate that new password is different from previous one
         if (request.body.newpassword && request.body.repeatnewpassword == login_password) {
            new_errors['newpassword'] = `This is your old password, choose a new one`;
         }
      } else {
         // Password does not match
         new_errors['password'] = `Incorrect Password`;
      }
   } else {
      // Email does not exists and not on file
      new_errors['email'] = `Email has not been registered`;
   }
   // If no errors, change the account info for the user
   if (Object.keys(new_errors).length == 0) {
      // Get data and send to the invoice
      users[login_email].password = request.body.newpassword

      // Update the user information in JSON file
      fs.writeFileSync(filename, JSON.stringify(users), "utf-8");

      // No errors send to login page
      response.redirect('./login.html');
      return;
   } else {
      // If errors detected, send back to edit_user page with errors
      request.body['new_errors'] = JSON.stringify(new_errors);
      let params = new URLSearchParams(request.body);
      response.redirect(`./edit_user.html?` + params.toString());
   }
});

// Process purchase requests (validate quantities, check quantity available)
// Referenced from Lab 13, Professor Kazman Lab 13 repo (info_server_new.js)
// Validates quantities entered into textboxes
// If valid add quantity to cart, if invalid stay at products page with error messages
// Adds items to cart
app.post('/in_cart', function (request, response, next) {
   var products_key = request.body['products_key'];
   // Assume no errors
   var errors = {};
   var check_quantities = false;
   // Validate quantities with isNonNegativeInteger funciton
   for (i in products[products_key]) {
      var quantities = request.body['quantity'];
      // Validate quantity for product i
      if (isNonNegativeInteger(quantities[i]) == false) {
         errors['quantity_' + i] = `Invalid quantity for ${products[products_key][i].brand}.`;
      }
      // Validate that a quantity is entered
      if (quantities[i] > 0) {
         check_quantities = true;
      }
      // Validate quantity entered is <= quantity available 
      if (quantities[i] > products[products_key][i].quantity_available) {
         // If quantity entered is > quantity available give error message
         errors['quantity_available' + i] = `${(quantities[i])} ${products[products_key][i].brand} not available.`;
      }
   }
   // Validate that a quantity is selected for items
   if (!check_quantities) {
      errors['no_quantities'] = `Please select a quantity`;
   }
   let params = new URLSearchParams();
   // Get products to appear on cart page
   params.append('products_key', products_key);
   // See if object is empty
   if (Object.keys(errors).length > 0) {
      // if errors occur, stay on products page and display errors
      params.append('errors', JSON.stringify(errors));
      response.redirect('./products_page.html?' + params.toString());
      return;
   }
   else {
      // Create an array for each category of products (Hard, Soft and Chocolate)
      if (typeof request.session.cart[products_key] == 'undefined') {
         request.session.cart[products_key] = [];
      }
      // Get quantities from post and covert the string to a number
      var quantities = request.body['quantity'].map(Number);
      // Store quantity array in session cart
      request.session.cart[products_key] = quantities;
      response.redirect('./cart.html');
   }
});

// Allows user to change the quantitiy of an item in the cart
app.post("/cart_change", function (request, response) {
   for (let prod_key in request.session.cart) {
      for (let i in request.session.cart[prod_key]) {
         // Get quantity input from box
         if (typeof request.body[`qty${prod_key}${i}`] != 'undefined') {
            // Update cart data to show new quantity
            request.session.cart[prod_key][i] = Number(request.body[`qty${prod_key}${i}`]);

         }
      }
   }
   // Doing the same thing as above but for the favorites
   // Allows user to add favorites
   for (let prod_key in request.session.favorite) {
      for (let i in request.session.favorite[prod_key]) {
         // Get quantity input from box
         if (typeof request.body[`qty_${prod_key}_${i}`] != 'undefined') {
            // Make array for each product category
            if (typeof request.session.cart[prod_key] == 'undefined') {
               request.session.cart[prod_key] = [];
            }
            // Set session product key since favorites has no products key in cart
            request.session[prod_key] = request.session.favorite[prod_key];
            // Update cart data to show new quantity
            request.session.cart[prod_key][i] = Number(request.body[`qty_${prod_key}_${i}`]);
         }
      }
   }
   // Redirect to cart page with new quantities 
   response.redirect("./cart.html");
});

// Monitor all requests
// Taken from A1 steps page
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   // Referenced from A3 code examples
   // Make a session cart when requested
   // Session for cart
   if (typeof request.session.cart == 'undefined') {
      request.session.cart = {};
   }
   // Session for email
   if (typeof request.session.email == 'undefined') {
      request.session.email = {};
   }
   next();
});

// INDIVIDUAL REQUIREMENT 4
// Referenced from Stackoverflow https://stackoverflow.com/questions/10033215/how-do-i-add-an-add-to-favorites-button-or-link-on-my-website and https://stackoverflow.com/questions/66762798/how-do-i-add-a-favorite-option-on-my-site
// Also referenced Lab 15 and watched video https://www.hackingwithswift.com/books/ios-swiftui/letting-the-user-mark-favorites and https://www.youtube.com/watch?v=QQ8UZb1Mv_0 
app.post("/new_fav", function (request, response) {
   if (typeof request.session.favorite == 'undefined') {
      request.session.favorite = {};
   }
   if (typeof request.session.favorite[request.query.prod_key] == 'undefined') {
      request.session.favorite[request.query.prod_key] = [];
   }
   request.session.favorite[request.query.prod_key][request.query.pindex] = (request.query.favorite.toLowerCase() === 'true');
   response.json({});
});

// Taken from A3 code examples
app.post("/product_data", function (request, response) {
   response.json(products);
});

// Referenced from Lab 15, A3 code examples
// Also referenced Stackoverflow https://stackoverflow.com/questions/10033215/how-do-i-add-an-add-to-favorites-button-or-link-on-my-website and https://stackoverflow.com/questions/66762798/how-do-i-add-a-favorite-option-on-my-site
app.post("/get_fav", function (request, response) {
   if (typeof request.session.favorite == 'undefined') {
      request.session.favorite = {};
   }
   response.json(request.session.favorite);
});

// Taken from A3 code examples
app.post("/cart", function (request, response) {
   response.json(request.session.cart);
});

app.get("/purchase", function (request, response) {
   // Check for errors
   var errors = {};
   // Look for cookies to confirm a person is logged in
   if (typeof request.cookie["email"] == 'undefined') {
      response.redirect(`./login.html`);
      return;
   }
   // No errors the send to invoice
   if (JSON.stringify(errors) === '{}') {
      // send to invoice.html 
      let login_email = request.cookie['email'];
      // Get user name and email and put into string
      let params = new URLSearchParams();
      // Get fullname to display when a person logs in 
      params.append('fullname', users[login_email]['fullname']);
      // Redirect user to invoice
      response.redirect(`./invoice.html?` + params.toString());
   } else {
      response.redirect(`./cart.html`);
   }
});

// Referenced from A3 code examples
app.post("/mail_invoice", function (request, response) {
   // Generate the invoice string
   subtotal = 0;
   var invoice_str = `Thank you for shopping at Zachs Candy Store!
<table border><th style="width:10%">item</th>
<th class="text-right" style="width:15%">Quantity</th>
<th class="text-right" style="width:15%">Price</th>
<th class="text-right" style="width:15%">Extended Price</th>`;
   var shop_cart = request.session.cart;
   for (product_key in shop_cart) {
      for (i = 0; i < shop_cart[product_key].length; i++) {
         if (typeof shop_cart[product_key] == 'undefined') continue;
         qty = shop_cart[product_key][i];
         let extended_price = qty * products[product_key][i].price;
         subtotal += extended_price;
         if (qty > 0) {
            invoice_str += `<tr><td>${products[product_key][i].brand}</td>
            <td>${qty}</td>
            <td>${products[product_key][i].price}</td>
            <td>${extended_price}
            <tr>`;
         }
      }
   }
   // Compute tax
   var tax_rate = 0.04;
   var tax = tax_rate * subtotal;

   // Compute shipping
   if (subtotal <= 20) {
      shipping = 0;
   }
   else if (subtotal <= 40) {
      shipping = 2.50;
   }
   else {
      shipping = 5;
   }
   // Compute Total
   var total = subtotal + tax + shipping;

   invoice_str += `<tr>
                     <tr><td colspan="4" align="right">Subtotal: $${subtotal.toFixed(2)}</td></tr>
                     <tr><td colspan="4" align="right">shipping: $${shipping.toFixed(2)}</td></tr>
                     <tr><td colspan="4" align="right">Tax: $${tax.toFixed(2)}</td></tr>
                     <tr><td colspan="4" align="right">Total: $${total.toFixed(2)}</td></tr>
                  </table>`;

   // Taken from A3 code examples
   // Set up mail server. Only will work on UH Network due to security restrictions
   var transporter = nodemailer.createTransport({
      host: "mail.hawaii.edu",
      port: 25,
      // Use TLS
      secure: false,
      tls: {
         // Do not fail on invalid certs
         rejectUnauthorized: false
      }
   });

   var user_email = request.session.email;
   var mailOptions = {
      from: 'zmatsudo@hawaii.edu',
      to: user_email,
      subject: 'Zachs Candy Store Reciept',
      html: invoice_str
   };

   transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
         invoice_str += '<br>There was an error and your invoice could not be emailed :(';
      } else {
         invoice_str += `<br>Your invoice was mailed to ${user_email}`;
      }
      // Log out
      response.clearCookie("user_cookie");
      // Response.send(invoice_str);
      response.send(`<script>alert('Invoice has been sent'); location.href="/index.html"</script>`);
      // Clear cart
      request.session.destroy();
   });
});

// Logout 
app.get("/logout", function (request, response, next) {
   response.clearCookie("user_cookie");
   request.session.destroy();
   // After logging out user is redirected to index page
   response.send(`<script>alert(' Successful Log Out'); location.href="/index.html"</script>`);
});

// Taken from A1 steps page
// Route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));

// Taken from A1 steps page
// Start server
app.listen(8080, () => console.log(`listening on port 8080`));
