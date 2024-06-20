/*
*   Core
*   
*/

let crud_debug = true;

function log(action, data = {}, warn = false){
    if (crud_debug){
        warn ? console.warn(`[ARC DEBUG]: ${action}`): //console.log(`[ARC DEBUG]: ${action}`);
        data && console.table(data);
    }
}

function filter_operations(operations, filter){
    return filter.length ? filter.reduce((acc, curr) => {
        acc[curr] = operations[curr];
        return acc;
    }, {}) : operations;
}


function validate_form(form) {
    let is_valid = true;
    form.querySelectorAll("[name]").forEach((element) => {
      if (!element.checkValidity()) {
        is_valid = false;
        //show the error message
        element.classList.add("error");
        element.reportValidity();

      } else {
        //remove the error class if it exists
        element.classList.remove("error");
      }
    });
    return is_valid;
  }
  

function check_needs(needs_by_name){

    //if undefined return true
    if (!needs_by_name){
        return [true, {}];
    }

    //check if we have an array of strings
    if (!Array.isArray(needs_by_name)){
        throw new Error("Needs must be an array of strings");
    }

    let value;
    const data = {}
    const errors = {};

    needs_by_name.forEach(need => {
        switch (need) {
            case "branch_id":
                //attempt to get the branch id from the branch select
                value = Q("#branch-select")?.value;

                if (value){
                    //console.log("BRANCH ID", value, Boolean(value))
                    data[need] = value;
                } else {
                    errors[need] = "User has no branch allocations, please assign one or contact your administrator";
                }
                break;
            default:
                errors[need] = `Unable to find case to handle need value: ${need}`;
                break;
        } 
    });

    //if any errors return them
    if (Object.keys(errors).length){
        return [false, errors];
    }
    return [true, data];
}

const debounce_delay = 200;
let debounce_timer;

