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

document.getElementById('archiveAllButton').addEventListener('click', () => {
    archiveAllItems();
});

document.getElementById('archiveSelectedButton').addEventListener('click', () => {
    archiveSelectedItems();
});

document.getElementById('showArchiveButton').addEventListener('click', () => {
    toggleArchiveSection();
    socket.emit('requestArchiveList');
});

socket.on('archiveList', (items) => {
    displayArchiveList(items);
});

socket.on('itemRestored', (item) => {
    const archiveItem = document.getElementById(`archive-item-${item.id}`);
    if (archiveItem) {
        archiveItem.remove();
    }
    const list = document.getElementById('shoppingList');
    createListItem(item, list);
});

socket.on('archiveList', (items) => {
    displayArchiveList(items);
    updateArchiveCount(items.length); // Appel de la fonction pour mettre à jour le compteur d'archives
});

function displayList(items) {
    const list = document.getElementById('shoppingList');
    list.innerHTML = '';
    items.forEach((item) => {
        createListItem(item, list);
    });
}

function createListItem(item, list) {
    const li = document.createElement('li');
    li.id = `item-${item.id}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('checkbox');
    li.appendChild(checkbox);

    const itemText = document.createElement('span');
    itemText.textContent = item.item;
    itemText.style.fontSize = 'small'; // Small text
    li.appendChild(itemText);

    const dateAdded = new Date(item.timestamp);
    const formattedDate = `${dateAdded.toLocaleDateString()} ${dateAdded.toLocaleTimeString()}`;
    const itemDate = document.createElement('span');
    itemDate.textContent = ` (${formattedDate})`;
    itemDate.classList.add('date');
    itemDate.style.fontSize = 'small'; // Small text for date and time
    li.appendChild(itemDate);

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '&times;';
    deleteButton.classList.add('delete');
    deleteButton.addEventListener('click', () => {
        socket.emit('removeItem', item.id);
    });
    li.appendChild(deleteButton);

    list.appendChild(li);
}

function addItemToList() {
    const itemInput = document.getElementById('itemInput');
    const item = itemInput.value.trim();
    if (item) {
        socket.emit('addItem', item);
        itemInput.value = '';
    }
}

function archiveAllItems() {
    socket.emit('archiveItems', { items: 'all' });
}

function archiveSelectedItems() {
    const selectedItems = Array.from(document.querySelectorAll('.checkbox:checked')).map(checkbox => {
        return Number(checkbox.closest('li').id.replace('item-', ''));
    });
    if (selectedItems.length > 0) {
        socket.emit('archiveItems', { items: selectedItems });
    }
}

function toggleArchiveSection() {
    const archiveSection = document.getElementById('archiveSection');
    archiveSection.style.display = archiveSection.style.display === 'none' ? 'block' : 'none';
}

function displayArchiveList(items) {
    const list = document.getElementById('archiveList');
    list.innerHTML = '';
    items.forEach((item) => {
        const li = document.createElement('li');
        li.id = `archive-item-${item.id}`;

        const itemText = document.createElement('span');
        itemText.textContent = item.item;
        li.appendChild(itemText);

        const dateAdded = new Date(item.timestamp);
        const formattedDate = `${dateAdded.toLocaleDateString()} ${dateAdded.toLocaleTimeString()}`;
        const itemDate = document.createElement('span');
        itemDate.textContent = ` (${formattedDate})`;
        itemDate.classList.add('date');
        itemDate.style.fontSize = 'small'; // Small text for date and time
        li.appendChild(itemDate);

        const restoreButton = document.createElement('button');
        restoreButton.textContent = 'Restaurer';
        restoreButton.classList.add('restore');
        restoreButton.addEventListener('click', () => {
            socket.emit('restoreItem', item.id);
        });
        li.appendChild(restoreButton);

        list.appendChild(li);
    });
}

function updateArchiveCount(count) {
    const archiveCount = document.getElementById('archiveCount');
    archiveCount.textContent = count;
}
