

function get_header(){

    const exchange_to_flag = exchange => {
        switch (exchange) {
            case "tor":
            case "van":
                return "flag-ca";
            case "stu":
            case "fra":
            case "mun":
                return "flag-de";
            case "lse":
            case "iob":
                return "flag-gb";
            case "mex":
                return "flag-mx";
            default:
                return "flag-us";
        }
    }

    const results = new Component('#search-results', {
        data: {
            rows: null,
            open: false,

        },
	template: ({ rows, open }) => {

            if (!open){
                return html`<div style="display:none"></div>`
            }
            if (rows){
                if (rows.length > 0){
                    return html`
                        <ul style="list-style: none;"> ${rows.map(({ symbol, exchange, name, code }, i) => html`
                            <li class="search-results-item" onclick="select_symbol()" key="${i}">
                                <div class="d--f fd--r jc--sb pe--n">
                                    <div class="d--f fd--r jc--fs g--sm">
                                        <p class="tt--u t fw--b blue"><b>${symbol}</b></p>
                                        <p style="max-width: 55vw;" class="tt--c t">${name}</p>
                                    </div>
                                    <div class="flag-containor d--f fd--r jc--fe g--sm">
                                        <p class="tt--u t">${code}</p>
                                        ${get_svg(exchange_to_flag(code), 'class="svg-flag"')}
                                    </div>
                                </div>
                            </li>`)}
                        </ul>`;
                } else {
                    return html`
                    	<div class="d--f fd--c ai--c ptb--lg g--xxs">
                        	<h3>No symbols match your search</h3>
                       		${get_svg("inverse-smile", 'class="svg-inverse-smile"')}
                    	</div>`;
                }
            } else {
                return html`
                    <ul>
                        <li class="search-results-pre">Search a symbol...</li>
                    </ul>`;
            }
        },
        listeners: {
            select_symbol: function(e){

                const k = Number(e.target.getAttribute("key"));
                const s = results.data.rows[k];

                if (!app.data.security.symbol){
                    app.data.security = s ;
                    app.view.active?.name ? app.view.change(app.view.active.name) : app.view.change("overview");
                } else {
                    app.data.security = s ;
                    app.view.active.component?.do("fetch_data");
                }

                const keys = ['name', 'symbol', 'exchange']

                header.elem.querySelectorAll(".security-details").forEach( ( p, i ) => {
                    p.innerText = s[keys[i]];
                })

                setTimeout(() => {
                    results.do("close")
                    Hamburger.close();
                    
                }, 100)

            }
        },
        setters: {
            update_results: function(props, rows){
                this.data = {
                    rows,
                    open: true
                }
            },
            toggle_open: function() {
                this.data.open = !this.data.open
            },
            close: function(){
                this.data.open = false;
            }
        }
    });

    const header = new Component('header', {
        template: () => {
            //const { name, exchange, symbol } = app.data?.security;
            const name="test";
            const exchange="test";
            const symbol="test";

            return html`
                <div onclick="handle_click()" id="header-top" class="d--f fd--r ai--c jc--sb">
                    <div class="d--f" id="header-logo">
                        <img
                            width=35
                            height=30
                            alt="FV"
                            style="max-width: unset"
                            src="imgs/logo_mobile.png"
                        >
                    </div>
                    <div id="header-search">
                        <input
                            onblur="keep_focus()"
                            id="search"
                            onfocus="search_focus()"
                            autocapitalize="none"
                            onkeyup="search_handle_input()"
                            autocomplete="off"
                            autocorrect="off"
                            name="search_query"
                            type="text"
                            spellcheck="false"
                            placeholder="Search"
                            aria-label="Search"
                        >
                        <button class="active" id="header-search-button">
                            ${get_svg("search")}
                        </button>
                        <div id="search-results"></div>
                    </div>
                    <div class="menu-header">
                        <button id="menu-button">
                            ${get_svg("menu-button")}
                        </button>
                    </div>
                </div>
                <div id="header-bottom" class="d--f fd--r ai--c jc--sb">
                    <h3 class="d--f ai--c">
                        ${get_svg("activity", 'class="svg-activity"')}
                        ${get_svg("spinner", 'class="hide svg-loading"')}
                        <p class="security-details ml--xs tt--c t" style="max-width: 55vw;">${name || "company"}</p>
                    </h3>
                    <h3 class="d--f ai--c jc--fs">
                        <p class="security-details tt--u blue t" style="font-size:1.3rem"><span style="font-weight: 100;margin-right: .05rem;">$</span>${symbol || "SYMBL"}</p>
                        ${get_svg("dot", 'class="svg-dot" viewBox="0 0 16 16"')}
                        <p class="security-details t" style="font-weight:100;font-size:1.3rem">${exchange || "exchange"}</p>
                    </h3>
                </div>
                <div id="menu" class="app-min">
                    <div id="menu-home"></div>
                    <div id="menu-viewer">
                        <div id="menu-viewer-cover">
                            <div class="menu-header">
                                <button class="return no-select" onclick="menu_return()">${get_svg("arrow-left", 'class="svg-return"')}</button>
                            </div>
                            <div id="menu-viewer-component"></div>
                        </div>
                    </div>
                </div>`;
        },
        listeners: {
            handle_click: function(e){

                e.preventDefault();

                if (e.target.closest("#header-logo")){
                    location.reload();

                } else if (e.target.closest("#menu-button")) {

                    const { is_open, is_busy, mode } = Hamburger.state()

                    //The Hambuger animation will break and come out of sync if we don't bounce
                    //spammy clicks
                    if (is_busy) return console.log("Kicked out, slow your roll dawg")

                    Hamburger.busy(true);

                    //close search mode
                    if ( is_open === true && mode === "search"){
                        Hamburger.close();
                        results.do("close");
                        Q("#search").value = "";
                    //close menu mode
                    } else if (is_open === true && mode === "menu"){
                        Hamburger.close();
                    //open menu
                    } else if (is_open === false && mode === "menu"){
                        Hamburger.open("menu");
                    }

                    Hamburger.busy(false);

                } else {
                    //open search mode;
                    Q("#search").focus();
                }

            },
            menu_return: function(e){
                Q("#menu").classList.replace("active-viewer", "active-home");
                Q("#menu-viewer-cover").style.opacity = 0;
            },
            keep_focus: function({ target: el }){
                if (Hamburger.state()['mode'] === "search" && el.id === "search"){
                    el.focus();
                }
            },
            search_focus: function(){
                if (Hamburger.state()['is_open']) return;
                Hamburger.open("search");
                results.do("update_results", null);
            },

            search_handle_input: async function({ target: el, code }){
 
                if ( el.value.length > 0 ){

                    if (code === "Enter"){

                    }

                    const { data } = await arc.get(SECURITY, SEARCH, { query: el.value })
                        .catch( ({ error, status}) => {
                            console.log(error, status);
                            return { data: false } 
                        });

                    data && results.do("update_results", data);
                } else {
                    results.do("update_results", false);
                }
            },
        },
    });

    //TODO clean this shit up
    use_effect_on_render(header, () => {
        topLine_1 = Q("#top-line-1");
        middleLine_1 = Q("#middle-line-1");
        bottomLine_1 = Q("#bottom-line-1");
    });
    

    return header.render(),header;
}

