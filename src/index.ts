const API_URL = 'https://tasks-service-maks1394.amvera.io';

const BASE_CONFIG: RequestInit = {
  headers: { 'Content-Type': 'application/json' },
};

interface Task {
  id: number;
  name: string;
  info: string;
  isImportant: boolean;
  isCompleted: boolean;
}

type CreateTask = Omit<Task, 'id'>;

class BaseFetchAgent {
  constructor(private _apiUrl: string) {}

  protected fetchRequest = async <ReturnDataType>(url: string, config: RequestInit = {}): Promise<ReturnDataType> => {
    const response = await fetch(`${this._apiUrl}${url}`, { ...BASE_CONFIG, ...config });

    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

    const data = await response.json().catch(() => ({}));
    return data as ReturnDataType;
  };
}

class RequestTaskAgent extends BaseFetchAgent {
  constructor() {
    super(API_URL);
  }

  getAllTasks = async (): Promise<Task[]> => {
    const response = await this.fetchRequest<Task[]>('/tasks');
    console.log('Все задачи:', response);
    return response;
  };

  createTask = async (newTask: CreateTask): Promise<Task> => {
    const response = await this.fetchRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(newTask),
    });
    console.log('Создана задача:', response);
    return response;
  };

  updateTask = async (id: number, updatedData: Partial<Task>): Promise<Task> => {
    const response = await this.fetchRequest<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updatedData),
    });
    console.log(`Обновлена задача #${id}:`, response);
    return response;
  };

  deleteTask = async (id: number): Promise<void> => {
    await this.fetchRequest<void>(`/tasks/${id}`, { method: 'DELETE' });
    console.log(`Задача #${id} удалена`);
  };
}

// UI
const taskAgent = new RequestTaskAgent();

const taskList = document.querySelector('.taskList') as HTMLUListElement;
const addTaskBtn = document.querySelector('.addTask') as HTMLButtonElement;
const nameInput = document.querySelector('.taskName') as HTMLInputElement;
const infoInput = document.querySelector('.taskInfo') as HTMLTextAreaElement;
const importantInput = document.querySelector('.taskImportant') as HTMLInputElement;
const completedInput = document.querySelector('.taskCompleted') as HTMLInputElement;

const modalOverlay = document.querySelector('.modalOverlay') as HTMLElement;
const editName = document.querySelector('.editName') as HTMLInputElement;
const editInfo = document.querySelector('.editInfo') as HTMLTextAreaElement;
const editImportant = document.querySelector('.editImportant') as HTMLInputElement;
const editCompleted = document.querySelector('.editCompleted') as HTMLInputElement;
const saveEditBtn = document.querySelector('.saveEdit') as HTMLButtonElement;
const cancelEditBtn = document.querySelector('.cancelEdit') as HTMLButtonElement;

const importantFilter = document.querySelector('.importantFilter') as HTMLInputElement;
const completedFilter = document.querySelector('.completedFilter') as HTMLInputElement;
const searchName = document.querySelector('.searchName') as HTMLInputElement;
const applyFiltersBtn = document.querySelector('.applyFilters') as HTMLButtonElement;

let currentEditId: number | null = null;

// Рендер (с фильтрацией)
const renderTasks = async (applyFilter = false) => {
  const tasks = await taskAgent.getAllTasks();
  let filteredTasks = tasks;

  if (applyFilter) {
    if (importantFilter.checked) {
      filteredTasks = filteredTasks.filter((task) => task.isImportant);
    }

    if (completedFilter.checked) {
      filteredTasks = filteredTasks.filter((task) => !task.isCompleted);
    }

    const search = searchName.value.trim().toLowerCase();
    if (search) {
      filteredTasks = filteredTasks.filter((task) => task.name.toLowerCase().includes(search));
    }
  }

  taskList.innerHTML = '';

  filteredTasks.forEach((task) => {
    const li = document.createElement('li');
    li.classList.add('taskItem');
    li.innerHTML = `
      <div>
        <span class="property ${task.isImportant ? 'important' : 'standard'}">
          ${task.isImportant ? 'Важная' : 'Обычная'}
        </span>
        <span class="property ${task.isCompleted ? 'complete' : 'inProgress'}">
          ${task.isCompleted ? 'Выполнена' : 'В процессе'}
        </span>
      </div>
      <strong class="taskItem_name">${task.name}</strong>
      <span class="taskItem_info">${task.info || ''}</span>

      <div class="buttons">
        <button class="editBtn">Редактировать</button>
        <button class="delBtn">Удалить</button>
      </div>
    `;

    // Удаление
    li.querySelector('.delBtn')?.addEventListener('click', async () => {
      await taskAgent.deleteTask(task.id);
      renderTasks(applyFilter);
    });

    // Редактирование
    li.querySelector('.editBtn')?.addEventListener('click', () => {
      currentEditId = task.id;
      editName.value = task.name;
      editInfo.value = task.info;
      editImportant.checked = task.isImportant;
      editCompleted.checked = task.isCompleted;
      modalOverlay.style.display = 'flex';
    });

    taskList.appendChild(li);
  });
};

// Добавление
addTaskBtn.addEventListener('click', async () => {
  const newTask: CreateTask = {
    name: nameInput.value.trim(),
    info: infoInput.value.trim(),
    isImportant: importantInput.checked,
    isCompleted: completedInput.checked,
  };

  if (!newTask.name) return alert('Введите название задачи');

  await taskAgent.createTask(newTask);
  nameInput.value = '';
  infoInput.value = '';
  importantInput.checked = false;
  completedInput.checked = false;
  renderTasks();
});

// Сохранить изменения
saveEditBtn.addEventListener('click', async () => {
  if (currentEditId === null) return;

  if (!editName.value.trim()) {
    return alert('Введите название задачи');
  }

  await taskAgent.updateTask(currentEditId, {
    name: editName.value,
    info: editInfo.value,
    isImportant: editImportant.checked,
    isCompleted: editCompleted.checked,
  });

  modalOverlay.style.display = 'none';
  renderTasks();
});

// Закрыть модалку
cancelEditBtn.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

// Применить фильтры
applyFiltersBtn.addEventListener('click', () => renderTasks(true));

// Старт
renderTasks();
