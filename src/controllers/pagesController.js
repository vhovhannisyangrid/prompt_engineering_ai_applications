import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/data');
});


router.get('/data', (req, res) => {
  res.render('data', {
    title: 'Data Assistant - Data Generation',
    response: req.flash('response')[0],
    error: req.flash('error')[0]
  });
});

router.get('/chat', (req, res) => {
  res.render('chat', {
    title: 'Data Assistant - Talk to Your Data',
    conversationId: uuidv4()
  });
});

export default router;
