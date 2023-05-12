/*
Bao Vy Tran
This file is a server to serve the application and to perform server-side data validation
*/

/// STARTING THE SERVER.JS FILE ///
const express = require('express');
const app = express();
const querystring = require('querystring');
const nodemailer = require('nodemailer');

/// GET SESSION ///
// To keep track of different users' data as they go from page to page
const session = require('express-session');
app.use(session({secret: "mySecretKey", resave: true, saveUninitialized: true}));

/// GET COOKIE ///
const cookieParser = require('cookie-parser');
const {request} = require('http');
app.use(cookieParser());

/// PASSWORD ENCRYPTION ///
const crypto = require('crypto'); 

// Create a function to encrypt text
function encrypt(text) {
    encryptAlgo = crypto.createCipher('aes192', 'secretKey');
    let encrypted = encryptAlgo.update(text, 'utf-8', 'hex');
    encrypted += encryptAlgo.final('hex');
    return encrypted;
}
// Create a function to decrypt text (mainly for testing)
function decrypt(encrypted) {
    decryptAlgo = crypto.createDecipher('aes192', 'secretKey');
    let decrypted = decryptAlgo.update(encrypted, 'hex', 'utf-8');
    decrypted += decryptAlgo.final('utf-8');
    return decrypted;
}

/// STORING TEMPORARY DATA ///
var status = {};

/// USER DATA ///
// Get an entire file as an array of lines of user info data
var fs = require('fs');
var filename = './user_data.json';

// Define a variable to specify where user identification numbers start
let idNumber = 0;

// If the filename exists
if (fs.existsSync(filename)) {
    // Read the file and store the information in variable data 
    var data = fs.readFileSync(filename, 'utf-8');
    // Parse the information into JSON format and store as user_data
    var user_data = JSON.parse(data);

    // For every user that is already in the system
    for (let i = 0; i < Object.keys(user_data).length; i++) {
        
        // If the user is "loggedin", add them to the status object
        if (user_data[Object.keys(user_data)[i]].status == "loggedin") {
            status[Object.keys(user_data)[i]] = true;
        }

        // Assign an ID to each user that has 4 digits
        user_data[Object.keys(user_data)[i]].customer_id = idNumber.toString().padStart(4, '0');
        idNumber++;
    }
} 
// If the file does not exist
else {
    console.log(filename + " does not exist");
    user_data = {};
}

/// SALES RECORD ///
var salesFile = './sales_record.json';
if (fs.existsSync(salesFile)) {
     var salesData = fs.readFileSync(salesFile, 'utf-8');
     var sales_record = JSON.parse(salesData);
}
else {
    sales_record = [];
}

/// ROUTING /// 

// Monitor all requests 
app.all('*', function (request, response, next) {
    // Console log as a diagnostic
    console.log(request.method + ' to ' + request.path);
    // Make a session cart at any request (because the user can add items before login)
    if (typeof request.session.cart == 'undefined') {
        request.session.cart = {};
    }
    if (typeof request.session.users == 'undefined') {
        request.session.users = Object.keys(status).length;
    }
    next();
});

app.use(express.urlencoded({extended: true}));

var products = require(__dirname + '/products.json');

// Define a variable to specify where item numbers start
let itemNumber = 0;

for (let category in products) {
    // Create a quantitySold key for each product
    products[category].forEach((prod, i) => {prod.quantitySold = 0});

    // Create an item_id for each product
    products[category].forEach((prod, i) => {
        prod.item_id = itemNumber.toString().padStart(4, '0');
        itemNumber++;
    });
    
}

app.get('/products_data.js', function (request, response) {
    response.type('.js');
    var products_str = `var products = ${JSON.stringify(products)};`;
    response.send(products_str);
});

app.get('/sales_record.js', function (request, response) {
    response.type('.js');
    var sales_record_str = `var sales_record = ${JSON.stringify(sales_record)};`;
    response.send(sales_record_str);
})

app.post("/get_products_data", function (request, response) {
    response.json(products);
});

