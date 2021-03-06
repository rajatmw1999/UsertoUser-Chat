var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var moment = require('moment');
const { send } = require('process');
// var cors = require('cors');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
// app.use(cors())
var Message = mongoose.model('Message',{
  id:String,
  user1:String,
  user2:String,
  messages:[
    {
      mid:String,
      name:String,
      message:String,
      date:String,
      time:String
    }
  ]
})

var UserChats = mongoose.model('userchats',{
  id:String,
  user:String,
  chats:[
    {
      user2:String
    }
  ]
})

mongoose.connect("mongodb+srv://admin:admin@cluster0-nbxxl.mongodb.net/chatms?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology:true});

app.get('/messages/:userid1/:userid2', (req, res) => {

  const messageId = req.params.userid1 + ',' + req.params.userid2;

  Message.findOne({id:messageId},(err, messages)=> {
    if(messages)
    res.send(messages.messages);
    else
    res.send(null);
  })
})

app.post('/messages/:userid1/:userid2', async (req, res) => {
  const messageId = req.params.userid1 + ',' + req.params.userid2;
  var sendingGuy= messageId.substr(0, messageId.indexOf(','));
  var sendingGuy2= messageId.substr(messageId.indexOf(',') +1, messageId.length);
  var name = req.body.name;
  var msg = req.body.message;

  UserChats.findOne({user:sendingGuy}, async(err, found)=> {
    if(err)
      console.log(err);
    var flag = -1;
    if(!found)
    {
      var newChat = new UserChats({
        user:sendingGuy,
        chats:[
          {
            user2:sendingGuy2
          }
        ]
      });
      newChat.save();
    }
    else{
      found.chats.forEach(function(c){
        if(c.user2===sendingGuy2)
        {
          flag=1;
        }
      });  
      if(flag===-1)
      {
        found.chats.push({
          user2:sendingGuy2
        });
        found.save();
      }
    }
    
  });

  UserChats.findOne({user:sendingGuy2}, async(err, found)=> {
    if(err)
      console.log(err);
    var flag = -1;
    if(!found)
    {
      var newChat = new UserChats({
        user:sendingGuy2,
        chats:[
          {
            user2:sendingGuy
          }
        ]
      });
      newChat.save();
    }
    else{
      found.chats.forEach(function(c){
        if(c.user2===sendingGuy)
        {
          flag=1;
        }
      });
      if(flag===-1)
      {
        found.chats.push({
          user2:sendingGuy
        });
        found.save();
      }
    }
     
  });


  if((sendingGuy!=name)&&(sendingGuy2!=name))
  {
    console.log('Invalid request');
    
    return res.send('Invalid Request.');
  }
    

  try{
    var uniqueNumber=(new Date().getTime()).toString(36);

    var message = {
      mid: uniqueNumber,
      name:name,
      message:msg,
      time:moment().format('h:mm a'),
      date:moment(new Date()).format("DD/MM/YYYY")
    };

    Message.findOne({id:messageId}, async(err, found) => {
      if(err){
        res.sendStatus(500);
        return console.log('error',err);
      }
      if(!found)
      {
        const newMessageRoom = new Message({
          id:messageId,
          user1:sendingGuy,
          user2:sendingGuy2
        });
        await newMessageRoom.save();
        await newMessageRoom.messages.push(message);
        await newMessageRoom.save();
        console.log('saved');
      }
      else{
      await found.messages.push(message);
      await found.save();
      console.log('saved');
      }
      io.emit('message', message);
      res.sendStatus(200);
    });

  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }
  finally{
    console.log('Message Posted')
  }
})

app.get('/messages/:userid', async(req, res) => {
  var user  = req.params.userid;
  var returnData = [];
  UserChats.findOne({user:user}, async(err, found)=> {
    if(err)
      console.log(err);
    if(found)
      {
        console.log('found');
        
        returnData = found.chats.map(obj => {
          return obj.user2;
           })
      }
      return res.send(returnData);
  });
 });

 app.delete('/messages/:userid1/:userid2', async(req, res)=>{
   var user = req.params.userid1;
  UserChats.findOne({user:req.params.userid1}, async(err, found)=>{
    if(err)
      console.log(err);
    if(found)
    {
      found.chats.forEach(function(c){
        if(c.user2 === req.params.userid2)
          c.user2 = null;
      });
      await found.save();
    }
  });
  var returnData = [];
  UserChats.findOne({user:user}, async(err, found)=> {
    if(err)
      console.log(err);
    if(found)
      {
        console.log('found');
        
        returnData = found.chats.map(obj => {
          
          return obj.user2;
           })
      }
      return res.send(returnData);
  });
 });

io.on('connection', (socket) =>{
  console.log('a user is connected');
  socket.emit('uConnected', "");
    socket.on('join', function (name) {
        console.log(name + " : has joined the chat ");
        socket.broadcast.emit('userjoinedthechat', userNickname + " : has   joined the chat ");
    });

    socket.on('close',()=>{
        console.log("closed connection");
    })

    socket.on("message", (data) => {
        console.log(data);
        var d = sendMessage(data, socket);
        console.log(JSON.stringify(d));
    });

    socket.on('disconnect', function () {
        socket.broadcast.emit("userdisconnect", ' user has left');
    });
  });
  function sendMessage(mes, soc) {
    const messageId = "user3,user4";
    var sendingGuy = messageId.substr(0, messageId.indexOf(','));
    var sendingGuy2 = messageId.substr(messageId.indexOf(',') + 1, messageId.length);
    console.log(sendingGuy2);

    var data = mes;
    // console.log(data.name, data.to);
    if ((sendingGuy == sendingGuy2)) {
        console.log('Invalid request');
        soc.emit("Invalid Request", "sending message to same person");
        return "Invalid Request";
    }
    try {
        console.log("in sending message", data);
        var uniqueNumber = (new Date().getTime()).toString(36);
        var message = {
            mid: uniqueNumber,
            name: data.name,
            message: data.message,
            time: moment().format('h:mm a'),
            date: moment(new Date()).format("DD/MM/YYYY")
        };

        Message.findOne({ id: messageId }, async (err, found) => {
            if (err) {
                soc.emit("no such users found", "No such users found");
                return console.log('error', err);
            }
            if (!found) {
                const newMessageRoom = new Message({
                    id: messageId
                });
                await newMessageRoom.save();
                await newMessageRoom.messages.push(message);
                await newMessageRoom.save();
                console.log('saved');
            }
            else {
                await found.messages.push(message);
                await found.save();
                console.log('saved');
            }
            io.emit('message', message);
            var output = {
                message: message,
                status: 200
            }
            console.log('Output: \n', message);
            soc.broadcast.emit("new message", JSON.stringify(message));
            soc.emit("new message",  JSON.stringify(message));
        });
    }
    catch (error) {
        soc.emit("error in connection", "connection error");
        return error;
    }
    finally {
        console.log('Message Posted')
    }
}

var server = http.listen(process.env.PORT || 3000, () => {
  console.log('server is running on port', server.address().port);
});
