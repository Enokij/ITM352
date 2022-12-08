
//use express
var express = require('express');

//use middleware
var app = express();


// Includes crypto module for encryption
const crypto = require('crypto');

// set global variables
user_error = false;
password_error = false;
email_exists = false;

//load in the products json 
products_array = require(__dirname + '/products.json');

//implement read file
var fs = require('fs');
var fname = 'user_data.json';
var pname = 'products.json';
var data = fs.readFileSync(fname, 'utf-8');
var data2 = fs.readFileSync(pname, 'utf-8');
var users = JSON.parse(data);
var products = JSON.parse(data2);

//upload products.js on the client side
app.get("/products.js", function (request, response) {
  response.type('js');
  var products_str = `var products = ${JSON.stringify(products_array)};`;
  response.send(products_str);
})
//function to generate the shipping
function generateShipping(subtotal) {
  var shipping;
  if (subtotal <= 50) {
    shipping = 2;
  }
  else if (subtotal <= 100) {
    shipping = 5;
  }
  else {
    shipping = subtotal * .05;
  }
  return shipping;
}


//function to check if valid integer
function checkNonNegInt(value, returnErrors = false) {
  errors = [];

  if (value < 0 || parseInt(value) != value || Number(value) != value) {
    errors.push("Please enter a valid number!\n");
  }
  if (errors.length == 0) {
    returnErrors = true;
  }
  else {
    return errors;
  }
  return returnErrors;
}


//generate Hash received help from https://www.npmjs.com/package/crypto-js
function generateHash(password) {

  // Node.js program to demonstrate the    
  // crypto.createHash() method
  // Defining key
  const secret = password;

  // Calling createHash method
  const hash = crypto.createHash('sha256').update(secret).digest("hex")
  return hash;
}
//compare Hash passwords
function compareHash(password, hashed) {
  if (password == hashed) {
    return true;
  }
  else {
    return false;
  }
}
//function to check if email exists
function checkEmailExists(email) {
  let text = email;
  text = text.toLocaleLowerCase();
  for (i in users) {
    if (text.match(users[i].email.toLocaleLowerCase())) {
      return true
    }
  }
  return false
}

//received help from youtube video on creating regex at https://www.youtube.com/watch?v=QxjAOSUQjP0
//function to check if email is in proper format of X@Y.Z
function CheckEmailFormat(inputText) {
  var mailformat = /^([A-Za-z\d\.-_]+)@([A-Za-z\d\.]+)\.([A-Za-z]{2,3})$/;
  if (inputText.match(mailformat)) {
    return true;
  }
  else {
    return false;
  }
}

//call in middleware
var bodyParser = require("body-parser");
const { response } = require('express');
const e = require('express');
const { match } = require('assert');
app.use(bodyParser.urlencoded({ extended: false }));

//monitor all requests
app.all('*', function (request, response, next) {
  console.log(request.method + ' to ' + request.path);
  next();
});

//route all other GET requests to files in public
app.use(express.static(__dirname + '/public'));



//post request to /purchase
app.post('/purchase', function (req, res) {
  let error = false;
  let obj = req.body;
  let arr = Object.values(obj);
  let arry = [];

  //push the object from params for quantities into an array called arry
  arr.forEach(function (value, key) {
    arry.push(value);

    // if not valid integer THEN throw an error message
    if (checkNonNegInt(value, true) != true && value != 0) {

      //res.send(`Invalid amount of quantity added, please go back<br><button onclick="window.location = 'index.html'">Go Back</button>`);
      res.redirect('index.html?error');
      error = true;
    }
  })

  //IF ERROR IS FALSE THEN GO TO LOGIN
  if (error == false) {
    let params = new URLSearchParams(req.body);
    res.redirect('./login?' + params.toString());
  }

})

