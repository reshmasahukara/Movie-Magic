const express = require("express");
const bodyParser = require("body-parser");

const ejs = require("ejs");
const path = require("path");
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
const crypto = require('crypto');


var mysql = require('mysql');

var md5 = require('md5');
const { error, Console } = require("console");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "lab"
});

con.connect(function(error) {
  if (error) throw error;
  console.log("Connected!");
});

const app = express();
app.set('view engine','ejs');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname + "/public")));


console.log(path.join(__dirname + "/public"))

app.get("/admin",function (req,res) { 
    res.render("admin");
 })
app.post("/admin",function(req,res)
{
 const username = req.body.username;
 const password = req.body.password;

 con.query(`SELECT  * FROM admin WHERE user_name = '${username}'`,function(error,results,fields){
if(error) throw error;
if (results.length>0) {
    res.redirect("admindash")
}else{
res.send({error: "Sorry inavlid details:"})
}
});
});

app.get("/usersignup",function(req,res){
    res.render("usersignup");
});

app.post("/usersignup", function(req, res) {
    const name = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const city = req.body.city;
    const contactno = req.body.contactno;

      console.log( name, email, password, city, contactno);

const hashpass = md5(password);
const longNumber = contactno;
const shortNumber = longNumber % 1000;
const longNumber2 = contactno;
const shortNumber2 = Math.floor(longNumber2 / 100000);



 const user_id = shortNumber + shortNumber2;

    console.log(user_id, name, email, password, city, contactno);
    const checkUserQuery = "SELECT COUNT(*) AS count FROM customer WHERE user_id = ?";
    con.query(checkUserQuery, [user_id], (error, result) => {
      if (error) {
        console.log(error);
        res.send({ error: "An error occurred while checking user ID" });
      } else {
        if (result[0].count > 0) {
          // user_id already exists, send error message
          res.send({ error: "User ID already exists" });
        } else {
          // user_id does not exist, insert new user data into database
          const insertUserQuery =
            "INSERT INTO customer (user_id,name, email, password,city,contact_no) VALUES (?, ?, ?,?, ?, ?)";
          con.query(
            insertUserQuery,
            [user_id, name, email, hashpass, city,  contactno],
            (error, result) => {
              if (error) {
                console.log(error);
                res.send({
                  error: "An error occurred while inserting new user data",
                });
              } else {
               console.log({ message: "User data inserted successfully" });
                const details = [];
                details.push({user_id, name, email, city,  contactno});
                console.log(details);
                
                res.render("index",{details:details});
            }
            }
          );
        }
      }
    });
  });
  


