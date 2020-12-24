const express = require('express');

const home_controller = require('../controllers/homeController');
const prize_controller = require('../controllers/prizeController');
const project_controller = require('../controllers/projectController');
const user_controller = require('../controllers/userController');

const router = express.Router();

//主页
router.get('/', home_controller.checkLogin, home_controller.index);

router.get('/login', home_controller.login_get);

router.post('/login', home_controller.login_post);

router.get('/logout', home_controller.logout);

//奖品
router.get('/prizes', home_controller.checkLogin, prize_controller.prize_list);

router.get('/prize/create', home_controller.checkLogin, prize_controller.prize_create_get);

router.post('/prize/create', home_controller.checkLogin, prize_controller.prize_create_post);

router.get('/prize/:id/delete', home_controller.checkLogin, prize_controller.prize_delete_get);

router.post('/prize/:id/delete', home_controller.checkLogin, prize_controller.prize_delete_post);

router.get('/prize/:id', home_controller.checkLogin, prize_controller.prize_detail);

//抽奖项
router.get('/projects', home_controller.checkLogin, project_controller.project_list);

router.get('/project/create', home_controller.checkLogin, project_controller.project_create_get);

router.post('/project/create', home_controller.checkLogin, project_controller.project_create_post);

router.get('/project/:id/update', home_controller.checkLogin, project_controller.project_update_get);

router.post('/project/:id/update', home_controller.checkLogin, project_controller.project_update_post);

router.get('/project/:id/delete', home_controller.checkLogin, project_controller.project_delete_get);

router.post('/project/:id/delete', home_controller.checkLogin, project_controller.project_delete_post);

router.get('/project/:id/qrcode', home_controller.checkLogin, project_controller.project_qrcode);

//user_controller.checkLogin,user_controller.checkLogin,
router.get('/project/:id',  project_controller.project_detail);

router.post('/update',  project_controller.user_update);

//用登录模拟获取微信id
//router.post('/project/:id',  user_controller.user_update);

//router.post('/update',user_controller.user_update);

//router.get('/project/:id/login', user_controller.login_get);

//router.post('/project/:id/login', user_controller.login_post);


module.exports = router;
