var app = require('express')();
var server = require('http').createServer(app);
var io = require ('socket.io').listen(server);

var sql = require('mssql');

var sticky = require('socketio-sticky-session');

//var redis = require('socket.io-redis');
//io.adapter(redis({ host: 'localhost', port: 6379 }));


var PORT = 8080;
var SQLConnection = 'mssql://sa:sa@1234@203.113.143.247/StackExchange';

var OnConnection = 'connection';
var OnChat = 'chat message';
var OnTyping = 'typing';
var OnDisconnect = 'disconnect';
var OnAndroidSentData = 'from android';

var EmitSocketJoin = 'join';
var EmitBroadcast = 'broadcast';
var EmitSendDataToAndroid = 'to android';
var EmitUserXisTyping = 'usertyping';

var options =
{
    proxy: false, //activate layer 4 patching
    header: 'x-forwarded-for', //provide here your header containing the users ip
    num: 4,
    sync:
    {
        isSynced: true, //activate synchronization
        event: 'mySyncEventCall' //name of the event you're going to call
    }
}


sticky(server).listen(PORT, function()
{
    console.log('server started on port: ' + PORT + ' - Process: ' + process.pid);
});


app.get('/', function (req, res)
{
    res.sendFile(__dirname + '/index.html');
});


io.on(OnConnection, function (socket)
{
    console.log(socket.id + ' connected');

    io.emit(EmitSocketJoin, socket.id + ' connected to process ' + process.pid);

    socket.on(OnChat, function (msg)
    {
        // send message to all the socket connected except the sender
        //socket.broadcast.emit('broadcast', msg);

        //process data before send back to client
        processMessage(msg, socket.id, function(data)
        {
            //console.log(data);
            // send message to a specific socket id
            io.to(socket.id).emit(EmitBroadcast, data);
        });

    });

    socket.on(OnAndroidSentData, function (msg)
    {

        processMessage(msg, function(data)
        {
            console.log(data);
            io.emit(EmitSendDataToAndroid, data);
        });

    });

    socket.on(OnTyping, function ()
    {
        socket.broadcast.emit(EmitUserXisTyping, socket.id + ' is typing');

    });

    socket.on(OnDisconnect, function ()
    {
        console.log( socket.id + ' disconnected');
        io.emit(EmitSocketJoin, socket.id + ' disconnected');
    });

});


// cluster without Sticky-Session

/*if(cluster.isMaster)
{
    var numWorkers = 2;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');

    for(var i = 0; i < numWorkers; i++)
    {
        cluster.fork();
    }

    cluster.on('online', function(worker)
    {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal)
    {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });

}
else
{
    var app = require('express')();
    var server = require('http').Server(app);
    var io = require('socket.io')(server);

    server.listen(8080);

    app.get('/chat', function (req, res)
    {
        res.sendFile(__dirname + '/index.html');
    });


    io.on('connection', function (socket)
    {

        console.log(socket.id + ' connected');

        io.emit('join', socket.id + ' connected to ' + process.pid);

        socket.on('chat message', function (msg)
        {

            // send message to all the socket connected except the sender
            //socket.broadcast.emit('broadcast', msg);


            //process data before send back to client
            // send message to a specific socket id
            processMessage(msg, socket.id, function(data)
            {
                console.log(data);
                io.to(socket.id).emit('broadcast', data);
            });


        });


        socket.on('from android', function (msg)
        {

            processMessage(msg, function(data)
            {
                console.log(data);
                io.emit('to android', data);
            });

        });

        socket.on('typing', function ()
        {
            socket.broadcast.emit('usertyping', 'user is typing');

        });


        socket.on('disconnect', function ()
        {
            console.log( socket.id + ' disconnected');
            io.emit('join', socket.id + ' disconnected');
        });

    });
}*/

// cluster without Sticky-Session


// Test method
function processMessage(message, sid, callback)
{
    var username = message;

    var connection = new sql.Connection(SQLConnection);

    var myBox;

    connection.connect(function (err)
    {
        if (err)
        {
            callback(err);
        }

        var request = new sql.Request(connection);

        request.input("username", sql.NVarChar(20), username);

        request.execute("user_UserGet").then(function (recordsets)
        {

            if (recordsets.length > 1)
            {
                var tblUser = recordsets[0];
                var row0 = tblUser[0];

                var uname = row0.Username;
                var email = row0.Email;


                myBox =
                {
                    name: uname,
                    email: email,
                    pro: process.pid,
                    id: sid
                };

                callback(myBox);
            }
            else
            {
                myBox =
                {
                    name: 'default',
                    email: 'default@email.com',
                    pro: process.pid,
                    id: sid
                };

                callback(myBox);
            }
        });
    });
}


module.exports = app;
