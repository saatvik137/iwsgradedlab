const http = require('http') ;
const express = require('express');
const path = require('path');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const fs = require('fs'); 
const firebase = require('firebase-admin');
const serviceAccount = require('./seviceKey.json');
const port = process.env.PORT || 3000 ; 

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://iwsgradedlab.firebaseio.com"
});

var db = firebase.database();
var ref = db.ref("studentData");


const app = express();

// Handlebars Middleware
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    console.log("home get req") ; 
  const title = 'Saatvik Upadhyay ';
  res.render('index', {
    title: title
  });
});


app.get('/form' , ( req , res)=>{
    console.log("display form") ;
    res.render('form') ;
}) ;

app.get('/formSearch' , (req, res) => {
  console.log("display search form") ;
  res.render('searchForm') ; 
}) ;

app.post('/formSearch',(req,res) =>{
  console.log(req.body) ;

  ref.child(req.body.rollnu).on("value", function(snapshot) {
    console.log(req.body.rollnu) ;
    console.log("result") ;
    //console.log(snapshot) ;
    console.log(snapshot.val());
    
    const data = JSON.stringify(snapshot.val()) ;
    res.render('searchResult', {data : data}) ; 
    
    // snapshot.forEach(function(data) {
    //     console.log(data.key);
    // });
});
 // res.redirect('/') ; 
  //now search for roll number in DB  ; 

}) ;

app.get('/formSubmitted' , ( req , res)=>{
    console.log("display formSubmit") ;
    res.render('formSubmitted') ;
}) ;

app.get('/migrateFilesToDb',(req,res)=>{
const files = fs.readdirSync("data");
const path = require('path');

for(var i in files) {
   if(path.extname(files[i]) === ".txt") {
      console.log(files[i]) ; 
    var j = files[i] ;     
    //do something

    var content;
    // First I want to read the file
    fs.readFile(j,"utf8", function read(err, data) {
        if (err) {
            throw err;
        }
        content = data;
    
        // Invoke the next step here however you like
        console.log(content); 
        console.log(typeof content) ;
        var da = JSON.parse(content) ; 
        console.log(da.fname) ; 
        saveToDb(da) ; 
        console.log("file has been added to DB with name of student " + da.fname) ; 
        
        // Put all of the code here (not the best solution)
                // Or put the next step in a function and invoke it
    });
    
   }
}
res.render('fileMigrated') ;

}) ;

app.post('/formSubmitAjax',(req,res)=>{
  console.log("form submit kar diya") ;
  console.log(typeof req.body) ;
  console.log(req.body.fname) ;
  
  saveToDb(req.body) ;
  savetoFile(req.body) ; 
  res.redirect('/formSubmitted') ;

}) ;



app.post('/formSubmit',(req,res)=>{
    console.log("form submit kar diya") ;
    //console.log(req.body) ;
    console.log(req.email) ;
    const newEntry = req.body ; 
    savetoFile(req.body) ;   
    saveToDb(req.body) ; 
    // const newEntry = {
    //     x : req.body.x  //aise karke bana lena hai object jo file me save hoga 
    // };
    res.redirect('/formSubmitted') ;

}) ;
// About Route
app.get('/about', (req, res) => {
  res.render('about');
});


function savetoFile(formEntry){
    console.log("form entry k andar aa gaye bro") ;
    console.log(formEntry) ;
    const email = formEntry.email ;
    console.log(email) ; 

    const name = formEntry.fname + formEntry.lname +'.txt' ;
    
    console.log("name is " + name) ; 

    const data = JSON.stringify(formEntry) ;
    
    fs.appendFile(name,data, function (err) {
        if (err) throw err;
        console.log('Saved!');
      });


    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'su370@snu.edu.in',
          pass: '' //enter your password
        }
      });
      

      var mailOptions = {
        from: 'su370@snu.edu.in',
        to: email ,
        subject: 'Form Submission has been recieved',
        text: 'We have recieved your form and have added it here , your form is ' + data 
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}



function saveToDb(formEntry){
    console.log("saving to DB") ; 
    var usersRef = ref.child(formEntry.rollnu); 
    usersRef.set(formEntry) ;
}

app.listen(port, () =>{
  console.log(`Server started on port ${port}`);
});