/// LOGIN VALIDATION ///
app.post('/process_login', function(request, response) {
    var POST = request.body;

    // Get the email and password inputted from the request body
    email_input = POST['email'].toLowerCase();
    password_input = POST['password'];
    
    // Encrypt password_input
    let encryptedPass = encrypt(password_input);    
    
    // If both input boxes are empty
    if ((email_input.length == 0) && (password_input.length == 0)) {
        request.query.loginError = 'Input fields cannot be blank.';
    } 
    // If the email exists in user_data
    else if (typeof user_data[email_input] != 'undefined') {
        // If the encrypted inputted password matches the email's encrypted saved password
        if (user_data[email_input].password == encryptedPass) {
            // If the user's current status is "loggedout", change it to "loggedin" and add them to the status object
            if (user_data[email_input].status == "loggedout") {
                user_data[email_input].status = "loggedin";
                status[email_input] = true;
            }

            // Store the user's email and name in the cookie in an object
            var user_cookie = {"email": email_input, "name": user_data[email_input]['name']};
            // Response with the user's cookie as a JSON string and set expiration to 15 minutes
            response.cookie('user_cookie', JSON.stringify(user_cookie), {maxAge: 900 * 1000});

            // Update the number of active users
            request.session.users = Object.keys(status).length;

            response.redirect('/display_products.html?');  
            return;
        } 
        // If the email was correct, but the password was left blank
        else if (password_input.length == 0) {
            request.query.loginError = 'Password input field cannot be blank.';
        }
        // If the inputted password does not match with the email's password
        else {
            request.query.loginError = 'Invalid password.';
        }
    } 
    // If the email does not exist in user_data
    else {
        request.query.loginError = 'Invalid email.';
    }

    request.query.email = email_input;
    let params = new URLSearchParams(request.query);
    response.redirect('/login.html?' + params.toString());
})

