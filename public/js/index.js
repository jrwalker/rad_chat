


function init() {

    var serverBaseUrl = document.domain;
    


    // On client init, try to connect to the socket.IO server
    var socket = io.connect(serverBaseUrl);

    // This will be used in the 'connect' event listener below
    var sessionId = '';

    //Helper function to update the participants' list
    function updateParticipants(participants) {
        $('#participants').html('');
        for (var i = 0; i < participants.length; i++) {
            $('#participants').append('<span id="' + participants[i].id + '">' +
                participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
        }
    }

    // Helper function to update the messages, called upon newConnection from the server
    function updateMessages(messages) {
        $('#messages').html('');
        for (var i = 0; i < messages.length; i++) {
            $('#messages').prepend('<b>' + messages[i].name + ":" + '</b><br />' + "@ " + messages[i].time + ":  " + messages[i].data + '<hr />');
        }
    }

    /*
    The server emits a "connect" event when the client connects to the server.
    This function listens for that, and then grabs the session ID so that it 
    can be logged to the console, confirming the connection for the user/developer.
    It also emits a newUser event which will be listened for by the server.
    */

    socket.on('connect', function() {
        sessionId = socket.io.engine.id;
        console.log('Connected ' + sessionId);
        socket.emit('newUser', {
            id: sessionId,
            name: $('#name').val()
        });
    });

    /*
    The 'newConnection' event is fired by the server, and this 
    function listens for it so that we can updated the list of 
    participants and blast out all of the messages to the connected
    clients.
    */
    socket.on('newConnection', function(data) {
        updateParticipants(data.participants);
        updateMessages(data.messages);
    });


    /*
    This function listens for the 'userDisconnected' event from the server.
    Each user gets appended in the DOM with a unique ID, and this function grabs them 
    by that ID and removes them.
    */
    socket.on('userDisconnected', function(data) {
        $('#' + data.id).remove();
    });

    /*
    This function listens for the 'nameChanged' event from the server.
    When it hears it, it updates the DOM element accordingly.
     */
    socket.on('nameChanged', function(data) {
        $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
    });

    /*
    This function takes the message data from the server, carried by the 
    'incomingMessage' event 
    When receiving a new chat message with the "incomingMessage" event,
    we prepend it to the messages div
    */
    socket.on('incomingMessage', function(data) {
        var message = data.message;
        var name = data.name;
        var time = data.time;
        $('#messages').prepend('<b>' + name + ":" + '</b><br />' + "@ " + time + ":  " + message +  '<hr />');
    });

    /*
    Notifies the user of a connection error between client and server.
    */
    socket.on('error', function(reason) {
        console.log('Unable to connect to server', reason);
    });

    /*
    This is an ajax call, posting the message to the server side.
    */
    function sendMessage() {
        var outgoingMessage = $('#outgoingMessage').val();
        var name = $('#name').val();
        $.ajax({
            url: '/message',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                message: outgoingMessage,
                name: name
            })
        });
    }

    /*
    This functions makes it so that the user can just press enter to send 
    their message. The user will be alerted that they must enter text if they
    try to send an empty message.
    */
    function outgoingMessageKeyDown(event) {
        if (event.which == 13) {
            event.preventDefault();
            if ($('#outgoingMessage').val().trim().length <= 0) {
                alert("Ummmm I can't send an empty message... please enter some text!");
                return;
            }
            sendMessage();
            $('#outgoingMessage').val('');
        }
    }

    /*
    Helper function to disable/enable Send button. Not sure yet why this 
    affects the Participants.
    */
    function outgoingMessageKeyUp() {
        var outgoingMessageValue = $('#outgoingMessage').val();
        $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
    }

    /*
    When a user updates his/her name, let the server know by
    emitting the "nameChange" event
    */
    function nameFocusOut() {
        var name = $('#name').val();
        socket.emit('nameChange', {
            id: sessionId,
            name: name
        });
    }

    /* Elements setup */
    $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
    $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
    $('#name').on('focusout', nameFocusOut);
    $('#send').on('click', sendMessage);

}

$(document).on('ready', init);