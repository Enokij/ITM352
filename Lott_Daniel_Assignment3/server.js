  /*Assignment 3. Created by DANIEL LOTT, created a bike store which has several different pages.
  All pages have navigation bars except for the invoice.html file. These nav bars allow the user to get
  from one page at any moment in time. 
  -Utilizes express and express session to store user inputted information into the server's storage.
  -Cookie-parser is also utilized to parse cookie information so that information will be able to be stored on the client's browser
  -After all process are made and the User either logs out or checks out through the invoice, the session and all cookies will be destroyed*/                                                       
                                                        
                                                        /////////////////////////////////////////////
                                                        ///*Definitions & Middleware Requirements*///
                                                        /////////////////////////////////////////////

var express = require('express');
var app = express();
var myParser = require("body-parser");
var session = require('express-session');
var products_data = require('./product_data.json');
var user_data = require("./user_data.json");
var fs = require('fs');
const crypto = require('crypto');
let secretekey = 'secretekey';
var cookieParser = require('cookie-parser');
var nodemailer = require('nodemailer');

                                                                    /////////////////
                                                                    ///*FUNCTIONS*///
                                                                    /////////////////
//Encrpytion function
// reference sites for crypto: I used w3schools for the structure to create the function that will encrypt users password. When running the code I noticed that it would output in my terminal that is depreciated. I used my second reference to find out whether or not createCipher nodejs works. It does so therefore I kept using createCipher. Lastly, found other examples of ways to create crypto in node.js. 
// https://www.w3schools.com/nodejs/ref_crypto.asp
// https://stackoverflow.com/questions/60369148/how-do-i-replace-deprecated-crypto-createcipher-in-node-js
// https://www.tabnine.com/code/javascript/functions/crypto/createCipher
// IR1 - must encrypt password that is input by client, do not decrypt 
function generateCipher(TextInputted) { // Created a function using crypto so that I can call the function when user inputs password. The parameter I wrote any text so that it would be "any".

    cipher = crypto.createCipher('aes192', secretekey)
    /* We want it to be a global variable so that we can call it again later in the function. Since w3school used 
    createCipher as their example we decieded to go with that. We set the parameters within createCipher to be the 
    algorithm (aes192) this is more outdated algorithm but since createCipher is depreciated it works with the
     algorithm. And we called secretkey to get the string we put within it*/

    let ciphermade = cipher.update(TextInputted, 'utf8', 'hex')
    /*We called the variable ciphermade and set it to equal to the another equation. Then used update so that the
     cipher will be updated with the data we put within the parameters. We put the "any text", utf-8 as the 
     variable length: 8 bits, and hex as 4 bits.*/
    ciphermade += cipher.final('hex')
    /* We then set both of the variables += so that they will concatenate. This will encrpyt the string that is 
    inputted and then used .final because once this method is called the cipher no longer be used to encrypt data. */
    return ciphermade;
}

//Taken from Lab13, Ex5 
//Runs through each element in the product array and initiailly set the total_sold 0
var products_data = require('./product_data.json');
for (let key in products_data) {
    products_data[key].forEach((prod) => { prod.total_sold = 0 });
}


                                                                    ///////////////
                                                                    ///*APP.USE*///
                                                                    ///////////////

//Used for creating a session for a user. 
// Set how long we want the users cookies to last for each session created
// http://expressjs.com/en/resources/middleware/session.html
app.use(session({
    secret: 'No Pain No Gain',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 50000,
        httpOnly: true,
        signed: true,
        secure: false
    }
}));

//Used for parsing the body of incoming HTTP requests
app.use(myParser.urlencoded({ extended: true }));

//Used for parsing the cookies that are included in the HTTP request and enables the req.cookie property
app.use(cookieParser());

// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));

// parses the request body of an HTTP request if it is in the URL-encoded format
app.use(express.urlencoded({ extended: true }));

                                                                    ///////////////
                                                                    ///*APP.ALL*///
                                                                    ///////////////

