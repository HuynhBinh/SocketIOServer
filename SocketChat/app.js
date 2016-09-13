var app = require('express')();
var sql = require('mssql');
var cluster = require('cluster');
var sticky = require('sticky-session');

var server = require('http').Server(app);


if (!sticky.listen(server, 8080))
{
    // Master code
    server.once('listening', function()
    {
        console.log('server started on 3000 port');
    });
}
else
{
    var io = require('socket.io')(server);

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

}




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


function processMessage(message, sid, callback)
{
    var username = message;

    var connection = new sql.Connection('mssql://sa:sa@1234@203.113.143.247/StackExchange');

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
