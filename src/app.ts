interface Store {
    currentPage: number,
    feeds: NewsFeed[],
}

interface News {
    readonly id: number,
    readonly time_ago: string,
    readonly title: string,
    readonly url: string,
    readonly user: string,
    readonly content: string
}

interface NewsFeed extends News {
    readonly comments_count: number,
    read?: boolean,
    readonly points: number,
}

interface NewsDetail extends News {
    readonly comments: NewsComments[]
}

interface NewsComments extends News {
    readonly comments: [],
    readonly level: number
}

interface RouteInfo {
    path: string,
    page: View
}

function get(target: string): HTMLElement | null {
    return document.querySelector(target);
}

const root = get('#root');
const ul = document.createElement('ul');
const content = document.createElement('div');

const NEWS_URL: string = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL: string = 'https://api.hnpwa.com/v0/item/@id.json';

const ajax: XMLHttpRequest = new XMLHttpRequest();

let store: Store = {
    currentPage: 1,
    feeds: [],
}

let { currentPage, feeds } = store;

class Api {
    url: string;
    ajax: XMLHttpRequest;
    constructor(url: string) {
        this.url = url;
        this.ajax = new XMLHttpRequest();
    }

    protected getRequest<AjaxResponse>(): AjaxResponse {
        this.ajax.open('GET', this.url, false);
        this.ajax.send();

        return JSON.parse(this.ajax.response);
    }
}

class NewsFeedApi extends Api {
    getData(): NewsFeed[] {
        return this.getRequest<NewsFeed[]>();
    }
}

class NewsDetailApi extends Api {
    getData(): NewsDetail {
        return this.getRequest<NewsDetail>();
    }
}
function getData<AjaxResponse>(url: string): AjaxResponse {
    ajax.open('GET', url, false);
    ajax.send();
    return JSON.parse(ajax.response);
}



abstract class View {
    private root: HTMLElement;
    private template: string;
    private renderTemplate: string;
    private htmlList: string[];

    constructor(rootId: string, template: string) {
        const rootElement = get(rootId);
        if (!rootElement) {
            throw '최상위 root가 없어서 UI를 진행하지 못합니다.'
        }
        this.root = rootElement;
        this.template = template;
        this.renderTemplate = template;
        this.htmlList = [];
    }

    protected updateView(): void {
        this.root.innerHTML = this.renderTemplate;
        this.renderTemplate = this.template;
    }

    protected addHtml(htmlString: string): void {
        this.htmlList.push(htmlString);
    }

    protected getHtml(): string {
        const snapshot = this.htmlList.join('');
        this.clearHtmlList();
        return snapshot;
    }

    protected setTemplateData(key: string, value: string): void {
        this.renderTemplate = this.renderTemplate.replace(`{{__${key}__}}`, value);
    }

    private clearHtmlList(): void {
        this.htmlList = [];
    }

    abstract render(): void;
}


class Router {
    routeTable: RouteInfo[];
    defaultRoute: RouteInfo | null;
    constructor() {
        window.addEventListener('hashchange', this.route.bind(this));
        this.routeTable = [];
        this.defaultRoute = null;
    }

    setDefaultPage(page: View) {
        this.defaultRoute = { path: '', page: page }
    }

    addRoutePath(path: string, page: View): void {
        this.routeTable.push({ path: path, page: page, })
    }

    route() {
        const routePath = location.hash;
        if (routePath === '' && this.defaultRoute) {
            this.defaultRoute.page.render();
        }
        for (const routeInfo of this.routeTable) {
            if (routePath.indexOf(routeInfo.path) >= 0) {
                routeInfo.page.render();
                break;
            }
        }
    }
}

