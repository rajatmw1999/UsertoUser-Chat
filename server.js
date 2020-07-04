var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var moment = require('moment');
const { send } = require('process');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

var Message = mongoose.model('Message',{
  id:String,
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

// var dbUrl = 'mongodb+srv://admin:admin@cluster0-nbxxl.mongodb.net/simplechat?retryWrites=true&w=majority'
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


// app.get('/messages/:user', (req, res) => {
//   var user = req.params.user
//   Message.find({name: user},(err, messages)=> {
//     res.send(messages);
//   })
// })


app.post('/messages/:userid1/:userid2', async (req, res) => {
  const messageId = req.params.userid1 + ',' + req.params.userid2;
  var sendingGuy= messageId.substr(0, messageId.indexOf(','));
  var sendingGuy2= messageId.substr(messageId.indexOf(',') +1, messageId.length);
  console.log(sendingGuy2);
  
  // console.log('sending Guy = ' + sendingGuy + ' or ' + sendingGuy2);
  var name = req.body.name;
  var msg = req.body.message;

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
          id:messageId
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

    // var savedMessage = await message.save()
      // console.log('saved');

    // var censored = await Message.findOne({message:'badword'});
    //   if(censored)
    //     await Message.remove({_id: censored.id})
    //   else
    //     io.emit('message', req.body);
    //   res.sendStatus(200);
  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }
  finally{
    console.log('Message Posted')
  }
})



io.on('connection', () =>{
  console.log('a user is connected')
})

// mongoose.connect(dbUrl ,{useMongoClient : true} ,(err) => {
//   console.log('mongodb connected',err);
// })

var server = http.listen(process.env.PORT || 3000, () => {
  console.log('server is running on port', server.address().port);
});