/// REGISTER VALIDATION ///
app.post('/process_register', function(request, response) {
    // Create a registration errors object and assume no errors
    var regErrors = {};
    // Get the request body input boxes 
    var regname = request.body.name;
    var regEmail = request.body.email.toLowerCase();
    var regPassword = request.body.password;
    var regConPass = request.body.confirm_password;
    
    /// FULL NAME VALIDATION ///
    // Make sure that the name field is not blank
    if (regname.length == 0) {
        regErrors['name_Length'] = 'Full name field cannot be blank.'
    }
    // Make sure name field is between 2 and 30 characters
    else if ((regname.length < 2) || (regname.length > 30)){
        regErrors['name_Length'] = 'Full name must be between 2 and 30 characters.'
    }
    // Make sure that the full name is made of letters and spaces
    if ((/^[a-zA-Z\s]+$/.test(regname) == false) && (regname.length != 0)){
        regErrors['name_Type'] = 'Full name must only contain letter characters.';
    } 

    /// EMAIL VALIDATION ///
    // Make sure email field is not blank
    if (regEmail.length == 0) {
        regErrors['email_Length'] = 'Email field cannot be blank.';
    }
    // Make sure email meets the requirements
    else if (/^\w+([.`!#$%^&*\-_+={}|'?/]?\w+)*@\w+([\.\-]?\w+)*(\.\w{2,3})+$/.test(regEmail) == false) {
        regErrors['email_Type'] = 'Invalid email address.';
    }
    // Make sure email is not already registered to another user
    else if (user_data[regEmail] != undefined) {
        regErrors['email_Type'] = 'This email is already registered to another user.';
    }

    /// PASSWORD VALIDATION ///
    // Make sure password field is not blank
    if (regPassword.length == 0) {
        regErrors['password_Length'] = 'Password field cannot be blank.';
    }
    // Make sure password meets the requirements
    else if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*.,_])[a-zA-Z0-9!@#$%^&*.,_]{8,}$/.test(regPassword) == false) {
        regErrors['password_Type'] = 'Password must have at least 8 characters that include: <br> at least 1 lowercase letter, 1 uppercase letter, <br> 1 number, and 1 special character in (!@#$%^&*.,_)';
    } 

    /// CONFIRMATION PASSWORD VALIDATION ///
    // Password confirmation to make sure that the re-entered password field is not blank
    if (regConPass.length == 0) {
        regErrors['confirm_password_Length'] = 'Confirmation password field cannot be blank.';
    }
    // Password confirmation to make sure that the re-entered password matches with the first password input
    else if (regConPass !== regPassword) {
        regErrors['confirm_password_Type'] = 'Passwords do not match.';
    }

    /// RESPONSE ///
    // If there are no input errors, redirect the user back to products display
    if (Object.keys(regErrors).length == 0) {

        // Find the current highest customer_id 
        let maxId = 0;
        for (const user in user_data) {
            var customerId = parseInt(user_data[user].customer_id);
            if (customerId > maxId) {
                maxId = customerId;
            }
        }
        // Assign the next available customer_id to the new user
        var newCustomerId = (maxId + 1).toString().padStart(4, '0');

        // Create an object within the user_data object for the new user
        user_data[regEmail] = {
            "name": regname,
            "password": encrypt(regPassword),
            "status": "loggedin",
            "customer_id": newCustomerId
        };

        console.log(user_data);
        
        // Store the user's email and name in the cookie in an object
        var user_cookie = {"email": regEmail, "name": regname};
        // Response with the user's cookie as a JSON string and set expiration to 15 minutes
        response.cookie('user_cookie', JSON.stringify(user_cookie), {maxAge: 900 * 1000});

        // Add the user's email to status
        status[regEmail] = true;

        // Update the number of active users
        request.session.users = Object.keys(status).length;

        response.redirect('/display_products.html?'); 
    } 
    // If there was an input error, make the user stay on the registration page and display error messages
    else {
        let params = new URLSearchParams(request.body);
        response.redirect('/register.html?' + params.toString() + '&' + querystring.stringify(regErrors));
    }
})

/// EDIT VALIDATION ///
app.post('/process_edit', function(request, response) {
    // Create a registration errors object and assume no errors
    var regErrors = {};
    
    // Get the user's cookie and parse it 
    var cookie = JSON.parse(request.cookies['user_cookie']);
    // Get the user's pre-edited email and name
    var oldEmail = cookie['email'];

    var regname = request.body.name;
    var regEmail = request.body.email.toLowerCase();
    var regPassword = request.body.password;
    var regConPass = request.body.confirm_password;
    
    /// FULL NAME VALIDATION ///
    // Make sure that the name field is not blank
    if (regname.length == 0) {
        regErrors['name_Length'] = 'Full name field cannot be blank.'
    }
    // Make sure name field is between 2 and 30 characters
    else if ((regname.length < 2) || (regname.length > 30)){
        regErrors['name_Length'] = 'Full name must be between 2 and 30 characters.'
    }
    // Make sure that the full name is made of letters and spaces
    if ((/^[a-zA-Z\s]+$/.test(regname) == false) && (regname.length != 0)){
        regErrors['name_Type'] = 'Full name must only contain letter characters.';
    } 

    /// EMAIL VALIDATION ///
    // Make sure email field is not blank
    if (regEmail.length == 0) {
        regErrors['email_Length'] = 'Email field cannot be blank.';
    }
    // Make sure email meets the requirements
    else if (/^\w+([.`!#$%^&*\-_+={}|'?/]?\w+)*@\w+([\.\-]?\w+)*(\.\w{2,3})+$/.test(regEmail) == false) {
        regErrors['email_Type'] = 'Invalid email address.';
    }

    /// PASSWORD VALIDATION ///
    // Make sure password field is not blank
    if (regPassword.length == 0) {
        regErrors['password_Length'] = 'Password field cannot be blank.';
    }
    // Make sure password meets the requirements
    else if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*.,_])[a-zA-Z0-9!@#$%^&*.,_]{8,}$/.test(regPassword) == false) {
        regErrors['password_Type'] = 'Password must have at least 8 characters that include: <br> at least 1 lowercase letter, 1 uppercase letter, <br> 1 number, and 1 special character in (!@#$%^&*.,_)';
    } 

    /// CONFIRMATION PASSWORD VALIDATION ///
    // Password confirmation to make sure that the re-entered password field is not blank
    if (regConPass.length == 0) {
        regErrors['confirm_password_Length'] = 'Confirmation password field cannot be blank.';
    }
    // Password confirmation to make sure that the re-entered password matches with the first password input
    else if (regConPass !== regPassword) {
        regErrors['confirm_password_Type'] = 'Passwords do not match.';
    }

    /// RESPONSE ///
    // If there are no input errors, redirect the user back to products display
    if (Object.keys(regErrors).length == 0) {
        
        // Find the user's current information
        var currentUserInfo = user_data[oldEmail];

        // Delete their old entry in user_data and status
        delete user_data[oldEmail];
        delete status[oldEmail];

        if (currentUserInfo) {
            // Get their current id
            var currentUserId = currentUserInfo.customer_id;

            //Create a new user object with their new info, but assign them their old id
            user_data[regEmail] = {
                "name": regname,
                "password": encrypt(regPassword),
                "status": "loggedin",
                "customer_id": currentUserId
            };
            // Add the user's email to status
            status[regEmail] = true;

            console.log(user_data);
        }

        // Update the number of active users
        request.session.users = Object.keys(status).length;

        // Edit the user's email and name in the cookie
        var user_cookie = {"email": regEmail, "name": regname};
        // Response with the user's cookie as a JSON string and set expiration to 15 minutes
        response.cookie('user_cookie', JSON.stringify(user_cookie), {maxAge: 900 * 1000});

        // Send the user back to products display
        response.redirect('/display_products.html?'); 
    } 
    // If there was an input error, make the user stay on the registration page and display error messages
    else {
        let params = new URLSearchParams(request.body);
        response.redirect('/register.html?' + params.toString() + '&' + querystring.stringify(regErrors));
    }
})