//get request for login gives a login form with username and password
app.get("/login", function (request, response) {


  // Give a simple login form
  let params = new URLSearchParams(request.query);
  // call in string for login form
  str = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="../style.css">
      <title>Invoice</title>
      
  </head>
  <header>
  <span id="purple">
      <p>
          <span style="color:#FF0000">B</span>
          <span style="color:#66CC66">E</span>
          <span style="color:#FF9966">T</span>
          <span style="color:#FFCCCC">T</span>
          <span style="color:#FF0066">A</span>
      </p>
      <img src="./images/bob.png">
  </span>
</header>
  <script>
    if(${user_error == true})
    {
      alert("Invalid username or password");
      ${user_error = false}
    }
    </script>
<body>
<div class= "full-screen-container">
<div class="login-container">
<h1 class="login-title">Login</h1>
<form class="form" action="?${params.toString()}" name = "form2" method="POST">
<div class="input-group">
<label for="username">Username</label>
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<label for="password">Password</label>
<input type="password" name="password" size="40" placeholder="enter password"><br />
</div>
<input type="submit"; value="Submit" id="submit" class="login-button"><br>
</form>
<script>
if(${params.has("username")})
{
  let user_name = "${params.get("username")}";
  document.form2.username.value = user_name;
}
</script>


<p><a href = "./register?${params.toString()}">Create account</a></p>
</body>
  `;
  response.send(str);
});

//get request for reguest send a simple form for user, name, email, and password
app.get('/register', function (req, res) {

  //grab params from url
  let params = new URLSearchParams(req.query);
  //send a string for a form of register
  res.send(

    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="../style.css">
        <title>Invoice</title>
     
    </head>
    <header>
    <span id="purple">
        <p>
            <span style="color:#FF0000">B</span>
            <span style="color:#66CC66">E</span>
            <span style="color:#FF9966">T</span>
            <span style="color:#FFCCCC">T</span>
            <span style="color:#FF0066">A</span>
        </p>
        <img src="./images/bob.png">
    </span>
  </header>
    <script>
    //function to check strong password help form https://www.w3resource.com/javascript/form/password-validation.php
function CheckPassword(inputtxt) {
  var paswd = /^(?=.*[0-9])(?=.*[!@#$%^&*,'\.])[a-zA-Z0-9!@#$%^&*,'\.]{10,16}$/;
  if (inputtxt.value.match(paswd)) {
      return true;
  }
  else {
      alert('Please put strong password. 1 special character and 1 number. Minimum 10 characters and maximum 16 characters.')
      return false;
       }
  }     
 
  //received help from youtube video on creating regex at https://www.youtube.com/watch?v=QxjAOSUQjP0
  function CheckEmail(inputText)
  {
  var mailformat = /^([A-Za-z\d\.-_]+)@([A-Za-z\d\.]+)\.([A-Za-z]{2,3})$/;
  if(inputText.value.match(mailformat))
  {
  return true;
  }
  else
  {
  alert("You have entered an invalid email address!");
  return false;
  }
  }
  //function to validate the email on return submit makes sure everythign is good
  function ValidateData(email, password, username, fullname)
  {
 
    let user_length = username.length;
    let fullname_length = fullname.length;
    if(CheckPassword(password)== true && CheckEmail(email) == true && user_length != 0 && fullname_length != 0)
    {
      return true;
    }
    else
    {
      document.form1.email.value = email.value;
      document.form1.fullname.value = fullname;
      document.form1.username.value = username;
      document.form1.password.value = "";
      document.form1.secondpassword.value = "";
      return false;
    }
   
  }
  //function to check for the password strength. Used in IR3
  
  function checkPasswordStrength(pass)
  {
    let strong_pass = /^(?=.*[0-9])(?=.*[!@#$%^&*,'\.])[a-zA-Z0-9!@#$%^&*,'\.]{10,16}$/;
    if(pass.match(strong_pass))
    {
      document.getElementById("passworderror").innerHTML = "Strong!";
      document.getElementById('passworderror').style.color='green';
 
    }
    else
    {
      document.getElementById("passworderror").innerHTML = "Weak";
      document.getElementById('passworderror').style.color='red';
    }
  }

 
    </script>
    <body>
    <div class= "full-screen-container2">
    <div class="login-container">
    <h1 class="login-title">Register</h1>
    <form name = "form1"; method = "post" action = "?${params.toString()}"; onsubmit="return ValidateData(document.form1.email, document.form1.password, document.form1.username.value, document.form1.fullname.value)" >
    <div class="input-group">
    <label for="email">Email</label>
    <input type = "email" name = "email" size="40" placeholder="enter email";>
    <br>
    <label for="fullname">Fullname</label>
    <input type = "text" name = "fullname" size="40"; placeholder="enter full name" minlength = "2"; maxlength="30">
    <br>
    <label for="username">Username</label>
    <input type = "text" name = "username" size="40" placeholder="enter username" minlength = "2"; maxlength="30">
    <br>
    <label for="Password">Password</label>
    <input type = "password" name = "password" onkeyup = "checkPasswordStrength(this.value)") size="40" placeholder="enter password";  minlength = "10"; maxlength="16">
    <div id = "passworderror"><p></p></div>
    <br>
    <label for="ConfirmPassword">ConfirmPassword</label>
    <input type = "password" name = "secondpassword" size="40" placeholder="enter password again"  minlength = "10"; maxlength="16">
    <br>
    </div>
    <button type = "submit" class = "login-button" >Register</button>
    
    </form>
    <script>
    //check to see if params has email, if it does then make it sticky
    if(${params.has("email")})
    {
      let email = "${params.get("email")}";
      let user_name = "${params.get("username")}";
      let full_name = "${params.get("fullname")}";
      document.form1.email.value = email;
      document.form1.username.value = user_name;
      document.form1.fullname.value = full_name;
    } 
      //this code looks at the global variable booleans throws alerts if any are true
      if(${user_error == true})
      {
        alert("User name is taken");
        ${user_error = false};
      }
      else if(${password_error == true})
      {
        alert("Passwords do not match");
        ${password_error = false};
      }
      else if(${email_exists} == true)
      {
        alert("Email already exists!");
        ${email_exists = false};
      }
  
 
    </script>
    </body>
    `
  )

})


