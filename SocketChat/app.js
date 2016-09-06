var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);


server.listen(3100);
server.on('error', onError);
server.on('listening', onListening);



app.get('/', function(req, res)
{
  res.sendFile(__dirname + '/index.html');
});



io.on('connection', function (socket)
{

    console.log('user connect');


    io.emit('join', 'user ' + socket.id + ' has joined');


    socket.on('chat message', function(msg)
    {
      //console.log('message: ' + msg);

      socket.broadcast.emit('broadcast', msg);

    });


    socket.on('typing', function()
    {
      //console.log('user is typing');

      socket.broadcast.emit('usertyping', 'user is typing');

    });


    socket.on('disconnect', function()
    {
      console.log('user disconnected');
    });

});









function onError(error)
{
  if (error.syscall !== 'listen')
  {
    throw error;
  }

  var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

  // handle specific listen errors with friendly messages
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
