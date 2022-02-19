// Load dependencies
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var moment = require('moment');
const PORT = process.env.PORT || 3001;

// initialize redi2medi SDK
var redi2medi = require('redi2medi')(process.env.REDI2MEDI_API_KEY);

// Reminder database
var ReminderDatabase = [];

// Express framework configuration
var app = express();
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended : true }));

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
    if (!req.body.name || !req.body.medication || !req.body.remname || !req.body.date || !req.body.time
        || req.body.name == '' || req.body.medication == '' || req.body.remname == ''
        || req.body.date == '' || req.body.time == '') {
            // If no, throw an error
            res.render('home', {
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

     
   // The push notification logic should go here, below is just example of a the logic for 
   // SMS notification that I found in one of the tutorials

            // Schedule reminder 1 hour 
            var appDT = appointmentDT.clone().subtract({hours: 1});

            // Send a reminder 
         
            redi2medi.messages.create({
                originator : "REDI2MEDI",
                recipients : [ ],
                scheduledDatetime : appDT.format(),
                body : req.body.name + ", here's a reminder that you have a " + req.body.medication + " scheduled for " + appointmentDT.format('HH:mm') + ". See you soon!"
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
                        appointmentDT : appointmentDT.format('Y-MM-DD HH:mm'),
                        appDT : appDT.format('Y-MM-DD HH:mm')
                    }
                    ReminderDatabase.push(app);
    
                    // Render confirmation page
                    res.render('confirm', app);    
                }
            });
        }     
      );


      

// Start the application
app.listen(PORT, () => {
    console.log(`API server now on port ${PORT}!`)
});