function get_nav(){


    const nav = new Component('nav', {
        data: {
            items: [        
                {
                    icon: "nav-ufc-fight",
                    key: "ufc_fight",
                    text: "fight"
                },
                {
                    icon: "nav-ufc-event",
                    key: "ufc_event",
                    text: "event"
                },
                {
                    icon: "person_fill",
                    key: "ufc_fighter",
                    text: "fighter"
                }
            ]
        },
        template: function(props) {
            return html`
                <div id="nav-bottom-containor">
                    <ul role="list" class="d--f fd--r"> ${ props.items.map( ( { key, icon, text }, i ) => html`
                        <li 
                            key="${key}" 
                            class="d--f ai--c nav-item ${ i === 0 ? "active" : "" }" 
                            onclick="select()"
                        >
                            <button>${get_svg(icon, 'class="nav-icon"')}</button>
                            <p class="hide">${text}</p>
                        </li>`)}
                    </ul>
                    <!-- <div id="li-indicator"></div> -->
                </div>`
        },
        listeners :{
            select: function(e){

                const view = e.target.closest(".nav-item").getAttribute("key");
                console.log(view);
                //TODO remove ?.
                if (view !== app?.active_view?.name){
                    app.mods.view.change(view);
                } else {
                    app.active_view.do("fetch_data");
                }
                
                //TODO highlight proper selcted bav
                document.querySelectorAll(".nav-item").forEach(ni => {
                    ni.classList.contains("active") && ni.classList.remove("active")
                });
                e.target.closest(".nav-item").classList.add("active");
            }
        }
    });

    return nav.render(),nav;
}

