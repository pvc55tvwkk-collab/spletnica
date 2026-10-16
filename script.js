"use strict";

/* ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ===== */

const $ = (selector) => document.querySelector(selector);

const state = {
    user: null,
    posts: [],
    messages: {},
    friends: [],
    requests: [],
    incomingMessages: [],
    conversations: {},
    nearbyCities: [],
    blockedUsers: [],
    reports: []
};

const cities = [
    "Октябрьский",
    "Уфа",
    "Туймазы",
    "Бугульма",
    "Казань",
    "Москва",
    "Санкт-Петербург"
];

const demoUsers = [
    { nickname: "lisa", city: "Октябрьский" },
    { nickname: "angel", city: "Октябрьский" },
    { nickname: "mila", city: "Уфа" },
    { nickname: "darkstar", city: "Туймазы" },
    { nickname: "sonya", city: "Октябрьский" },
    { nickname: "maxx", city: "Бугульма" },
    { nickname: "viki", city: "Казань" }
];

let demoCode = "";
let currentConversation = null;

/* ===== ХРАНЕНИЕ ===== */

function saveState() {
    try {
        localStorage.setItem("spletnitsa-demo", JSON.stringify(state));
    } catch (error) {
        console.warn("Хранилище недоступно. Данные временные.");
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem("spletnitsa-demo");
        if (!saved) return;

        const data = JSON.parse(saved);
        if (!data || typeof data !== "object") return;

        state.user = data.user || null;
        state.posts = Array.isArray(data.posts) ? data.posts : [];
        state.messages = data.messages || {};
        state.friends = Array.isArray(data.friends) ? data.friends : [];
        state.requests = Array.isArray(data.requests) ? data.requests : [];
        state.incomingMessages = Array.isArray(data.incomingMessages)
            ? data.incomingMessages : [];
        state.conversations = data.conversations || {};
        state.nearbyCities = Array.isArray(data.nearbyCities)
            ? data.nearbyCities : [];
        state.blockedUsers = Array.isArray(data.blockedUsers)
            ? data.blockedUsers : [];
        state.reports = Array.isArray(data.reports) ? data.reports : [];
    } catch (error) {
        console.warn("Не удалось загрузить сохранённые данные.");
    }
}

/* ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===== */

function makeElement(tag, className = "", text = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== "") element.textContent = text;
    return element;
}

function createId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
}

function notify(message) {
    alert(message);
}

/* ===== РЕГИСТРАЦИЯ ===== */

function showRegistrationForm(formToShow) {
    const forms = [
        $("#phone-form"),
        $("#code-form"),
        $("#profile-form")
    ];

    forms.forEach(function (form) {
        if (!form) return;

        const shouldShow = form.id === formToShow;
        form.hidden = !shouldShow;
        form.style.display = shouldShow ? "" : "none";
    });
}

const phoneForm = $("#phone-form");
const codeForm = $("#code-form");
const profileForm = $("#profile-form");

if (phoneForm && codeForm && profileForm) {
    showRegistrationForm("phone-form");

    phoneForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const phone = $("#phone").value.trim();

        if (!/^\+?[\d\s()\-]{7,20}$/.test(phone)) {
            notify("Проверь номер телефона.");
            return;
        }

        demoCode = String(
            Math.floor(100000 + Math.random() * 900000)
        );

        let codeNotice = $("#demo-code-notice");

        if (!codeNotice) {
            codeNotice = makeElement("div", "notice");
            codeNotice.id = "demo-code-notice";
            codeForm.prepend(codeNotice);
        }

        codeNotice.textContent =
            "ДЕМО-КОД: " + demoCode +
            ". Настоящее SMS не отправлялось.";

        showRegistrationForm("code-form");
        $("#sms-code").value = "";
    });

    codeForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const enteredCode = $("#sms-code").value.trim();

        if (!demoCode || enteredCode !== demoCode) {
            notify("Неверный код. Введи цифры, показанные на экране.");
            return;
        }

        showRegistrationForm("profile-form");
    });

    profileForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const nickname = $("#nickname").value.trim();
        const city = $("#city").value;
        const password = $("#password").value;

        if (nickname.length < 2) {
            notify("Никнейм должен содержать минимум 2 символа.");
            return;
        }

        if (!cities.includes(city)) {
            notify("Выбери город из списка.");
            return;
        }

        if (password.length < 8) {
            notify("Пароль должен содержать минимум 8 символов.");
            return;
        }

        state.user = {
            nickname: nickname,
            city: city,
            phone: $("#phone").value.trim()
        };

        saveState();
        showMainApp();
    });
} else {
    console.error(
        "Регистрация не найдена. Проверь ID phone-form, code-form и profile-form in HTML."
    );
}