app.get("/userlogin",function(req,res){
res.render("userlogin");
  });

  app.post("/userlogin",function(req,res){
    const email = req.body.email;
    const password = md5(req.body.password);

    const query = `SELECT * FROM customer WHERE email='${email}' AND password='${password}'`;
    con.query(query, function (error, results, fields) {
        if (error) throw error;
        console.log(results)
        if (results.length > 0) {
         
          res.json({details:results});

        } 
        else {
          res.status(404).json("User Not Found");
        }
    });
  });
  
  app.get('/admindash', (req, res) => {
    const getuserdetails = 'SELECT * from customer';
    const getmoviedetails = 'SELECT * from movie';
    const gettheaterdetails = 'SELECT  * from theater';
   const getshowsdetails = 'SELECT * FROM SHOWS';
    con.query(getuserdetails, (error, customers) => {
      if (error) {
        console.error(error);
        return;
      }
  
      con.query(getmoviedetails, (error, movies) => {
        if (error) {
          console.error(error);
          return;
        }
  
        con.query(gettheaterdetails, (error, theater) => {
          if (error) {
            console.error(error);
            return;
          }
        con.query(getshowsdetails,(error,shows)=>{
          if (error) {
            console.error(error);
            return;
          }
       
          const details = {
            customers: customers,
            movies: movies,
            theater: theater,
            shows : shows
          };
        console.log(details)
          res.render('admindash', { details: details });
        });
        });
      });
    });
  });
  


  app.post('/admindash/removeMovie', function(req, res) {
    var movie_id = req.body.movieId;
    var theater_id = req.body.theaterId;
    var screen_id  = req.body.showId;
    const deleteShowsQuery = `DELETE FROM shows WHERE screen_id = '${screen_id }'`;
    con.query(deleteShowsQuery, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
    });
  
    const deleteMovieQuery = `DELETE FROM theater1 WHERE  movie_id = ${movie_id} AND theater_id = ${theater_id}`;
    con.query(deleteMovieQuery, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.redirect('/admindash');
  


    const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = '${movie_id}'`;
    con.query(deleteMovieQuery, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
    });
     
    });
  });
  
  
  

  app.post('/admindash/theaterandmoviedetails', (req, res) => {
    const theaterId = req.body.theaterId;
    console.log('sql running 1 ');
    const query = `
      SELECT movie.movie_id, movie.movie_name, movie.status
      FROM theater1
      JOIN movie ON theater1.movie_id = movie.movie_id
      WHERE theater1.theater_id = ${theaterId}
    `;
    console.log('sql running 2');
  
    con.query(query, (err, results) => {
      if (err) throw err;
      console.log(results);
      res.render( 'admindash',{ results: results }); 
      
      
    });
  });
  


  app.post('/movie/:movieId', function(req, res) {
    var movie_id = req.params.movieId;
   console.log(movie_id)
  const theaterselect =  `SELECT *
  FROM theater
  JOIN theater1 ON theater.theater_id = theater1.theater_id
  WHERE theater1.movie_id = '${movie_id}'
  `
  const shows = `SELECT *  FROM shows where  movie_id = '${movie_id}'`
  con.query(theaterselect, (error, result) => {
    if (error) {
      console.error(error);
      return;
    }

    con.query(shows, (error, shows) => {
      if (error) {
        console.error(error);
        return;
      }

      const info = {
        result: result,
        shows: shows
      };
      console.log(info)
      
      res.render('theatersandshow', { info: info});
    });
  });

   
  });
  
app.get("index",function (res,req) {
  res.render("index");
  });


app.post('/admindash/removeCustomer', function(req, res) {
    var email = req.body.customeremail;
    console.log(email)
    const deletequery = `DELETE FROM customer WHERE email = '${email}'`;
    con.query(deletequery, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.redirect('/admindash');
    });
  });
  app.post("/admindash/addMovie", function(req, res) {
    console.log(req.body);

    var movie_id = req.body.movieId;
    var movie_name = req.body.movieName;
    var movie_rating = req.body.movieRating;
    var movie_dimensions = req.body.movieDimensions;
    var Genre = req.body.movieGenre;
    var status = req.body.movieStatus;
    var Description = req.body.movieDescription;
    var language = req.body.movieLanguage;
    var theater_id = req.body.theaterId;
    var timmings = req.body.Timmings;
    var show_date = req.body.showdate;
    var screen_no = req.body.screenno;
    var screen_dimensions = req.body.screendimensions;
    var no_of_seats = req.body.noofseats;
    var selected_seats = req.body.selectedseats;
    const query = `SELECT COUNT(*) as count FROM movie WHERE movie_id = '${movie_id}'`;
    con.query(query, function(error, results, fields) {
      if (error) {
        throw error;
      }
      const count = results[0].count;
      if (count === 0) {
        // If movie is not present, add it to the database
        const insertmovie = "INSERT INTO movie (movie_id,movie_name, movie_rating, movie_dimensions,Genre,status,Description,language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        con.query(insertmovie, [movie_id, movie_name, movie_rating, movie_dimensions, Genre, status, Description, language], function(error, results, fields) {
          if (error) {
            throw error;
          }
          console.log('Movie added successfully to the database');
  
          const inserttheater = "INSERT INTO theater1 (theater_id, movie_id) VALUES (?, ?)";
          con.query(inserttheater, [theater_id,movie_id], function(error, results, fields) {
            if (error) {
              throw error;
            }
            console.log('Theater details added successfully to the database');
  
            const insertShow = "INSERT INTO shows (movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats,selected_seats) VALUES (?, ?, ?, ?, ?, ?, ?,?)";
            con.query(insertShow, [movie_id, theater_id, timmings, show_date, screen_no, screen_dimensions, no_of_seats,selected_seats], function(error, results, fields) {
              if (error) {
                throw error;
              }
              console.log('Show details added successfully to the database');
              res.redirect('/admindash');
            });
          });
        });
      } else {
        console.log('Movie already present in the database');
        res.redirect('/admindash');
      }
    });
  });
  


app.post("/logout",function (req,res) {
    res.redirect("admin");
  });


  
app.get("/moviesdash",function(req,res){
  const showmovie = 'SELECT * from movie';
  con.query(showmovie,(error,movies) => {
    if(error)
    {
      res.send({
        error: "An error occurred while showing movies",
      });
    }else{
      res.render('moviesdash',{movies:movies});
    }
  });
});


app.get("/seats",function(req,res){
res.render("seats");

});
app.post('/seats', (req, res) => {
  const booking = {
    screenid: req.body.screenid,
    user_id: req.body.user_id,
    noofseats: req.body.noofseats,
    seats: req.body.seats,
    price: req.body.price
  };

  const sqlqueryseats =  `SELECT * FROM shows WHERE screen_id = ${booking.screenid}`;
  con.query(sqlqueryseats, function (error, results, fields) {
    if (error) throw error;
    if (results.length > 0) {
      const existingBooking = results[0];

      const updateSql = `UPDATE shows SET selected_seats = JSON_MERGE_PRESERVE(selected_seats, '${JSON.stringify(booking.seats)}') WHERE screen_id = ${existingBooking.screen_id}`;

      con.query(updateSql, function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        console.log('Seats updated successful in  !');
      });
    } 
  });


  console.log(booking);
  const selectSql = `SELECT * FROM bookings WHERE screen_id = ${booking.screenid} AND user_id = ${booking.user_id}`;
  con.query(selectSql, function (error, results, fields) {
    if (error) throw error;
    if (results.length > 0) {
      const existingBooking = results[0];

      const updateSql = `UPDATE bookings 
      SET no_of_seats = ${existingBooking.no_of_seats + booking.noofseats},
          selected_seats = JSON_MERGE_PRESERVE(selected_seats, '${JSON.stringify(booking.seats)}'),
          price = ${existingBooking.price + booking.price} 
      WHERE id = ${existingBooking.id}`;



      con.query(updateSql, function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        res.status(200).send('Seats booked successful!');
      });
    } else {
      const sql = `INSERT INTO bookings (screen_id, user_id, no_of_seats, selected_seats, price) VALUES (${booking.screenid}, ${booking.user_id}, ${booking.noofseats}, '[${booking.seats}]', ${booking.price})`;
      con.query(sql, function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        res.status(200).send('Seats booked successful!'); 
        res.render("success")
      });
    }
  });  
});


app.get('/getseats' , function(req,res){

  const screen_id = req.header('screen_id')
  console.log(screen_id)

  const sqlqueryseats =  `SELECT selected_seats FROM shows WHERE screen_id = ${screen_id}`;
  con.query(sqlqueryseats, function (error, results, fields) {
    if (error) throw error;
    console.log(results)

    if(results){
      res.status(200).send(results); 

    }
  });
  


} )


app.post('/shows/:screen_id', function(req, res) {

  var screen_no = req.params.screen_id;


res.render("seats");


  });
     
  app.get("/success",function(req,res){

     localStorage.setItem("sanju" , "hio")
     let seats = localStorage.getItem("selectedSeats")
     console.log(seats)
    res.render("success");
    
    });


    app.post("/success",function(req,res){

      console.log(req.body)

      const selectedSeats = req.body.selectedSeats

      if (selectedSeats){
        res.json(selectedSeats)
        console.log(selectedSeats)
      }
   
     
     });
 

     app.get("/theaterdetails",function(req,res){
    const theaterid = req.header('theater_id')

    const theaterdata = `SELECT * FROM theater WHERE theater_id = ${theaterid}`;
    const showsdata = `SELECT * FROM shows WHERE theater_id = ${theaterid}`;

    con.query(theaterdata, (error, theater) => {
      if (error) {
        console.error(error);
        return;
      }
  
      con.query(showsdata, (error, shows) => {
        if (error) {
          console.error(error);
          return;
        }
  
        const info = {
          theater: theater,
          shows: shows
        };
        console.log(info)
        res.json(info);
        // res.render('theaterdetails', { info: info});
      });
    });
    
     });
     

 app.get("/index",function(req,res){
  res.render("index");
 })
  
app.get("/profile/:userid",function(req,res){

  const userid = req.params.userid

  const getdeatils = `select * from customer where user_id = ${userid}`;
  con.query(getdeatils, (error,result) =>{
    if (error) {
      console.error(error);
      return;
    }
  res.render("profile" ,{result:result})
})
})

app.get("/success/:userid/:screenid",function (req,res) {

  const userid = req.params.userid;
  const screenid = req.params.screenid;

  const showsuccess  = `select * from bookings where user_id = ${userid} AND screen_id = ${screenid}`;


  con.query(showsuccess,(error,success)=> {
    if (error) {
      console.error(error);
      return;
    }

 res.render("success" ,{success:success})
  });

  });




app.listen(3000,function(){
    console.log('Server started on port 3000');
});
