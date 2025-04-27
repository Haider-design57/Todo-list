// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDEXIjJwfiizgbraJDAK3mF9LzqxixiFoQ",
    authDomain: "todolist-5fe29.firebaseapp.com",
    projectId: "todolist-5fe29",
    storageBucket: "todolist-5fe29.firebasestorage.app",
    messagingSenderId: "819797409383",
    appId: "1:819797409383:web:40e5cd0c944b9f3a299ec2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get DOM elements
const taskList = document.getElementById('taskList');
const taskInput = document.getElementById('taskInput');
const confirmAdd = document.getElementById('confirmAdd');
const welcomeMessage = document.getElementById('welcomeMessage');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const pendingTasks = document.getElementById('pendingTasks');
const bulkAddBtn = document.getElementById('bulkAddBtn');
const bulkModal = document.getElementById('bulkModal');
const closeBulkModal = document.getElementById('closeBulkModal');
const bulkTasksInput = document.getElementById('bulkTasksInput');
const addBulkTasksBtn = document.getElementById('addBulkTasksBtn');

let currentUser = null;

// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        welcomeMessage.textContent = `Welcome, ${user.displayName || user.email}!`;
        loadTasks();
    } else {
        window.location.href = 'index.html';
    }
});

// Load tasks from Firestore
function loadTasks() {
    db.collection('tasks')
        .where('userId', '==', currentUser.uid)
        .onSnapshot((snapshot) => {
            taskList.innerHTML = '';
            let total = 0;
            let completed = 0;

            snapshot.forEach((doc) => {
                const task = doc.data();
                total++;
                if (task.completed) completed++;

                const taskElement = createTaskElement(doc.id, task);
                taskList.appendChild(taskElement);
            });

            updateTaskCounts(total, completed);
        });
}

// Create task element
function createTaskElement(taskId, task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    taskElement.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
        <div class="task-actions">
            <button class="complete-btn" title="Mark as ${task.completed ? 'incomplete' : 'complete'}">
                <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
            </button>
            <button class="delete-btn" title="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Add event listeners
    const checkbox = taskElement.querySelector('.task-checkbox');
    const completeBtn = taskElement.querySelector('.complete-btn');
    const deleteBtn = taskElement.querySelector('.delete-btn');

    checkbox.addEventListener('change', () => toggleTaskCompletion(taskId, !task.completed));
    completeBtn.addEventListener('click', () => toggleTaskCompletion(taskId, !task.completed));
    deleteBtn.addEventListener('click', () => deleteTask(taskId));

    return taskElement;
}

// Add task functionality
function addTask(taskText) {
    if (taskText.trim()) {
        db.collection('tasks').add({
            text: taskText,
            completed: false,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

confirmAdd.addEventListener('click', () => {
    const taskText = taskInput.value.trim();
    if (taskText) {
        addTask(taskText);
        taskInput.value = '';
    }
});

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const taskText = taskInput.value.trim();
        if (taskText) {
            addTask(taskText);
            taskInput.value = '';
        }
    }
});

// Toggle task completion
function toggleTaskCompletion(taskId, completed) {
    db.collection('tasks').doc(taskId).update({
        completed: completed
    });
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        db.collection('tasks').doc(taskId).delete();
    }
}

// Update task counts
function updateTaskCounts(total, completed) {
    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = total - completed;
}

// Bulk add tasks functionality
bulkAddBtn.addEventListener('click', () => {
    bulkModal.style.display = 'flex';
    bulkTasksInput.value = '';
    bulkTasksInput.focus();
});

closeBulkModal.addEventListener('click', () => {
    bulkModal.style.display = 'none';
});

addBulkTasksBtn.addEventListener('click', () => {
    const tasks = bulkTasksInput.value.split('\n')
        .map(task => task.trim())
        .filter(task => task);
    
    if (tasks.length > 0) {
        tasks.forEach(taskText => {
            addTask(taskText);
        });
        bulkModal.style.display = 'none';
    } else {
        alert('Please enter at least one task.');
    }
});

// Close modal on outside click
window.addEventListener('click', (event) => {
    if (event.target === bulkModal) {
        bulkModal.style.display = 'none';
    }
});