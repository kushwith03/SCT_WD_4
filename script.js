class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.currentSort = 'added';
        this.editingTaskId = null;
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.cacheDomElements();
        this.bindEvents();
        this.renderTasks();
        this.updateTaskCount();
    }
    
    cacheDomElements() {
        this.taskInput = document.getElementById('taskInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.dueDate = document.getElementById('dueDate');
        this.dueTime = document.getElementById('dueTime');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.taskCount = document.getElementById('taskCount');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.sortSelect = document.getElementById('sortSelect');
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        this.dueDate.min = today;
    }
    
    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });
        
        this.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTasks();
        });
    }
    
    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;
        
        const dueDateTime = this.getDueDateTime();
        
        const task = {
            id: Date.now(),
            text: text,
            category: this.categorySelect.value,
            dueDate: dueDateTime,
            completed: false,
            createdAt: new Date()
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.renderTasks();
        this.updateTaskCount();
    }
    
    getDueDateTime() {
        const date = this.dueDate.value;
        const time = this.dueTime.value;
        
        if (!date) return null;
        
        if (time) {
            return new Date(`${date}T${time}`);
        }
        
        return new Date(date);
    }
    
    toggleTaskCompletion(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCount();
        }
    }
    
    editTask(id) {
        this.editingTaskId = id;
        this.renderTasks();
    }
    
    saveEditedTask(id, newText, newCategory, newDueDate) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = newText;
            task.category = newCategory;
            task.dueDate = newDueDate;
            this.saveTasks();
            this.editingTaskId = null;
            this.renderTasks();
        }
    }
    
    cancelEdit() {
        this.editingTaskId = null;
        this.renderTasks();
    }
    
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCount();
        }
    }
    
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    filterTasks() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'today':
                return this.tasks.filter(task => {
                    if (!task.dueDate) return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate.toDateString() === today.toDateString();
                });
            default:
                return this.tasks;
        }
    }
    
    sortTasks(tasks) {
        switch (this.currentSort) {
            case 'due':
                return tasks.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
            case 'alpha':
                return tasks.sort((a, b) => a.text.localeCompare(b.text));
            case 'category':
                return tasks.sort((a, b) => a.category.localeCompare(b.category));
            default:
                return tasks.sort((a, b) => b.id - a.id);
        }
    }
    
    renderTasks() {
        let filteredTasks = this.filterTasks();
        filteredTasks = this.sortTasks(filteredTasks);
        
        this.taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.emptyState.style.display = 'block';
            return;
        }
        
        this.emptyState.style.display = 'none';
        
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'task-completed' : ''}`;
            
            if (this.editingTaskId === task.id) {
                li.innerHTML = this.renderEditForm(task);
            } else {
                li.innerHTML = this.renderTaskItem(task);
            }
            
            this.taskList.appendChild(li);
        });
        
        // Add event listeners after rendering
        this.addTaskEventListeners();
    }
    
    renderTaskItem(task) {
        const dueDateFormatted = task.dueDate ? this.formatDueDate(task.dueDate) : 'No due date';
        
        return `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${this.escapeHtml(task.text)}</div>
                <div class="task-due">Due: ${dueDateFormatted}</div>
                <span class="task-category">${task.category}</span>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" title="Edit task">✏️</button>
                <button class="action-btn delete-btn" title="Delete task">🗑️</button>
            </div>
        `;
    }
    
    renderEditForm(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        const dueTime = task.dueDate ? new Date(task.dueDate).toTimeString().substring(0, 5) : '';
        
        return `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} disabled>
            <div class="task-content">
                <input type="text" class="edit-input" value="${this.escapeHtml(task.text)}">
                <div class="edit-form">
                    <div class="datetime-inputs">
                        <input type="date" class="edit-date" value="${dueDate}">
                        <input type="time" class="edit-time" value="${dueTime}">
                    </div>
                    <select class="edit-category">
                        <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>Personal</option>
                        <option value="work" ${task.category === 'work' ? 'selected' : ''}>Work</option>
                        <option value="shopping" ${task.category === 'shopping' ? 'selected' : ''}>Shopping</option>
                        <option value="health" ${task.category === 'health' ? 'selected' : ''}>Health</option>
                        <option value="other" ${task.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                    <div>
                        <button class="save-edit-btn">Save</button>
                        <button class="cancel-edit-btn">Cancel</button>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn delete-btn" title="Delete task">🗑️</button>
            </div>
        `;
    }
    
    addTaskEventListeners() {
        // Checkbox events
        document.querySelectorAll('.task-checkbox').forEach((checkbox, index) => {
            if (!checkbox.disabled) {
                checkbox.addEventListener('change', () => {
                    const filteredTasks = this.filterTasks();
                    const sortedTasks = this.sortTasks(filteredTasks);
                    this.toggleTaskCompletion(sortedTasks[index].id);
                });
            }
        });
        
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const filteredTasks = this.filterTasks();
                const sortedTasks = this.sortTasks(filteredTasks);
                this.editTask(sortedTasks[index].id);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const filteredTasks = this.filterTasks();
                const sortedTasks = this.sortTasks(filteredTasks);
                this.deleteTask(sortedTasks[index].id);
            });
        });
        
        // Edit form events
        document.querySelectorAll('.save-edit-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const filteredTasks = this.filterTasks();
                const sortedTasks = this.sortTasks(filteredTasks);
                const task = sortedTasks[index];
                
                const newText = document.querySelectorAll('.edit-input')[index].value.trim();
                const newCategory = document.querySelectorAll('.edit-category')[index].value;
                const newDate = document.querySelectorAll('.edit-date')[index].value;
                const newTime = document.querySelectorAll('.edit-time')[index].value;
                
                let newDueDate = null;
                if (newDate) {
                    newDueDate = newTime ? new Date(`${newDate}T${newTime}`) : new Date(newDate);
                }
                
                if (newText) {
                    this.saveEditedTask(task.id, newText, newCategory, newDueDate);
                }
            });
        });
        
        document.querySelectorAll('.cancel-edit-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.cancelEdit();
            });
        });
    }
    
    updateTaskCount() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        
        this.taskCount.textContent = `${active} active, ${completed} completed, ${total} total`;
    }
    
    formatDueDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});