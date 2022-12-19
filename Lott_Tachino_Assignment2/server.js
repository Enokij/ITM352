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

//set the product_data.json array to variable products
products = require('./public/product_data.json');

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
products.forEach( (prod,i) => {prod.total_sold = 0}); 


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

 app.get("/shopping_cart", function (request, response) { 
    str = `
    <body>
        <h1> Shopping Cart </h1>
    </body>
    `
 })

// process POST request which will validate the quantities and check the qty_available. 
//Code source: Worked with Erin Tachino and Professor Kazman, Lab13-Ex5. 
app.post("/getToLogin", function (request, response) {
    // Process the invoice.html form for all quantities and then redirect if quantities are valid
    let valid = true;  //going to use the boolean to verify if the quantity entered is less than the qty_available 
    let valid_num= true;    
    for (i = 0; i < products.length; i++) { // Runs loop for all products and their respective entered quantities
        let qty_name = 'quantity' + i; //going to be used to set the url string for the different quantities entered in the textbox for each product 
        let qty = request.body[qty_name]; //pulls product quantities for i and sets it to qty. to be used
        console.log('qty_name= ' +qty_name);
        console.log('qty= ' + qty);
        if(qty == 0) continue; //if no inputs are entered into a product quantity textbox, then continue to the next product in the qty array.
            if (isNonNegInt(qty) && Number(qty) <= products[i].qty_available) {
            //if the qty meets the above criteria, then update the product's qty sold and available with the respective product quantities entered
                products[i].qty_available -= Number(qty);//subtracts quantities from qty_available
                products[i].total_sold += Number(qty); //increments quantities to quantities sold    
                order_str = qs.stringify(request.body); // creates a string using the request.body
            } else if(isNonNegInt(qty) != true) { // if quantities is not equal to a valid number than it is false 
                valid_num = false;
            } else if(Number(qty) >= products[i].qty_available) { // If the quantities enter are greater then the qty_available, then valid = false (returns)
                valid = false;
             } if(qty > 0) { //if quantities is greater than 0 than this statement returns true
                var zero_qty = true;
             }
            }
    //from Lab 13 info_server.new.js. For Individual Requirement 4 Assignment 1 (Erin)
    /*if the number entered is not a valid number as identified through the isNonNegInt(qty) or did not meet the other conditions set in the if statement,
    then redirect user back to the index page and set the submit_button parameter to the respective error message*/
    if(valid_num == false){ 
        response.redirect('index.html?submit_button=Please Enter Valid Quantity!' + '&' + order_str);
    /*if quantity available is less then the amount of quantity ordered, then redirect user back to the index page
    and set the submit_button parameter to the respective error message*/
    } if(typeof zero_qty == 'undefined') {
        response.redirect('index.html?submit_button=Need to select quantity to purchase' + '&' + order_str);
    }
    else if (valid == false) {
        response.redirect('index.html?submit_button=Not Enough Left In Stock!' + '&' + order_str);
    } else if (typeof qty == "") {
        response.redirect('index.html?submit_button=Enter Quantity To Continue!' + '&' + order_str);
    } else {
        // If no errors are found, then redirect to the invoice page.
        qty_ordered = order_str;
        response.redirect(`login.html?${order_str}`);
    }
});


