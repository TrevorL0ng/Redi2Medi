const path = require('path');
const express = require('express');
// Import express-session. Get over here.
const session = require('express-session');
const exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var moment = require('moment');
var mysql = require('mysql');
var connection = mysql.createConnection(process.env.JAWSDB_URL);

connection.connect();

connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
  if (err) throw err;

  console.log('The solution is: ', rows[0].solution);
});

connection.end();

connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
  if (err) throw err;

  console.log('The solution is: ', rows[0].solution);
});

connection.end();

const routes = require('./controllers');
const sequelize = require('./config/connection');
const helpers = require('./utils/helpers');

// initialize redi2medi SDK
// var redi2medi = require('redi2medi')(process.env.REDI2MEDI_API_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Set up sessions. Wow. Nice.
const sess = {
  secret: 'Super secret secret',
  resave: false,
  saveUninitialized: true,
};

app.use(session(sess));

const hbs = exphbs.create({ helpers });

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended : true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);

// Display reminder page
app.get('/', function(req, res) {
    // we can put minimum amount of hours from now on for the reminder for example 1 hour
    var defaultDT = moment().add({hours:1, minutes:0});
    res.render('login', {
        date : defaultDT.format('Y-MM-DD'),
        time : defaultDT.format('HH:mm')
    });
});

// Process an incoming reminder
app.post('/schedule', function(req, res) {
    
    // Check if user has provided input for all form fields
    if (!req.body.name || !req.body.medication || !req.body.remname || !req.body.date || !req.body.time
        || req.body.name == '' || req.body.medication == '' || req.body.remname == ''
        || req.body.date == '' || req.body.time == '') {
            // If no, throw an error
            res.render('login', {
                error : "Please fill all required fields!",
                name : req.body.name,
                medication : req.body.medication,
                remname: req.body.remname,
                date : req.body.date,
                time : req.body.time
            });
            return;
    };

    // Check if date/time is correct and at least 1 hour in the future
    var earliestPossibleDT = moment().add({hours:1, minutes:0});
    var appointmentDT = moment(req.body.date+" "+req.body.time);
    if (appointmentDT.isBefore(earliestPossibleDT)) {
        // If not, show an error
        res.render('login', {
            error : "You can only schedule reminder that are at least 1 hour in the future!",
            name : req.body.name,
            medication : req.body.medication,
            remname: req.body.remname,
            date : req.body.date,
            time : req.body.time
        });
        return;
    }

     
   // The push notification logic should go here, below is just example of a the logic for 
   // SMS notification that I found in one of the tutorials

    //         // Schedule reminder 1 hour 
    //         var appDT = appointmentDT.clone().subtract({hours: 1});

    //         // Send a reminder 
         
    //         redi2medi.messages.create({
    //             originator : "REDI2MEDI",
    //             recipients : [ ],
    //             scheduledDatetime : appDT.format(),
    //             body : req.body.name + ", here's a reminder that you have a " + req.body.medication + " scheduled for " + appointmentDT.format('HH:mm') + ". See you soon!"
    //         }, function (err, response) {
    //             if (err) {
    //                 // Request has failed
    //                 console.log(err);
    //                 res.send("Error occured while sending message!");
    //             } else {
    //                 // Request was successful
    //                 console.log(response);

    //                 // Create and persist reminder object
    //                 var app = {
    //                     name : req.body.name,
    //                     medication : req.body.medication,
    //                     remname: req.body.remname,
    //                     appointmentDT : appointmentDT.format('Y-MM-DD HH:mm'),
    //                     appDT : appDT.format('Y-MM-DD HH:mm')
    //                 }
    //                 ReminderDatabase.push(app);
    
    //                 // Render confirmation page
    //                 res.render('confirm', app);    
    //             }
    //         });
        }     
      );

     

sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log('Now listening'));
});  


