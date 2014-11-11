var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');
// bind the socket object to the http server so's dat we can be real-time
var io = require('socket.io').listen(server);
var _ = require('underscore');
var moment = require('moment');

// This is where we'll store the chat user's names.
var participants = [];

// This is where the messages will be stored for data persistence.
var messages = [];

// Tell http/socket.io the door to which they should put their ear.
server.listen(3000);

// function to store messages for data persistence
var storeMessage = function(name, data) {
    messages.push({
        name: name,
        data: data,
        time: moment().format('h:mm')
    });
    console.log(messages.length + " messages stored");
    console.log(_.last(messages));
};

// Set the view engine to Jade.
app.set('view engine', 'jade');

// This tells express where lives the CSS and JS.
app.use(express.static('public', __dirname + '/public'));

// Tells server to support JSON requests using the bodyParser library.
app.use(bodyParser.json());

/* Server routing */

// This is an Express GET method with a callback function 
// to render the index. it'll look in views and serve index.jade.
app.get('/', function(request, response) {
    response.render('index');
});

// This is an Express POST method to create a new chat message.
app.post('/message', function(request, response) {

    // The request body expects a param named "message".
    var message = request.body.message;
    var name = request.body.name;

    // This function tells the client that a message is coming. It
    // passes the message and the name of the user as JSON.
    io.sockets.emit('incomingMessage', {
        message: message,
        name: name,
        time: moment().format('h:mm')
    });

    // Looks good, let the client know
    response.json(200, {
        message: 'Message received'
    });
    storeMessage(name, message);
});



// Socket.IO events
io.on('connection', function(socket) {

    /*
    When a new user connects to our server, we expect an event called "newUser"
    and then we'll emit an event called "newConnection" with a list of all 
    participants to all connected clients
    */
    socket.on('newUser', function(data) {
        participants.push({
            id: data.id,
            name: data.name
        });
        io.sockets.emit('newConnection', {
            participants: participants,
            messages: messages
        });
        console.log("a new user has joined");
    });

    /*
    When a user changes their name in the client, we are expecting an event called "nameChange". 
    When the server hears this even, it will emit an event called "nameChanged" to all participants with
    the id and new name of the user who emitted the original message
    */
    socket.on('nameChange', function(data) {
        _.findWhere(participants, {
            id: socket.id
        }).name = data.name;
        io.sockets.emit('nameChanged', {
            id: data.id,
            name: data.name
        });
    });

    /* 
    When a client disconnects from the server, the event "disconnect" is automatically 
    captured by the server. It will then emit an event called "userDisconnected" to 
    all participants with the id of the client that disconnected
    */
    socket.on('disconnect', function() {
        participants = _.without(participants, _.findWhere(participants, {
            id: socket.id
        }));
        io.sockets.emit('userDisconnected', {
            id: socket.id,
            sender: 'system'
        });
        console.log("a user has left the chat");
    });

});

// Start the http server at port and IP defined before
server.listen(app.get('port'), app.get('ipaddr'), function() {
    console.log("Server up and running at localhost:3000");
});