// taken from lab14 and Assignment 2 examples 
app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    // User entered inputs are set to the variable POST
    let POST = request.body; 
    //User's entered email will be set to the variable entered_email. This value is set to all lowercase letters
     entered_email = POST["email"].toLowerCase(); 
     //IR1 we want to encrypt the password entered in the login page
    var user_pass = generateCipher(POST['password']);
    console.log("User email=" + entered_email + " password=" + user_pass);
    //Validates the user's email/password by matching information to the user_data.json file
    if (typeof users[entered_email] != 'undefined') { 
        if(users[entered_email].password == user_pass) { 
            // retrieves the parameters sent from the processing of the process_purchase form
            let params = new URLSearchParams(request.query); 
            // appends the user the username to the search parameters
            params.append('name', users[entered_email].name); 
           
            //For Assignment 2: IR4 (Daniel)
            //sets the json object's count of the times it was previously logged in to a string
            TimesLoggedIn_str = users[entered_email].num_loggedIn;
            console.log(users[entered_email].num_loggedIn);
            
            //sets the json string to a number
            TimesLoggedIn_num = Number(TimesLoggedIn_str);
            
            //adds 1 to the number of times the user has previously logged in and sets the json file's object's property to this value
            users[entered_email].num_loggedIn = 1 + TimesLoggedIn_num;
            console.log("num= " + TimesLoggedIn_num);
                       
            //syncs the new object property value for the times logged in to the user_data.json
            fs.writeFileSync(fname, JSON.stringify(users), 'utf-8'); 
            
            //redirects to the invoice page with the respective variables appended to the url string
            response.redirect('/invoice.html?' + '&' + order_str + '&' + `email=${entered_email}` + '&' + `name=${users[entered_email].name}` + '&' + `LogCount=${users[entered_email].num_loggedIn}` + '&' + `date=${users[entered_email].last_date_loggin}`); // these appended variables are entered into the query string to bring that user input data to the next page
            users[entered_email].last_date_loggin = Date();
        } else {
            // if the password is not valid, then will push the error to LoginError
            request.query.LoginError = 'Password not valid!' 
        }
    } else { 
        request.query.LoginError = 'Username not valid!';
    }
    params = new URLSearchParams(request.query);
    // if error was detected, then redirect back to login page with the respective search parameters
    response.redirect('./login.html?' + '&' + `errors=${request.query.LoginError}` + '&' + order_str + '&' + `email=${entered_email}`); 

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

     let onlyletters = /^[A-Za-z]+$/; // only allows letters /* case insensitive - format must be ex. erin@gmail.com */
     let email_valid_input = /^[A-Za-z0-9_.]+@([A-Za-z0-9_.]*\.)+([a-zA-Z]{2}|[a-zA-Z]{3})$/; 
    /* case sensitive - format must have at least special character "!", one number "2", and upper and lower case letters */

  
     // using an if statement to validate what we call "name" from our user_data.json
    if(onlyletters.test(POST.name)) { // calling the variable that has the rule for only letters, the name cannot be anything but letters
    } else {
        reg_error['name'] = 'Must only use valid letters'; // if there are any nonletter within name then the query string will have this message
    }
    // validating that name is at least 2 characters long and under 30 characters
    if(POST.name > 30 || POST.name < 2) {
        reg_error['name'] = 'Full name must be at least 2 characters long, no more than 30 character allowed'
    } // if it is shorter than 2 or above 30 then this message will appear in the query string 

    // if statement to check if email added is valid to the requirements called by the variable email_valid_input
    if(email_valid_input.test(POST.email)) {
    } else {
        reg_error['email'] = 'Please enter valid email'; // if it does not meet the requirements for valid email then this message appears in query string 
    }
    if(typeof users[user_email] != 'undefined') { // if the email is already within the our user_data.json 
        reg_error['email'] = 'Email already exsist' // then send this message to the query string 
    }

    // if statement to valid password length - required by A2 to have at least 10 characters
    if((POST['password'].length) < 10) { // used .length so that it reads the length of password that is inputted
        reg_error['password'] = 'Password must be longer than 10 characters' // message appears in query string
    }
    if((POST['password']) != POST['repeat_password']) { // make sure both password match 
        reg_error['repeat_password']
    }
    // used object.keys for the array to check that errors equal to zero
    // ref for objectkeys: https://www.w3schools.com/jsref/jsref_object_keys.asp
    if (Object.keys(reg_error).length == 0) { 
        var email = POST['email'].toLowerCase();
        users[email] = {};
        users[email].name = POST['name'];
        users[email].password = encrpt_user_password;
        users[email].email = POST['email'];
        users[email].num_loggedIn = 0;
        users[email].last_date_loggin = Date();
        
        // this creates a string using are variable fname which is from users and then JSON will stringify the data "users"
        fs.writeFileSync(fname, JSON.stringify(users), "utf-8"); 
        // redirect to login page if all registered data is good, we want to keep the name enter so that when they go to the invoice page after logging in with their new user account
        response.redirect('/login.html?' + order_str + '&' + `name=${user_name}` + '&' + `date=${users[email].last_date_loggin}`); 
    } else {
        POST['reg_error'] = JSON.stringify(reg_error); // if there are errors we want to create a string 
        let params = new URLSearchParams(POST);
        response.redirect('register.html?' + order_str + params.toString()); // then we will redirect them to the register if they have errors
    }
 });

 app.post("/user_update", function (request, response) {
    // once users' information is entered into the register page, post then processes the register form
    let POST = request.body; //Sets all the users' inputted information from their request into the POST variable 
    console.log(POST); //Writes the user data into a variable
    //The following 4 variables are set to individual attributes of the users' entered information
    let encrpt_user_password = generateCipher(POST["password"]);
     let reg_error = {};
      user_name = POST["fullname"]; 
      user_pass = POST["password"];
      user_email = POST["email"];
      user_pass2 = POST["repeat_password"];

     let onlyletters = /^[A-Za-z]+$/; // only allows letters 
    /* case insensitive - format must be ex. erin@gmail.com */
     let email_valid_input = /^[A-Za-z0-9_.]+@([A-Za-z0-9_.]*\.)+([a-zA-Z]{2}|[a-zA-Z]{3})$/; 
    /* case sensitive - format must have at least special character "!", one number "2", and upper and lower case letters */


     
     // validate name
    if(onlyletters.test(POST.name)) {
    } else {
        reg_error['name'] = 'Must only use valid letters';
    }

    if(POST.name > 30 || POST.name < 2) {
        reg_error['name'] = 'Full name must be at least 2 characters long, no more than 30 character allowed'
    } 

    // validate email
    if(email_valid_input.test(POST.email)) {
    } else {
        reg_error['email'] = 'Please enter valid email';
    }
    // validate password 
    if((POST['password'].length) < 10) {
        reg_error['password'] = 'Password must be longer than 10 characters'
    }
    if((POST['password']) != POST['repeat_password']) {
        reg_error['repeat_password']
    }

    // validates that the array that is being returned, which is the errors, is 0. If it is, redirect to invoice
    if (Object.keys(reg_error).length == 0) { 
        var email = POST['email'].toLowerCase();
        users[email] = {};
        users[email].fullname = user_name;
        users[email].password = encrpt_user_password;
        users[email].email = user_email;
        users[email].num_loggedIn = 1;

        var date = new Date();
        users[email].lastLoggin = date;
        fs.writeFileSync(fname, JSON.stringify(users), "utf-8"); // creates a string from the user information on the server data base using stringify
        response.redirect('/login.html?' + '&' + order_str + '&' + `email=${entered_email}` + '&' + `name=${users[entered_email].name}` + '&' + `LogCount=${users[entered_email].num_loggedIn}`); // direct to the invoice page if all data is valid
    } else {
        //if there are errors we want to create a string
        POST['reg_error'] = JSON.stringify(reg_error);
        let params = new URLSearchParams(POST);
        // then we will redirect them to the register if they have errors
        response.redirect('user_update.html?' + order_str + params.toString()); 
    }
 });
 

//start and display message in console if server loaded properly
app.listen(4000, () => console.log(`listening on port 8080`));