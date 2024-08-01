

function get_header(){

    const results = new Component('#search-results', {
        data: {
            rows: null,
            open: false,

        },
	template: (props) => {
	    let is_loading = false;
        let rows;
            
        if (!props?.rows){
            rows = [0,1,2,3,4,5,6,7,8,9,10];
            is_loading = true;
        } else {
            rows = props.rows;
        }

        return html`<ul>${rows.map((row) => {
            
            let event_data;
            if (row?.data){
                event_data = JSON.parse(row.data)['LiveEventDetail'];
            } else {
                event_data = {};
            }

            const start_datetime = is_loading ?  "" : new Date(row.prelims_card);
            const start_date = is_loading ?  "" : format_date(start_datetime);
            const start_time = is_loading ? "" : format_time(start_datetime);
            const flag_src = is_loading ? "" : `images/flags/${event_data?.Location?.TriCode?.substring(0,2)?.toLocaleLowerCase()}.png`
            const event_fmid = is_loading ? "" : row.fmid ;
            const event_name = is_loading ?  "" : row.name;
            const event_location = is_loading ? "" : `${event_data?.Location?.State} ${row.fmid}`;

            return html`<li 
                            data-event-fmid="${event_fmid}" 
                            onclick="select_event()"
                            class="search-results-item d--f ai--c jc--sb ${is_loading ? '' : 'loading'}"
                        >
                            <div class="search-results-item-left d--f ai--c g--xs">
                                <img class="search-results-item-flag ${is_loading ? 'skeleton' : ''}" src="${flag_src}"/>
                                <div class="d--f fd--c g--xxs">
                                    <p class="search-results-item-name ${is_loading ? 'skeleton' : ''} fw--b">${event_name}</p>
                                    <p class="search-results-item-location ${is_loading ? 'skeleton' : ''}">${event_location}</p>
                                </div>
                            </div>
                            <div class="search-results-item-right d--f fd--c g--xxs">
                                <p class="search-results-item-start-date ${is_loading ? 'skeleton' : ''}">${start_date}</p>
                                <p class="search-results-item-start-time ${is_loading ? 'skeleton' : ''}">${start_time}</p>
                            </div>
                        </li>`;
                })}</ul>`;
        },
        listeners: {
            select_event: function(e){

                let el;

                if (e.target.classList.contains("search-results-item")){
                    el = e.target;
                        } else {
                            el = e.target.closest(".search-results-item");
                        }

                        const id = el.getAttribute("data-event-fmid");
                        console.log(id);
                        const selected_event = this.data.rows.find( e => e.fmid == parseInt(id));
                        app.mods.core.header.data.selected_event = selected_event;
                        app.mods.core.header.render();
                        app.mods.view.change("ufc_event", { id });

                        setTimeout(() => {
                            results.do("close")
                            Hamburger.close();
                            
                        }, 100)

                    }
            },
            setters: {
                update_results: function(props, rows){
                    this.is_open = true;
                    this.data.rows = rows;
                    this.render();
                },
                toggle_open: function() {
                    this.is_open = !this.is_open;
                },
                close: function(){
                    this.is_open = false;
                }
            }
        });

    const header = new Component('header', {
        data: {
            form: null,
            selected_event: null
        },
        template: (props) => {

            const fight_org="UFC";
            const symbol="user";

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
                        <div id="search-results" class="search-results"></div>
                    </div>
                    <div class="menu-header">
                        <button id="menu-button">
                            ${get_svg("menu-button")}
                        </button>
                    </div>
                </div>
                <div id="header-bottom" class="d--f fd--r ai--c jc--sb">
                    <div class="header-bottom-left d--f ai--c g--xxs">
                        ${get_svg("activity", 'class="svg-activity"')}
                        ${get_svg("spinner", 'class="hide svg-loading"')}
                        <p class="t" style="font-weight:100;font-size:1.3rem">${fight_org || "fight_org"}</p>
                    </div>
                    <div class="header-bottom-center d--f fd--r jc--c">
                        <p class="selected-event ml--xs tt--c t" style="max-width: 55vw;">${props.selected_event?.name || "selected_event"}</p>
                    </div>
                    <div class="header-bottom-right d--f ai--c jc--fe">
                        <p class="tt--u blue t" style="font-size:1.3rem"><span style="font-weight: 100;margin-right: .05rem;">$</span>${symbol || "SYMBL"}</p>
                        ${get_svg("dot", 'class="hide svg-dot" viewBox="0 0 16 16"')}
                    </div>
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
            search_focus: async function(){
                if (Hamburger.state()['is_open']) return;
                results.data.rows = null;
                results.render();
                Hamburger.open("search");
                const response = await arc.get(UFC_EVENT, READ_LIST, { order_by: "prelims_card|desc"});
                
                
                results.do("update_results", response.data.rows)

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
                            class="d--f ai--c nav-item ${ i === 1 ? "active" : "" }" 
                            onclick="select()"
                        >
                            <button class="">
                                ${get_svg(icon, 'class="nav-icon"')}
                                <p class="nav-item-title">${text}</p>
                            </button>
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

                    const fmid = app.mods.core.header.data.selected_event.fmid

                    app.mods.view.change(view, { fmid});
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
                <div class="d--f fd--c jc--sb" style="height:100%">
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
    
