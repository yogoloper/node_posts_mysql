const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

const { sequelize } = require('./models');

// cors 처리
// 모든 도메인에서 제한 없이 요청 받기
app.use(cors());

// 특정 도멘에게서만 요청 받기
// let corsOptions = {
//   origin: 'https://www.domain.com',
//   credentials: true
// }
// app.use(cors(corsOptions));

// 라우터 정보 가져오기
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');
const adminsRouter = require('./routes/admins');

sequelize
  .sync({ force: false })
  .then(() => {
    console.log('Database connected..');
  })
  .catch((err) => {
    console.log(err);
  });

// 접속 경로 로그 미들웨어
const requestMiddleware = (req, res, next) => {
  console.log('request URL : ', req.originalUrl, ' - ', new Date());
  next();
};

app.use(requestMiddleware);
app.use(express.json());

// api 경로시 배열에 있는 라우터 순서대로 우선순위를 정한다.
app.use('/api', [postsRouter, usersRouter, adminsRouter]);

app.listen(port, () => {
  console.log(port, '포트로 서버가 생성되었습니다.');
});
