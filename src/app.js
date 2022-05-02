"use strict";
var get = function (target) {
    return document.querySelector(target);
};
var root = get('#root');
var ul = document.createElement('ul');
var content = document.createElement('div');
var NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
var CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id.json';
var ajax = new XMLHttpRequest();
var store = {
    currentPage: 1,
    feeds: [],
};
var currentPage = store.currentPage, feeds = store.feeds;
var getData = function (url) {
    ajax.open('GET', url, false);
    ajax.send();
    return JSON.parse(ajax.response);
};
var makeFeeds = function (feeds) {
    for (var i = 0; i < feeds.length; i++) {
        feeds[i].read = false;
    }
    return feeds;
};
var updateView;
(function (html) {
    if (html) {
        root.innerHTML = html;
    }
    else {
        console.error('null');
    }
});
var newsFeed = function () {
    var newsList = feeds;
    var newsArr = [];
    var template = "\n        <div class=\"bg-gray-600 min-h-screen\">\n            <div class=\"bg-white text-xl\">\n                <div class=\"mx-auto px-4\">\n                    <div class=\"flex justify-between items-center py-6\">\n                        <div class=\"flex justify-start\">\n                            <h1 class=\"font-extrabold\">Hacker News</h1>\n                        </div>\n                        <div class=\"items-center justify-end\">    \n                            <a href=\"#/page/{{__prev_page__}}\" class=\"text-gray-500\">prev</a>\n                            <a href=\"#/page/{{__next_page__}}\" class=\"text-gray-500 ml-4\">next</a>\n                        </div>\n                    </div>\n                </div>\n            </div>\n            <div class=\"p-4 text-2xl text-gray-700\">    \n                {{__news_feed__}}\n            </div>\n        </div>\n    ";
    if (newsList.length === 0) {
        newsList = feeds = makeFeeds(getData(NEWS_URL));
    }
    for (var i = (currentPage - 1) * 10; i < (currentPage) * 10; i++) {
        newsArr.push("\n        <div class=\"p-6 ".concat(newsList[i].read ? 'bg-green-500' : 'bg-white', " mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100\">\n            <div class=\"flex\">\n                <div class=\"flex-auto\">\n                    <a href=\"#/show/").concat(newsList[i].id, "\">").concat(newsList[i].title, "</a>\n                </div>\n                <div class=\"text-center text-sm\">\n                    <div class=\"w-10 text-white ").concat(newsList[i].read ? 'bg-white text-gray-500' : 'bg-green-300', " rounded-lg px-0 py-2\">").concat(newsList[i].comments_count, "</div>\n                </div>\n            </div>\n            <div class=\"flex mt-3\">\n                <div class=\"grid grid-cols-3 text-sm text-gray-500\">\n                    <div><i class=\"fas fa-user mr-1\"></i>").concat(newsList[i].user, "</div>\n                    <div><i class=\"fas fa-heart mr-1\"></i>").concat(newsList[i].points, "</div>\n                    <div><i class=\"fas fa-clock mr-1\"></i>").concat(newsList[i].time_ago, "</div>\n                </div>\n            </div>\n        </div>\n        "));
    }
    template = template.replace("{{__news_feed__}}", newsArr.join(''));
    template = template.replace("{{__prev_page__}}", currentPage > 1 ? currentPage - 1 : 1);
    template = template.replace("{{__next_page__}}", currentPage < 3 ? currentPage + 1 : 3);
    if (root !== null) {
        root.innerHTML = template;
    }
};
//글 목록
var newsContent = function () {
    var id = location.hash.substring(7);
    var newsDetail = getData(CONTENT_URL.replace('@id', id));
    var template = "\n        <div class=\"bg-gray-600 min-h-screen pb-8\">\n            <div class=\"bg-white text-xl\">\n                <div class=\"mx-auto px-4\">\n                    <div class=\"flex justify-between items-center py-6\">\n                        <div class=\"flex justify-start\">\n                            <h1 class=\"font-extrabold\">Hacker News</h1>\n                        </div>\n                        <div class=\"items-center justify-end\">\n                            <a href=\"#/page/".concat(currentPage, "\" class=\"text-gray-500\">\n                                <i class=\"fa fa-times\"></i>\n                            </a>\n                        </div>\n                    </div>\n                </div>\n            </div>\n\n            <div class=\"h-full border rounded-xl bg-white m-6 p-4\">\n                <h2>").concat(newsDetail.title, "</h2>\n                <div class=\"text-gray-400 h-20\">\n                    ").concat(newsDetail.content, "\n                </div>\n                {{__comments__}}\n            </div>\n        </div>\n    ");
    for (var i = 0; i < feeds.length; i++) {
        if (feeds[i].id === Number(id)) {
            feeds[i].read = true;
            break;
        }
    }
    var makeComments = function (comments, called) {
        if (called === void 0) { called = 0; }
        var commentString = [];
        for (var i = 0; i < comments.length; i++) {
            commentString.push("\n                <div style=\"padding-left:".concat(called * 40, "px;\" class=\"mt-4\">\n                    <div class=\"text-gray-400\">\n                        <i class=\"fa fa-sort-up mr-2\"></i>\n                        <strong>").concat(comments[i].user, "</strong>\n                        ").concat(comments[i].time_ago, "\n                    </div>\n                    <p class=\"text-gray-700\">").concat(comments[i].content, "</p>\n                </div>\n            "));
            if (comments[i].comments.length > 0) {
                commentString.push(makeComments(comments[i].comments, called + 1));
            }
        }
        return commentString.join('');
    };
    if (root) {
        root.innerHTML = template.replace("{{__comments__}}", makeComments(newsDetail.comments));
    }
    else {
        console.error('null');
    }
};
//글 내용
var router = function () {
    var routePath = location.hash;
    if (routePath === '') {
        newsFeed();
    }
    else if (routePath.indexOf('#/page/') >= 0) {
        currentPage = Number(routePath.substring(7));
        newsFeed();
    }
    else {
        newsContent();
    }
};
//화면 처리기
router();
window.addEventListener('hashchange', router);
//# sourceMappingURL=app.js.map