class NewsFeedView extends View {
    private api: NewsFeedApi;
    private feeds: NewsFeed[];
    constructor(rootId: string) {
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
        super(rootId, template);
        this.api = new NewsFeedApi(NEWS_URL);
        this.feeds = feeds;

        if (this.feeds.length === 0) {
            this.feeds = feeds = this.api.getData();
            this.makeFeeds();
        }


    }
    render() {
        currentPage = Number(location.hash.substring(7) || 1);
        for (let i = (currentPage - 1) * 10; i < (currentPage) * 10; i++) {
            const { id, read, title, user, time_ago, points, comments_count } = this.feeds[i];
            this.addHtml(`
            <div class="p-6 ${this.feeds[i].read ? 'bg-green-500' : 'bg-white'} mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
                <div class="flex">
                    <div class="flex-auto">
                        <a href="#/show/${id}">${title}</a>
                    </div>
                    <div class="text-center text-sm">
                        <div class="w-10 text-white ${read ? 'bg-white text-gray-500' : 'bg-green-300'} rounded-lg px-0 py-2">${comments_count}</div>
                    </div>
                </div>
                <div class="flex mt-3">
                    <div class="grid grid-cols-3 text-sm text-gray-500">
                        <div><i class="fas fa-user mr-1"></i>${user}</div>
                        <div><i class="fas fa-heart mr-1"></i>${points}</div>
                        <div><i class="fas fa-clock mr-1"></i>${time_ago}</div>
                    </div>
                </div>
            </div>
            `);
        }
        this.setTemplateData("news_feed", this.getHtml());
        this.setTemplateData("prev_page", String(currentPage > 1 ? currentPage - 1 : 1));
        this.setTemplateData("next_page", String(currentPage < 3 ? currentPage + 1 : 3));

        this.updateView();
    }

    private makeFeeds(): void {
        for (let i = 0; i < this.feeds.length; i++) {
            this.feeds[i].read = false;
        }
    }
}

class NewsDetailView extends View {
    constructor(rootId: string) {
        let template = `
        <div class="bg-gray-600 min-h-screen pb-8">
            <div class="bg-white text-xl">
                <div class="mx-auto px-4">
                    <div class="flex justify-between items-center py-6">
                        <div class="flex justify-start">
                            <h1 class="font-extrabold">Hacker News</h1>
                        </div>
                        <div class="items-center justify-end">
                            <a href="#/page/{{__currentPage__}}" class="text-gray-500">
                                <i class="fa fa-times"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="h-full border rounded-xl bg-white m-6 p-4">
                <h2>{{__title__}}</h2>
                <div class="text-gray-400 h-20">
                {{__content__}}
                </div>
                {{__comments__}}
            </div>
        </div>
    `;
        super(rootId, template);
    }
    render() {
        const id = location.hash.substring(7);
        const api = new NewsDetailApi(CONTENT_URL.replace('@id', id));
        const newsDetail = api.getData();

        for (let i = 0; i < feeds.length; i++) {
            if (feeds[i].id === Number(id)) {
                feeds[i].read = true;
                break;
            }
        }

        this.setTemplateData("comments", this.makeComments(newsDetail.comments));
        this.setTemplateData("currentPage", String(currentPage));
        this.setTemplateData("title", newsDetail.title);
        this.setTemplateData("content", newsDetail.content);
        this.updateView();
    }

    private makeComments(comments: NewsComments[]): string {
        for (let i = 0; i < comments.length; i++) {
            const comment: NewsComments = comments[i];
            this.addHtml(`
                <div style="padding-left:${comment.level * 40}px;" class="mt-4">
                    <div class="text-gray-400">
                        <i class="fa fa-sort-up mr-2"></i>
                        <strong>${comment.user}</strong>
                        ${comment.time_ago}
                    </div>
                    <p class="text-gray-700">${comment.content}</p>
                </div>
            `);
            if (comment.comments.length > 0) {
                this.addHtml(this.makeComments(comment.comments));
            }
        }
        return this.getHtml();
    }
}
const router: Router = new Router();
const newsFeedView = new NewsFeedView('#root');
const newsDetailView = new NewsDetailView('#root');

router.setDefaultPage(newsFeedView);
router.addRoutePath('/page/', newsFeedView);
router.addRoutePath('/show/', newsDetailView);
router.route();