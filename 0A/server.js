const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(express.static(__dirname));

// Set up middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Set up middleware to store sessions in memory
const session = require('express-session');
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Set up routes and handling for HTTP requests here

app.post('/server-route', (req, res) => {
    // Retrieve the value of the checkbox from the request body
    const checkboxValue = req.body.checkboxValue;
  
    // Store the value of the checkbox in the user's session
    req.session.checkboxValue = checkboxValue;
    console.log(checkboxValue)
  
    // Send a response to the client
    res.send('Checkbox value received and stored in session');
  });

  app.get('/another-server-route', (req, res) => {
    // Retrieve the query parameter
    const values = req.query.values;
 
    // Render a new HTML page with the checked values
    res.send(`
       <!DOCTYPE html>
       <html lang="en">
       <head>
          <meta charset="UTF-8">
          <title>Checked Values</title>
       </head>
       <body>
          <h1>Checked Values:</h1>
          <p>${values}</p>
       </body>
       </html>
    `);
 });

  app.listen(8080, () => {
    console.log('Express server listening on port 8080');
  });
