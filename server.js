const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let shoppingList = [];

try {
    const data = fs.readFileSync(path.join(__dirname, 'shoppingList.json'));
    shoppingList = JSON.parse(data);
} catch (err) {
    console.error('Erreur lors du chargement de la liste de courses :', err);
}

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.emit('currentList', shoppingList);

    socket.on('addItem', (item) => {
      const newItem = { id: Date.now(), item, timestamp: Date.now() };
      shoppingList.push(newItem);
      io.emit('currentList', shoppingList);
      sauvegarderListeCourses();
    });

    socket.on('removeItem', (id) => {
        shoppingList = shoppingList.filter(item => item.id !== id);
        io.emit('currentList', shoppingList);
        sauvegarderListeCourses();
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
    });
});

function sauvegarderListeCourses() {
    fs.writeFile(path.join(__dirname, 'shoppingList.json'), JSON.stringify(shoppingList), (err) => {
        if (err) {
            console.error('Erreur lors de la sauvegarde de la liste de courses :', err);
        }
    });
}


// Servir le contenu statique du répertoire public
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
