                                                        /////////////////////////////////////////////
                                                        ///*Definitions & Middleware Requirements*///
                                                        /////////////////////////////////////////////

var express = require('express');
var app = express();
var myParser = require("body-parser");
var session = require('express-session');
var products_data = require('./product_data.json');
var user_data = require("./user_data.json");
const qs=require('node:querystring');
var fs = require('fs');
const crypto = require('crypto');
let secretekey = 'secretekey';
var cookieParser = require('cookie-parser');
const { request } = require('node:http');

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

// from lab 14 ex4.js 
fname = __dirname + '/user_data.json'; // creating a variable to call the user_data.json file 
if (fs.existsSync(fname)) { // reads entire file 
    var data = fs.readFileSync(fname, 'utf-8');
    var users = JSON.parse(data); // var users lets the file parse through the data within the user_data.json 
    console.log(users);
} else {
    console.log("Sorry file " + fname + " does not exist.");
}

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
    } 
    if (returnErrors) {
        return errors;
    } else if (errors.length == 0) {
        return true;
    } else {
        return false;
    }
};

//Taken from Lab13, Ex5 
//Runs through each element in the product array and initiailly set the total_sold 0
for (let key in products_data) {
  products_data[key].forEach((prod) => { prod.total_sold = 0 });
}


                                                                    ///////////////
                                                                    ///*APP.USE*///
                                                                    ///////////////

