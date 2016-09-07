var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8080);
server.on('error', onError);
server.on('listening', onListening);



app.get('/', function(req, res)
{
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function (socket)
{
    console.log('new user connected');

    io.emit('join', 'user ' + socket.id + ' has joined');

    socket.on('chat message', function(msg)
    {

        // send message to all the socket connected except the sender
        //socket.broadcast.emit('broadcast', msg);


        // send message to all the socket connected
        //io.emit('broadcast', msg);


        //process data before send back to client
        // send message to a specific socket id
        io.to(socket.id).emit('broadcast', processMessage(msg));

    });


    socket.on('from android', function(msg)
    {
        io.emit('to android', 'Echo from server' +  msg);

    });


    socket.on('typing', function()
    {
        //console.log('user is typing');
        socket.broadcast.emit('usertyping', 'user is typing');

    });


    socket.on('disconnect', function()
    {
      console.log('a user disconnected');
    });

});





function processMessage(message)
{
    return 'From server: ' + message;
}



function onError(error)
{
  if (error.syscall !== 'listen')
  {
    throw error;
  }

  var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;


  switch (error.code)
  {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening()
{
  var addr = server.address();
  var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;

}

module.exports = app;