function get_menu(){

    const user = token.parse()

    const menu = new Component('#menu-home', {
        data: {
            is_logged: Boolean(user),
            profile: ``,
            footer: ``,
            user: user,
            menu_items: [
                {
                    key: "login",
                    label: "Login",
                    help: "Access your account",
                },
                {
                    key: "register",
                    label: "Sign up",
                    help: "Create an account",
                },
                {
                    key: "about",
                    label: "About",
                    help: "Learn more about us",
                },
                {
                    key: "advertise",
                    label: "Advertising",
                    help: "Advertise with us",
                },
                {
                    key: "contact",
                    label: "Contact",
                    help: "Have a question or concern?",
                    
                },
                {
                    key: "membership",
                    label: "Membership",
                    help: "Become a member",
                }
            ]
        },
        template: function( { menu_items, is_logged, user, profile } ){

            //If user is logged in remove a couple menu options

            if (is_logged){

                menu_items = menu_items.filter( mi => ['login', 'register'].includes(mi['key']) === false);

                profile = html`
                    <div class="menu-profile">
                        <p>USER: ${user.ip}</p>
                        <p>STATUS: Logged in</p>
                        <button id="logout" onclick="logout()">Logout</button>
                    </div>`;

            }
         
            const footer = get_footer();

            return html`
                <div class="d--f fd--c jc--fs" style="height:100%">
                    <div>
                        ${profile}
                        <ul class="menu-list" style="margin-top: ${is_logged ? '1.75rem' : '4.75rem'}"> ${menu_items.map(({ key, label, help}) => html`
                            <li onclick="select()" key="${key}" class="d--f jc--sb ai--c menu-list-item">
                                <h2 class="tt--c menu-item">${label}</h2>
                                <p class="menu-item-text">${help}</p>
                                ${get_svg("chevron-right", 'class="svg-test"')}
                            </li>`)}
                        </ul>
                    </div>
                    ${footer}
                </div>`;
        },
        listeners: {
            logout: e => {
                e.preventDefault();
                token.destroy();
                Q("#menu-button").click();
                return false;
            },
            select: function(e){
                const selection = e.target.closest(".menu-list-item").getAttribute("key");
                auth.data.mode = selection;
                auth.do("load_form");
                auth.render()
                Q("#menu").classList.replace("active-home", "active-viewer");
                Q("#menu-viewer").classList.add("open");
                Q("#menu-viewer-cover").style.opacity = 1;
            },
            modal: function ({ target: el }){
                app.modal.render(get_html, { filename: el.dataset.html })
            }
        }
    });
    menu.render()
}

function get_html(){
    return new Component('main', {
        data: { html: null},
        template: function({ html }){ return html || "<div>...loading</div>" },
        setters: {
            fetch_data: function(){
                const that = this;
                arc.get(SYSTEM, FETCH_HTML, { filename })
                    .then( ({ data, status }) => {
                        if ( status === 0 ){
                            that.data.html = data;
                        }
                    });

            }
        }
    })
}

