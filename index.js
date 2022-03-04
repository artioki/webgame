import express from 'express'
import path from 'path'
import http from  'http';
import morgan from 'morgan'
import { Server } from "socket.io";

const _USERS =[]; 

const __dirname = path.resolve() // возращает ссылку в деррикторию
const PORT = process.env.PORT || 8001

const app = express()
//создание сервера
const server = http.createServer(app);
//создание главного сокета
const io = new Server(server);
// событие при подключении пользователя
io.on('connection',(socket)=>{
  console.log('user-connected',socket.id);
  //создание обекта пользователя на сервере
  _USERS.push(new ConectedUser(socket));
  console.log(_USERS.length)
})
// делает папку общедоступной для пользователя
app.use(express.static(path.resolve(__dirname,'static'))) 
// логер отвечающий запросом, URL и временем ответа
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))
//запрос поьзователя по адресу
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
//прослушивание событий
server.listen(PORT, () => {
  console.log(process.env.PORT)
  console.log(process.env.$PORT)
  console.log(`listening on *:${PORT}`);
});










class ConectedUser{
  constructor(socket){
    this.id_= socket.id;
    this.pos_ = [Math.random()*10*0,0,Math.random()*10*0];
    this.rotationY_ = 0;
    this.action_bool = false;
    this.objId_ = null;
    this.objId_ ="zombi"
    this.socket_ = socket;
    console.log(this.id_,this.pos_);
    this.spanEveryone_();
    this.socket_.on('res_pos',(d)=>{
      const [id,pos,rotationY,action_bool] = d;
      this.action_bool = action_bool;
      this.pos_=pos;
      this.rotationY_ = rotationY;
      this.socket_.broadcast.emit('pos',[this.id_,this.pos_,this.rotationY_,this.objId_,this.action_bool]);
    })
    this.socket_.on('disconnect', () => {
      this.delEveryone_();
    })
  }
  //создание объекта на стороне клиентов
  spanEveryone_(){
    //запрос отправляемый другим пользователям
    console.log(_USERS.length,_USERS)
    io.sockets.emit('pos',[this.id_,this.pos_,this.rotationY_,this.objId_,this.action_bool]);
    for(let i = 0;i<_USERS.length-2;i++){
      //запрос на получение объекта от других соединений
      this.socket_.emit('pos',[_USERS[i].id_,_USERS[i].pos_,_USERS[i].rotationY_,_USERS[i].objId_,_USERS[i].action_bool]);
    }
  }
  delEveryone_(){
    _USERS.splice(_USERS.indexOf(this),1);
    io.sockets.emit('del',this.id_);
    console.log("DELETE ",this.id_)
  }
}