//Used for creating a session for a user. 
app.use(session({
    secret: 'No Pain No Gain',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 500000,
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

app.use(express.urlencoded({ extended: true }));

                                                                    ///////////////
                                                                    ///*APP.ALL*///
                                                                    ///////////////

// monitor all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to ' + request.path);
    // cart session
    if (typeof request.session.cart == 'undefined') {  
       request.session.cart = {};
       shopping_cart = request.session.cart
       response.cookie('cart', shopping_cart);
    } // email session
    if (typeof request.session.email == 'undefined') { 
       request.session.email = {};
    }
    next();
 });

                                                                    ///////////////
                                                                    ///*APP.GET*///
                                                                    ///////////////

//Logs the cookies for all requests in the console
app.get('/', function (req, res) {
    // Cookies that have not been signed
    console.log('Cookies: ', req.cookies)

    // Cookies that have been signed
    console.log('Signed Cookies: ', req.signedCookies)
})

//Gets the cookies that have been created so that can be called and parsed in the HTML for user info. 
//Puts in JSON format
app.get("/get_cookies", function (request, response) {
    response.json(request.cookies);
});

app.get("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

//Gets the user's data file in JSON format
app.get("/get_users", function (request, response) {
    response.json(user_data);
});

//Gets the product's data file in JSON format
app.get("/get_products_data", function (request, response) {
    response.json(products_data);
});

//Gets the product's data file in JSON format
app.get("/get_products_data", function (request, response) {
    response.json(products_data);
});

//Gets the login page
app.get("/get_to_login", function (request, response) {
    //gets the URL search parameters
    params = new URLSearchParams(request.query); // use search params to find the params within the document    
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
        <title>Login Page</title>
       
    </head>
    <header>
  <img src='./images/logo.jpg'>
  <nav>
    <ul>
        <li><a href='/index.html'>HOME<a></li> 
        <li><a href='/cart.html'>View Cart<a></li> 
    </ul>
  </nav>
</header>
    <h1>Login</h1>
    <body>
    <span id="error_msg">
    <script>
        if ('${params.get("error")}' == 'Not Logged In') {
            document.getElementById("error_msg").innerHTML = "<center>Please login or create an account to continue purchase.</center>";
            console.log('${params.get("error")}');
        };
    </script>
        <form action="./submit_login" method="get"> 
           <h2><input type="text" name="email" id="email" value="" size="40" placeholder="Enter email" ><br /></h2>
               <h2><input type="password" name="password" size="40" placeholder="Enter password"><br /></h2>
                <h3><input class="submit" type="submit" value="Submit" id="error_button"></h3>
        </form>
        <script>
                if (${params.has("login_error")})  { // if params has/find errors 
                    document.getElementById("error_button").value = "Invalid Login";}; // use the id to get the element to change the button to invalid login if there are any errors
                console.log(${params.get("login_error")});
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
})

//Gets the register page
app.get("/register", function (request, response) {
    let str = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="register-style.css" rel="stylesheet">
        <title>Register page</title>
    </head>
    <h1>Register Here!</h1>
    <body>
        <form action="/register" method="POST">
           <h2><input type="text" name="name" size="40" placeholder="Enter full name" ><br />
                <input type="password" name="password" size="40" placeholder="Enter password"><br />
                    <input type="password" name="repeat_password" size="40" placeholder="Enter password again"><br />
                        <input type="email" name="email" size="40" placeholder="Enter email"><br /></h2>
                          <center><input class="submit" type="submit" value="Submit" id="submit"></center>
        </form>
    </body>
    </html>`
    response.send(str);
});


app.get("/get_to_logout", function (request, response) {
    let loggedIn = false;
    request.session.destroy();
    let str = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <form action="logout" method="get">
        <script>
            document.write(
                'Thank you for shopping at Island Cycling! <br> You have been successfully logged out.' 
                + '<br><a href="./index.html">Return to Homepage</a>'
            );
        </script>   
    </form>
</body>
</html>`;
    response.cookie('loggedIn', loggedIn);
    response.send(str);
})


// creates the cart for the sesison
app.get("/add_to_cart", function (request, response) {
    let valid = true;  //going to use the boolean to verify if the quantity entered is less than the qty_available 
    let valid_num = true;
    let qty_name = 'quantity'; //name of textbox in products_data.html
    let qtys = request.query[qty_name]; //gets the quantities of the entered data 
    let favorite_name = request.query["favorite-"]
    request.session.qty = qtys;
    request.session.favorite = favorite_name;
    let zero_qty = false;
    let product = request.query['products_key'];
    if (favorite_name) {
        for (i = 0; i < products_data[product].length; i++) {
          let qty = qtys[i];
           favorite = favorite_name[i];
          if (qty == 0 || qty == '') continue;
          if (quantityValidation(qty) && Number(qty) <= products_data[product][i].qty_available && Number(qty) > 0) {
            // Update product quantities
          } else if (quantityValidation(qty) != true) {
            valid_num = false;
          } else if (Number(qty) >= products_data[product][i].qty_available) {
            valid = false;
          }
          if (qty > 0) {
            zero_qty = true;
          }
        }
      } else {
        for (i = 0; i < products_data[product].length; i++) {
          let qty = qtys[i];
           favorite = undefined;
          if (qty == 0 || qty == '') continue;
          if (quantityValidation(qty) && Number(qty) <= products_data[product][i].qty_available && Number(qty) > 0) {
            // Update product quantities
          } else if (quantityValidation(qty) != true) {
            valid_num = false;
          } else if (Number(qty) >= products_data[product][i].qty_available) {
            valid = false;
          }
          if (qty > 0) {
            zero_qty = true;
          }
        }
      }
    if (valid_num == false) {
        response.redirect(`products_display.html?products_key=${product}&error=Please Enter Valid Quantity`);
        /*if quantity available is less then the amount of quantity ordered, then redirect user back to the products_display page
        and set the submit_button parameter to the respective error message*/
    } else if (zero_qty == false) {
        response.redirect(`products_display.html?products_key=${product}&error=Need to select quantity to purchase`);
    }
    else if (valid == false) {
        response.redirect(`products_display.html?products_key=${product}&error=Not Enough Left In Stock!`);
    } else {
        // If no errors are found, then redirect to the invoice page.
        products_key = request.query['products_key'];
        quantities = request.query['quantity'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
        request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
        console.log(request.session.cart[products_key])
        response.cookie('cart', request.session.cart);
        response.cookie('favorite', favorite);
        response.redirect('./cart.html');
        }
    } 
);


// Code help from Justin Enoki 
// Define the increaseQuantity() function and pass the products_key variable as an argument
function increaseQuantity(request, products_key, prodID, product_key, products_data) {
    // Use the passed product_key variable to access the correct array of products in the products object
    var products = products_data[product_key];
    var index = products.findIndex(product => product.id === prodID);
    // Use the passed products_key variable inside the function to update the quantity of the selected product in the request.session.cart array
    request.session.cart[product_key][index] += 1;
}

// Define the app.get() method and pass the products_key variable as an argument
app.get("/increase_quantity", function (request, response) {
    // Get the index of the item from the request query string
    var prodID = request.query.prodID;
    // Get the product_key of the selected product from the request query string
    var product_key = request.query.product_key;
    // Increase the value of the item in the array by 1
    increaseQuantity(request, products_key, prodID, product_key, products_data);
    // Redirect the user back to the shopping cart page
    response.redirect("./cart.html");
});

// Define the increaseQuantity() function and pass the products_key variable as an argument
function decreaseQuantity(request, products_key, prodID, product_key, products_data) {
    // Use the passed product_key variable to access the correct array of products in the products object
    var products = products_data[product_key];
    var index = products.findIndex(product => product.id === prodID);
    // Use the passed products_key variable inside the function to update the quantity of the selected product in the request.session.cart array
    request.session.cart[product_key][index] -= 1;
}

// Define the app.get() method and pass the products_key variable as an argument
app.get("/decrease_quantity", function (request, response) {
    // Get the index of the item from the request query string
    var prodID = request.query.prodID;
    // Get the product_key of the selected product from the request query string
    var product_key = request.query.product_key;
    // Increase the value of the item in the array by 1
    decreaseQuantity(request, products_key, prodID, product_key, products_data);
    // Redirect the user back to the shopping cart page
    response.redirect("./cart.html");
});

                                                                    ////////////////
                                                                    ///*APP.POST*///
                                                                    ////////////////

// updates the cart 
app.post("/update_cart",function(request, response){
    updated_qty = request.session.cart
    response.cookie('cart', updated_qty);
    if(request.cookies.loggedIn == "true"){
        response.redirect('./cart.html?update=Cart Has Been Updated!')
    } else {
        response.redirect("/get_to_login?error=Not Logged In")
    }
});

app.post("/checkout", function(request, response) {
    if(request.cookies.loggedIn == "true"){
        updated_qty = request.session.cart
        response.cookie('cart', updated_qty);
        response.redirect('./invoice.html')
    }
});
app.get("/submit_login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    // User entered inputs are set to the variable POST
    let POST = request.query;
    entered_email = POST["email"].toLowerCase();
    var user_pass = generateCipher(POST['password']);
    let loggedIn = false;
    console.log("User name=" + entered_email + " password=" + user_pass);
    if (user_data[entered_email] != undefined) {
        if (user_data[entered_email].password == user_pass) {
            loggedIn = true;
            request.session.email = entered_email;
            user_data[entered_email].num_loggedIn += 1;
            user_data[entered_email].last_date_loggin = Date();
            fs.writeFileSync(fname, data, 'utf-8');
            if (typeof request.session.last_date_loggin != "undefined") {
                user_data[entered_email].last_date_loggin = Date();;
            }
        }    
        //sends cookie back to the client
        response.cookie('email', entered_email)
        response.cookie('cart', request.session.cart);
        response.cookie('loggedIn', loggedIn)
        response.redirect(`index.html`);
    } else {
        response.send({ success: false, error: "Invalid username or password" });
    }
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
    user_pass = POST["password"];
    user_email = POST["email"];
    user_pass2 = POST["repeat_password"];

    let onlyletters = /^[A-Za-z\s]+$/; // only allows letters /* case insensitive - format must be ex. erin@gmail.com */
    let email_valid_input = /^[A-Za-z0-9_.]+@([A-Za-z0-9_.]*\.)+([a-zA-Z]{2}|[a-zA-Z]{3})$/;
    /* case sensitive - format must have at least special character "!", one number "2", and upper and lower case letters */


    // using an if statement to validate what we call "name" from our user_data.json
    if (onlyletters.test(POST.name)) { // calling the variable that has the rule for only letters, the name cannot be anything but letters
    } else {
        reg_error['name'] = 'Must only use valid letters'; // if there are any nonletter within name then the query string will have this message
    }
    // validating that name is at least 2 characters long and under 30 characters
    if (POST.name > 30 || POST.name < 2) {
        reg_error['name'] = 'Full name must be at least 2 characters long, no more than 30 character allowed'
    } // if it is shorter than 2 or above 30 then this message will appear in the query string 

    // if statement to check if email added is valid to the requirements called by the variable email_valid_input
    if (email_valid_input.test(POST.email)) {
    } else {
        reg_error['email'] = 'Please enter valid email'; // if it does not meet the requirements for valid email then this message appears in query string 
    }
    if (typeof users[user_email] != 'undefined') { // if the email is already within the our user_data.json 
        reg_error['email'] = 'Email already exsist' // then send this message to the query string 
    }

    // if statement to valid password length - required by A2 to have at least 10 characters
    if ((POST['password'].length) < 10) { // used .length so that it reads the length of password that is inputted
        reg_error['password'] = 'Password must be longer than 10 characters' // message appears in query string
    }
    if ((POST['password']) != POST['repeat_password']) { // make sure both password loginmatch 
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
        user_data[email].num_loggedIn = 0;
        user_data[email].last_date_loggin = Date();

        // this creates a string using are variable fname which is from users and then JSON will stringify the data "users"
        fs.writeFileSync(fname, JSON.stringify(user_data), "utf-8");
        // redirect to login page if all registered data is good, we want to keep the name enter so that when they go to the invoice page after logging in with their new user account
        response.cookie('loggedIn', LogStatus);
        response.cookie('email', email);
        response.cookie('cart', request.session.cart);
        response.redirect('/get_to_login');
    } else {
        POST['reg_error'] = JSON.stringify(reg_error); // if there are errors we want to create a string 
        let params = new URLSearchParams(POST);
        response.redirect('register?' + params.toString()); // then we will redirect them to the register if they have errors
    }
});


app.listen(8080, () => console.log('listening on port 8080'))