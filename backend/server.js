// this is a test code, it can be deleted

import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) =>{
    res.send('Hello from the Caravan API');
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));