// monitor all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to ' + request.path);
    // creates cart session variable if not already created
    // also pushes cart's session to cookies
    if (typeof request.session.cart == 'undefined') {
        request.session.cart = {};
        shopping_cart = request.session.cart
        response.cookie('cart', shopping_cart);
    } // creates email session variable if not already created
    if (typeof request.session.email == 'undefined') {
        request.session.email = {};
    }
    if (typeof request.session.favorite == 'undefined') {
        request.session.favorite = {};
     }
    next();
});

                                                                    ///////////////
                                                                    ///*APP.GET*///
                                                                    ///////////////

// Logs the cookies for all requests in the console
app.get('/', function (req, res) {
    console.log('Cookies: ', req.cookies)
})

// To get the cookies in JSON format
app.get("/get_cookies", function (request, response) {
    response.json(request.cookies);
});

// To get the user data in JSON format
app.get("/get_users", function (request, response) {
    response.json(user_data);
});

// To get the session's cart in JSON format
app.get("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

// To get the product data in JSON format
app.get("/get_products_data", function (request, response) {
    response.json(products_data);
});



// from lab 14 ex4.js 
// Reads and determines existence of the user data file and stores it in the `users` variable
var fname = __dirname + '/user_data.json';
if (fs.existsSync(fname)) {
    var data = fs.readFileSync(fname, 'utf-8');
    var users = JSON.parse(data);
} else {
    console.log("Sorry file " + fname + " does not exist.");
}

// Reference to Justin Enoki for the increase and decrease button's functions and get requests
// Define the increaseQuantity() function and pass the products_key variable as an argument
// Increments the quantity of the product with the specified productId in the cart
function increaseQuantity(request, productId, catagory_key, products_data) {
    //defines product to the array that contains data that associated with the specified productId
    var product = products_data[catagory_key];
    //defines index  which represents the index of the product in the product array defined above. 
    //uses findIndex to access the correct item in the product array and sets the array's id to the variable productId. 
    var index = product.findIndex(product => product.id === productId);
    //increases the product's quantity by one in the session's cart for each product that is edited in the cart
    request.session.cart[catagory_key][index] += 1;
}

// Same functionality as increaseQuantity but for the decrease button
// Decrements the quantity of the product with the specified productId in the cart
function decreaseQuantity(request, productId, catagory_key, products_data) {
    var product = products_data[catagory_key];
    var index = product.findIndex(product => product.id === productId);
    request.session.cart[catagory_key][index] -= 1;
}

// Increments the quantity of the product with the specified productId in the cart and redirects the user back to the shopping cart page with the updated quantity
app.get("/increase_quantity", function (request, response) {
    //sets variables to 
    var productId = request.query.productId;
    var catagory_key = request.query.catagory_key;
    increaseQuantity(request, productId, catagory_key, products_data);
    response.redirect("./cart.html");
});

// Decrements the quantity of the product with the specified productId in the cart and redirects the user back to the shopping cart page with the updated quantity
app.get("/decrease_quantity", function (request, response) {
    var productId = request.query.productId;
    var catagory_key = request.query.catagory_key;
    decreaseQuantity(request, productId, catagory_key, products_data);
    response.redirect("./cart.html");
});

//For Assignment 3 IR4:
// To get the favorited items from product_data.html
app.post("/add_to_fav", function (request, response) {
    // Initialize the favorite property as an empty object if it is not already defined
    request.session.favorite = request.session.favorite || {};
    // Initialize the prod_key property as an empty object if it is not already defined
    if (!(request.query.prod_key in request.session.favorite)) {
       request.session.favorite[request.query.prod_key] = {};
    }
    // Set the value of the favorite property at the specified pindex to either true or false
    request.session.favorite[request.query.prod_key][request.query.pindex] = (request.query.favorite.toLowerCase() === 'true') ? true : false;
    // Set the value of the checked cookie to the value of the favorite property
    response.cookie("checked", request.session.favorite[request.query.prod_key][request.query.pindex]);
    // Return an empty JSON object as the response
    response.json({});
});


// creates the cart for the session
// From A2 Login validation modifed for the cart 
app.get("/add_to_cart", function (request, response) {
    // Define verification booleans that will be changed depending if errors are detected
    let valid = true;
    let valid_num = true;
    let zero_qty = false;
    let qty_name = 'quantity'; // name of textbox in products_data.html
    let product = request.query['products_key']; // name of productCategory
    let qtys = request.query[qty_name]; // gets the quantities of the entered data 
    let checkboxValue = {};
    for (i = 0; i < products_data[product].length; i++) { // Runs loop for all products and their respective entered quantities
        let qty = qtys[i];
        if (qty == 0 || qty == '') continue; // if no inputs are entered into a product quantity textbox, then continue to the next product in the qty array.
        if (quantityValidation(qty) && Number(qty) <= products_data[product][i].qty_available && Number(qty) > 0) {
            // if the qty meets the above criteria, then update the product's qty sold and available with the respective product quantities entered   
        } else if (quantityValidation(qty) != true) { // if quantities is not equal to a valid number than it is false 
            valid_num = false;
        } else if (Number(qty) >= products_data[product][i].qty_available) { // If the quantities enter are greater then the qty_available, then valid = false (returns)
            valid = false;
        }
        if (qty > 0) { // if quantities is greater than 0 than this statement returns true
            zero_qty = true;
        }
    }
    // from Lab 13 info_server.new.js. For Individual Requirement 4 Assignment 1 (Erin)
    /* if the number entered is not a valid number as identified through the quantityValidation(qty) or did not meet the other conditions set in the if statement,
    then redirect user back to the products_display page and set the submit_button parameter to the respective error message*/
    if (valid_num == false) {
        response.redirect(`products_display.html?products_key=${product}&error=Please Enter Valid Quantity`);
        /* if quantity available is less then the amount of quantity ordered, then redirect user back to the products_display page
        and set the submit_button parameter to the respective error message*/
    } else if (zero_qty == false) {
        response.redirect(`products_display.html?products_key=${product}&error=Need to select quantity to purchase`);
    } else if (valid == false) {
        response.redirect(`products_display.html?products_key=${product}&error=Not Enough Left In Stock!`);
    } else {
        // If no errors are found, then redirect to the invoice page.
        // From Simple Shopping Cart from Professor 
        products_key = request.query['products_key'];
        quantities = request.query['quantity'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
        request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
        response.redirect('./cart.html');
    }
});

// updates the cart 
app.post("/update_cart", function (request, response) {
    if (request.cookies.loggedIn == "true") {
        updated_qty = request.session.cart
        response.cookie('cart', updated_qty);
         // if user changes anything on the cart page send this to let them know the cart has been updated
        response.redirect('./cart.html?updated=Your Cart Has Been Updated!')
    } else {
        // They need to be logged in if they want to check out, the button will change once logged in }
        response.redirect("/get_to_login?error=Not Logged In")
    }
});

// Make sure that user is logged in before sending the user to the invoice, and has the more updated cart quantity
app.post("/checkout", function(request, response) {
    if(request.cookies.loggedIn == "true"){
        updated_qty = request.session.cart
        response.cookie('cart', updated_qty);
        response.redirect('./invoice.html')
    }
});

//Taken from the Stor1 WOD
//check if there are any invalid quantity inputs
function quantityValidation(quantityString, returnErrors = false) {
    errors = []; // assume no errors at first
    if (Number(quantityString) != quantityString) {
        errors.push('Not a number!'); // Check if string is a number value
    } else if (Number(quantityString) < 0) {
        errors.push('Negative value!'); // Check if it is non-negative
    } else if (parseInt(quantityString) != quantityString) {
        errors.push('Not an integer!'); // Check that it is an integer
    } else if (quantityString == '') {
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


//Gets the login page
// From lab 15 Ex4.js app.get/login
app.get("/get_to_login", function (request, response) {
    //gets the URL search parameters
    let params = new URLSearchParams(request.query); // use search params to find the params within the document    
    console.log(params);

    let str =

        `<!DOCTYPE html>
    <html lang="en">
    <head> 
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="login-style.css" rel="stylesheet">
        <script src="./functions.js"></script>
        </head>
        <script>
        var products;
        var total = 0;
        loadJSON('get_products_data', function (response) {
            // Parsing JSON string into object
            products = JSON.parse(response);
        });
        </script>
      <header>
        <img src='./images/logo.jpg'>
        <nav>
            <ul>
            <li><a href='index.html'>HOME<a></li>
            <li><script>nav_bar('', products);</script></li> 
            <li><a href='./cart.html'>View Cart</a></li>
        </nav>
        
        </header>
        
    <h1>Login</h1>
    <body>
    <span id="error_msg" style="color: red; font-size: 12px;"">
        <script>
            if ('${params.has("error")}'!= 'false') {
                document.getElementById("error_msg").innerHTML = "<center>Please login or create an account to continue purchase.</center>";
            };
        </script>
        <form action="./get_to_login" method="POST"> 
           <h2><input type="text" name="email" id="email" value="" size="40" placeholder="Enter email" ><br /></h2>
               <h2><input type="password" name="password" size="40" placeholder="Enter password"><br /></h2>
                <h3><input class="submit" type="submit" value="Submit" id="error_button"></h3>
        </form>
        <script>
        // if the login post finds and returns errors in the URL parameter string
        // use the id to get the element to change the button to invalid login if there are any errors
        if ('${params.has("login_error")}' != 'false')  { 
            document.getElementById("error_button").value = '${params.get("login_error")}';                 
            console.log('${params.get("login_error")}');
          }
          
            </script>
            <br>
            <form action="/register" method="GET">
                <h4><script>
                document.write('<p class="register"> Not a member? <a href="/register"> Click here to register</a></p>')
            </script></h4>
                </form>       
    </body>
    </html>`;
    response.send(str);
});

// From lab 15 ex4.js 
// Also taken from login from A2
app.post("/get_to_login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    // User entered inputs are set to the variable POST
    let POST = request.body;
    entered_email = POST["email"].toLowerCase();
    //IR1 we want to encrypt the password entered in the login page
    var user_pass = generateCipher(POST['password']);
    console.log("User name=" + entered_email + " password=" + user_pass);
    if (user_data[entered_email] != undefined) {
        if (user_data[entered_email].password == user_pass) {
            let loggedIn = true;
            if (fs.existsSync(fname)) {
                // IR4 A2 Daniel Lott - last time user logged in
                request.session.loginDate = new Date(); 
                // IR4 A2 Daniel Lott - counts how many times user logged in 
                //sends cookie back to the client
                user_data[entered_email].num_loggedIn += 1; 
                //sends cookies when logged in to session
                response.cookie('email', entered_email);
                response.cookie('loggedIn', loggedIn);
                response.cookie('cart', request.session.cart);
                response.redirect('loggedIn');  
            } else {
                response.redirect('get_to_login?login_error=Invalid password!');
            }
        } else {
            response.redirect('get_to_login?login_error=Invalid username!');
        }} else {
                console.log("Sorry file " + fname + " does not exist.");
            }
        });

// From lab 15 Ex4.js
//Used to diosplay user's account information
//Used to display loggedIn page after user registers or logs in through the login page
app.get('/loggedIn', function(request, response){
    let str= `
    <script src="./functions.js"></script>
    <link href="login-style.css" rel="stylesheet">
    <script>
    var products;
    var cookie;
    var user_data;
    loadJSON('get_products_data', function (response) {
      // Parsing JSON string into object
      products = JSON.parse(response);
    });
    loadJSON('get_cookies', function (response) {
        // Parsing JSON string into object
        cookie = JSON.parse(response);
      });
      loadJSON('get_users', function (response) {
        // Parsing JSON string into object
        user_data = JSON.parse(response);
        console.log(user_data);
      });
      ifLoggedIn = cookie.loggedIn;
    var this_product_key = ''
    </script>
    <header>
    <img src='./images/logo.jpg'>
    <nav>
        <ul>
        <li><a href='index.html'>HOME<a></li>
        <li>
            <script>nav_bar(this_product_key, products);</script>
        </li>
        <li><a href='./cart.html'>View Cart</a></li>
        <li><a href="get_to_logout">Logout</a></li>
        </script>
        </ul>
    </nav>
    </header>
    <center><h2>Welcome <span id="username"></span>!</h2>
    <br> You last logged in on ${request.session.loginDate}<br>
    Number of Logins: <span id="numLog"></span><br> 
        <button type="button" class="submit" onclick="window.location.href = './index.html'">Continue shopping</button>
        <br>
        <script>
        numLog.innerHTML = user_data[cookie.email].num_loggedIn
        username.innerHTML = user_data[cookie.email].name
        </script>
    </center>`
response.send(str);
})

// reads through the json with any errors for the registation page 
app.get('/get_reg_errors', function (request, response) {
    response.json(request.session.registration_error);
    console.log(request.session.registration_error);
});

// Gets the register page
// Lab 15 Ex4.js 
app.get("/register", function (request, response) {
    let str = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="register-style.css" rel="stylesheet">
          <script src="./functions.js"></script>
          <title>Register page</title>
      </head>
        <script>
        var products;
        var total = 0
        loadJSON('get_products_data', function (response) {
            // Parsing JSON string into object
            products = JSON.parse(response);
        });
        </script>
      <header>
        <img src='./images/logo.jpg'>
        <nav>
            <ul>
            <li><a href='index.html'>HOME<a></li>
            <li><script>nav_bar('', products);</script></li> 
            <li><a href='./cart.html'>View Cart</a></li>
            <li><a href="get_to_login">Login</a></li>
            </ul>
        </nav>
        </header>
      <h1>Register Here!</h1>
      <body>
        <form action="/register" method="POST">
          <h2>
          <input type="text" name="name" size="40" placeholder="Enter full name">
            <br>
            <span id="name_error" style="color: red; font-size: 12px;"></span> <br>
            <input type="password" name="password" size="40" placeholder="Enter password">
            <br />
            <span id="password_error" style="color: red; font-size: 12px;"></span><br>
            <input type="password" name="repeat_password" size="40" placeholder="Enter password again">
            <br />
            <span id="repassword_error" style="color: red; font-size: 12px;"></span><br>
            <input type="email" name="email" size="40" placeholder="Enter email">
            <br />
            <span id="email_error" style="color: red; font-size: 12px;"></span><br>
            <center><input class="submit" type="submit" value="Submit" id="submit"></center>
          </h2>
        </form>
        <script>
        var reg_error;
        loadJSON('get_reg_errors', function (response) {
            // Parsing JSON string into object
            if (typeof reg_error === 'undefined') {
              reg_error = JSON.parse(response);
            }
            console.log(reg_error)
          });
        if(reg_error !== undefined){
            if (typeof reg_error.name !== 'undefined') {
            document.getElementById("name_error").innerHTML = reg_error.name;
            }
            if (typeof reg_error.password !== 'undefined') {
            document.getElementById("password_error").innerHTML = reg_error.password;
            }
            if (typeof reg_error.repeat_password !== 'undefined') {
            document.getElementById("repassword_error").innerHTML = reg_error.repeat_password;
            }
            if (typeof reg_error.email !== 'undefined') {
            document.getElementById("email_error").innerHTML = reg_error.email;
            }
        }
      </script>
    </body>
    </html>`
    response.send(str);
});



// A2 reference reading and writing user info to a JSON file 
app.post("/register", function (request, response) {
    // once users' information is entered into the register page, post then processes the register form
    let POST = request.body; // Sets all the users' inputted information from their request into the POST variable 
    console.log(POST); //Writes the user data into a variable
    //The following 4 variables are set to individual attributes of the users' entered information
    let encrpt_user_password = generateCipher(POST["password"]); // IR1 we want to encrypt the password the register user inputs
    let reg_error = {}; // made this an open string for errors within the registation page 
    user_name = POST["name"];
    user_pass = POST["password"].toLowerCase();
    entered_email = POST["email"];
    user_pass2 = POST["repeat_password"];
    request.session.loginDate = new Date();
    let loggedIn = false;

    let onlyletters = /^[A-Za-z\s]+$/; // only allows letters /* case insensitive - format must be ex. danielrl@gmail.com */
    let email_valid_input = /^[A-Za-z0-9_.]+@([A-Za-z0-9_.]*\.)+([a-zA-Z]{2}|[a-zA-Z]{3})$/;
    /* case sensitive - format must have at least special character "!", one number "2", and upper and lower case letters */


    // using an if statement to validate what we call "name" from our user_data.json
    if (onlyletters.test(POST.name)) { // calling the variable that has the rule for only letters, the name cannot be anything but letters
    } else {
        reg_error['name'] = 'Must only use valid letters'; // if there are any nonletter within name then the query string will have this message
    }
    // validating that name is at least 2 characters long and under 30 characters
    if (POST.name.legth > 30 || POST.name.length < 2) {
        reg_error['name'] = 'Full name must be at least 2 characters long, no more than 30 character allowed'
    } // if it is shorter than 2 or above 30 then this message will appear in the query string 

    // if statement to check if email added is valid to the requirements called by the variable email_valid_input
    if (email_valid_input.test(POST.email)) {
    } else {
        reg_error['email'] = 'Please enter valid email'; // if it does not meet the requirements for valid email then this message appears in query string 
    }
    if (typeof users[entered_email] != 'undefined') { // if the email is already within the our user_data.json 
        reg_error['email'] = 'Email already exsist' // then send this message to the query string 
    }

    // if statement to valid password length - required by A2 to have at least 10 characters
    if ((POST['password'].length) < 10) { // used .length so that it reads the length of password that is inputted
        reg_error['password'] = 'Password must be longer than 10 characters' // message appears in query string
    }
    if ((POST['password']) != POST['repeat_password']) { // make sure both password match 
        reg_error['repeat_password']
    }
    // used object.keys for the array to check that errors equal to zero
    // ref for objectkeys: https://www.w3schools.com/jsref/jsref_object_keys.asp
    if (Object.keys(reg_error).length == 0) {
        var email = POST['email'].toLowerCase();
        user_data[email] = {};
        user_data[email].name = POST['name'];
        user_data[email]["password"] = encrpt_user_password;
        user_data[email]["email"] = POST['email'];
        user_data[email].num_loggedIn = 1;
        user_data[email].last_date_loggin = Date();
        request.session.registration_error = undefined;
        loggedIn = true;
        // this creates a string using are variable fname which is from users and then JSON will stringify the data "users"
        fs.writeFileSync(fname, JSON.stringify(user_data), "utf-8");
        // redirect to login page if all registered data is good, we want to keep the name enter so that when they go to the invoice page after logging in with their new user account
        response.cookie('email', email);
        response.cookie('loggedIn', loggedIn);
        response.cookie('cart', request.session.cart);
        response.redirect('/loggedIn');
    } else {
        request.session.registration_error = reg_error;
        POST['reg_error'] = JSON.stringify(reg_error); // if there are errors we want to create a string 
        console.log(reg_error)
        response.redirect('register?' + JSON.stringify(reg_error)); // then we will redirect them to the register if they have errors
    }
});

// takes user to logout and lets them know they have been successfully logged out
// occurs when user logs out or after invoice is sent after checkout
app.get("/get_to_logout", function (request, response) {
    let loggedIn = false;
    let str = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <script src="./functions.js"></script>
        <link href="cart-style.css" rel="stylesheet">
        <script>
        var products;
        var total = 0;
        loadJSON('get_products_data', function (response) {
        // Parsing JSON string into object
        products = JSON.parse(response);
        });
        var this_product_key = ''
        </script>
        <header>
        <img src='./images/logo.jpg'>
        <nav>
            <ul>
            <li><a href='index.html'>HOME<a></li>
            <li>
                <script>nav_bar(this_product_key, products);</script>
            </li>
            <li><a href="get_to_login">Login</a></li>    
            </ul>
        </nav>
        </header>
        <div class = "container">
            <body>
                <center>
                    <h2>Thank you for shopping at Island Cycling! <br> You have been successfully logged out </h2>
                    <button type="button" class="submit" onclick="window.location.href = './index.html'">logout</button>  
                </center>
            </body>
        </div>
        </html>`;
    response.cookie('loggedIn', loggedIn);
    response.clearCookie('email');
    response.clearCookie('cart');
    request.session.destroy();
    response.send(str);
    // clears the cookies once this is done 
});

// Code modifed from nodemailer from Professor 
// Generates an invoice for the user 
app.post("/email_inv", function (request, response) {
    // prints out invoice on email thread
    subtotal = 0;
    var invoice_str = `Thank you for shopping with us!
<table border><th style="width:10%">Item</th>
<th class="text-right" style="width:15%">Quantity</th>
<th class="text-right" style="width:15%">Price</th>
<th class="text-right" style="width:15%">Extended Price</th>`;
    var shopping_cart = request.session.cart;
    for (catagory_key in shopping_cart) {
        for (i = 0; i < shopping_cart[catagory_key].length; i++) {
            if (typeof shopping_cart[catagory_key] == 'undefined') continue;
            qty = shopping_cart[catagory_key][i];
            let extended_price = qty * products_data[catagory_key][i].price;
            subtotal += extended_price;
            if (qty > 0) {
                invoice_str += `<tr><td>${products_data[catagory_key][i].item}</td>
         <td>${qty}</td>
         <td>$${products_data[catagory_key][i].price}</td>
         <td>$${extended_price}
         <tr>`;
                products_data[catagory_key][i].qty_available -= Number(qty); // makes product quantitty and total sold dynamic IR1 A1 Daniel Lott
                products_data[catagory_key][i].total_sold += Number(qty);
            }
        }
    }
    var tax_rate = 0.0575;
    var tax = tax_rate * subtotal;

    // Computer Shipping 
    if (subtotal <= 50) (
        shipping = 5
    )
    else if (subtotal <= 100) (
        shipping = 10
    )
    else (
        shipping = 0.05 * subtotal
    )

    // Computer Grand total
    var total = subtotal + tax + shipping;

    invoice_str += `<tr>
     <tr><td colspan="4" align="right">Subtotal: $${subtotal.toFixed(2)}</td></tr>
     <tr><td colspan="4" align="right">Shipping: $${shipping.toFixed(2)}</td></tr>
     <tr><td colspan="4" align="right">Tax: $${tax.toFixed(2)}</td></tr>
     <tr><td colspan="4" align="right">Grand Total: $${total.toFixed(2)}</td></tr>
     </table>`;

    // Cited: display and mail invoice 
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
        from: 'danielrl@hawaii.edu',
        to: user_email,
        subject: `Your invoice from Island Cycling`,
        html: invoice_str
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            invoice_str += `<br>Error: Invoice failed to deliver to ${user_email}`;
        } else {
            invoice_str += `<br>Your invoice was emailed to ${user_email}`;
        }
        response.send(`<script>alert('Your invoice has been sent!'); location.href="/get_to_logout"</script>`); // sends user to get to logout 
        // distroys the session for the user who is signed in
    });
});



app.listen(8080, () => console.log('listening on port 8080'))