const listeners = {

    DROPDOWN_CHECKLIST: function(){
        const operations = {
                toggle_open: function(event){
                        let button = event.target;

                        if (button.nodeName !== 'BUTTON'){
                            button = button.closest('button');
                        }
                        
                        button.nextElementSibling.classList.toggle("show");
                },
                toggle_select: function(event){
                    console.log(event);

                    const checklist_inputs = Array.from(this.elem.querySelectorAll('input[type="checkbox"]'))
                    //update the filter query param;
                    
                    const options = checklist_inputs.reduce((acc, curr, i, a) => {
                        //curr = input el
                        //acc {}
                        console.log(acc, curr)
                        acc[curr.value] = curr.checked;
                        return acc;
                    }, {})

                    console.log(JSON.stringify(options));
                    this.query_options.adv_filter = options;
                    this.isLoading = true;
                    this.list = null;
                    this.render();
                    //requery  the list
                    this.do("fetch")
                }
        }
  
        return operations;
    },
    TOGGLE_LIST: function(){
      const operations = {
            toggle_list_edit_open: function(event){
                event.preventDefault();

                const toggle = event.target.closest("button.yes-no-toggle");
                //console.log(toggle, event.target)
                //if disabled return
                if (toggle.disabled) return;

                //console.log(event.target);
                const toggle_list = event.target.closest(".toggle-list");
                //console.log(toggle_list);
                toggle_list.classList.toggle("active");
            },
            remove_from_list: function(event){
                event.preventDefault();
                //console.log(event);
            },
            add_to_list: function(event){
                event.preventDefault();
                //console.log(event);
            },
            handle_list_button_action: function(event){
                event.preventDefault();
                //console.log(event);
            }
      }

      return operations;
    },
    MULTISELECT_SEARCH: function(options={}){
        //console.log("test")
        const operations = {
            handle_search_input: function(event){
                //console.log(event);

                const that = this;

                async function search_function(event){

                    const search_term = event.target.value;
                    const search_id  = event.target.id

                    that.query_options['ilike'] = JSON.stringify({ name: search_term });
                    that.query_options.order_by = "type|desc";
                    //filter out all null query_options into params obj
                    const params = {};

                    for (const [k,v] of Object.entries(that.query_options)){
                        v && (params[k]=v);
                    }

                    params["segregation_id"] = Q("#branch-select")?.value

                    const response = await arc.get(SYSTEM, "read_list_entity", params);

                    if (response.status === 0){
                        //find the form element with the search_id for 
                        const form_element = that.data.form.find(el => el.id === search_id);
                        //console.log(form_element, that.data.form, search_id)
                        //update the options for the select
                        form_element.element.options = response.data.rows;
                        form_element.search = search_term;
                        that.render();

                    } else {
                        show_message(response.message);
                    }
    
                }
  
                // Timer variable to store the timeout
                
                //console.log("searching...")
                clearTimeout(debounce_timer);

                debounce_timer = setTimeout(() => search_function(event), debounce_delay)
            },
            add_selection: async function(event){

                const selection = event.target.closest("li").dataset;

                //find the form element with the search_id for
                const multiselect_search = this.data.form.find(el => el.id === Q('.multiselect-search-input').id );

                const selected = multiselect_search.value ? JSON.parse(multiselect_search.value) : {
                    person: [],
                    department: [],
                    branch: [],
                    company: []
                };

                const stored_value = `${selection.id}|${selection.name}`;

                //check if the selection is already in the selected array
                if (selected[selection.type].includes(stored_value)){
                    //console.log("ALready selected", selection);
                    return;
                }

                //add the selection to the selected array
                selected[selection.type].push(stored_value);

                multiselect_search.value = JSON.stringify(selected);

                this.render();

                //get the
            },
            remove_selection: async function(event){

                event.preventDefault();

                //get the button element, could be a child
                const chip = event.target.closest("button");

                if (chip.disabled) return;

                const selection = chip.dataset;
                //console.log(selection, event, chip)
                //find the form element with the search_id for
                const multiselect_search = this.data.form.find(el => el.id === Q('.multiselect-search-input').id );

                const selected = JSON.parse(multiselect_search.value);

                const stored_value = `${selection.id}|${selection.name}`;
                //console.log(stored_value, selected, stored_value, multiselect_search)
                //remove the selection from the selected array
                selected[selection.type] = selected[selection.type].filter(el => el !== stored_value);


                multiselect_search.value = JSON.stringify(selected);

                this.render();

            }
        }

        return operations;
    },
    /* callbacks require for hte select-manage component to work */
    SELECT_MANAGE: function(options={}){

        const operations = {
            open_select : function(event){
                //console.log(event)


                //this will fire when the el with .selected-option is clicked/focused on and add the class .active to el .select-options-containor
                const select_manage = event.target.closest(".select-manage")
                const select_options = select_manage.querySelector(".select-options-containor");

                //rerender the options if needed, check if the this.data.select_manage_options is the same as the options in the select-options-containor
                const select_options_containor = select_manage.querySelector(".select-options-containor");
                const select_options_containor_options = select_options_containor.querySelectorAll("li");
                const select_manage_options = this.data.select_manage_options;

                //if the options are the same return
                if (select_options_containor_options.length !== select_manage_options.length){
                    this.render();
                };




                if (!select_options.classList.contains("active")){
                    select_options.classList.add("active");
                }
                //add an event listener to close the menu on any click outside of .select-manage, run once
                document.addEventListener("click", function close_menu(event){
                    //if the click is not inside the menu or one of the list items
                    //console.log("TEST")
                    if (!event.target.closest(".select-manage")){
                        document.removeEventListener("click", close_menu);
                        // select_manage.dataset.mode = "create";
                        const menu = Q(".select-options-containor.active");
                        if (menu) menu.classList.remove("active");
                    }
                }
                );
    
            },
            switch_mode: function(event){
                event.preventDefault();
                //console.log("SWITCH", event)
                const select_manage = event.target.closest(".select-manage")

                //update the data-mode attribute
                const current_mode = select_manage.dataset.mode;
                const new_mode = current_mode === "create" ? "edit" : "create";
                select_manage.dataset.mode = new_mode;

                if (new_mode === "edit"){
                    //rotate all the .svg-plus-2 by adding rorate class
                    select_manage.querySelectorAll(".svg-plus-2").forEach(svg => {
                        svg.classList.add("rotate");
                    });
                }

                if (new_mode === "create"){
                    //rotate all the .svg-plus-2 by removing rorate class
                    select_manage.querySelectorAll(".svg-plus-2").forEach(svg => {
                        svg.classList.remove("rotate");
                    });
                }


            },
            add_option: async function(event){
                event.preventDefault();
                const select_manage = event.target.closest(".select-manage")
                const input = select_manage.querySelector(".select-options-add > input");

                //if the input is empty return
                if (!input.value) return;

                
                const new_option = {
                    description: input.value, 
                    type: "accessory",
                    branch_id: Q("#branch-select").value
                }


                const response = await arc.get("template_item", "create_one", new_option);
                //console.log(response);
                if (response.status === 0){
                    //clear the input
                    input.value = "";

                    new_option.id = response.data.id;

                    this.data.select_manage_options.push(new_option);
                    const field_input = select_manage.querySelector(".selected-option");
                    field_input.value = new_option.description;

                    this.render();
                    //console.log(event)
                }


            },
            select_option: async function(event){
                event.preventDefault();

                if (!this.data.select_manage_options.length) return;

                const select_manage = event.target.closest(".select-manage");
                const current_mode = select_manage.dataset.mode;

                const li = event.target.closest("li");

                //get the closest li with the data-value attribute
                const option_value = li.dataset.value;
                //console.log(option_value, current_mode);
                if (current_mode === "create"){

                    //set the value of the input.selected-option

                    const selected_option = select_manage.querySelector(".selected-option");
                    selected_option.value = option_value;

                    const select_options_containor = select_manage.querySelector(".select-options-containor");
                    select_options_containor.classList.remove("active");
                }

                if (current_mode === "edit"){

                    //prevent any further propagation
                    event.stopPropagation();

                    const response = await arc.get("template_item", "delete_one", { id: event.target.dataset.id });
          
                    if (response.status === 0){
                        //remove the option from the data
                        this.data.select_manage_options = this.data.select_manage_options.filter(o => o.description !== option_value);

                        //remove the option from the dom
                        const option = event.target.closest("li");

                        //if there are no more options switch to create mode
                        if (!this.data.select_manage_options.length){
                            select_manage.dataset.mode = "create";
                                                //replace the li with a new one
                            const new_option = document.createElement("li");
                            new_option.classList.add("ta--c");
                            //add text
                            new_option.innerText = "No entries found";

                            option.replaceWith(new_option);
                        } else {
                            option.remove();
                        }



                    }

                }
                
                //console.log(event);
            }
        }

        return operations;  
    },

    CORE: function(filter=[],options={}){

        //const { test } = options;

        const operations = {
            settings: function(event){
                //console.log(event);
                app.modal.open("Settings", modal_settings);
            },
            select_user: function(event){
                //console.log("SELECT USER: DATA", event.target.value);
                app.modal.open("User Tree", modal_user);
            },
            print_page: function(event){
                window.print();
            },
            password_reset: function(event){
                app.modal.open("Password Reset", modal_password_reset, {}, "modal-password-reset");
            },
            open_menu: function(event){

                let button = event.target;

                if (event.target.closest("button")){
                    button = event.target.closest("button");
                }

                const { mode } = button.dataset;

                //remove the active class from all the menu items
                button.closest("div").querySelectorAll("button").forEach(b => {
                    b.classList.remove("active");
                });

                //add the active class to the button
                button.classList.add("active");

                app.menu.active = mode;

                //if hte mode is alerts reset the alerts count
                if (mode === "alerts"){
                    app.menu.alerts.data.mode = "live";
                    app.menu.alerts.data.archived_prepsheet_id=null;
                }

                app.menu[mode].render();
                app.menu[mode].do("fetch");

                Q(".header-menu").classList.remove("selling_days", "user_tools", "alerts");
                Q(".header-menu").classList.add("active");
                Q(".header-menu").classList.add(mode);

                //add an event listener to close the menu on any click outside of .header-menu-containor, run once
                document.addEventListener("click", function close_menu(event){
                    //if the click is not inside the menu or one of the list items

                    const is_target_list_item = event.target.closest(".header-actions");

                    if (!event.target.closest(".menu-nav") || is_target_list_item){
                        document.removeEventListener("click", close_menu);
                        const menu = Q(".header-menu");
                        if (menu) menu.classList.remove("active");
                        button.closest("div").querySelectorAll("button").forEach(b => {
                            b.classList.remove("active");
                        });

                        if (mode === "alerts"){
                            update_ui_alerts_count(0);
                        };
                    }



                });

            },
            /* 
            * Use with a keyup event on an input to update the data object
            */
            search: function(event){

                function search_function(event){

                    const search_term = event.target.value;

                    log("SEARCH: DATA", search_term)
    
                    that.query_options['ilike'] = search_term;
		            that.query_options.active_page = 1;
                    that.do("fetch");
                    that.render();
                }

                const that = this;
  
                // Timer variable to store the timeout
                
                //console.log("searching...")
                clearTimeout(debounce_timer);

                debounce_timer = setTimeout(() => search_function(event), debounce_delay)

            },
            sort: function(e){
                let direction = "asc";
                const key = e.target.dataset.sortKey;

                const [ curr_key, curr_direction ] = this.data?.direction?.split("|") || "created_at|desc".split("|");

                if (curr_key === key){
                    //flip the direction
                    direction = (curr_direction === "asc" ? "desc" : "asc");
                } 

                this.query_options.order_by = `${key}|${direction}`;
                this.do("fetch");

                this.data.direction = `${key}|${direction}`;
                this.render();

            },
            filter: function(event) {
                event.preventDefault();
                //console.log("FILTER: DATA", event.target.value)
                const filter = event.target.value;
                
                log("FILTER: DATA", filter)

                this.query_options['filter_by'] = filter;
		        this.query_options.active_page = 1;
                this.do("fetch");
                this.render();
            },
            close_modal: function(){
                app.modal.close();
            },
            page_prev: function(e){
                //console.log(e, this);
                e.preventDefault();
                if (this.query_options.active_page <= 1) return;

                this.query_options.active_page -=1;
                this.isLoading=true;
                this.render();
                this.do("fetch");
            },
            page_next: function(e){
                //console.log(e, this);
                e.preventDefault();
                if (this.query_options.active_page >= this.data.count) return;
                this.query_options.active_page +=1;
                this.isLoading=true;
                this.render();
                this.do("fetch");
            },
            reload: function(event = null){
                
                Q("nav").classList.toggle("micro");

            },
            select_tab: function(event){

                let tab;
                const tabs = document.querySelectorAll("[data-tab-select]");

                //check if the target is a tab
                if (!event.target.closest("[data-tab-select]")) {
                    tab = event.target;
                } else {
                    tab = event.target.closest("[data-tab-select]");
                }

                tabs.forEach((tab) => tab.classList.remove("active"));
                tab.classList.add("active");
                app.view.change(tab.dataset.tabSelect);

                // Check if the current scroll position is not at the top
                if (window.scrollY > 0) {
                    // Scroll smoothly to the top position
                    window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                    });
                }
                

            },
            logout: function(event = null, ini_string = ""){
                event && event.preventDefault();
                app.logout();
                app.view.change("login", {ini_string});
            },
            handle_branch_change: async function(event){
                //get the current view, if its a list just refresh if we are drilled in, go to the list

                //get the branch id from the event and use it to filter and update the departments
                const branch_id = Number(event.target.value);
                let user_departments = app.data.user.departments.list
                //filter the departments by the selected branch

                if (user_departments){
                    user_departments = user_departments.filter(department => department.branch_id === branch_id);
                }

                //check if we have any departments assigned to this user, if there are none then we will have one el in array an object with id = null
                if (user_departments?.length === 1){
                    department = user_departments[0]?.name || "None";
                } else if (user_departments?.length > 1){
                    //add all the demparments together delimited by a comma
                    department = user_departments.map(department => department.name).join(", ");
                } else {
                    department = "None";
                }

                Q("#departments").innerHTML = department;

                send_arc_ws("add_credentials", { active_branch_id: branch_id });

                //if a specific view is there to go to on branch switch use that
                const switch_view = app.view.list[app.view.active.name]?.on_branch_switch_view;
 
                if (switch_view){
                    app.view.change(switch_view);
                    return;
                }

                app.view.active.component.do("fetch", {
                    reload_value: {
                        key: "branch_id",
                        callback: () => Q("#branch-select").value
                }});

                app.view.active.component.query_options.active_page = 1;
                app.menu.alerts.data.archived_prepsheet_id=null;
                app.menu.alerts.data.mode = "live";
                app.menu.alerts.data.selected_li_index = 0;

                await fetch_selling_days();
                Q("#selling_day_tracker").innerHTML = put_selling_days();
            }
        }

        return filter_operations(operations, filter);  
    },
    CRUD: function(controller, filter = [], options = {}){
        /*  
        * The CRUD methods below are designed to work with the component class, they can be used as listeners
        * for form elements but could be used in any context within an HTML template. Used for single records 
        */

        const { 
            read_enhanced, // If true the read operation will select from a view rather than a table
            is_clear_form // reset the form on a successful submit
        } = options;

        const operations = {
            /*
            *   Create
            *   @param {Event} event
            */
            create_one: function(event){
  

                const component = this;
                const form = component.elem.querySelector("form");

                if (!validate_form(form)) {
                    return;
                }

                event.preventDefault();

                const form_data = new FormData(form);

                // Convert multi-select fields with multiple values to JSON
                for (const field of form.elements) {
                    if (field.type === "select-multiple") {
                        const selectedValues = Array.from(field.selectedOptions).map((option) => option.value);
                        form_data.set(field.name, JSON.stringify(selectedValues));
                    } else if (field.type === 'datetime-local'){
                        // Get the value from the field
                        let datetime_value = field.value;

                        // Check if the value is not empty
                        if (datetime_value) {
                            // Convert to ISO 8601 format by adding seconds
                            datetime_value += ':00';

                            // Set the modified value in form_data
                            form_data.set(field.name, datetime_value);
                        }
                    }
                }

                this.query_options.collectors.forEach(c => {

                    //check collector is formmatted coorectly with key and value
                    if (!c.key || !c.value){
                        log("CREATE_ONE: Collector is not formatted correctly, must have key and value", c, true);
                    }

                    form_data.set(c.key, c.value());

                })

                log("CREATE_ONE: DATA", [...form_data])

                arc.post(controller, CREATE_ONE, form_data).then(({ status, message, data }) => {
                    
                    component.isLoading = false;

                    if (status === 0){
                        log(`CREATE_ONE: Success, ${message}`, data )
                        is_clear_form && clear_form(form);
                        app.view.active.component.do("fetch");
                        app.modal.close();  
                    } else {
                        log(`CREATE_ONE: Failure,${message}`, data, true )
                        //console.log(data);
                        show_message(message);
                    }
       
                })
            },
            /*
            *   Read
            *   @param {Event} event
            */
            read_one: function(event){
                
                event.preventDefault();

                const component = this;
                const id = new FormData(component.elem.querySelector("form")).get("id");

                if (!id){
                    log("READ_ONE: No ID sourced from form", id, true);
                }

                log("READ_ONE: DATA", { id });

                arc.get(controller, READ_ONE, { id, read_enhanced: Boolean(read_enhanced) }).then(({ status, message, data }) => {
                    
                    component.isLoading = false;
                    
                    if (status === 0){
                        log(`READ_ONE: Success, ${message}`, data);
                        fill_form("form", data);
                    } else {
                        log(`READ_ONE: Failure, ${message}`, data, true);
                    }
                              
                });
            },
            /*
            *   Update
            *   @param {Event} event
            */
            update_one: function(event){

                const component = this;
                const form = component.elem.querySelector("form");

                if (!validate_form(form)) {
                    //console.log("form not valid")
                    return;
                }

                event.preventDefault();

                const form_data = new FormData(form);

                for (const field of form.elements) {
                    if (field.type === "select-multiple") {
                        const selectedValues = Array.from(field.selectedOptions).map((option) => option.value);
                        form_data.set(field.name, JSON.stringify(selectedValues));
                    }
                }

                log("UPDATE_ONE: DATA", [...form_data]);

                arc.post(controller, UPDATE_ONE, form_data).then(({ status, message, data }) => {
                    
                    component.isLoading = false;

                    if (status === 0){
                        log(`UPDATE_ONE: Success, ${message}`, data);
                        //if we are updating a record and it has locking functionality relock
                        if ("is_locked" in component?.data){
                            component.data.is_locked = true;
                        } 

                        sync_form(form_data, component);
                     
                    } else {
                        log(`UPDATE_ONE: Failure, ${message}`, data, true);
                    }

                    show_message(message);
                    // component.data?.is_locked = true;
                })
            },
            /*
            *   Delete
            *   @param {Event} event
            */
            delete_one: function(event){

                //make sure user is sure they want to delete
                if (!confirm("Are you sure you want to delete this record?")){
                    return;
                }

                event.preventDefault();
                
                const component = this;
                const id = new FormData(component.elem.querySelector("form")).get("id") || component.data.id;

                log("DELETE_ONE: DATA",  { id })

                arc.get(controller, DELETE_ONE, { id }).then(({ status, message, data }) => {
                    
                    component.isLoading = false;

                    if (status === 0){
                        log(`DELETE_ONE: Success, ${message}`, data);
                        //go back one view
                        const return_view = app.view.history[app.view.history.length - 2];

                        app.view.change(return_view);

                    } else {
                        show_message(message);
                        log(`DELETE_ONE: Failure, ${message}`, data, true);
                    }

                    app.modal.close();

                })

            },
            toggle_one: function(event){
                    
                    const component = this;

                    //determine if we are adding or removing a pivot table entry
                    const service = event.target.checked 
                        ? "assign_relation" 
                        : "remove_relation";
                    //console.log(event.target)
                    //get the id and value of the checkbox
                    const relation_id = event.target.dataset.relationId;
                    //get the data-record-id attrib

                    const { junction_table, record_name, relation_type, record_id } = this.data.checklist_relations_requirements
                    //we are either deleteing a pivot table entry or adding one, so we need both the id's
                    //EG branch_person, branch_id and person_id
                    const params = {
                        relation_id,
                        record_id,
                        junction_table,
                        record_name,
                        relation_type
                    }

                    /*
                        record_id
                        record_name
                        relation_id
                        relation_name
                        junction_table
                    */

                    log("TOGGLE_ONE: DATA", params);
    
                    arc.post(controller, service, params).then(({ status, message, data }) => {
                        
                        component.isLoading = false;
    
                        if (status === 0){
                            log(`TOGGLE_ONE: Success, ${message}`, data);
                            app.view.active.component.do("fetch");
                            app.refresh();
                        } else {
                            log(`TOGGLE_ONE: Failure, ${message}`, data, true);
                        }
    
                        // show_message(message);
                    })
            },
            submit: function(){ 
                return false;
            },
            navigate_one: function(event){
                event.preventDefault();

                const button = event.target.closest("button");
                const view = event.target.closest("section.relation").dataset.view;

                //ensure we have a view to navigate to and an id to utilize
                if (!view || !button?.dataset.id){
                    log("NAVIGATE_ONE: No view or id sourced from element", { view, id: button?.dataset.id }, true);
                }

                //ensure the nav tab is changed to the view we are navigating to
                const tabs = Q("[data-tab-select]", true);

                tabs.forEach((tab) => tab.classList.remove("active"));
                //get the reference to the el where [data-tab-select] is ilike company*
                const tab_selector = button.dataset.view.split("_")[0] + "_list";
                const tab = Q(`[data-tab-select="${tab_selector}"]`);

                
                if (tab){
                    tab.classList.add("active");
                    app.view.change(button.dataset.view, { id: button.dataset.id })
                } else {
                    log("NAVIGATE_ONE: No tab found with data-tab-select attribute matching the view to navigate to", tab_selector, true);
                }

            },
            toggle_form_lock: function(e){
                this.data.is_locked = !this.data.is_locked;
                //TODO, this should auto render when the data is updated
                this.render();
            },
            return_to_list: function( e = null ){

                //get the second last entry to the app.view.history array
                const return_view = Q("button[data-return-view]")?.dataset?.returnView;

                if (!return_view) return;

                app.view.change(return_view);
            },
            manage_relations(event){
      
                //get the id of the record we are managing relations for from the name attribute = id
                const record_id = this.elem.querySelector("input[name='id']").value;
                const relation = event.target.closest("section.relation").dataset.key;
                // //console.log(relation, this.data)
                const checklist_options = this.data?.relations_options[relation]?.checklist || {
                    error: "No checklist options found"
                };

                const checklist_requirements = {
                    ...checklist_options,
                    record_id,
                }
                // //console.log(checklist_requirements);
                app.modal.open("Manage", modal_checkbox_list, checklist_requirements);
            },
            deactivate: async function(e){
                const id = this.data.id;
                const response = await arc.post(controller, "deactivate", { id });
                
                if(response.status === 0){
                    this.elem.querySelector(".button-bck").click();
                }

                show_message(response.message);
            },
            activate: async function(e){
                const id = this.data.id;
                const response = await arc.post(controller, "activate", { id });

                if(response.status === 0){
                    this.elem.querySelector(".button-bck").click();
                }

                show_message(response.message);
            }
        }

        return filter_operations(operations, filter)
    },
    LIST: function(controller, component_package=null){
        /* 
        * The LIST methods are designed to work with the Component class, they can be used as listeners
        * for any type of list / table with a row structure
        */
        return {
            /*
            *   Select
            *   @param {Event} event
            */
            select: function(event){
                event.preventDefault();

                const component = this;
                //Retrieve the unqiue key assigned to each row
                const key = get_key(event);

                log("READ_ONE: DATA", { id: key })

                arc.get(controller, READ_ONE, { id: key }).then(({ status, message, data }) => {

                    component.isLoading = false;

                    if (status === 0){
                        log(`READ_ONE: Success, ${message}`, data);
                        fill_form("form", data);
                    } else {
                        log(`READ_ONE: Failure, ${message}`, data, true);
                    }

                });
            },
            /*
            *   Open a form for creation in a modal
            *   @param {Event} event
            */
            create: function(event){
                const { header, component, type } = component_package;

                if (type === "modal"){
                    app.modal.open(header, component);
                } 
                
            },
            /*
            *   Open a form for update in a modal
            *   @param {Event} event
            */
            manage: function(event){

                //get the key from the row
                const key = get_key(event);
                //console.log(key, "key")
                const { header, component, type } = component_package;

                if (type === "modal"){
                    app.modal.open(header, component, { id: key });
                } else {
                    app.view.change(component, { id: key })
                }
                
            },
        }
    }
}