function get_footer() { 
    return html`
        <div class="d--f fd--c ai--c jc--c g--md p--lg mt--md">
            <ul role="list" class="d--f ai--c jc--c g--xl">
                <li><a class="td--n" href="https://stocktwits.com/Insider_Analysis" target="_blank" style="color:var(--clr-green)">Stocktwits</a></li>
                <li><a href="https://twitter.com/IA_machine" target="_blank">${get_svg("twitter", 'class="svg-footer"')}</a></li>
                <li><a href="https://www.instagram.com/insider.analysis/" target="_blank">${get_svg("instagram", 'class="svg-footer"')}</a></li>
                <li><a class="td--n" href="https://www.patreon.com/insider_analysis" target="_blank" style="color:var(--clr-green)">Patreon</a></li>
            </ul>
            <div class="d--f g--md">
                <button data-html="policy" onclick="modal()" class="ts--sm fw--r">Private Policy</button>
                <button data-html="disclaimer" onclick="modal()" class="ts--sm fw--r">Disclaimer</button>
            </div>
        </div>`;
}

const dropdown = ({ options, selection, id }, action) => html`
    <div class="selector-containor" data-selector="${id}">
        <span class="selection">${options[selection].text}</span>
        <ul role="list" class="selector">
            ${options.map(({ text, value }, i) => {
                return html`<li onclick="select()" data-index=${i} data-action="${action}" data-value="${value}">${text}</li>`
            })}
        </ul>
    </div>`;


    function view_error(options){
		
        const { request, response, mode = "client", message } = options;
    
        function get_url_parameters(url) {
            //console.log(url);
    
            if (!url) return undefined;
    
            const url_obj = new URL(url);
            const params = {};
            for (let [key, value] of url_obj.searchParams.entries()) {
                params[key] = value;
            }
            return params;
        }
    
            
        const error = new Component("main", {
            data: {
                status_code: request?.status,
                reponse_url: get_url_parameters(request?.responseURL) || {},
                text: request?.statusText || request?.status ? "Internal Server Error" : "External Client Error",
                message
                    
            },
            template: function(r){
    
                let description, details;
    
                if (mode === "client"){
                        description = message || "It seems there was a problem with your request. Please check your input and try again.";
                } else if ( mode ==="server") {
                        description = "An unexpected error has occurred on our end. We're working on fixing the issue. Please try again later.";
                        details = html`
                            <h1>Arc API Server Request Diagnostics</h3>
                            <br>
                            <div>
                                <h3>Request</h3>
                                <ul role="list">
                                    <li><span>Method: </span><b>${request?.method}</b></li>
                                    <li><span>Controller: </span><b>${request?.controller}</b></li>
                                    <li><span>Service: </span><b>${request?.service}</b></li>
                                    <li><span>Parameters: </span><b>${JSON.stringify(request?.parameters,null,4)}</b></li>
                                </ul>
                            </div>
                            <br>
                            <div>
                                <h3>Response</h3>
                                <ul role="list">
                                    <li><span>Status Code: </span><b>${response?.status}</b></li>
                                    <li><span>Message: </span><b>${response?.message}</b></li>
                                    <li><span>Data: </span><b>${JSON.stringify(response?.data,null,4)}</b></li>
                                </ul>
                            </div>`;
                } else {
                    return html`<p>Mode: ${mode}</p>`;
                }
                    
                return html`
                    <div class="module">
                        <div class="form-section">
                            <div>
                                <div class="d--f jc--sb ai--fe">
                                    <h1 class="c--red">Oops something went wrong!</h1>
                                    <p>${r.text}</p>
                                </div>
                                <hr class="full">
                                <div class="mt--300">
                                    <p>${description}</p>
                                    <div class="mt--500">
                                        <b>...</b>
                                        <div class="text-light">${details ? details : ""}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }
        });
    
        return error;
    }
    