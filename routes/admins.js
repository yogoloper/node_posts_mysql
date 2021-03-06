const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const router = express.Router();

const authMiddleware = require('../middlewares/auth-middleware');

// 관리자 로그인
router.post('/admins/login', async (req, res, next) => {
  try {
    console.log(req.body);
    const { nickname, password } = req.body;

    // 관리자 검색
    const [existAdmin] = await Admin.findAll({
      where: {
        nickname,
        password,
      },
    });

    // 해당하는 계정이 없으면  400 반환
    if (existAdmin == null) {
      return res.status(400).send({
        success: false,
        message: '계정 정보가 일치하지 않습니다.',
      });
    }

    const token = jwt.sign(
      { userId: existAdmin.dataValues.id, isAdmin: true },
      'secretKey'
    );

    // token은 헤더에 담아서 전달,
    // nickname, imageUrl, admin 여부는 바디로 전달
    return res
      .header('authorization', 'Bearer ' + token)
      .status(201)
      .send({
        nickname: existUser.nickname,
        isAdmin: true,
        token,
      });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// 관리자 인증
router.get('/admins/auth', authMiddleware, async (req, res, next) => {
  try {
    // 유저 검색
    const [existAdmin] = await Admin.findAll({
      where: {
        id: res.locals.userId,
      },
    });

    return res.status(201).send({
      nickname: existAdmin.nickname,
      isAdmin: true,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