//post request for register
app.post("/register", function (req, res) {
  let params = new URLSearchParams(req.query);
  let POST = req.body;
  let email = POST.email;
  let full_name = POST.fullname
  let user_name = POST.username;
  let password = POST.password;
  //save encrypt_pass called from generateHash function
  let encrypt_pass = generateHash(password);
  let secondpassword = POST.secondpassword;
  //check if statement to see if second password matches first and if there is no user of that username in the database and if the email does not exist
  if (password.match(secondpassword) && users[user_name] == undefined && checkEmailExists(email) != true) {
    if (users[user_name] != user_name) {
      //create a new object for the new username
      users[user_name] = {};
      users[user_name].name = user_name;
      users[user_name].fullname = full_name;
      users[user_name].password = encrypt_pass;
      users[user_name].email = email;
      users[user_name].loginCount = 1;
      //received help on date from lab 6
      var date = new Date();
      hours = date.getHours();
      time = (hours < 12) ? 'AM' : 'PM';
      hours = ((hours + 11) % 12 + 1);
      minutes = date.getMinutes();
      minutes = ((minutes < 10) ? `0${minutes}` : `${minutes}`);
      new_date = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + hours + ":" + minutes + time;
      users[user_name].lastTime = new_date;
      let data = JSON.stringify(users);
      fs.writeFileSync(fname, data, 'utf-8');
      //if there is a param of username then set the params of the new req.body and redirect it and send it to success_register
      if (params.has("username")) {
        params.set("email", email);
        params.set("username", user_name);
        params.set("fullname", full_name);
        res.redirect('./success_register?' + params.toString())
      }
      //if there is no params then redirect to success_register with param
      else {
        res.redirect('./success_register?' + params.toString() + "&username=" + user_name);
      }

    }
  }
  else {
    //check to see if the params already has email in it
    if (params.has("email")) {
      params.set("email", email);
      params.set("username", user_name);
      params.set("fullname", full_name);
      res.redirect('./register?' + params.toString());
      //check to see if the username is taken
      if (users[user_name] != undefined) {
        user_error = true;
      }
      //check to see if the password and confirm password match
      else if (password.match(secondpassword) == null) {
        password_error = true;
      }
      //check to see if the email exists in our database
      else if (checkEmailExists(email) == true) {
        email_exists = true;
      }
    }
    //if params does not have email then send a query string with the information
    else {
      res.redirect('./register?' + params.toString() + "&email=" + email + "&fullname=" + full_name + "&username=" + user_name);
      //checks if username is taken
      if (users[user_name] != undefined) {
        user_error = true;
      }
      //checks if passwords match with confirm password
      else if (password.match(secondpassword) == null) {
        password_error = true;
      }
      //checks if email exists in database
      else if (checkEmailExists(email) == true) {
        email_exists = true;
      }
    }
  }

})

