import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    updateDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
    auth,
    db
} from "./firebase.js";
emailjs.init({
    publicKey: "V_wN-G0zboweJ9LN0"
});
let currentUser = null;
let projects = [];
let tasks = [];
let notificationUnsubscribe = null;
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userAvatar = document.getElementById("userAvatar");
const welcomeName = document.getElementById("welcomeName");
const teamName = document.getElementById("teamName");
const teamEmail = document.getElementById("teamEmail");
const teamAvatar = document.getElementById("teamAvatar");
const projectCount = document.getElementById("projectCount");
const taskCount = document.getElementById("taskCount");
const completedCount = document.getElementById("completedCount");
const memberCount = document.getElementById("memberCount");
const projectsContainer =
    document.getElementById("projectsContainer");
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
const logoutBtn =
    document.getElementById("logoutBtn");
const addProjectBtn =
    document.getElementById("addProjectBtn");
const addTaskBtn =
    document.getElementById("addTaskBtn");
const inviteBtn =
    document.getElementById("inviteBtn");
const projectModal =
    document.getElementById("projectModal");
const taskModal =
    document.getElementById("taskModal");
const inviteModal =
    document.getElementById("inviteModal");
const closeProjectModal =
    document.getElementById("closeProjectModal");
const closeTaskModal =
    document.getElementById("closeTaskModal");
const closeInviteModal =
    document.getElementById("closeInviteModal");
const projectForm =
    document.getElementById("projectForm");
const taskForm =
    document.getElementById("taskForm");
const inviteForm =
    document.getElementById("inviteForm");
const projectName =
    document.getElementById("projectName");
const projectDescription =
    document.getElementById("projectDescription");
const taskName =
    document.getElementById("taskName");
const taskProject =
    document.getElementById("taskProject");
const taskStatus =
    document.getElementById("taskStatus");
const inviteEmail =
    document.getElementById("inviteEmail");
const inviteMessage =
    document.getElementById("inviteMessage");
const menuBtn =
    document.getElementById("menuBtn");
const sidebar =
    document.getElementById("sidebar");
const notificationBtn =
    document.getElementById("notificationBtn");
const notificationPanel =
    document.getElementById("notificationPanel");
const notificationList =
    document.getElementById("notificationList");
const notificationDot =
    document.getElementById("notificationDot");
