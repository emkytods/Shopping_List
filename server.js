const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let shoppingList = [];
let archive = [];

const shoppingListPath = path.join(__dirname, 'shoppingList.json');
const archivePath = path.join(__dirname, 'archive.json');

// Load the shopping list from file
try {
    const data = fs.readFileSync(shoppingListPath);
    shoppingList = JSON.parse(data);
} catch (err) {
    console.error('Error loading shopping list:', err);
}

// Load the archive from file
try {
    const data = fs.readFileSync(archivePath);
    archive = JSON.parse(data);
} catch (err) {
    console.error('Error loading archive:', err);
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.emit('currentList', shoppingList);
    socket.emit('archiveList', archive);

    socket.on('addItem', (item) => {
        const newItem = { id: Date.now(), item, timestamp: Date.now() };
        shoppingList.push(newItem);
        io.emit('currentList', shoppingList);
        saveShoppingList();
    });

    socket.on('removeItem', (id) => {
        shoppingList = shoppingList.filter(item => item.id !== id);
        io.emit('currentList', shoppingList);
        saveShoppingList();
    });

    socket.on('archiveItems', ({ items }) => {
        let itemsToArchive;
        if (items === 'all') {
            itemsToArchive = shoppingList;
            shoppingList = [];
        } else {
            itemsToArchive = shoppingList.filter(item => items.includes(item.id));
            shoppingList = shoppingList.filter(item => !items.includes(item.id));
        }
        archive.push(...itemsToArchive);
        io.emit('currentList', shoppingList);
        io.emit('archiveList', archive);
        saveShoppingList();
        saveArchive();
    });

    socket.on('requestArchiveList', () => {
        socket.emit('archiveList', archive);
    });

    socket.on('restoreItem', (id) => {
        const itemToRestore = archive.find(item => item.id === id);
        if (itemToRestore) {
            archive = archive.filter(item => item.id !== id);
            shoppingList.push(itemToRestore);
            io.emit('currentList', shoppingList);
            io.emit('archiveList', archive);
            saveShoppingList();
            saveArchive();
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

function saveShoppingList() {
    fs.writeFile(shoppingListPath, JSON.stringify(shoppingList), (err) => {
        if (err) {
            console.error('Error saving shopping list:', err);
        }
    });
}

function saveArchive() {
    fs.writeFile(archivePath, JSON.stringify(archive), (err) => {
        if (err) {
            console.error('Error saving archive:', err);
        }
    });
}

// Serve static content from the public directory
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