app.post('/process_logout', function(request, response) {
    // Get the user's cookie and parse it 
    var cookie = JSON.parse(request.cookies['user_cookie']);
    // Get the user's email
    var email = cookie['email'];
    // Clear the user's cookie
    response.clearCookie("user_cookie");
    
    // Delete the user's old value in the status object
    delete status[email];

    // Update the number of active users
    request.session.users = Object.keys(status).length;

    // Change their status to "loggedout"
    user_data[email].status = "loggedout";

    // Console log check
    console.log(status);  
    console.log(user_data);

    // If the user logs out, take them back to the products display page
    response.redirect('/index.html?');
})

/// USER PRODUCT INPUT VALIDATION INTO CART ///
app.post('/add_to_cart', function (request, response) {
    // POST the content of the request route
    var POST = request.body;
    
    // Get the products_key from the hidden input box
    var products_key = POST['products_key'];
    
    // Create an errorsObject object to store the error messages
    var errorsObject = {};

    for (let i in products[products_key]) {
        // Retrieve the quantity input from the POST method
        qty = POST[`quantity${[i]}`];

        // If there is an error, set the key and value pairs in errorsObject as the errorMessages
        if (notAPosInt(qty, false) == false) {
            // Store the error in an errorsObject to pass it in the URL
            errorsObject[`quantity${i}_error`] = notAPosInt(qty, true);
        }
    }
    // If there is an input and if there are no errors, redirect the user to invoice.html
    if (Object.keys(errorsObject).length == 0) {
        
        // If the session cart does not exist
        if (!request.session.cart) {
            // Create one
            request.session.cart = {};
        }
        // If the session cart array for a product category does not exist
        if (typeof request.session.cart[products_key] == 'undefined') {
            // Create one
            request.session.cart[products_key] = [];
        }
        
        // Make an array to store the quantities the users input
        var userQuantities = [];

        for (let i in products[products_key]) {
            // Push the user's inputs into the array
            userQuantities.push(Number(POST[`quantity${i}`]));  
        }
        // Set userQuantities in the session 
        request.session.cart[products_key] = userQuantities;
        response.redirect("./display_products.html?products_key=" + POST['products_key']);
    }
    // If there are errors, redirect the user back to products display 
    // Append the request body and the errorsObject so that users know what errors to fix
    // Append input error to the URL
    else if (Object.keys(errorsObject).length > 0) {
        response.redirect("./display_products.html?" + querystring.stringify(POST) + `&inputError&`+ querystring.stringify(errorsObject)); 
    }  
})

app.post('/get_cart', function (request, response) {
    response.json(request.session.cart);
})

