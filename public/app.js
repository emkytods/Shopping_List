const socket = io();

window.addEventListener('load', () => {
    const storedItems = JSON.parse(localStorage.getItem('shoppingListItems'));
    if (storedItems) {
        displayList(storedItems);
    } else {
        socket.emit('requestCurrentList');
    }
});

socket.on('currentList', (items) => {
    displayList(items);
});

document.getElementById('addItemButton').addEventListener('click', () => {
    addItemToList();
});

socket.on('itemRemoved', (id) => {
    const item = document.getElementById(`item-${id}`);
    if (item) {
        item.remove();
    }
});

const itemInput = document.getElementById('itemInput');
itemInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        addItemToList();
    }
});

function displayList(items) {
    const list = document.getElementById('shoppingList');
    list.innerHTML = '';
    items.forEach((item) => {
        const li = document.createElement('li');
        li.id = `item-${item.id}`;
        
        const itemText = document.createElement('span');
        itemText.textContent = item.item;
        li.appendChild(itemText);

        const dateAdded = new Date(item.timestamp);
        const formattedDate = `${dateAdded.toLocaleDateString()} ${dateAdded.toLocaleTimeString()}`;
        const itemDate = document.createElement('span');
        itemDate.textContent = ` (${formattedDate})`;
        itemDate.classList.add('date');
        li.appendChild(itemDate);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete');
        deleteButton.addEventListener('click', () => {
            socket.emit('removeItem', item.id);
        });
        li.appendChild(deleteButton);

        list.appendChild(li);
    });
}

function addItemToList() {
    const itemInput = document.getElementById('itemInput');
    const item = itemInput.value.trim();
    if (item) {
        socket.emit('addItem', item);
        itemInput.value = '';
    }
}
