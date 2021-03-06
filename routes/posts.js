const express = require('express');

const jwt = require('jsonwebtoken');
const moment = require('moment');

const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Like = require('../models/like');

const router = express.Router();

const authMiddleware = require('../middlewares/auth-middleware');
const { sequelize } = require('../models');

// 게시글 목록 조회
router.get('/posts', async (req, res, next) => {
  try {
    // 토큰이 있으면 userId 추출
    let user;
    const { authorization } = req.headers;

    if (authorization != null) {
      const [tokenType, token] = authorization.split(' ');

      // 토큰 타입이 다르면 401 반환
      if (tokenType && tokenType === 'Bearer') {
        user = jwt.verify(token, 'secretKey');
      }
    }

    // 게시물 목록 조회
    const posts = await Post.findAll({
      raw: true,
      where: {
        active: true,
      },
      order: [['id', 'desc']],
    });

    // 해당 유저의 좋아요 확인
    let isLike = false;

    // 반복문을 돌면서 좋아요, 좋아요수, 댓글수 저장
    for (let i = 0; i < posts.length; i++) {
      // 유저 닉네임 조회
      const existUser = await User.findOne({
        raw: true,
        where: {
          id: posts[i].user_id,
        },
      });

      // 유저 닉네임 삽입
      posts[i].nickname = existUser.nickname;
      posts[i].createdAt = moment(posts[i].createdAt).format(
        'YYYY-MM-DD HH:mm:ss'
      );
      posts[i].updatedAt =
        posts[i].updatedAt != null
          ? moment(posts[i].updatedAt).format('YYYY-MM-DD HH:mm:ss')
          : undefined;

      // 해당 게시물의 좋아요 조회
      const likes = await Like.findAll({
        where: {
          post_id: posts[i].id,
        },
      });
      // 좋아요수 추가
      posts[i].likeCnt = likes.length;

      // 해당 게시물의 댓글 조회
      const comments = await Comment.findAll({
        where: {
          post_id: posts[i].id,
          active: true,
        },
      });
      // 댓글수 추가
      posts[i].commentCnt = comments.length;
      posts[i].postId = posts[i].id;
      posts[i].isLike = false;

      // 유저가 존재하면 해당 게시물에 좋아요 있는지 확인
      if (user != null) {
        const like = await Like.findOne({
          where: {
            post_id: posts[i].id,
            user_id: user.userId,
          },
        });

        // 해당 유저의 좋아요 있으면 추가
        if (like != null) {
          posts[i].isLike = true;
        }
      }

      // 게시글 목록에 불필요한 값 삭제
      posts[i].id = undefined;
      posts[i].user_id = undefined;
      posts[i].active = undefined;
    }

    return res.status(200).send({ posts });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// 게시글 상세 조회
router.get('/posts/:postId', async (req, res, next) => {
  try {
    console.log(req.params);
    // 토큰이 있으면 userId 추출
    let user;
    const { authorization } = req.headers;

    if (authorization != null) {
      const [tokenType, token] = authorization.split(' ');

      // 토큰 타입이 다르면 401 반환
      if (tokenType && tokenType === 'Bearer') {
        user = jwt.verify(token, 'secretKey');
      }
    }

    const { postId } = req.params;
    // 게시글 상세 조회
    const post = await Post.findOne({
      raw: true,
      where: {
        id: postId,
        active: true,
      },
    });

    if (post == null) {
      res.status(200).send({
        result: {
          success: true,
          message: 'OK',
        },
      });
    }

    // 유저 닉네임 조회
    const existUser = await User.findOne({
      raw: true,
      where: {
        id: post.user_id,
      },
    });
    post.nickname = existUser.nickname;

    // 해당 게시물의 좋아요 조회
    const likes = await Like.findAll({
      where: {
        // post_id: posts[i].getDataValue('id'),
        post_id: post.id,
      },
    });
    // 좋아요수 추가
    post.likeCnt = likes.length;
    post.isLike = false;

    // 유저가 존재하면 해당 게시물에 좋아요 있는지 확인
    if (user != null) {
      const like = await Like.findOne({
        where: {
          post_id: post.id,
          user_id: user.userId,
        },
      });

      // 해당 유저의 좋아요 있으면 추가
      if (like != null) {
        post.isLike = true;
      }
    }

    // 댓글 목록 조회
    const comments = await Comment.findAll({
      raw: true,
      where: {
        post_id: postId,
        active: true,
      },
      order: [['id', 'desc']],
    });

    // 댓글 목록이 존재한다면 게시글에 추가
    if (comments != null) {
      for (let i = 0; i < comments.length; i++) {
        // 유저 닉네임 조회
        const existUser = await User.findOne({
          raw: true,
          where: {
            id: comments[i].user_id,
          },
        });

        // 댓글 목록에 필요한 값 삽입
        comments[i].nickname = existUser.nickname;
        comments[i].imageUrl = existUser.imageUrl;
        comments[i].commentId = comments[i].id;
        comments[i].createdAt = moment(comments[i].createdAt).format(
          'YYYY-MM-DD HH:mm:ss'
        );
        comments[i].updatedAt =
          comments[i].updatedAt != null
            ? moment(comments[i].updatedAt).format('YYYY-MM-DD HH:mm:ss')
            : undefined;

        // 댓글 목록에 불필요한 값 삭제
        comments[i].post_id = undefined;
        comments[i].user_id = undefined;
        comments[i].id = undefined;
        comments[i].active = undefined;
      }
    }

    // 게시글에 필요한 값 삽입
    post.postId = post.id;
    post.comments = comments;

    // 게시글에 불필요한 값 삭제
    post.id = undefined;
    post.user_id = undefined;
    post.active = undefined;

    return res.status(200).send({ post });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// 게시글 작성
router.post('/posts', authMiddleware, async (req, res, next) => {
  try {
    console.log(req.body);
    const { title, content, imageUrl, layout } = req.body;

    // 게시글 작성
    const createdPost = await Post.create({
      user_id: res.locals.userId,
      title,
      content,
      imageUrl,
      layout,
    });

    return res.status(201).send({ postId: createdPost.id });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// 게시글 수정
router.put('/posts/:postId', authMiddleware, async (req, res, next) => {
  try {
    console.log(req.params, req.body);
    const { postId } = req.params;
    const { title, content, imageUrl, layout } = req.body;

    // 게시글 수정
    const updatedPost = await Post.update(
      {
        title,
        content,
        imageUrl,
        layout,
        updated: Date.now(),
      },
      {
        where: {
          id: postId,
          user_id: res.locals.userId,
        },
      }
    );

    return res.status(201).send();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// 게시글 삭제
router.delete('/posts/:postId', authMiddleware, async (req, res, next) => {
  try {
    console.log(req.params);
    const { postId } = req.params;

    let updatedPost;

    // 관리자일 경우 바로 삭제
    if (res.locals.isAdmin) {
      updatedPost = await Post.update(
        {
          active: false,
          updated: Date.now(),
        },
        {
          where: {
            id: postId,
          },
        }
      );
    }

    // 일반유저일 경우 해당 유저가 작성한 것만 삭제
    else {
      // 게시글 삭제 플레그 수정
      updatedPost = await Post.update(
        {
          active: false,
          updated: Date.now(),
        },
        {
          where: {
            id: postId,
            user_id: res.locals.userId,
          },
        }
      );
    }

    // 업데이트 된 게시글이 있다면 해당 게시물의 댓글들도 모두 삭제
    if (updatedPost[0]) {
      // 해당 게시글의 댓글들 삭제 플레그 수정
      const updatedComment = await Comment.update(
        {
          active: false,
          updated: Date.now(),
        },
        {
          where: {
            post_id: postId,
          },
        }
      );
    }

    return res.ststus(200).send();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// 댓글 작성
router.post(
  '/posts/:postId/comments',
  authMiddleware,
  async (req, res, next) => {
    try {
      console.log(req.params, req.body);
      const { postId } = req.params;
      const { content } = req.body;

      // 댓글 작성
      const createdComment = await Comment.create({
        user_id: res.locals.userId,
        post_id: postId,
        content,
      });

      return res.status(201).send({ commentId: createdComment.id });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);

// 댓글 수정
router.put(
  '/posts/:postId/comments/:commentId',
  authMiddleware,
  async (req, res, next) => {
    try {
      console.log(req.params, req.body);
      const { postId, commentId } = req.params;
      const { content } = req.body;

      // 댓글 수정
      const updatedComment = await Comment.update(
        {
          content: content,
          updated: Date.now(),
        },
        {
          where: {
            id: commentId,
            post_id: postId,
            user_id: res.locals.userId,
          },
        }
      );

      return res.status(201).send();
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);

// 댓글 삭제
router.delete(
  '/posts/:postId/comments/:commentId',
  authMiddleware,
  async (req, res, next) => {
    try {
      console.log(req.params);
      const { postId, commentId } = req.params;

      // 관리자일 경우 바로 삭제
      if (res.locals.isAdmin) {
        // 댓글 삭제 플레그 수정
        const updatedComment = await Comment.update(
          {
            active: false,
            updated: Date.now(),
          },
          {
            where: {
              id: commentId,
              post_id: postId,
            },
          }
        );
      }
      // 일반유저일 경우 해당 유저가 작성한 것만 삭제
      else {
        // 댓글 삭제 플레그 수정
        const updatedComment = await Comment.update(
          {
            active: false,
            updated: Date.now(),
          },
          {
            where: {
              id: commentId,
              post_id: postId,
              user_id: res.locals.userId,
            },
          }
        );
      }

      return res.status(200).send();
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);

// 좋아요 작성
router.post('/posts/:postId/like', authMiddleware, async (req, res, next) => {
  try {
    console.log(req.params);
    const { postId } = req.params;

    const existLike = await Like.findOne({
      where: {
        user_id: res.locals.userId,
        post_id: postId,
      },
    });
    let createdLike;

    if (!existLike) {
      // 좋아요 작성
      createdLike = await Like.upsert({
        user_id: res.locals.userId,
        post_id: postId,
      });
    }
    return res.status(201).send();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// 좋아요 취소
router.delete('/posts/:postId/like', authMiddleware, async (req, res, next) => {
  try {
    console.log(req.params);
    const { postId } = req.params;

    // 좋아요 취소
    const deletedLike = await Like.destroy({
      where: {
        user_id: res.locals.userId,
        post_id: postId,
      },
    });

    return res.status(200).send();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