app.post('/update_shopping_cart', function (request, response) {
    var products_key = request.body['products_key'];
    for (let key in request.session.cart) {
        for (let i in request.session.cart[key]) {
            if (typeof request.body[`cartInput_${key}${i}`] != 'undefined') {
                // Update the cart with new edited quantities
                request.session.cart[key][i] = Number(request.body[`cartInput_${key}${i}`]);
            } 
        }  
    }
    response.redirect("./display_products.html?" + querystring.stringify(products_key));
})

app.get('/checkout', function (request, response) {
    // Check if the user is logged in using their cookie
    if (typeof request.cookies['user_cookie'] == 'undefined') {
        response.redirect('./login.html?');
        return;
    } else {
        response.redirect('./invoice.html?valid');
    }
})

// Retrieved from Assignment 3 Code Example
app.post('/complete_purchase', function (request, response) { 
    // Get the user's cookie and parse it 
    var cookie = JSON.parse(request.cookies['user_cookie']);
    // Get the user's email
    var email = cookie['email'];

    // Delete the user's old value in the status object
    delete status[email];

    // Update the number of active users
    request.session.users = Object.keys(status).length;

    // Change their status to "loggedout"
    user_data[email].status = "loggedout";
    
    subtotal = 0;
    var invoice_str = `Thank you for your order!
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity Purchased</th>
                    <th>Remaining Inventory</th>
                    <th>Price</th>
                    <th>Extended Price</th>
                </tr>
            </thead>
            <tbody>`;
    var shopping_cart = request.session.cart;

    // Calculate quantity sold and inventory
    for (let products_key in products) {
        for (let i in products[products_key]) {
            if (typeof shopping_cart[products_key] == 'undefined') continue;
            qty = shopping_cart[products_key][i];
            // Calculate the quantity sold
            products[products_key][i].quantitySold += Number(qty);
            // Calculate the 'new' inventory by subtracting the quantity the user inputted by the 'old' inventory
            products[products_key][i].inventory = products[products_key][i].inventory - Number(qty); 
        }
    }
    
    // Create an object to store the sales info
    let salesInfo = {};

    // Print out invoice table in email
    for (let products_key in products) {
        for (let i = 0; i < products[products_key].length; i++) {
            if (typeof shopping_cart[products_key] == 'undefined') continue;
            let qty = shopping_cart[products_key][i];
            if (qty > 0) {
                extended_price = qty * products[products_key][i].price;
                subtotal += extended_price;
                invoice_str += `
                <tr>
                    <td>${products[products_key][i].name}</td>
                    <td>${qty}</td>
                    <td>${products[products_key][i].inventory - qty}</td>
                    <td>$${products[products_key][i].price.toFixed(2)}</td>
                    <td>$${extended_price}</td>
                </tr>
                `;

                // Log the date that the product was sold
                let date_sold = new Date();
                // Add the necessary info to the salesInfo object 
                    // Every product will have a separate salesInfo
                    // So if a user buys 3 different types of products in 1 purchase, 3 salesInfo objects will be created
                let salesInfo = {
                    'item_id': products[products_key][i].item_id,
                    'customer_id': user_data[email].customer_id,
                    'date_sold': date_sold,
                    'quantity': qty,
                    'price': extended_price
                }
                // Push the salesInfo object to the sales_record 
                sales_record.push(salesInfo);
            }
        }
    }

    console.log(sales_record);

    // Sales tax
    var taxRate = (4.7/100);
    var taxAmount = subtotal * taxRate;
    // Shipping
    if (subtotal < 300) {
        shipping = 5;
        shippingDisplay = `$${shipping.toFixed(2)}`;
        var grandTotal = Number(taxAmount + subtotal + shipping);
    } else if ((subtotal >= 300) && (subtotal < 500)) {
        shipping = 10;
        shippingDisplay = `$${shipping.toFixed(2)}`;
        var grandTotal = Number(taxAmount + subtotal + shipping);
    } else {
        shipping = 0;
        shippingDisplay = 'FREE';
        var grandTotal = Number(taxAmount + subtotal + shipping);
    }

    invoice_str += `
        <tr style="border-top: 2px solid black;">
            <td colspan="4" style="text-align:center;">Sub-total</td>
            <td>$${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
            <td colspan="4" style="text-align:center;">Tax @ ${Number(taxRate) * 100}%</td>
            <td>$${taxAmount.toFixed(2)}</td>
        </tr>
        <tr>
            <td colspan="4" style="text-align:center;">Shipping</td>
            <td>${shippingDisplay}</td>
        </tr>
        <tr>
            <td colspan="4" style="text-align:center;"><b>Total</td>
            <td><b>$${grandTotal.toFixed(2)}</td>
        </tr>
        </tbody>
        </table>`;
    
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
    var user_email = JSON.parse(request.cookies['user_cookie']).email;
    var mailOptions = {
        from: 'vycstm@gmail.com',
        to: user_email,
        subject: 'vycstm Invoice',
        html: invoice_str
    };
  
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            response.redirect(`thankyou.html?` + 'error')
        } else {
            response.redirect(`thankyou.html`);
        }
    })
    request.session.destroy(); //clear cart
})

