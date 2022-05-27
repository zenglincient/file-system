var express = require('express')
const {RequestHandler} = express
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require("express-session");
const fileUpload = require("express-fileupload")
const Path = require('path');
const Fs = require('fs')


var app = express()

app.use(express.static('public'));

app.use(fileUpload())

app.use(bodyParser.json());

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));

/**
 * session配置
 **/
 app.use(session({
    secret: 'sessionKey', // 可以随便写。String类型的字符串，作为服务器端生成 session 的签名
    name: 'token', // 这个会作为给cookie设置值的key
    saveUninitialized: true, // 强制将未初始化的 session 存储。默认值是true，建议设置成true
    resave: false, // 强制保存 session 即使它并没有变化,。默认为 true。建议设置成 false。
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 //设置过期时间是一天
    },
    rolling: true, // 在每次请求时强行设置 cookie，这将重置 cookie 过期时间，默认：false
  }))
 


  // 登陆拦截
  app.use(function (req, res, next) {
    const { userInfo } = req.session;
    if (req.url !== '/loginApi' && req.url !== '/signApi') {
      if (!userInfo) {
        res.send({ flag: false, status: 403, msg: '登录已过期,请重新登录' });
      } else {
        next();
      }
    } else {
      next();
    }
  });
  
app.use('/files', express.static('files'))


const getAssets = async (distDir, keyword = '') => {
    const files = await Fs.promises.readdir(distDir)
    return files.filter((el) => Path.basename(el).includes(keyword)).map((el) => Path.join(distDir, el))
}

app.post('/uploadFile', async(req, res) => {
    const { file } = req.files
    // console.log(req)
    const distDir = Path.join(__dirname, 'files')
    // await Fs.promises.mkdir(distDir, { recursive: true })
    await file.mv(Path.join(distDir, file.name))
    res.send({
        flag: true,
        msg: '上传成功'
    })
})

app.post('/deleteFile', async(req, res) => {
    const { fileName } = req.body
    const distDir = Path.join(__dirname, 'files')
    await Fs.promises.unlink(Path.join(distDir, fileName))
    res.send({
        flag: true,
        msg: '删除成功'
    })
})

app.get('/getSource', async(req, res) => {
    const distDir = Path.join(__dirname, './files')
    const files = await getAssets(distDir, req.query.keyword)
    const result = files.map(item => {
        return {
            path: item,
            name: Path.basename(item)
        }
    })
    res.send({
        flag: true,
            data: result
    })
})

/**
 * 登录
 **/
app.post('/loginApi', (req, res) => {
    const { username, password } = req.body;
    const resSend = { flag: false, message: '' };
    if (username && password) {
      const isUser = username === 'jobs' && password === 'maga'; 
      // 这个可以放数据库，此处只为演示
      if (isUser) {
        resSend.flag = true;
        resSend.message = '登录成功!';
        // 这里还可以在查询数据库登录成功之后，存入_id之类的编号，方便查找
        req.session.userInfo = { username, password };
      } else {
        resSend.message = '用户名或密码错误!';
        req.session.destroy();
      }
    } else {
      resSend.message = '请输入合法的用户名或密码!';
    }
    res.send(resSend);
  })
  
  /**
 * 测试cookie
 **/
app.post('/testApi', (req, res) => {
    const resSend = { flag: true,  };
    res.send(resSend);
  })


app.listen(9001, () => {
    console.log('success in 9001')
})