const collectors = {
    branch_id: {
        key: "branch_id",
        value: function(){
            return Q("#branch-select").value;
        }
    }
}

const setters = {
    /*
    * The CRUD methods below are designed to work with the component class, they can be used by the application
    * proactively to display default data for the user or indirectly access CRUD API calls for a single record
    */
    CRUD: function(controller, service){

        return {
            fetch: function(props, options ={}){

                const { is_modal, id } = options;

                let params = {};
                const component = this;

                if (id){
                    params.id = id;
                } else {
                    //if id in props, add to params
                    props.id && (params.id = props.id);
                }

                props.mode && (params.mode = props.mode);
                props.get_relations && (params.get_relations = true);

                for (const [k,v] of Object.entries(component.query_options)){

                    if (k ==="params" && typeof v === "object"){
                        params = {...params, ...v};
                        continue;
                    }

                    v && (params[k]=v);
                }

                component.isLoading = true;

                log("FETCHING: Data for form");
                console.log(params);

                arc.get(controller, service, params).then(({ status, message, data }) => {

                    component.isLoading = false;
                    //console.log(status, message, data, params)
                    if (status === 0){
                        log(`FETCHING: Success, ${message}`, data);
                        component.data.form = data.form;
                        component.data.relations = data.relations;

                    } else {
                        log(`FETCHING: Failure, ${message}`, data, true);
                    }
                    is_modal ? modal_transition(component) : component.render();             
                })

            }
        }
    },
    LIST: function(controller, service){
        /*  
        * The LIST methods are designed to work with the Component class, they can be used proactively by the app  
        * or indirectly by the client, works with any type of list / table with a row structure
        */
        return {
            fetch: function(props, options = {}){

                const component = this;
                component.isLoading = true;

                let params = {}
                const { is_modal } = options;

                "checklist_relations_requirements" in props && (params = {...params, ...props.checklist_relations_requirements});

                for (const [k,v] of Object.entries(component.query_options)){

                    if (k === "collectors") {

                        //loop through the collectors and add the key and value to the params object
                        v.forEach(c => {
                            //check collector is formmatted coorectly with key and value
                            if (!c.key || !c.value){
                                log("FETCHING: Collector is not formatted correctly, must have key and value", c, true);
                            }

                            params[c.key] = c.value();
                        })

                        continue;
                    };

                    if (k ==="ilike" && v){
                            
                        let cols = {};
                        console.log("test")
                        if (component.data?.searchable && typeof component.data.searchable === "object"){
                            component.data.searchable.forEach((col) => {
                                cols[col] = component.query_options.ilike;
                            });
                        } else if(component.data?.list?.length) {
        
                            //if no searchable columns are defined, search all columns if avail, don't want to get to component
                            cols = Object.keys(component.data.list[0]).reduce((a, v) => { 
        
                                a[v] = component.query_options.ilike; 
                                
                                return a
                            
                            }, {});
                        }
             
                        params[k] = JSON.stringify(cols);

                        continue;
                    }

                    if (k ==="params" && typeof v === "object"){
                        params = {...params, ...v};
                        continue;
                    }

                    v && (params[k]=v);
                }

                if ("reload_value" in options && options.reload_value?.key in params){
                    params[options.reload_value.key] = options.reload_value.callback()
                }

                log("FETCHING: Data for list");

                arc.get(controller, service, params).then(({ status, message, data }) => {

                    component.isLoading = false;
                    //console.log("LIST", data)
                    if (status === 0){
                        log(`FETCHING: Success, ${message}`, data);

                        if ("count" in data && "rows" in data){
                            component.data = {...component.data,
                                list: data.count > 0 ? data.rows : [],
                                count: Math.ceil(data.count / component.query_options.page_size)
                            };
                        } else {
                            component.data.list = data;
                        }

                        is_modal ? modal_transition(component) : component.render();

                    } else {
                        log(`FETCHING: Failure, ${message}`, data, true);
                    }

                    
                })
            }
        }
    }
}