app.post('/get_users', function (request, response) {
    response.json(request.session.users);
})

app.post('/get_timeStamp', function (request, response) {
    response.json(request.session.timeStamp);
})

// Code retrieved from Assignment2
function notAPosInt(arrayElement, returnErrors=false) {
    // Assume no errors at first
    errors = []; 
      
    // If the array element is not a number data type
    if (Number(arrayElement) != arrayElement) { 
        errors.push('Please enter a number value.'); 
    } 
    // If the array element is a number type
    else 
    {   
        // If the array element is negative
        if (arrayElement < 0)  {
            errors.push('Please enter a positive value.'); 
        } 
        // If the array element is not an integer
        else if ((parseInt(arrayElement) != arrayElement) && (arrayElement != 0)) {
            errors.push('Please enter an integer value.');
        }
    }
    return (returnErrors ? errors : (errors.length == 0));
}

/// Testing dynamic pricing               
let today = new Date();

// Subtract 24 hours in milliseconds (24 * 60 * 60 * 1000) to get yesterday's date
let yesterday = new Date(today - 86400000);

// Subtract 48 hours in milliseconds (48 * 60 * 60 * 1000) to get 2 days ago
let twoDaysAgo = new Date(today - 172800000);

// Subtract 72 hours in milliseconds (72 * 60 * 60 * 1000) to get 3 days ago
let threeDaysAgo = new Date(today - 259200000);

// Subtract 96 hours in milliseconds (96 * 60 * 60 * 1000) to get 4 days ago
let fourDaysAgo = new Date(today - 345600000);

// Make change to products price because after a discount is applied, the data in sales record changes
// So make the price into a set var first, put it in sales record

var yesterday_record = {
    "item_id": products['Shoes'][0].item_id, // HunterxHunter
    "customer_id": "0001",
    "date_sold": yesterday, 
    "quantity": 1, 
    "price": 200
}

var twoDaysAgo_record = {
    "item_id": products['Shoes'][1].item_id, //FMAB
    "customer_id": "0002",
    "date_sold": twoDaysAgo, 
    "quantity": 1, 
    "price": 350
}

var threeDaysAgo_record = {
    "item_id": products['Shoes'][2].item_id, //JJK
    "customer_id": "0002",
    "date_sold": threeDaysAgo, 
    "quantity": 1, 
    "price": 350
}

var fourDaysAgo_record = {
    "item_id": products['Shoes'][3].item_id, //Fairy Tail
    "customer_id": "0002",
    "date_sold": fourDaysAgo, 
    "quantity": 1, 
    "price": 350
}

sales_record.push(yesterday_record);
sales_record.push(twoDaysAgo_record);
sales_record.push(threeDaysAgo_record );
sales_record.push(fourDaysAgo_record);

console.log(`sales_record: `)
console.log(sales_record)

app.post('/set_price', function(request, response) {
    var selectedP = request.body.productDropdown;
    if (!selectedP === '*') {
        var item_id = Number(request.body.productDropdown);
    }
    else {
        var item_id = selectedP;
    }
    
    var discount = Number(request.body.discountInput);
    var dynamic = request.body.dynamicPricing;
        
    set_price(item_id, products, sales_record, discount, dynamic);
    response.redirect("/display_products.html?");
})