//get request for successful login
app.get("/success_login", function (req, res) {
  let params = new URLSearchParams(req.query);

  let user_name = params.get("username");
  //send a response string 
  res.send(`Successful login! Welcome back! ${users[user_name].fullname}.
  <br>
You have logged in ${users[user_name].loginCount} times. Last time you logged in was ${users[user_name].lastTime}.
  
  <form method = "post" action = "/invoice?${params.toString()}">
  Click here to view your <button type = "submit">invoice!</button>
  </form>
  <br>
  Want to edit your account? Click here. <button onclick = "window.location = './edit?${params.toString()}'">Edit</button>

  `);
  //date received help from lab 6
  var date = new Date();
  hours = date.getHours();
  time = (hours < 12) ? 'AM' : 'PM';
  hours = ((hours + 11) % 12 + 1);
  minutes = date.getMinutes();
  minutes = ((minutes < 10) ? `0${minutes}` : `${minutes}`);
  new_date = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + hours + ":" + minutes + time;
  users[user_name].lastTime = new_date;
  let data = JSON.stringify(users);
  fs.writeFileSync(fname, data, 'utf-8');
})

//post to successful register
app.get("/success_register", function (req, res) {
  let params = new URLSearchParams(req.query);
  let user_name = params.get("username");

  res.send(`Successful register!!
  <form method = "post" action = "/invoice?${params.toString()}">
  Click here to confirm <button type = "submit">purchase!</button>
  </form>
 
  `);

})