const templates = {
    /*
    *   Form A
    *   - Basic form, should be able to handle most forms
    */
    form_a: function({ form, header, buttons = ['create', 'update', 'delete'] }){
        
        this.isLoading  
            ? log(`FORM_A: Signaling Load`)
            : log(`FORM_A: Load finished, now rendering`, form);


        if (!this.isLoading && form){
            return html`
                <form class="d--f fd--c g--400" onsubmit="submit()">
                    <div class="fields">
                        ${form.map(field => field_builder(field))}
                    </div>
                    <div class="d--f ai--c g--200">${buttons.map(button => html`
                        <button class="button-std tt--c " onclick="${button}()">${button.split("_")[0]}</button>`)}
                    </div>
                </form>`;

        } else {
            return loader();
        }
    },
    /*
    *   Form b
    *   - b through z will cover unique and custom designs
    */
    form_b: function({ form, header, buttons = ['create', 'update', 'delete'], relations = {}}){
        this.isLoading 
            ? log(`FORM_B: Signaling Load`)
            : log(`FORM_B: Load finished, now rendering`, form);

        if (!this.isLoading && form){
            return html`
                <div class="tabs">
                    <div 
                        data-tab="form" 
                        class="active" 
                        style="border-top-left-radius: var(--br-radius-100);"
                        onclick="select_tab()">${header}
                    </div>
                    <div 
                        data-tab="relations" 
                        style="border-top-right-radius: var(--br-radius-100);" 
                        onclick="select_tab()">View Relations
                    </div>
                </div>
                <form data-tab-content="form" class="form-b active" onsubmit="submit()">
                    <div class="fields">
                        ${form.map(field => field_builder(field))}
                    </div>
                    <div class="d--f ai--c g--200">${buttons.map(button => html`
                        <button class="button-std tt--c " onclick="${button}()">${button.split("_")[0]}</button>`)}
                    </div>
                </form>
                <div data-tab-content="relations" class="relations">
                    ${relations ? relations_builder(relations) : "No Relations"}
                </div>`;

        } else {
            return loader();
        }

    },
    /*
     * form_relations
    */
    form_relations: function(properties){
        
        const { relations, form, is_locked, header, relations_options, return_view } = properties;

        // the relations_options object is used to determine which relations to display, we will create a build package with it
        
        if (!form) return loader();
        //console.log(relations, relations_options)
        const relations_build_package = (relations && relations_options) ? relations_package(relations, relations_options) : [];

        return html`
                <div class="plr--600">
                    <div class="d--f ai--c jc--sb ptb--300">
                        <button onclick="return_to_list()" data-return-view="${return_view || app.view.active.name.split("_")[0] + "_list"}" class="button-bck">
                            <svg viewBox="0 0 24 24">
                                <path d="M0 0h24v24H0V0z"/>
                                <path d="M17.51 3.87L15.73 2.1 5.84 12l9.9 9.9 1.77-1.77L9.38 12l8.13-8.13z"/>
                            </svg>
                            <span>Return to List</span>
                        </button> 
                        <div class="ai--fs d--f g--200">
                            <button 
                                onclick="delete_one()" 
                                class="button-del" 
                                type="button"
                                ${is_locked ? "disabled" : ""}
                            >Delete</button>
                                <button 
                                    ${is_locked ? "disabled" : ""} 
                                    class="button-std" 
                                    onclick="update_one()">Update
                                </button>
                            <button
                                style="width: 9rem;"
                                class="button-rvr no-wrap  ${app.data.user.role_name === 'clerk' ? 'hide' : ''}"
                                type="button"
                                onclick="toggle_form_lock()">${is_locked ? `Edit` : `Discard`}
                            </button>
                        </div>
                    </div>
                    <hr class="full">
                    <form class="form-section" onsubmit="submit()">
                        <h1 class="mb--400">${header}</h1>
                        <div class="fields">${form.map(field => {

                            if (is_locked && field.element?.attributes?.single){
                                //add the disabled attribute single array
                                field.element.attributes.single.push("disabled");
                            } else if (!is_locked && field.element?.attributes?.keyval) {
                                //add the disabled attribute multi array
                                field['class_list'] = "unlocked";
                            }

                            return field_builder(field);
                        })}
                        </div>
                    </form>
                    <hr>
                    <section class="form-section  ${app.data.user.role_name === 'clerk' ? 'hide' : ''}">
                        <h1 class="mb--400">Relations</h1>
                        <div class="pb--400">${relations_build_package.map(relation =>
                            relation_builder(relation))}
                        </div>
                    </section>
                </div>`;
    
    },
    checklist_relations: function({ list: checklist, header, record_id }){
        
        this.isLoading 
            ? log(`CHECKLIST_RELATIONS: Signaling Load`)
            : log(`CHECKLIST_RELATIONS: Load finished, now rendering`, checklist);


        if (!this.isLoading && checklist){

            return html`
                <h3 class="hide">${header}</h3>
                <input type="hidden" data-record-id="${record_id}"/>
                <ul class="checkbox-ul d--f fd--c g--100" role="list">${checklist.map( row => html`
                    <li class="checkbox-li d--f ai--c g--200">
                        <input 
                            data-relation-id="${row['id']}"
                            onclick="toggle_one()"
                            type="checkbox" 
                            name="${row['name']}" 
                            ${row['checked'] ? "checked" : ""}
                        />
                        <label class="fs--775">${row['name']}</label>
                    </li>`)}
                </ul>`;
        } else {
            return loader();
        } 
    },
    /*
    *   list a
    */
    list_a: function({ list, header = "List A"  }){

        this.isLoading 
            ? log(`LIST_A: Signaling Load`)
            : log(`LIST_A: Load finished, now rendering}`, list);

        if (!this.isLoading && list){
            return html`
                <h1>${header}</h1>
                <ul>${list.map( row => html`
                    <li data-key="${row["id"]}">
                        <span>${row["id"]}</span>
                        <span>${row["name"]}</span>
                        <span>${row["price"]}</span>
                        <button onclick="select()">Read</button>
                    </li>`)}
                </ul>`;
        } else {
            return loader();
        }
    },
    /*
    *   Table a
    */
    table_a: function({ list: table, header = "", count, style={}, format={}, classify={}}){

        this.isLoading 
            ? log(`TABLE_A: Signaling Load`)
            : log(`TABLE_A: Load finished, now rendering`, table);
            
        let html_body="";
        let page_count_numerator =0;
        let page_count_denominator =0;

        if (!this.isLoading && table){

            page_count_numerator = this.query_options.active_page;
            page_count_denominator = count || 1;

            if (count > 0){
                html_body = html`
                    <table class="table-a">
                        <tr>${Object.keys(table[0]).map( th => html`<th onclick="sort()" data-sort-key="${th}">${relabelers.standard(th)}</th>`)}</tr>
                        ${table.map((row, i) => { 
                            return html`
                                <tr data-key="${row.id}" class="">${Object.entries(row).map(([key, val]) => { 

                                    val = (key in style) ? style[key](val) : val;
                                    val = (key in format) ? format[key](val) : val;
                                    class_list = (key in classify) ? classify[key] : '';
                                    
                                    return html`<td class="${class_list}">${val}</td>`}).concat([html`
                                <td ${row?.data === "none" ? 'style="display:none"' : ''}>
                                    <button class="button-slt" onclick="manage()">Manage</button>
                                </td>`])}
                        </tr>`})}
                    </table>`

            } else {
                html_body = html`<div class="ta--c text-light w--full no-entries">No entries found</div>`;
            }
         
        } else {
            html_body=loader();
        }

        const filter_options = [
            { text: "Active", value:"is_active|t"},
            { text: "Inactive", value: "is_active|f"}
        ]

        return html`
            <div class="table-a-containor d--f fd--c ai--c g--500 p--400">
                <div class="ai--fe d--f jc--sb w--full">
                    <div class="ai--c d--f g--400">
                        <button class="button-add" onclick="create()">Add ${header} +</button>
                        <div class="page-status text-light">
                            <span>Page: </span>
                            <span class="span-number ${this.isLoading ? 'blur' : ''}">${page_count_numerator}</span>
                            <span>/</span>
                            <span class="span-number ${this.isLoading ? 'blur' : ''}">${page_count_denominator}</span>
                        </div>
                    </div>
                    <div class="d--f ai--c g--400">
                        <input onkeyup="search()" class="input-std" type="text" placeholder="Search..." @value="${this.query_options.ilike}">
                        ${get_filter(filter_options, this.query_options.filter_by)}
                        <div class="paginate-buttons">
                            <button 
                                ${(this.query_options.active_page <= 1) || this.isLoading  ? "disabled" : ""}
                                data-action="page_prev" 
                                onclick="page_prev()" 
                                style="transform: rotate(180deg);" 
                                class="center">${get_svg("caret-right", 'class="center"')}
                            </button>
                            <button
                                ${(this.query_options.active_page >= count) || this.isLoading ? "disabled" : count ? "" : "disabled"}
                                data-action="page_next" 
                                onclick="page_next()" 
                                class="center">${get_svg("caret-right", 'class="center"')}
                            </button>
                        </div>
                    </div>
                </div>
                ${html_body}
            </div>`;
        
    },
    /*
    *   Home Screen
    */
    home: function({ modules }){
        return html`
            <nav class="d--f fd--c jc--sb">
                <div>
                    <div class="logo-containor">
                        <svg class="micro-logo" onclick="reload()" version="1.1" id="Layer_1" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 16 16" style="enable-background:new 0 0 16 16;" xml:space="preserve">
                            <style xmlns="http://www.w3.org/2000/svg" type="text/css">
                                .st0{fill:#FF5252;}
                                .st1{fill:#FF9D41;}
                                .st2{fill:#66B681;}
                                .st3{fill:#0085E2;}
                                .st4{fill:#A91522;}
                                .st5{fill:#6047B5;}
                            </style>
                            <g>
                                <path class="st0" d="M5.72,5.03c-0.37-0.37-0.97-0.37-1.34,0L1.12,8.28c-0.37,0.37-0.37,0.97,0,1.34c0.37,0.37,0.97,0.37,1.34,0   l3.25-3.25C6.09,6,6.09,5.4,5.72,5.03z"/>
                                <path class="st1" d="M7.95,4.14l0.04-0.04l1.47-1.47l0.17-0.17C10,2.09,10,1.48,9.63,1.11c-0.37-0.37-0.97-0.37-1.34,0L8.12,1.28   L6.65,2.75L6.6,2.79c-0.37,0.37-0.37,0.97,0,1.34C6.97,4.51,7.58,4.51,7.95,4.14z"/>
                                <path class="st2" d="M8.13,6.14c-0.37-0.37-0.97-0.37-1.34,0c-0.37,0.37-0.37,0.97,0,1.34l1.14,1.14c0.37,0.37,0.97,0.37,1.34,0   l3.25-3.25c0.37-0.37,0.37-0.97,0-1.34c-0.37-0.37-0.97-0.37-1.34,0L8.6,6.61L8.13,6.14z"/>
                                <path class="st3" d="M14.88,6.48c-0.37-0.37-0.97-0.37-1.34,0l-3.29,3.29l-0.59,0.59l-0.93,0.93c-0.37,0.37-0.37,0.97,0,1.34   C9.1,13,9.7,13,10.07,12.63l0.74-0.74l0.78-0.78l3.29-3.29C15.25,7.46,15.25,6.85,14.88,6.48z"/>
                                <path class="st4" d="M7.05,10.84c0.37-0.37,0.37-0.97,0-1.34c-0.37-0.37-0.97-0.37-1.34,0L5.54,9.66l-1.47,1.47l-0.04,0.04   c-0.37,0.37-0.37,0.97,0,1.34c0.37,0.37,0.97,0.37,1.34,0l0.04-0.04l1.47-1.47L7.05,10.84z"/>
                                <path class="st5" d="M6.47,13.54c-0.37,0.37-0.37,0.97,0,1.34c0.37,0.37,0.97,0.37,1.34,0c0.37-0.37,0.37-0.97,0-1.34   C7.45,13.17,6.84,13.17,6.47,13.54z"/>
                            </g>
                        </svg>
                        <svg class="full-logo" onclick="reload()" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="589.84 467.62 741.84 144.75">
                            <path d="M639.05 509.97c-3.73-3.73-9.84-3.73-13.58 0l-32.83 32.83c-3.73 3.73-3.73 9.84 0 13.58 3.73 3.73 9.84 3.73 13.58 0l32.83-32.83c3.73-3.74 3.73-9.85 0-13.58z" style="fill:#ff5252"/>
                            <path d="m661.6 500.99.43-.43 14.89-14.89 1.67-1.67c3.73-3.73 3.73-9.84 0-13.58-3.73-3.73-9.84-3.73-13.58 0l-1.67 1.67-14.89 14.89-.43.43c-3.73 3.73-3.73 9.84 0 13.58s9.84 3.74 13.58 0z" style="fill:#ff9d41"/>
                            <path d="M663.44 521.22c-3.73-3.73-9.84-3.73-13.58 0-3.73 3.73-3.73 9.84 0 13.58l11.49 11.49c3.73 3.73 9.84 3.73 13.58 0l32.83-32.83c3.73-3.73 3.73-9.84 0-13.58-3.73-3.73-9.84-3.73-13.58 0l-26.04 26.04-4.7-4.7z" style="fill:#66b681"/>
                            <path d="M731.59 524.67c-3.73-3.73-9.84-3.73-13.58 0l-33.23 33.23-5.91 5.91-9.41 9.41c-3.73 3.73-3.73 9.84 0 13.58 3.73 3.73 9.84 3.73 13.58 0l7.48-7.48 7.84-7.84 33.23-33.23c3.73-3.74 3.73-9.85 0-13.58z" style="fill:#0085e2"/>
                            <path d="M652.51 568.69c3.73-3.73 3.73-9.84 0-13.58-3.73-3.73-9.84-3.73-13.58 0l-1.67 1.67-14.89 14.89-.43.43c-3.73 3.73-3.73 9.84 0 13.58 3.73 3.73 9.84 3.73 13.58 0l.43-.43 14.89-14.89 1.67-1.67z" style="fill:#a91522"/>
                            <path d="M646.7 595.98a9.603 9.603 0 1 0 13.58 13.58 9.603 9.603 0 0 0-13.58-13.58z" style="fill:#6047b5"/>
                            <path d="M761.31 549.33h18.52c.84 7.65 4.06 13.98 16.73 13.98 8.48 0 14.1-4.66 14.1-11.35 0-6.81-3.59-9.2-16.13-11.11-21.87-2.87-30.83-9.44-30.83-25.93 0-14.58 12.19-25.45 31.07-25.45 19.24 0 30.47 8.6 32.03 25.57h-17.81c-1.2-7.77-5.74-11.35-14.22-11.35s-12.79 3.94-12.79 9.68c0 6.09 2.75 8.96 15.89 10.87 20.67 2.63 31.31 8.24 31.31 25.93 0 15.18-12.43 27.25-32.62 27.25-23.42-.01-34.18-11.01-35.25-28.09zM837.55 558.77c0-14.58 13.38-20.07 32.5-20.07h7.05v-2.51c0-7.41-2.27-11.47-10.16-11.47-6.81 0-9.92 3.47-10.64 8.84h-16.37c1.08-14.82 12.79-21.39 28.08-21.39 15.3 0 26.17 6.21 26.17 23.18v40.75h-16.85v-7.53c-3.59 5.02-9.08 8.84-18.88 8.84-11.34 0-20.9-5.5-20.9-18.64zm39.55-4.54v-5.26h-6.69c-10.04 0-15.89 2.15-15.89 8.84 0 4.54 2.75 7.53 9.08 7.53 7.64 0 13.5-4.18 13.5-11.11zM909.48 485.28h17.21v90.82h-17.21v-90.82zM938.64 545.62v-.96c0-19.72 13.98-32.5 32.14-32.5 16.13 0 30.47 9.44 30.47 31.79v4.78H956.2c.48 10.4 6.09 16.37 15.53 16.37 8.01 0 11.95-3.47 13.03-8.72h16.37c-2.03 13.5-12.79 21.03-29.87 21.03-18.88 0-32.62-11.83-32.62-31.79zm45.77-7.53c-.6-9.44-5.38-13.98-13.62-13.98-7.77 0-13.03 5.14-14.34 13.98h27.96zM1008.67 556.5h16.13c.72 5.62 3.47 8.84 10.99 8.84 6.69 0 9.8-2.51 9.8-6.81s-3.7-6.09-12.67-7.41c-16.61-2.51-23.06-7.29-23.06-19.48 0-13.03 11.95-19.48 24.74-19.48 13.86 0 24.26 5.02 25.81 19.36h-15.89c-.96-5.14-3.82-7.53-9.8-7.53-5.62 0-8.84 2.63-8.84 6.45 0 3.94 2.99 5.5 12.07 6.81 15.65 2.27 24.26 6.21 24.26 19.6 0 13.5-9.8 20.55-26.29 20.55-16.86.01-26.66-7.4-27.25-20.9zM1073.19 513.6h17.33v9.8c3.47-5.98 10.75-11.23 19.96-11.23 15.3 0 27.25 11.35 27.25 32.02v.96c0 20.67-11.71 32.26-27.25 32.26-9.68 0-16.73-4.78-19.96-10.87v30.83h-17.33V513.6zm46.97 31.66v-.96c0-12.67-6.21-18.88-14.94-18.88-9.08 0-15.3 6.33-15.3 18.88v.96c0 12.55 5.98 18.64 15.42 18.64 9.56.01 14.82-6.45 14.82-18.64zM1149.31 513.6h17.33v11.95c3.94-8.36 10.04-12.79 20.19-12.91v16.13c-12.79-.12-20.19 4.06-20.19 16.01v31.31h-17.33V513.6zM1193.17 545.62v-.96c0-19.72 13.98-32.5 32.14-32.5 16.13 0 30.47 9.44 30.47 31.79v4.78h-45.05c.48 10.4 6.09 16.37 15.53 16.37 8.01 0 11.95-3.47 13.03-8.72h16.37c-2.03 13.5-12.79 21.03-29.87 21.03-18.88 0-32.62-11.83-32.62-31.79zm45.77-7.53c-.6-9.44-5.38-13.98-13.62-13.98-7.77 0-13.02 5.14-14.34 13.98h27.96zM1267.14 513.6h17.33v9.8c3.47-5.98 10.75-11.23 19.96-11.23 15.3 0 27.25 11.35 27.25 32.02v.96c0 20.67-11.71 32.26-27.25 32.26-9.68 0-16.73-4.78-19.96-10.87v30.83h-17.33V513.6zm46.96 31.66v-.96c0-12.67-6.21-18.88-14.94-18.88-9.08 0-15.3 6.33-15.3 18.88v.96c0 12.55 5.97 18.64 15.41 18.64 9.57.01 14.83-6.45 14.83-18.64z"/>
                        </svg>
                    </div>
                    <ul class="modules-list">
                        <h3 class="ul-header">Dealership</h3>${modules.workflow.map(({ text, value }) => html`
                        <li
                            onclick="select_tab()"
                            class="modules-listitem"
                            data-tab-select="${value}"
                        >
                            ${get_svg(value, 'class="svg-std"')}
                            <button
                                class="modules-listitem-button
                                ${value === modules.selected ? 'active' : ''}"
                            >${text}</button>`)}
                        </li>
                    </ul>
                    <hr class="inset">
                    <ul class="modules-list">
                        <h3 class="ul-header">Admin</h3>${modules.admin.map(({ text, value }) => html`
                        <li
                            onclick="select_tab()"
                            data-tab-select="${value}"
                            class="modules-listitem"
                        >
                            ${get_svg(value, 'class="svg-std"')}
                            <button
                                class="modules-listitem-button
                                ${value === modules.selected ? 'active' : ''}">${text}
                            </button>`)}
                        </li>
                    </ul>
                </div>
                <div class="footer-containor">
                    <hr class="inset">
                    <footer class="ai--c d--f fd--c g--400 jc--c ptb--500">
                        <div>Terms of Service | Privacy Policy</div>
                        <div>© 2023 Salesprep</div>
                    </footer>
                </div>
            </nav>
            <div class="app-containor">
                <div id="header-containor">${app.header.html()}</div>
                <main class="start"><!-- Modules Render Here--></main>
                <div id="modal-overlay">
                    <div id="modal-containor">
                        <div class="modal-header-containor d--f jc--sb ai--c mb--400 g--400">
                            <h3 class="fw--b no-wrap" id="modal-header"></h3>
                            <button id="modal-close-button" onclick="close_modal()">
                                <svg class="svg-close-modal" fill="currentColor" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/>
                                    <path fill-rule="evenodd" d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/>
                                </svg>
                            </button>
                        </div>
                        <div id="modal-content" class="modal-std"></div>
                    </div>
                </div>
                <div id="show-message"></div>
                <div id="stall" class="stall"></div>
            </div>
            ${get_svg("background")}`;
    },

}

