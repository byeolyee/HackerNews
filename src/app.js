const get = (target) => {
    return document.querySelector(target);
}

const root = get('#root');
const ul = document.createElement('ul');
const content = document.createElement('div');

const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id.json';

const ajax = new XMLHttpRequest();

let store = {
    currentPage: 1,
    feeds: [],
}

let { currentPage, feeds } = store;

const getData = (url) => {
    ajax.open('GET', url, false);
    ajax.send();
    return JSON.parse(ajax.response);
}

const makeFeeds = (feeds) => {
    for (let i = 0; i < feeds.length; i++) {
        feeds[i].read = false;
    }
    return feeds;
}

const newsFeed = () => {
    let newsList = feeds;
    const newsArr = [];
    let template = `
        <div class="bg-gray-600 min-h-screen">
            <div class="bg-white text-xl">
                <div class="mx-auto px-4">
                    <div class="flex justify-between items-center py-6">
                        <div class="flex justify-start">
                            <h1 class="font-extrabold">Hacker News</h1>
                        </div>
                        <div class="items-center justify-end">    
                            <a href="#/page/{{__prev_page__}}" class="text-gray-500">prev</a>
                            <a href="#/page/{{__next_page__}}" class="text-gray-500 ml-4">next</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-4 text-2xl text-gray-700">    
                {{__news_feed__}}
            </div>
        </div>
    `;

    if (newsList.length === 0) {
        newsList = feeds = makeFeeds(getData(NEWS_URL));
    }

    for (let i = (currentPage - 1) * 10; i < (currentPage) * 10; i++) {
        newsArr.push(`
        <div class="p-6 ${newsList[i].read ? 'bg-green-500' : 'bg-white'} mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
            <div class="flex">
                <div class="flex-auto">
                    <a href="#/show/${newsList[i].id}">${newsList[i].title}</a>
                </div>
                <div class="text-center text-sm">
                    <div class="w-10 text-white ${newsList[i].read ? 'bg-white text-gray-500' : 'bg-green-300'} rounded-lg px-0 py-2">${newsList[i].comments_count}</div>
                </div>
            </div>
            <div class="flex mt-3">
                <div class="grid grid-cols-3 text-sm text-gray-500">
                    <div><i class="fas fa-user mr-1"></i>${newsList[i].user}</div>
                    <div><i class="fas fa-heart mr-1"></i>${newsList[i].points}</div>
                    <div><i class="fas fa-clock mr-1"></i>${newsList[i].time_ago}</div>
                </div>
            </div>
        </div>
        `);
    }
    template = template.replace("{{__news_feed__}}", newsArr.join(''));
    template = template.replace("{{__prev_page__}}", currentPage > 1 ? currentPage - 1 : 1);
    template = template.replace("{{__next_page__}}", currentPage < 3 ? currentPage + 1 : 3);
    root.innerHTML = template;
}
//글 목록

const newsContent = () => {
    const id = location.hash.substring(7);
    const newsDetail = getData(CONTENT_URL.replace('@id', id));
    let template = `
        <div class="bg-gray-600 min-h-screen pb-8">
            <div class="bg-white text-xl">
                <div class="mx-auto px-4">
                    <div class="flex justify-between items-center py-6">
                        <div class="flex justify-start">
                            <h1 class="font-extrabold">Hacker News</h1>
                        </div>
                        <div class="items-center justify-end">
                            <a href="#/page/${currentPage}" class="text-gray-500">
                                <i class="fa fa-times"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="h-full border rounded-xl bg-white m-6 p-4">
                <h2>${newsDetail.title}</h2>
                <div class="text-gray-400 h-20">
                    ${newsDetail.content}
                </div>
                {{__comments__}}
            </div>
        </div>
    `;

    for (let i = 0; i < feeds.length; i++) {
        if (feeds[i].id === Number(id)) {
            feeds[i].read = true;
            break;
        }
    }
    const makeComments = (comments, called = 0) => {
        const commentString = [];
        for (let i = 0; i < comments.length; i++) {
            commentString.push(`
                <div style="padding-left:${called * 40}px;" class="mt-4">
                    <div class="text-gray-400">
                        <i class="fa fa-sort-up mr-2"></i>
                        <strong>${comments[i].user}</strong>
                        ${comments[i].time_ago}
                    </div>
                    <p class="text-gray-700">${comments[i].content}</p>
                </div>
            `);
            if (comments[i].comments.length > 0) {
                commentString.push(makeComments(comments[i].comments, called + 1));
            }
        }
        return commentString.join('');
    }
    root.innerHTML = template.replace("{{__comments__}}", makeComments(newsDetail.comments));
}
//글 내용

const router = () => {
    const routePath = location.hash;
    if (routePath === '') {
        newsFeed();
    } else if (routePath.indexOf('#/page/') >= 0) {
        currentPage = Number(routePath.substring(7));
        newsFeed();
    } else {
        newsContent();
    }
}
//화면 처리기

router();
window.addEventListener('hashchange', router);