/* ===== НАВИГАЦИЯ ===== */

function showPage(pageId) {
    const page = document.getElementById(pageId);

    if (!page || !page.classList.contains("page")) return;

    document.querySelectorAll("#main-screen .page").forEach(function (item) {
        item.hidden = item.id !== pageId;
    });

    document.querySelectorAll("#bottom-navigation button").forEach(
        function (button) {
            button.classList.toggle(
                "active",
                button.dataset.page === pageId
            );
        }
    );

    if (pageId === "feed-screen") renderPosts();
    if (pageId === "city-chat-screen") renderCityChat();
    if (pageId === "friends-screen") renderFriends();
    if (pageId === "messages-screen") renderConversations();
    if (pageId === "calls-screen") renderCallFriends();
    if (pageId === "nearby-cities-screen") renderNearbyCities();
    if (pageId === "profile-screen") renderProfile();
}

const bottomNavigation = $("#bottom-navigation");

if (bottomNavigation) {
    bottomNavigation.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-page]");
        if (button) showPage(button.dataset.page);
    });
}

function showMainApp() {
    $("#registration-screen").hidden = true;
    $("#main-screen").hidden = false;

    $("#current-city").textContent = "Твой город: " + state.user.city;
    $("#chat-city-name").textContent =
        "Общий чат города " + state.user.city;

    renderProfile();
    showPage("feed-screen");
}

/* ===== ЛЕНТА ===== */

$("#post-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const text = $("#post-text").value.trim();
    if (!text || !state.user) return;

    state.posts.unshift({
        id: createId(),
        author: state.user.nickname,
        city: state.user.city,
        text: text,
        date: new Date().toLocaleString("ru-RU"),
        likes: [],
        comments: []
    });

    $("#post-text").value = "";
    saveState();
    renderPosts();
});

function renderPosts() {
    const container = $("#posts-list");
    container.replaceChildren();

    if (!state.user) return;

    const posts = state.posts.filter(function (post) {
        return post.city === state.user.city;
    });

    if (!posts.length) {
        container.append(makeElement(
            "div", "empty-state",
            "Публикаций пока нет. Напиши первый пост!"
        ));
        return;
    }

    posts.forEach(function (post) {
        const card = makeElement("article", "post");
        card.append(
            makeElement("strong", "", post.author),
            makeElement("small", "", " " + post.date),
            makeElement("p", "", post.text)
        );

        const actions = makeElement("div", "post-actions");
        const liked = post.likes.includes(state.user.nickname);

        const likeButton = makeElement(
            "button", "", (liked ? "♥ " : "♡ ") + post.likes.length
        );

        likeButton.addEventListener("click", function () {
            if (liked) {
                post.likes = post.likes.filter(
                    name => name !== state.user.nickname
                );
            } else {
                post.likes.push(state.user.nickname);
            }
            saveState();
            renderPosts();
        });

        const commentButton = makeElement("button", "", "Комментировать");

        commentButton.addEventListener("click", function () {
            const comment = prompt("Твой комментарий:");

            if (comment && comment.trim()) {
                post.comments.push({
                    author: state.user.nickname,
                    text: comment.trim()
                });
                saveState();
                renderPosts();
            }
        });

        actions.append(likeButton, commentButton);
        card.append(actions);

        post.comments.forEach(function (comment) {
            card.append(makeElement(
                "p", "", comment.author + ": " + comment.text
            ));
        });

        container.append(card);
    });
}

/* ===== ГОРОДСКОЙ ЧАТ ===== */

function getCityMessages() {
    if (!Array.isArray(state.messages[state.user.city])) {
        state.messages[state.user.city] = [];
    }
    return state.messages[state.user.city];
}

$("#city-message-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const input = $("#city-message-input");
    const text = input.value.trim();

    if (!text || !state.user) return;

    getCityMessages().push({
        author: state.user.nickname,
        text: text,
        date: new Date().toLocaleTimeString("ru-RU", {