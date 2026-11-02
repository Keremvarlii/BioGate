const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { 
    getUsers, 
    createUser, 
    toggleUserStatus, 
    deleteUser, 
    updateUserFace // <-- Yeni eklediğimiz fonksiyonu buraya dahil et
} = require('../controllers/userController');

// ... diğer rotaların altına bunu ekle:
router.put('/:id/face', authMiddleware, updateUserFace);

// Bu rotaların tamamı güvenli bölgede olacak (Sadece token ile girilebilir)
router.use(authMiddleware);

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id/toggle-status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;