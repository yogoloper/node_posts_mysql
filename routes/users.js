const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

const authMiddleware = require('../middlewares/auth-middleware');

// 사용자 회원가입
router.post('/users/register', async (req, res) => {
  try {
    const { nickname, password, passwordConfirm, image_url } = req.body;

    // 비밀번호가 일치 하지 않으면 실패
    if (password != passwordConfirm) {
      return res.status(400).send({
        success: false,
        errorMessage: '비밀번호가 일치하지 않습니다.',
      });
    }

    // 유저 검색
    const existUsers = await User.findAll({
      where: {
        nickname: nickname
      }
    });

    // 해당 메일, 닉네임으로 가입된 회원이 있으면 400 반환
    if (existUsers.length > 0) {
      return res.status(400).send({
        success: false,
        errorMessage: '이미 가입된 회원 정보 입니다.'
      })
    }

    // 사용자 회원가입
    const createdUser = await User.create({
      nickname,
      password,
      image_url,
    });
    
    return res.send(201).send();

  } catch (err) {
    console.log(err);
    next(err);
  }
});

// 사용자 로그인
router.post('/users/login', async (req, res, next) => {
  try {
    const { nickname, password } = req.body;
    
    // 유저 검색
    const [existUsers] = await User.findAll({
      where: {
        nickname: nickname,
        password: password
      }
    });
    
    // 해당하는 계정이 없으면  400 반환
    if (existUsers.length == 0) {
      return res.status(400).send({
        success: false,
        errorMessage: '계정 정보가 일치하지 않습니다.'
      });
    }

    const token = jwt.sign({ userId: existUsers.dataValues.id }, 'secretKey');

    // token은 헤더에 담아서 전달,
    // nickname, image_url, admin 여부는 바디로 전달
    return res.header('authorization','Bearer ' + token).status(201).send({success: true});

  } catch (err) {
    console.log(err);
    next(err);
  }







});

// 사용자 인증
router.get('/users/me', authMiddleware, (req, res) => {
  console.log(res.locals);

  return res.status(200).send();
});

module.exports = router;