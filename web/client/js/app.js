'use strict';

/*
 * 
 */

var Application = (function () {

    let application;

    async function ini(){

        //Decide if we have a user logged in
        const { data } = await arc.get(AUTH, INITIALIZE);

        if (data?.is_authenticated === true){
            login(data);
        }
        console.log("Application initialized", data)
        application.mods.core.header.data.selected_event = data.upcoming_event;
        application.mods.core.header.render();

        application.mods.view.change("ufc_event", { selected_event: data.upcoming_event });
    }

    function create() {

        async function login(data){

            application.data.user = data?.user || {};
    
            const role_name=token.parse().rol;
    
            const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            //add id to src as parameter
            const src = `js/views/${role_name}.js?id=${id}`; 
    
            load_script(src).then(() => {
                application.mods.view.change("home");
                connect_arc_ws();
    
                if (application.start_view.name !== "default"){
                    application.mods.view.change(application.start_view.name, { id: application.start_view.id });
                    //clear the start view
                    console.log(`Clearing start view ${application.start_view.name} with id ${application.start_view.id}`);
                    application.start_view = { name: "default", id: null };
                } else {
                    application.mods.view.change("prepsheet_list");
                }
            
                clear_url_params();
             
            });
        }
    
        function logout(){
            arc_socket.close();
            token.destroy();
            clear_url_params();
            application.view.history = [];
    
        }

        //Views are determined by role and are loaded dynamically with core views
        function add(views) {
            this.list = { ...this.list, ...views };
        }

        async function refresh(){
            const { status, data } = await arc.get(AUTH, INITIALIZE);
            if (status === 0 && data?.is_authenticated === true){
                application.data.departments = data?.departments || {};
                application.data.user = data?.user || {};
                application.header.render();
            } 
            
        }

        async function change(view_name, run_time_options = {}) {

            let main = Q("main");

            //clear any existing listeners
            //Component.clear_events(main);
            let view;

            //check if view exists, if not throw an error in main
            if (!this.list[view_name]){
                //main.innerHTML = html`<h1 class="ta--c c--red">View ${view_name} does not exist, see console.</h1>`;
                return this.change("error", { error: `View ${view_name} does not exist` });
            }

            let {
                get_view,
                component,
                exports,
                preferences,
                containor_class,
                selector,
                mode,
                needs
            } = this.list[view_name];

            //try catch to handle errors in view
            try {

                if (!component){
                    //console.log("Component not loaded loading:", view_name, get_view, selector, mode, run_time_options)
                    view = get_view({ selector, mode, ...run_time_options});
                    this.list[view_name].component = view;
                    this.list[view_name].component.name = view_name
                } else {
                    //console.log("Component loaded: updating data", view_name, component, run_time_options)
                    view = component;
                    //check if this is a list or record view
                    if (view.data?.form){
                        view.data.form = null;
                        view.data.id = run_time_options?.id;
                        view.data.is_locked = run_time_options?.is_locked || true;
                    }

                    if (view.data?.list){
                        view.data.list=null;
                    }

                    view.do("fetch", { ...run_time_options });
                }

                // console.log(view);
                this.history.push(view_name);
            } catch (error) {
                console.log(error);
                // console.log(error, run_time_options, this.list[view_name]);
                const err = html`<h1 class="ta--c c--red">View ${view_name} has an error</h1>`;
                return this.change("error", { error: err });
            }


            if (!view.render()){
                console.error("View", view_name, "failed to render");
                return this.change("error", { error: `View ${view_name} failed to render` });
            };


            //handle if we need to change class managing <main/> layout
            if (containor_class && this.active.containor_class !== containor_class){
                //console.log("Replacing",this.active.containor_class, containor_class)
                main?.classList.replace(this.active.containor_class, containor_class);
            }

            //store to access properties & methods if needed
            this.active = {
                component: view,
                containor_class,
                name: view_name,
                exports,
                preferences
            }
            
        };

        function open_modal(title, getter, options = {}, content_class="modal-std", use_transition = false){

            Q("#modal-header").innerHTML = title;

            const modal = getter(options);
            //console.log(getter, getter.name)

            //for triggering a loading transition
            if (!use_transition){
                modal.render();
            }

            this.component = modal;
            this.component.name = getter.name;

            //get the class that will be replaced
            const replace_class = Q("#modal-content").classList[0];

            Q("#modal-content").classList.replace(replace_class, content_class);
            const overlay = Q("#modal-overlay");
            overlay.classList.add("active");

            //for triggering a loading transition, assumes component has required data
            if (use_transition){
                modal_transition(modal) 
            }

        }

        function close_modal(){
            Q("#modal-header").innerHTML = "";
            Q("#modal-content").innerHTML = "";
            
            const modal_containor = Q("#modal-containor")
            //console.log(modal_containor, "TeST")
            //reset the height width
            modal_containor.style.width="24.4rem";
            modal_containor.style.height="20.2rem";
            Q("#modal-overlay").classList.remove("active");

            this.intervals.clear_all();
        }

        return {
            login,
            logout,
            refresh,
            mods: {
                core: {
                    nav: get_nav(),
                    header: get_header()
                },
                view: {
                    add,
                    change,
                    list: {
                        "ufc_event": {
                            get_view: view_ufc_event
                        },
                        "ufc_fight": {
                            get_view: view_ufc_fight
                        },
                        "ufc_fighter": {
                            get_view: view_ufc_fighter
                        },
                        error: {
                            get_view: view_error
                        }
                    },
                    history: ['home'],
                    //Holds a reference to the active view
                    active: {
                        containor_class: "start",
                        component: null,
                        name: null
                    }
                },
                modal: {
                    open: open_modal,
                    close: close_modal,
                    component: null
                }  
            },
            //Holds app level data such as user
            data: {}
        };
    }

    return {
        get: function () {
            if (application) {
                ini();
                return application;
            }
            application = create();
            ini();
            return application;
        }
    };
})();



  
