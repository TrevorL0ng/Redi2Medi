const path = require('path');
const express = require('express');
// Import express-session. Get over here.
const session = require('cookie-session');
const sequelize = require('./config/connection');
const exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var moment = require('moment');
const helpers = require('./utils/helpers');
const routes = require('./controllers');
// const SequelizeStore = require('connect-session-sequelize')(session.Store);
const app = express();
const PORT = process.env.PORT || 3001;

const sess = {
  secret: 'Super secret secret',
//   cookie: {},
  resave: false,
  saveUninitialized: true
//   store: new SequelizeStore({
//     db: sequelize,
//   }),
};

app.use(session(sess));

const hbs = exphbs.create({ helpers });

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);

sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log('Now listening'));
});


// Display reminder page
app.get('/', function(req, res) {
    // we can put minimum amount of hours from now on for the reminder for example 1 hour
    var defaultDT = moment().add({hours:1, minutes:0});
    res.render('home', {
        date : defaultDT.format('Y-MM-DD'),
        time : defaultDT.format('HH:mm')
    });
});

// Process an incoming reminder
app.post('/schedule', function(req, res) {
    
    // Check if user has provided input for all form fields
    if (!req.body.name || !req.body.medication || !req.body.remname || !req.body.number || !req.body.date || !req.body.time
        || req.body.name == '' || req.body.medication == '' || req.body.remname == '' || req.body.number == '' 
        || req.body.date == '' || req.body.time == '') {
            // If no, throw an error
            res.render('home', {
                error : "Please fill all required fields!",
                name : req.body.name,
                medication : req.body.medication,
                remname: req.body.remname,
                number: req.body.number,
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
        res.render('home', {
            error : "You can only schedule reminder that are at least 1 hour in the future!",
            name : req.body.name,
            medication : req.body.medication,
            remname: req.body.remname,
            date : req.body.date,
            time : req.body.time
        });
        return;
    }

    // Check if phone number is valid
    redi2medi.lookup.read(req.body.number, process.env.COUNTRY_CODE, function (err, response) {
      console.log(err);
      console.log(response);

      if (err && err.errors[0].code == 21) {
          // This error code indicates that the phone number has an unknown format
          res.render('home', {
              error : "You need to enter a valid phone number!",
              name : req.body.name,
              treatment : req.body.treatment,
              number: req.body.number,
              date : req.body.date,
              time : req.body.time
          });
          return;
      } else
      if (err) {
          // Some other error occurred
          res.render('home', {
              error : "Something went wrong while checking your phone number!",
              name : req.body.name,
              treatment : req.body.treatment,
              number: req.body.number,
              date : req.body.date,
              time : req.body.time
          });
      } else
      if (response.type != "fixed line or mobile") {
          // The number lookup was successful but it is not a mobile number
          res.render('home', {
              error : "You have entered a valid phone number, but it's not a mobile number! Provide a mobile number so we can contact you via SMS.",
              name : req.body.name,
              treatment : req.body.treatment,
              number: req.body.number,
              date : req.body.date,
              time : req.body.time
          });
      } else {
          // Everything OK


     
   
   // SMS notification that I found in one of the tutorials

             // Schedule reminder 1 hour 
             var appDT = appointmentDT.clone().subtract({hours: 1});

             // Send a reminder 
        
             redi2medi.messages.create({
                 originator : "REDI2MEDI",
                 recipients : [response.phoneNumber],
                 scheduledDatetime : appDT.format(),
                 body : req.body.name + ", here's a reminder that you have a " + req.body.medication + " scheduled for " + appointmentDT.format('HH:mm') + ". Thank you for using Redi2Medi"
             }, function (err, response) {
                 if (err) {
                     // Request has failed
                     console.log(err);
                     res.send("Error occured while sending message!");
                 } else {
                     // Request was successful
                     console.log(response);

                     // Create and persist reminder object
                     var app = {
                         name : req.body.name,
                         medication : req.body.medication,
                         remname: req.body.remname,
                         number: req.body.number,
                         appointmentDT : appointmentDT.format('Y-MM-DD HH:mm'),
                         appDT : appDT.format('Y-MM-DD HH:mm')
                     }
                     ReminderDatabase.push(app);
    
                     // Render confirmation page
                     res.render('confirm', app);    
                    }
                  });
              }     
            });
      });

     

// sequelize.sync({ force: false }).then(() => {
//   app.listen(PORT, () => console.log('Now listening'));
// });  