function loader(class_string = "loading-a"){
    return html`
        <div class="${class_string}">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin: auto; display: block; shape-rendering: auto;" width="200px" height="200px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                <g transform="translate(80,50)">
                <g transform="rotate(0)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="1">
                <animateTransform attributeName="transform" type="scale" begin="-0.875s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.875s"></animate>
                </circle>
                </g>
                </g><g transform="translate(71.21320343559643,71.21320343559643)">
                <g transform="rotate(45)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.875">
                <animateTransform attributeName="transform" type="scale" begin="-0.75s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.75s"></animate>
                </circle>
                </g>
                </g><g transform="translate(50,80)">
                <g transform="rotate(90)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.75">
                <animateTransform attributeName="transform" type="scale" begin="-0.625s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.625s"></animate>
                </circle>
                </g>
                </g><g transform="translate(28.786796564403577,71.21320343559643)">
                <g transform="rotate(135)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.625">
                <animateTransform attributeName="transform" type="scale" begin="-0.5s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.5s"></animate>
                </circle>
                </g>
                </g><g transform="translate(20,50.00000000000001)">
                <g transform="rotate(180)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.5">
                <animateTransform attributeName="transform" type="scale" begin="-0.375s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.375s"></animate>
                </circle>
                </g>
                </g><g transform="translate(28.78679656440357,28.786796564403577)">
                <g transform="rotate(225)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.375">
                <animateTransform attributeName="transform" type="scale" begin="-0.25s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.25s"></animate>
                </circle>
                </g>
                </g><g transform="translate(49.99999999999999,20)">
                <g transform="rotate(270)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.25">
                <animateTransform attributeName="transform" type="scale" begin="-0.125s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.125s"></animate>
                </circle>
                </g>
                </g><g transform="translate(71.21320343559643,28.78679656440357)">
                <g transform="rotate(315)">
                <circle cx="0" cy="0" r="6" fill="#555555" fill-opacity="0.125">
                <animateTransform attributeName="transform" type="scale" begin="0s" values="1.5 1.5;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="0s"></animate>
                </circle>
                </g>
                </g>
            </svg>
        </div>`;
}


function sequence(views = []){
    let view = views.shift();

    if (view){
        return view.then(() => sequence(views));
    }
}

const relabelers= {
    standard: function(key){

        const labels = {
            created_at: "Created",
            updated_at: "Updated"
        }

        if (key in labels){
            return labels[key];
        } else {
            return key;
        }

    }
}