function set_price(item_id, products, sales_record, discount, dynamic) {
    // Check if the selected product is *
    if (item_id === "*") {
        console.log(`Selected product is * - applying discount to all products`);

        for (let category in products) { // For each category in the products object
            for (let i = 0; i < products[category].length; i++) {
                let product = products[category][i];
                let calculatedDiscount = 0;

                if (dynamic) { // If dynamic pricing was selected
                    console.log(`Dynamic pricing was selected`)

                    // Assume that the product's last sale date is null (meaning it has not been sold)
                    let lastSaleTime = null; 
                    
                    let currentDate = new Date(); // Get the current date
                    console.log(`The current date is: ${currentDate}`);

                    for (let i = sales_record.length - 1; i >= 0; i--) { // Loop through sales_record
                        let sale = sales_record[i]; // For every sale in the sales record

                        // If the item_id in the sales record matches the one from the admin's form submission
                        if (sale['item_id'] == product['item_id']) {
                            lastSaleTime = new Date(sale.date_sold); // Log the last sale time of the product
                            console.log(`The last time that ${product['name']} was sold is: ${lastSaleTime}.`);
                        }
                    }

                    

                    // If the last sale time exists (meaning the product was sold before)
                    if (lastSaleTime) {
                        // Calculate the number of hrs it has been since the last sale
                        let hoursSinceLastSale = Math.floor((currentDate - lastSaleTime) / (1000 * 60 * 60));

                        console.log(`It has been ${hoursSinceLastSale} hrs since ${product['name']} has been sold.`)
                        
                        // Apply the dynamic discount table
                        if (hoursSinceLastSale >= 96) {
                            calculatedDiscount = 95;
                            console.log(`A ${calculatedDiscount}% discount has been applied to ${product['name']}.`);
                        } else if (hoursSinceLastSale >= 72) {
                            calculatedDiscount = 60;
                            console.log(`A ${calculatedDiscount}% discount has been applied to ${product['name']}.`);
                        } else if (hoursSinceLastSale >= 48) {
                            calculatedDiscount = 30;
                            console.log(`A ${calculatedDiscount}% discount has been applied to ${product['name']}.`);
                        } else if (hoursSinceLastSale >= 24) {
                            calculatedDiscount = 10;
                            console.log(`A ${calculatedDiscount}% discount has been applied to ${product['name']}.`);
                        } else {
                            calculatedDiscount = 0;
                            console.log(`A ${calculatedDiscount}% discount has been applied to ${product['name']} because it has not been >= 24 hrs since it was last sold.`);
                        }
                    }
                    // If there has been no sales history for the selected product
                    else {
                        console.log(`${product['name']} has not been sold.`)
                        calculatedDiscount = 0;
                    }              
                    let discountedPrice = product.price * (1 - calculatedDiscount / 100);
                    if (discountedPrice < 0.01) {
                        discountedPrice = 0.01;
                    }
                    product.price = Number(discountedPrice.toFixed(2));

                    console.log(`${product['name']}'s price went from $${product.price} to $${discountedPrice}`);
                }
                else {
                    console.log(`Dynamic pricing was not selected.`)
                    if (discount >= -99 && discount <= 99) {
                        console.log(`The discount amount is: ${discount}%`);

                        // Update the product's price with the custom discount
                        let discountedPrice = product.price * (1 - discount / 100);
                        if (discountedPrice < 0.01) {
                            discountedPrice = 0.01;
                        }

                        console.log(`${product['name']}'s price went from $${product.price} to $${discountedPrice}`);
                        product.price = Number(discountedPrice.toFixed(2));
                    } else {
                        console.log("Invalid discount amount.");
                    }
                }
            }
        }
    }
    // Check if the selected product a singular product
    else if (!isNaN(item_id)) {
        console.log(`A singular product was selected.`);

        // Find the selected product within each category array
        let selectedProduct = null;

        for (let category in products) { // For each category in the products object
            // For each product in the category array
            // If the item_id from the dropdown form matches with the one in the products object
            
            selectedProduct = products[category].find(product => Number(product.item_id) === Number(item_id));
            if (selectedProduct) {
                console.log(`Selected product (${selectedProduct['name']}) with item id (${item_id}) exists within the products file`)
                break;
            }
        }
        
        // If the selected product exists
        if (selectedProduct) {
            // If dynamic pricing was selected
            if (dynamic) {
                console.log(`Dynamic pricing was selected`);

                // Assume that the product's last sale date is null (meaning it has not been sold)
                let lastSaleTime = null;
                
                // Get the current date
                let currentDate = new Date();
                console.log(`The current date is: ${currentDate}`);

                // Loop through sales_record
                for (let i = sales_record.length - 1; i >= 0; i--) {
                    // For every sale in the sales record
                    let sale = sales_record[i];

                    // If the item_id in the sales record matches the one from the admin's form submission
                    if (Number(sale.item_id) === Number(item_id)) {
                        // Log the last sale time of the product
                        lastSaleTime = new Date(sale.date_sold);
                        console.log(`The last time that ${selectedProduct['name']} was sold is: ${lastSaleTime}.`);
                    }
                }
                
                let calculatedDiscount = 0;

                // If the last sale time exists (meaning the product was sold before)
                if (lastSaleTime) {
                    // Calculate the number of hrs it has been since the last sale
                    let hoursSinceLastSale = Math.floor((currentDate - lastSaleTime) / (1000 * 60 * 60));
                    
                    console.log(`It has been ${hoursSinceLastSale} since ${selectedProduct['name']} has been sold.`)
                    
                    // Apply the dynamic discount table
                    if (hoursSinceLastSale >= 96) {
                        calculatedDiscount = 95;
                        console.log(`A ${calculatedDiscount}% discount has been applied to ${selectedProduct['name']}.`);
                    } else if (hoursSinceLastSale >= 72) {
                        calculatedDiscount = 60;
                        console.log(`A ${calculatedDiscount}% discount has been applied to ${selectedProduct['name']}.`);
                    } else if (hoursSinceLastSale >= 48) {
                        calculatedDiscount = 30;
                        console.log(`A ${calculatedDiscount}% discount has been applied to ${selectedProduct['name']}.`);
                    } else if (hoursSinceLastSale >= 24) {
                        calculatedDiscount = 10;
                        console.log(`A ${calculatedDiscount}% discount has been applied to ${selectedProduct['name']}.`);
                    } else {
                        discount = 0;
                        console.log(`A ${calculatedDiscount}% discount has been applied to ${selectedProduct['name']} because it has not been >= 24 hrs since it was last sold.`);
                    }
                }
                // If there has been no sales history for the selected product
                else {
                    console.log(`${selectedProduct['name']} has not been sold.`)
                    calculatedDiscount = 0;
                }
                let discountedPrice = selectedProduct.price * (1 - calculatedDiscount / 100);
                if (discountedPrice < 0.01) {
                    discountedPrice = 0.01;
                }
                console.log(`${selectedProduct['name']}'s price went from $${selectedProduct.price} to $${discountedPrice}`);

                selectedProduct.price = Number(discountedPrice.toFixed(2));
            } 
            // If dynamic pricing is not selected, validate the entered discount amount
            else {
                console.log(`Dynamic pricing was not selected.`)
                if (discount >= -99 && discount <= 99) {
                    console.log(`The discount amount is: ${discount}%`);

                    // Update the product's price with the custom discount
                    let discountedPrice = selectedProduct.price * (1 - discount / 100);
                    if (discountedPrice < 0.01) {
                        discountedPrice = 0.01;
                    }
                    
                    console.log(`${selectedProduct['name']}'s price went from $${selectedProduct.price} to $${discountedPrice}`);
                    selectedProduct.price = Number(discountedPrice.toFixed(2));
                } else {
                    console.log("Invalid discount amount.");
                }
            }
            
            for (let category in products) {
                let index = products[category].findIndex(product => Number(product.item_id) === item_id);
                if (index !== -1) {
                    products[category][index].price = selectedProduct.price;
                    break;
                }
            }
        } 
        else {
            console.log("Selected product does not exist.");
        }
    } 
    else {
        console.log(`Invalid item_id input`)
    }
}
  
// Route all other GET requests to files and images in public 
app.use(express.static(__dirname + '/public'));
// Start server
app.listen(8080, () => console.log(`listening on port 8080`));