//function req and res to edit account
app.get("/edit", function (req, res) {
  let params = new URLSearchParams(req.query);
  let user_name = params.get("username");
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="../style.css">
      <title>Invoice</title>
   
  </head>
  <header>
  <span id="purple">
      <p>
          <span style="color:#FF0000">B</span>
          <span style="color:#66CC66">E</span>
          <span style="color:#FF9966">T</span>
          <span style="color:#FFCCCC">T</span>
          <span style="color:#FF0066">A</span>
      </p>
      <img src="./images/bob.png">
  </span>
</header>
<body>
    <script>
    //if error is true for any of the global variables then throw an alert
    if(${email_exists == true})
    {
      alert("Email is already taken or improper email format.");
      ${email_exists = false}
    }
    else if(${password_error == true})
    {
      alert("Incorrect user password")
      ${password_error = false}
    }
    </script>
    <div class= "full-screen-container2">
    <div class="login-container">
    <h1 class="login-title">Edit your account below</h1>
    <form name = "form1"; method = "post" action = "?${params.toString()}";>
    <div class="input-group">
    <label for="email">Email</label>
    <input type = "email" name = "email" size="40" value = "${users[user_name].email}";>
    <br>
    <label for="fullname">Fullname</label>
    <input type = "text" name = "fullname" size="40"; value = "${users[user_name].fullname}" minlength = "2"; maxlength="30">
    <br>
    <label for="Password">Password</label>
    <input type = "password" name = "password" size="40" placeholder="enter your old password to make changes";>
    <br>
    <label for="Password">Confirm Password</label>
    <input type = "password" name = "confirmpassword" size="40" placeholder="confirm your password";>
    <button type = "submit" class = "login-button" >Save</button>
    
    </form>`);
})

//post to edit this checks if email exists and if it has proper email format.
// If it does then continue. 
//Also checks if your password matches
app.post("/edit", function (req, res) {
  let params = new URLSearchParams(req.query);
  //get username from query
  let user_name = params.get("username");
  let POST = req.body;
  let new_email = POST.email;
  let new_full_name = POST.fullname
  let password = POST.password;
  let confirm_password = POST.confirmpassword;
  let encrypt_pass = generateHash(password);
  let encrypt_pass2 = generateHash(confirm_password);;

  users[user_name].fullname = new_full_name;
  //if email already exists or the format is wrong then throw an error
  //also if no changes are made then let it continue
  if ((checkEmailExists(new_email) != false || CheckEmailFormat(new_email) == false) && new_email != users[user_name].email) {
    email_exists = true;
    res.redirect('./edit?' + params.toString())
  }
  else {
    //compare both password and confirm password as well as password and password in database
    if (compareHash(encrypt_pass, users[user_name].password) != true || compareHash(encrypt_pass, encrypt_pass2) != true) {
      password_error = true;
      res.redirect('./edit?' + params.toString());
    }
    else {
      //if there is no error then set the new email and write it
      users[user_name].email = new_email;
      let data = JSON.stringify(users);
      //write the new file
      fs.writeFileSync(fname, data, 'utf-8');
      res.redirect('./success_login?' + params.toString());
    }
  }

})
//post to login chhecks to see if credentials match if not then redirect back to login with error message
app.post("/login", function (request, response) {
  let params = new URLSearchParams(request.query);
  let POST = request.body;
  let user_name = POST["username"];

  let password = POST["password"];
  let hash_pass = generateHash(password);


  //if the username is not contained in our database then
  if (users[user_name] != undefined) {
    //compare the username and passwords
    if (user_name == users[user_name].name && compareHash(hash_pass, users[user_name].password) == true) {

      // Process login form POST and redirect to logged in page if ok, back to login page if not
      users[user_name].loginCount += 1;
      data = JSON.stringify(users);
      fs.writeFileSync(fname, data, 'utf-8');
      //if params has user then redirect them and set the user to the post username
      if (params.has("username")) {
        params.set('username', user_name);
        response.redirect('./success_login?' + params.toString());
      }
      //if no params then append the username to the query
      else {
        response.redirect('./success_login?' + params.toString() + "&username=" + user_name);
      }


    }
    //if username matches but passwords and user does not then redirect back to login
    else {
      //make sticky check to see if it query contains username
      if (params.has("username")) {
        params.set('username', user_name);
        response.redirect('./login?' + params.toString());
      }
      //make sticky if params does not contain username then append it to the url
      else {
        response.redirect('./login?' + params.toString() + "&username=" + user_name);
      }
      user_error = true;
    }
  }
  //if username and password does not match then redirect back to login
  else {
    //make sticky if params has user then set the new user and redirect with the params
    if (params.has("username")) {
      params.set('username', user_name);
      response.redirect('./login?' + params.toString());
    }
    //if params does not contain username then append it to the URL
    else {
      response.redirect('./login?' + params.toString() + "&username=" + user_name);
    }
    //global variable to make user_error true
    user_error = true;
  }

});


app.post("/invoice", function (req, res, next) {
  //get the query string
  let params = new URLSearchParams(req.query);
  //let the username be the params of username
  let user_name = params.get("username");

  let arry = []
  params.forEach(function (value, key) {
    arry.push(value);
  })
  res.write(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="../style.css">
      <script src="./products.js" type="text/javascript"></script>
      <title>Invoice</title>
      
  </head>
  <header>
  <span id="purple">
      <p>
          <span style="color:#FF0000">B</span>
          <span style="color:#66CC66">E</span>
          <span style="color:#FF9966">T</span>
          <span style="color:#FFCCCC">T</span>
          <span style="color:#FF0066">A</span>
      </p>
      <img src="./images/bob.png">
  </span>
</header>

  <body style = "position: relative;">
  <h1 style = "text-align: center;">Thank you ${users[user_name].fullname} for your purchase!</h1>
  <table border= "5em"; style = "margin-left: auto; margin-right: auto; margin-top: 100px; height: 400px">
  <tr>
  <th style = "text-align: center; width: 43%">Item</th>
  <th style = "text-align: center; width: 11%">Quantity</th>
  <th style = "text-align: center; width: 13%">Price</th>
  <th style = "text-align: center; width: 54%">Extended Price</th>
  </tr>
  `);

  //define variable called subtotal
  var subtotal = 0;

  //define tax_rate variable and assign it 
  var tax_rate = .0575;
  for (var i = 0; i < products_array.length; i++) {
    var extended_price = arry[i] * products_array[i].price;
    subtotal += extended_price;

    //if no quantity then dont write table
    if (arry[i] == 0) {
      continue
    }

    //write the table
    else {
      products[i].quantity_available -= arry[i];
      // products_array[i].quantity_available -= arry[i]
      res.write(`
      <tr>
      <td style = "text-align: center; width: 43%">${products_array[i].name}</td>
      <td style = "text-align: center; width: 13%">${arry[i]}</td>
      <td style = "text-align: center; width: 13%">$${(products_array[i].price).toFixed(2)}</td>
      <td style = "text-align: center; width: 54%">$${extended_price.toFixed(2)}</td>
      </tr>

    `)
    }
  }

  //writing all the subtotal, ,tax , shipping, and total
  res.write(`   
  <tr><td colspan = "4" width = "100%">&nbsp;</td><tr>
  <tr>
  <td style = "text-align: center;" colspan = "3"; width = "67%">Sub-total</td> 
  <td width = "54%;" style = "text-align: center;">$${subtotal.toFixed(2)}</td>
  </tr>
  <tr>
  <td style = "text-align: center;" colspan = "3"; width = "67%">Tax @ ${(tax_rate * 100).toFixed(2)}%</td> 
  <td width = "54%;" style = "text-align: center;">$${(subtotal * tax_rate).toFixed(2)}</td>
  </tr>
  <tr>
  <td style = "text-align: center;" colspan = "3"; width = "67%">Shipping</td> 
  <td width = "54%;" style = "text-align: center;">$${generateShipping(subtotal).toFixed(2)}</td>
  </tr>
  <tr>
  <td style = "text-align: center;" colspan = "3"; width = "67%">Total</td> 
  <td width = "54%;" style = "text-align: center;">$${(subtotal + (subtotal * tax_rate) + generateShipping(subtotal)).toFixed(2)}</td>
  </tr>
  </table>  
  <br>
  <br>
  <b><p style = "text-align: center">
  OUR SHIPPING POLICY IS:A subtotal $0 - $49.99 will be $2 shipping
  A subtotal $50 - $99.99 will be $5 shipping
  Subtotals over $100 will be charged 5% of the subtotal amount
</p>
<br>

</p></b>

  </body>
  </html>
  <button onclick = "window.location = 'index.html'"; style = "display: block; margin-left: auto; margin-right: auto; margin-top: 20px; background-color: black; color: white; height: 50px; width: 100px; border-radius: .4em; cursor: pointer;">Logout</button>
  `);
  res.end();
  data2 = JSON.stringify(products);
  //write to the file for products.json for updating the quantities
  fs.writeFileSync(pname, data2, 'utf-8');
  next();
  
})

//listen on 8080
app.listen(8080, () => console.log("listening  on port 8080"));