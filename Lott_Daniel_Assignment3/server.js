/* Assignment 2
Partners: Erin Tachino and Daniel Lott
IR1 -Encryption of passwords and IR4 - must output when user last logged in and how many times they have logged in */

var express = require('express'); // importing the express file from node_modules
var app = express(); //putting imported express files into function named app 
const qs=require('node:querystring');
var fs = require('fs');
const crypto = require('crypto');
var order_str = "";
let secretekey = 'secretekey';
let bodyParser = require('body-parser');
let session = require('express-session');
products = require('./public/product_data.json'); //set the product_data.json array to variable products

const sessionConfig = {
    name: "Authorized", //sets name for cookie
    secret: 'no pain no gain', //enctypts session cookie and activates cookie (for security purposes)
    resave: false, //do not reset cookie after each request
    saveUnititialized: true, //saves the session even if not modified
    cookie: { 
        maxAge: 30000, //sets expiration of the cookie
        secure: false, //does not use https, only local host
        httpOnly: true, //denies access from Javascript (for security purposes)
    }
}
 //uses session with the properties that set for it above
app.use(session(sessionConfig));

//parses the inputted data and sets it to the request body
app.use(bodyParser.urlencoded({ extended: true }));

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

// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));

//gives server access to the request packet
app.use(express.urlencoded({ extended: true }));

// create response to all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});




// from lab 14 ex4.js 
fname = __dirname + '/user_data.json'; // creating a variable to call the user_data.json file 
if (fs.existsSync(fname)) { // reads entire file 
    var data = fs.readFileSync(fname, 'utf-8');
    var users = JSON.parse(data); // var users lets the file parse through the data within the user_data.json 
    console.log(users);
} else {
    console.log("Sorry file " + fname + " does not exist.");
}

//Taken from Lab13, Ex5 
//Runs through each element in the product array and initiailly set the total_sold 0


//stringify the products array on product_data.json to the variable products_str
app.get('/product_data.js', function (request, response, next) { 
   response.type('.js');
   var products_str = `var products = ${JSON.stringify(products)};`; 
   //Stringifies the product array in the product_display.json and sets the string to = products_str variable
   response.send(products_str); 
   console.log(products);
});

//Taken from the Stor1 WOD
//check if there are any invalid quantity inputs
function isNonNegInt(quantityString, returnErrors = false) {
    errors = []; // assume no errors at first
    if (Number(quantityString) != quantityString) {
        errors.push('Not a number!'); // Check if string is a number value
} else {
    if (quantityString < 0) errors.push('Negative value!'); // Check if it is non-negative
    if (parseInt(quantityString) != quantityString) errors.push('Not an integer!'); // Check that it is an integer
}
    if (returnErrors) {
        return errors;
    } else if (errors.length == 0) {
        return true;
    } else {
        return false;
    }
};

app.all('*', function (request, response, next) {
    // need to initialize an object to store the cart in the session. We do it when there is any request so that we don't have to check it exists
    // anytime it's used
    if (typeof request.session.cart == 'undefined') { request.session.cart = {}; }
    next();
  });
 
  app.get("/add_to_cart", function (request, response) {
    var products_key = request.query['products_key']; // get the product key sent from the form post
    var quantities = request.query['quantities'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
    request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
    response.redirect('./cart.html');
});

app.get("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

//start and display message in console if server loaded properly
app.listen(8080, () => console.log(`listening on port 8080`));