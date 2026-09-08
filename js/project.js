import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
    auth,
    db
} from "./firebase.js";
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("id");
const projectNameElement =
    document.getElementById("projectName");
const projectDescriptionElement =
    document.getElementById("projectDescription");
const todoTasks =
    document.getElementById("todoTasks");
const progressTasks =
    document.getElementById("progressTasks");
const doneTasks =
    document.getElementById("doneTasks");
const todoCount =
    document.getElementById("todoCount");
const progressCount =
    document.getElementById("progressCount");
const doneCount =
    document.getElementById("doneCount");
const addTaskBtn =
    document.getElementById("addTaskBtn");
const taskModal =
    document.getElementById("taskModal");
const closeTaskModal =
    document.getElementById("closeTaskModal");
const taskForm =
    document.getElementById("taskForm");
const taskTitle =
    document.getElementById("taskTitle");
const taskDescription =
    document.getElementById("taskDescription");
const taskAssignee =
    document.getElementById("taskAssignee");
const taskDueDate =
    document.getElementById("taskDueDate");
const taskStatus =
    document.getElementById("taskStatus");
const taskMessage =
    document.getElementById("taskMessage");
let currentUser = null;
let currentProject = null;
let tasks = [];
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    currentUser = user;
    if (!projectId) {
        alert("Project not found.");
        window.location.href = "dashboard.html";
        return;
    }
    await loadProject();
    await loadTasks();
});
async function loadProject() {
    try {
        const projectRef =
            doc(db, "projects", projectId);
        const projectSnapshot =
            await getDoc(projectRef);
        if (!projectSnapshot.exists()) {
            alert("Project does not exist.");
            window.location.href =
                "dashboard.html";
            return;
        }
        const projectData =
            projectSnapshot.data();
        if (
            projectData.ownerId !==
            currentUser.uid
        ) {
            alert(
                "You don't have permission to open this project."
            );
            window.location.href =
                "dashboard.html";
            return;
        }
        currentProject = {
            id: projectSnapshot.id,
            ...projectData
        };
        displayProject();
    } catch (error) {
        console.error(
            "Error loading project:",
            error
        );
    }
}
function displayProject() {
    if (!currentProject) return;
    if (projectNameElement) {
        projectNameElement.textContent =
            currentProject.name;
    }
    if (projectDescriptionElement) {
        projectDescriptionElement.textContent =
            currentProject.description ||
            "Manage your project and tasks together.";
    }
}
async function loadTasks() {
    if (!currentUser || !projectId) return;
    try {
        const tasksRef =
            collection(db, "tasks");
        const tasksQuery =
            query(
                tasksRef,
                where(
                    "projectId",
                    "==",
                    projectId
                ),
                where(
                    "ownerId",
                    "==",
                    currentUser.uid
                )
            );
        const snapshot =
            await getDocs(tasksQuery);
        tasks = [];
        snapshot.forEach((taskDoc) => {
            tasks.push({
                id: taskDoc.id,
                ...taskDoc.data()
            });
        });
        displayTasks();
    } catch (error) {
        console.error(
            "Error loading tasks:",
            error
        );
        showTaskError();
    }
}
function displayTasks() {
    if (todoTasks)
        todoTasks.innerHTML = "";
    if (progressTasks)
        progressTasks.innerHTML = "";
    if (doneTasks)
        doneTasks.innerHTML = "";
    const todo =
        tasks.filter(
            task =>
                task.status === "todo"
        );
    const progress =
        tasks.filter(
            task =>
                task.status === "progress"
        );
    const done =
        tasks.filter(
            task =>
                task.status === "done"
        );
    if (todoCount)
        todoCount.textContent =
            todo.length;
    if (progressCount)
        progressCount.textContent =
            progress.length;
    if (doneCount)
        doneCount.textContent =
            done.length;
    todo.forEach(task => {
        renderTask(
            task,
            todoTasks
        );
    });
    progress.forEach(task => {
        renderTask(
            task,
            progressTasks
        );
    });
    done.forEach(task => {
        renderTask(
            task,
            doneTasks
        );
    });
    showEmptyMessage(
        todo,
        todoTasks,
        "No tasks yet."
    );
    showEmptyMessage(
        progress,
        progressTasks,
        "No tasks in progress."
    );
    showEmptyMessage(
        done,
        doneTasks,
        "No completed tasks."
    );
}
function renderTask(task, container) {
    if (!container) return;
    const card =
        document.createElement("div");
    card.className =
        "task-card";
    card.innerHTML = `
        <div class="task-card-content">
            <h4>
                ${escapeHTML(task.title || task.name)}
            </h4>
            ${
                task.description
                    ? `
                    <p>
                        ${escapeHTML(
                            task.description
                        )}
                    </p>
                    `
                    : ""
            }
            ${
                task.assignedTo
                    ? `
                    <span class="task-assignee">
                        👤 ${escapeHTML(
                            task.assignedTo
                        )}
                    </span>
                    `
                    : ""
            }
            ${
                task.dueDate
                    ? `
                    <span class="task-date">
                        📅 ${escapeHTML(
                            task.dueDate
                        )}
                    </span>
                    `
                    : ""
            }
        </div>
        <div class="task-actions">
            <button
                class="task-delete"
                data-id="${task.id}"
                title="Delete task"
            >
                🗑️
            </button>
        </div>
    `;
    const deleteBtn =
        card.querySelector(
            ".task-delete"
        );
    deleteBtn.addEventListener(
        "click",
        () => deleteTask(task.id)
    );
    container.appendChild(card);
}
function showEmptyMessage(
    array,
    container,
    message
) {
    if (!container) return;
    if (array.length === 0) {
        const empty =
            document.createElement("div");
        empty.className =
            "empty-task";
        empty.textContent =
            message;
        container.appendChild(empty);
    }
}
if (taskForm) {
    taskForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            if (!currentUser) {
                alert("Please login first.");
                return;
            }
            if (!projectId) {
                alert("Project not found.");
                return;
            }
            const title =
                taskTitle?.value.trim() || "";
            const description =
                taskDescription?.value.trim() || "";
            const assignedTo =
                taskAssignee?.value.trim() || "";
            const dueDate =
                taskDueDate?.value || "";
            const status =
                taskStatus?.value || "todo";
            if (!title) {
                if (taskMessage) {
                    taskMessage.textContent =
                        "Please enter a task title.";
                }
                return;
            }
            try {
                if (taskMessage) {
                    taskMessage.textContent =
                        "Creating task...";
                }
                await addDoc(
                    collection(db, "tasks"),
                    {
                        title: title,
                        name: title,
                        description:
                            description,
                        assignedTo:
                            assignedTo,
                        dueDate:
                            dueDate,
                        status:
                            status,
                        projectId:
                            projectId,
                        projectName:
                            currentProject?.name ||
                            "",
                        ownerId:
                            currentUser.uid,
                        ownerEmail:
                            currentUser.email,
                        createdAt:
                            serverTimestamp()
                    }
                );
                if (taskMessage) {
                    taskMessage.textContent =
                        "Task created successfully ✨";
                }
                taskForm.reset();
                setTimeout(() => {
                    closeTaskModalFn();
                }, 700);
                await loadTasks();
            } catch (error) {
                console.error(
                    "Error creating task:",
                    error
                );
                if (taskMessage) {
                    taskMessage.textContent =
                        "Could not create task.";
                }
            }
        }
    );
}
async function deleteTask(taskId) {
    if (!currentUser) return;
    const task =
        tasks.find(
            item =>
                item.id === taskId
        );
    if (!task) return;
    if (
        task.ownerId !==
        currentUser.uid
    ) {
        alert(
            "You cannot delete this task."
        );
        return;
    }
    const confirmDelete =
        confirm(
            "Delete this task?"
        );
    if (!confirmDelete) return;
    try {
        await deleteDoc(
            doc(
                db,
                "tasks",
                taskId
            )
        );
        await loadTasks();
    } catch (error) {
        console.error(
            "Error deleting task:",
            error
        );
        alert(
            "Could not delete task."
        );
    }
}
function openTaskModal() {
    if (!taskModal) return;
    if (taskMessage) {
        taskMessage.textContent = "";
    }
    taskModal.classList.add("show");
    if (taskTitle) {
        taskTitle.focus();
    }
}
function closeTaskModalFn() {
    if (!taskModal) return;
    taskModal.classList.remove("show");
}
if (addTaskBtn) {
    addTaskBtn.addEventListener(
        "click",
        openTaskModal
    );
}
if (closeTaskModal) {
    closeTaskModal.addEventListener(
        "click",
        closeTaskModalFn
    );
}
if (taskModal) {
    taskModal.addEventListener(
        "click",
        (event) => {
            if (
                event.target === taskModal
            ) {
                closeTaskModalFn();
            }
        }
    );
}
const backDashboardBtn =
    document.getElementById(
        "backDashboardBtn"
    );
if (backDashboardBtn) {
    backDashboardBtn.addEventListener(
        "click",
        () => {
            window.location.href =
                "dashboard.html";
        }
    );
}
function escapeHTML(value) {
    if (value === null ||
        value === undefined) {
        return "";
    }
    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}
function showTaskError() {
    const message =
        "Could not load tasks.";
    if (todoTasks) {
        todoTasks.innerHTML =
            `<div class="empty-task">${message}</div>`;
    }
    if (progressTasks) {
        progressTasks.innerHTML =
            `<div class="empty-task">${message}</div>`;
    }
    if (doneTasks) {
        doneTasks.innerHTML =
            `<div class="empty-task">${message}</div>`;
    }
}