const markAllReadBtn =
    document.getElementById("markAllReadBtn");
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUser = user;
    displayUser(user);
    startNotifications();
    await loadProjects();
    await loadTasks();
});
function displayUser(user) {
    const name =
        user.displayName ||
        user.email?.split("@")[0] ||
        "User";
    const email =
        user.email || "";
    if (userName) {
        userName.textContent = name;
    }
    if (userEmail) {
        userEmail.textContent = email;
    }
    if (welcomeName) {
        welcomeName.textContent =
            `Let's get things done, ${name.split(" ")[0]}.`;
    }
    if (teamName) {
        teamName.textContent = name;
    }
    if (teamEmail) {
        teamEmail.textContent = email;
    }
    const firstLetter =
        name.charAt(0).toUpperCase();
    if (userAvatar) {
        userAvatar.textContent = firstLetter;
    }
    if (teamAvatar) {
        teamAvatar.textContent = firstLetter;
    }
    if (memberCount) {
        memberCount.textContent = "1";
    }
}
async function loadProjects() {
    if (!currentUser) return;
    try {
        const projectsRef =
            collection(db, "projects");
        const projectQuery =
            query(
                projectsRef,
                where(
                    "ownerId",
                    "==",
                    currentUser.uid
                )
            );
        const snapshot =
            await getDocs(projectQuery);
        projects = [];
        snapshot.forEach((projectDoc) => {
            projects.push({
                id: projectDoc.id,
                ...projectDoc.data()
            });
        });
        if (projectCount) {
            projectCount.textContent =
                projects.length;
        }
        displayProjects();
        updateProjectDropdown();
    } catch (error) {
        console.error(
            "Error loading projects:",
            error
        );
    }
}
function displayProjects() {
    if (!projectsContainer) return;
    if (projects.length === 0) {
        projectsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    📁
                </div>
                <h3>
                    No projects yet
                </h3>
                <p>
                    Create your first project to get started.
                </p>
                <button
                    class="primary-btn"
                    id="emptyProjectBtn"
                >
                    Create Project
                </button>
            </div>
        `;
        const emptyProjectBtn =
            document.getElementById(
                "emptyProjectBtn"
            );
        if (emptyProjectBtn) {
            emptyProjectBtn.addEventListener(
                "click",
                openProjectModal
            );
        }
        return;
    }
    projectsContainer.innerHTML = "";
    projects.forEach((project) => {
        const card =
            document.createElement("div");
        card.className =
            "project-card";
        card.innerHTML = `
            <div class="project-card-header">
                <div class="project-icon">
                    📁
                </div>
            </div>
            <h3>
                ${escapeHTML(project.name)}
            </h3>
            <p>
                ${escapeHTML(
            project.description ||
            "No description added."
        )}
            </p>
            <div class="project-footer">
                <span class="project-date">
                    ${formatDate(
            project.createdAt
        )}
                </span>
                <span class="project-tasks">
                    Open Project →
                </span>
            </div>
        `;
        card.addEventListener(
            "click",
            () => {
                window.location.href =
                    `project.html?id=${project.id}`;
            }
        );
        projectsContainer.appendChild(card);
    });
}
if (projectForm) {
    projectForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            if (!currentUser) return;
            const name =
                projectName.value.trim();
            const description =
                projectDescription.value.trim();
            if (!name) return;
            const message =
                document.getElementById(
                    "projectMessage"
                );
            try {
                if (message) {
                    message.textContent =
                        "Creating project...";
                }
                await addDoc(
                    collection(db, "projects"),
                    {
                        name,
                        description,
                        ownerId:
                            currentUser.uid,
                        ownerEmail:
                            currentUser.email,
                        createdAt:
                            serverTimestamp()
                    }
                );
                await createNotification(
                    "Project Created 📁",
                    `Your project "${name}" was created successfully.`,
                    "project"
                );
                if (message) {
                    message.textContent =
                        "Project created successfully ✨";
                }
                projectForm.reset();
                await loadProjects();
                setTimeout(
                    () => {
                        closeProjectModalFn();
                    },
                    700
                );
            } catch (error) {
                console.error(
                    "Project creation error:",
                    error
                );
                if (message) {
                    message.textContent =
                        error.message;
                }
            }
        }
    );
}
async function loadTasks() {
    if (!currentUser) return;
    try {
        const tasksRef =
            collection(db, "tasks");
        const taskQuery =
            query(
                tasksRef,
                where(
                    "ownerId",
                    "==",
                    currentUser.uid
                )
            );
        const snapshot =
            await getDocs(taskQuery);
        tasks = [];
        snapshot.forEach((taskDoc) => {
            tasks.push({
                id: taskDoc.id,
                ...taskDoc.data()
            });
        });
        if (taskCount) {
            taskCount.textContent =
                tasks.length;
        }
        if (completedCount) {
            completedCount.textContent =
                tasks.filter(
                    task =>
                        task.status === "done"
                ).length;
        }
        displayTasks();
    } catch (error) {
        console.error(
            "Error loading tasks:",
            error
        );
    }
}
function displayTasks() {
    if (
        !todoTasks ||
        !progressTasks ||
        !doneTasks
    ) {
        return;
    }
    todoTasks.innerHTML = "";
    progressTasks.innerHTML = "";
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
    if (todoCount) {
        todoCount.textContent =
            todo.length;
    }
    if (progressCount) {
        progressCount.textContent =
            progress.length;
    }
    if (doneCount) {
        doneCount.textContent =
            done.length;
    }
    todo.forEach(
        task => {
            renderTask(
                task,
                todoTasks
            );
        }
    );
    progress.forEach(
        task => {
            renderTask(
                task,
                progressTasks
            );
        }
    );
    done.forEach(
        task => {
            renderTask(
                task,
                doneTasks
            );
        }
    );
}
function renderTask(
    task,
    container
) {
    const card =
        document.createElement("div");
    card.className =
        "task-card";
    card.innerHTML = `
        <h4>
            ${escapeHTML(task.name)}
        </h4>
        <span class="task-project">
            ${escapeHTML(
        task.projectName ||
        "General Task"
    )}
        </span>
    `;
    container.appendChild(card);
}
if (taskForm) {
    taskForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            if (!currentUser) return;
            const name =
                taskName.value.trim();
            const status =
                taskStatus.value;
            const selectedProjectId =
                taskProject.value;
            if (!name) return;
            let selectedProject = null;
            if (selectedProjectId) {
                selectedProject =
                    projects.find(
                        project =>
                            project.id ===
                            selectedProjectId
                    );
            }
            const projectDisplayName =
                selectedProject?.name ||
                "General Task";
            const message =
                document.getElementById(
                    "taskMessage"
                );
            try {
                if (message) {
                    message.textContent =
                        "Adding task...";
                }
                await addDoc(
                    collection(db, "tasks"),
                    {
                        name,
                        status,
                        projectId:
                            selectedProjectId ||
                            null,
                        projectName:
                            projectDisplayName,
                        ownerId:
                            currentUser.uid,
                        ownerEmail:
                            currentUser.email,
                        createdAt:
                            serverTimestamp()
                    }
                );
                await createNotification(
                    "Task Added ✓",
                    `Task "${name}" has been added to ${projectDisplayName}.`,
                    "task"
                );
                if (message) {
                    message.textContent =
                        "Task added successfully ✨";
                }
                taskForm.reset();
                await loadTasks();
                setTimeout(
                    () => {
                        closeTaskModalFn();
                    },
                    700
                );
            } catch (error) {
                console.error(
                    "Task creation error:",
                    error
                );
                if (message) {
                    message.textContent =
                        error.message;
                }
            }
        }
    );
}
function updateProjectDropdown() {
    if (!taskProject) return;
    taskProject.innerHTML = `
        <option value="">
            General Task
        </option>
    `;
    projects.forEach(
        (project) => {
            const option =
                document.createElement(
                    "option"
                );
            option.value =
                project.id;
            option.textContent =
                project.name;
            taskProject.appendChild(
                option
            );
        }
    );
}
function openProjectModal() {
    if (!projectModal) return;
    projectModal.classList.add(
        "show"
    );
    if (projectName) {
        projectName.focus();
    }
}
function closeProjectModalFn() {
    if (!projectModal) return;
    projectModal.classList.remove(
        "show"
    );
}
function openTaskModal() {
    if (!taskModal) return;
    updateProjectDropdown();
    taskModal.classList.add(
        "show"
    );
    if (taskName) {
        taskName.focus();
    }
}
function closeTaskModalFn() {
    if (!taskModal) return;
    taskModal.classList.remove(
        "show"
    );
}
function openInviteModal() {
    if (!inviteModal) return;
    inviteModal.classList.add(
        "show"
    );
    if (inviteMessage) {
        inviteMessage.textContent =
            "";
    }
    if (inviteEmail) {
        inviteEmail.focus();
    }
}
function closeInviteModalFn() {
    if (!inviteModal) return;
    inviteModal.classList.remove(
        "show"
    );
}
if (addProjectBtn) {
    addProjectBtn.addEventListener(
        "click",
        openProjectModal
    );
}
if (closeProjectModal) {
    closeProjectModal.addEventListener(
        "click",
        closeProjectModalFn
    );
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
if (inviteBtn) {
    inviteBtn.addEventListener(
        "click",
        openInviteModal
    );
}
if (closeInviteModal) {
    closeInviteModal.addEventListener(
        "click",
        closeInviteModalFn
    );
}
if (projectModal) {
    projectModal.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                projectModal
            ) {
                closeProjectModalFn();
            }
        }
    );
}
if (taskModal) {
    taskModal.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                taskModal
            ) {
                closeTaskModalFn();
            }
        }
    );
}
if (inviteModal) {
    inviteModal.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                inviteModal
            ) {
                closeInviteModalFn();
            }
        }
    );
}
if (logoutBtn) {
    logoutBtn.addEventListener(
        "click",
        async () => {
            try {
                await signOut(auth);
                if (notificationUnsubscribe) {
                    notificationUnsubscribe();
                }
                window.location.href =
                    "index.html";
            } catch (error) {
                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}
if (
    menuBtn &&
    sidebar
) {
    menuBtn.addEventListener(
        "click",
        () => {
            sidebar.classList.toggle(
                "open"
            );
        }
    );
}
if (inviteForm) {
    inviteForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            if (!currentUser) {
                if (inviteMessage) {
                    inviteMessage.textContent =
                        "Please login first.";
                }
                return;
            }
            const email =
                inviteEmail.value
                    .trim()
                    .toLowerCase();
            if (!email) {
                if (inviteMessage) {
                    inviteMessage.textContent =
                        "Please enter an email address.";
                }
                return;
            }
            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (
                !emailPattern.test(email)
            ) {
                if (inviteMessage) {
                    inviteMessage.textContent =
                        "Please enter a valid email address.";
                }
                return;
            }
            try {
                if (inviteMessage) {
                    inviteMessage.textContent =
                        "Creating invitation...";
                }
                const inviterName =
                    currentUser.displayName ||
                    currentUser.email?.split("@")[0] ||
                    "Velora Team";
                const invitationRef =
                    await addDoc(
                        collection(
                            db,
                            "invitations"
                        ),
                        {
                            invitedEmail:
                                email,
                            invitedBy:
                                currentUser.uid,
                            inviterEmail:
                                currentUser.email,
                            inviterName:
                                inviterName,
                            status:
                                "pending",
                            createdAt:
                                serverTimestamp()
                        }
                    );
                const inviteLink =
                    `${window.location.origin}/signup.html?invite=${invitationRef.id}`;
                if (inviteMessage) {
                    inviteMessage.textContent =
                        "Sending invitation...";
                }
                const templateParams = {
                    to_email:
                        email,
                    to_name:
                        email.split("@")[0],
                    inviter_name:
                        inviterName,
                    from_email:
                        currentUser.email,
                    invite_link:
                        inviteLink
                };
                await emailjs.send(
                    "service_78ubc0j",
                    "template_obn4tll",
                    templateParams
                );
                await createNotification(
                    "Invitation Sent 💌",
                    `An invitation was sent to ${email}.`,
                    "invitation"
                );
                if (inviteMessage) {
                    inviteMessage.textContent =
                        "Invitation sent successfully! 💌";
                }
                inviteForm.reset();
            } catch (error) {
                console.error(
                    "Invitation error:",
                    error
                );
                if (inviteMessage) {
                    inviteMessage.textContent =
                        error?.text ||
                        error?.message ||
                        "Could not send invitation.";
                }
            }
        }
    );
}
function startNotifications() {
    if (
        !currentUser ||
        !notificationList
    ) {
        return;
    }
    if (notificationUnsubscribe) {
        notificationUnsubscribe();
    }
    const notificationsQuery =
        query(
            collection(
                db,
                "notifications"
            ),
            where(
                "userId",
                "==",
                currentUser.uid
            )
        );
    notificationUnsubscribe =
        onSnapshot(
            notificationsQuery,
            (snapshot) => {
                const notifications = [];
                snapshot.forEach(
                    (notificationDoc) => {
                        notifications.push({
                            id:
                                notificationDoc.id,
                            ...notificationDoc.data()
                        });
                    }
                );
                notifications.sort(
                    (a, b) => {
                        const timeA =
                            a.createdAt
                                ?.toMillis?.() ||
                            0;
                        const timeB =
                            b.createdAt
                                ?.toMillis?.() ||
                            0;
                        return timeB - timeA;
                    }
                );
                renderNotifications(
                    notifications
                );
            },
            (error) => {
                console.error(
                    "Notification listener error:",
                    error
                );
            }
        );
}
function renderNotifications(
    notifications
) {
    if (!notificationList) return;
    if (
        notifications.length === 0
    ) {
        notificationList.innerHTML = `
            <div class="no-notifications">
                No notifications yet ✨
            </div>
        `;
        if (notificationDot) {
            notificationDot.style.display =
                "none";
        }
        return;
    }
    const unreadCount =
        notifications.filter(
            notification =>
                notification.read !== true
        ).length;
    if (notificationDot) {
        notificationDot.style.display =
            unreadCount > 0
                ? "block"
                : "none";
    }
    notificationList.innerHTML =
        "";
    notifications.forEach(
        (notification) => {
            const item =
                document.createElement(
                    "div"
                );
            item.className =
                `notification-item ${notification.read !== true
                    ? "unread"
                    : ""
                }`;
            item.innerHTML = `
                <div class="notification-icon">
                    ${getNotificationIcon(
                notification.type
            )}
                </div>
                <div class="notification-content">
                    <strong>
                        ${escapeHTML(
                notification.title ||
                "Notification"
            )}
                    </strong>
                    <p>
                        ${escapeHTML(
                notification.message ||
                ""
            )}
                    </p>
                    <span class="notification-time">
                        ${formatNotificationTime(
                notification.createdAt
            )}
                    </span>
                </div>
            `;
            item.addEventListener(
                "click",
                async () => {
                    if (
                        notification.read ===
                        true
                    ) {
                        return;
                    }
                    try {
                        await updateDoc(
                            doc(
                                db,
                                "notifications",
                                notification.id
                            ),
                            {
                                read: true
                            }
                        );
                    } catch (error) {
                        console.error(
                            "Error marking notification as read:",
                            error
                        );
                    }
                }
            );
            notificationList.appendChild(
                item
            );
        }
    );
}
function getNotificationIcon(type) {
    if (type === "project")
        return "📁";
    if (type === "task")
        return "✓";
    if (type === "invitation")
        return "💌";
    if (type === "member")
        return "👥";
    if (type === "success")
        return "🎉";
    return "🔔";
}
function formatNotificationTime(
    timestamp
) {
    if (!timestamp)
        return "Just now";
    try {
        const date =
            timestamp.toDate();
        const now =
            new Date();
        const difference =
            Math.floor(
                (now - date) / 1000
            );
        if (difference < 60) {
            return "Just now";
        }
        if (difference < 3600) {
            return `${Math.floor(
                difference / 60
            )} min ago`;
        }
        if (difference < 86400) {
            return `${Math.floor(
                difference / 3600
            )} hr ago`;
        }
        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short"
            }
        );
    } catch {
        return "Recently";
    }
}
async function createNotification(
    title,
    message,
    type = "system"
) {
    if (!currentUser)
        return;
    try {
        await addDoc(
            collection(
                db,
                "notifications"
            ),
            {
                userId:
                    currentUser.uid,
                title,
                message,
                type,
                read: false,
                createdAt:
                    serverTimestamp()
            }
        );
    } catch (error) {
        console.error(
            "Notification creation error:",
            error
        );
    }
}
if (
    notificationBtn &&
    notificationPanel
) {
    notificationBtn.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
            notificationPanel.classList.toggle(
                "show"
            );
        }
    );
}
document.addEventListener(
    "click",
    (event) => {
        if (
            notificationPanel &&
            notificationBtn &&
            !notificationPanel.contains(
                event.target
            ) &&
            !notificationBtn.contains(
                event.target
            )
        ) {
            notificationPanel.classList.remove(
                "show"
            );
        }
    }
);
if (markAllReadBtn) {
    markAllReadBtn.addEventListener(
        "click",
        async () => {
            if (!currentUser)
                return;
            try {
                const notificationsQuery =
                    query(
                        collection(
                            db,
                            "notifications"
                        ),
                        where(
                            "userId",
                            "==",
                            currentUser.uid
                        )
                    );
                const snapshot =
                    await getDocs(
                        notificationsQuery
                    );
                const updates = [];
                snapshot.forEach(
                    (notificationDoc) => {
                        if (
                            notificationDoc.data()
                                .read !== true
                        ) {
                            updates.push(
                                updateDoc(
                                    doc(
                                        db,
                                        "notifications",
                                        notificationDoc.id
                                    ),
                                    {
                                        read: true
                                    }
                                )
                            );
                        }
                    }
                );
                await Promise.all(
                    updates
                );
            } catch (error) {
                console.error(
                    "Mark all notifications error:",
                    error
                );
            }
        }
    );
}
function formatDate(timestamp) {
    if (!timestamp) {
        return "Just now";
    }
    try {
        const date =
            timestamp.toDate();
        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    } catch {
        return "Recently";
    }
}
function escapeHTML(value) {
    if (!value)
        return "";
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
