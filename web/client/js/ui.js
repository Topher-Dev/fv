/**
 * A simple template engine for creating / escaping - prepends all of our template literals eg. html`<h1>${h1}</h1>`.
 * Synergizes with vscode extention "lit-html" Syntax highlighting and IntelliSense for html inside template strings
 * @param  {Array} literals the strings that surround the substitutions eg. ["\n   <h1>","\n   <h2>"]
 * @param  {Array} substitutions the interperolated values eg ["h1"]
 */

function html(literals, ...substitutions) {
    return literals.raw.reduce((accumulation, literal, i) => {

        let subst = substitutions[i-1];
        if (Array.isArray(subst)) {
            subst = subst.join('');
        }

        if (accumulation.endsWith('$')) {
            subst = html_escape(subst);
            accumulation = accumulation.slice(0, -1);
        }
        
        return (accumulation + subst + literal).replace(/\s*\n\s*/g, ' ');
    });
}

function html_escape(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/>/g, '&gt;')
              .replace(/</g, '&lt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/`/g, '&#96;');
}


// Global variables
const messageQueue = [];
let isMessageDisplayed = false;

function show_message(message) {
  // Add the message to the queue
  messageQueue.push(message);

  // If a message is already being displayed, return
  if (isMessageDisplayed) {
    return;
  }

  // Display the next message in the queue
  displayNextMessage();
}

function displayNextMessage() {

  if (messageQueue.length === 0) {
    return;
  }

  // Set the flag to indicate that a message is being displayed
  isMessageDisplayed = true;

  const sm = Q("#show-message");
  const message = messageQueue.shift();

  sm.innerText = message;
  sm.classList.add("active");
  sm.clientWidth; //force layout to ensure CSS transition starts.
  sm.classList.add("transition");

  // Calculate the display duration dynamically based on message length and reading speed
  const displayDuration = Math.max(4000, message.length * 70);

  setTimeout(() => {
    sm.classList.remove("transition");
    setTimeout(() => {
      sm.innerText = "";
      sm.classList.remove("active");
      isMessageDisplayed = false;

      // Display the next message in the queue
      displayNextMessage();
    }, 1000);
  }, displayDuration);
}


function get_input_validation(key){

    const input_validations = {
        validate_email: async function(e){
            
            const input = e.target;
            const value = input.value;

            if (value === "") {
                input.focus();
                return;
            }

            const response= await arc.get(AUTH, "email_check", { email: value });

            const input_group = input.closest(".input-std-group");
            const svg = input_group.querySelector("svg");
            const circle_loader = input_group.querySelector("div.circle-loader");
            const hint = input_group.querySelector("p.input-std-hint");

            if (response.status ===0){
                input.classList.remove("failure");
                input.classList.add("success");
                circle_loader.classList.remove("hide");
                svg.classList.add("hide");
                hint.classList.add("hide");
                Q("#person_password").focus();
                //store the email in local storage 
                localStorage.setItem("email", value);
            } else {
                input.classList.remove("success");
                input.classList.add("failure");
                circle_loader.classList.add("hide");
                svg.classList.remove("hide");
                hint.innerText = "Email not found!";
                hint.classList.remove("hide");
                //remove the email from local storage
                localStorage.removeItem("email");
            }

        }
    }

    //check if the key is a validation
    if (input_validations[key]) {
        return input_validations[key];
    } else {
        console.warn(`Validation ${key} not found`);
        return false;
    }
}

function get_icon({ type, css_class, name }){
    switch (type) {
        case "svg":
            return get_svg(name, `class="${css_class}"`)
        default:
            return "";
    }
}

/*
A function that builds a form field based on a template
@param {string} template - The template to use
@param {object} build_package - The data to build the field with
*/
function field_builder(build_package){

    /* eg
        [{
            template: "input-std",
            label: "company",
            name: "company",
            id: 1,
            value: "sales prep",
            class_list: "d--f fd--c",
            element: {},
            validation: {},
            label: {},
            icon: {}
        }]
     */
    const { template, label, element, validation, name, id, value, class_list, icon } = build_package;

    //Compile the attributes into an array which will be joined & interporlated into the html

    const label_attributes = Object
        .entries(label?.attributes?.keyval || {})
        .map(([k,v]) => `${k}="${v}" ` || [])
        .concat(Object.entries(label?.attributes?.data || {})
            .map(([k,v]) => `data-${k}="${v}" `) || [])
            .concat(label?.attributes?.single?.join(" ") || []);

    const element_attributes = Object.entries(element?.attributes?.keyval || {})
        .map(([k,v]) => `${k}="${v}"`)
        .concat(Object.entries(element?.attributes?.data || {})
        .map(([k,v]) => `data-${k}="${v}" `))
        .concat(Object.entries(validation || {})
        .map(([k,v]) => `${k}="${v}" `))
        .concat(element?.attributes?.single?.join(" ") || [])

    switch (template) {
        case "input-std":
            return html`
                <div class="input-std-group ${class_list || ''} ${icon ? 'ps--r' : ''}">
                    <p class="truncate input-std-hint hint-${name} hide"></p>
                    <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                    <input
                        ${value ? `value="${value}"` : ""}
                        class="input-std-input" 
                        name="${name}" 
                        id="${id}"
                        ${element_attributes}
                    >
                    ${icon ? get_icon(icon) : ""}
                </div>`;
        case "input-datetime":
            return html`
                <div class="input-std-group ${class_list || ''} ${icon ? 'ps--r' : ''}">
                    <p class="truncate input-std-hint hint-${name} hide"></p>
                    <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                    <input
                        ${value ? `value="${value}"` : ""}
                        class="input-std-input" 
                        name="${name}" 
                        id="${id}" 
                        type="datetime-local"
                        ${element_attributes}
                    >
                    ${icon ? get_icon(icon) : ""}
                </div>`;
        case "input-boolean":
            return html`
                <div class="input-std-group ${class_list || ''} ${icon ? 'ps--r' : ''}">
                    <p class="truncate input-std-hint hint-${name} hide"></p>
                    <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                    <div class="toggle-wrapper">
                        <input
                            ${value ? 'checked' : ''}
                            ${element?.attributes?.disabled ? 'disabled' : ''}
                            class="toggle in-stock"
                            name="${name}"
                            id="${id}"
                            type="checkbox"
                            ${element_attributes}
                        >
                        <label for="${id}" class="toggle--label"></label>
                        <div class="foux-toggle"></div>
                    </div>
                </div>`;
        case "input-adv":
                return html`
                    <div class="input-std-group ${class_list || ''} ${icon ? 'ps--r' : ''}">
                        <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                        <p class="input-std-hint hide"></p>
                        <input
                            ${value ? `value="${value}"` : ""}
                            class="input-std-input" 
                            name="${name}" 
                            id="${id}" 
                            ${element_attributes}
                        >
                        ${icon ? get_icon(icon) : ""}
                        <div style="border:none !important" class="ps--a hide circle-loader load-complete" onclick="uncomplete_item()">
                            <div class="checkmark draw" style="display:block;"></div>
                        </div>
                    </div>`;
        case "input-hidden":

            return html`
                <input
                    ${value ? `value=${value}` : ""}
                    type="hidden" 
                    name="${name}" 
                    id="${id}" 
                    ${element_attributes}
                >`;
        case "input-textarea":
            break;
        case "input-hour-range":
            return html`
                <div class="input-hour-range ${class_list || ''}">
                    <label for="${name}" class="input-std-label" ${label_attributes}>${label.text}</label>
                    <input
                        ${value ? `value="${value}"` : ""}
                        class="input-std-input" 
                        name="${name}" 
                        id="${id}" 
                        ${element_attributes}
                    >
                </div>`;
        case "select-std":
            return html`
                <div class="select-std-group ${class_list || ''}">
                    <label id="${id}" for="${name}" class="select-std-label" ${label_attributes}>${label.text}</label>
                    <select ${element_attributes} name="${name}">${element.options.map( o => html`
                        <option ${o?.value == value ? "selected" : ""} value="${o.value}">${o.text}</option>`)}
                    </select>
                </div>`;
        case "select-multi":           
            return html`
                <div class="select-multi-group ${class_list || ''}">
                    <label id="${id}" for="${name}" class="select-multi-label" ${label_attributes}>${label.text}</label>
                    <select ${element_attributes} name="${name}" multiple>${element.options.map( o => { 
                        //console.log(name, "FYANK")
                        return html`
                        <option 
                            ${o?.value === "sms" ? "disabled" : ""}
                            ${o?.value ==="email" ? "selected" : ""}
                            ${o?.value == value ? "selected" : ""} 
                            value="${o.value}">${o.text}
                        </option>`})}
                    </select>
                </div>`;
        case "select-manage":
            return html`
            <div class="select-manage-group">
                <label id="${id}" for="${name}" class="select-manage-label hide" ${label_attributes}>${label?.text}</label>
                <div class="select-manage" ${class_list} data-mode="create">
                    <div class="selected-option-containor">
                        <input ${value ? html`value="$${value}"` : `value=""`} ${element_attributes} onfocus="open_select()" class="selected-option"  autocomplete="off" placeholder="add item..." />
                        <button onclick="switch_mode()" class="select-manage-edit-toggle">${get_svg('edit', 'class="svg-edit"')}</button>
                    </div>
                    <div class="select-options-containor">
                        <div class="select-options-add">
                            <input class="select-options-add-input" autocomplete="off" placeholder="add template item..." />
                            <button onclick="add_option()">${get_svg('check', 'class="svg-select"')}</button>
                        </div>
                        <ul role="list" class="select-options">${element.options.length > 0 ? element.options.map( o => {return html`
                            <li onclick="select_option()" data-type="${o.type}" data-id="${o.id}" data-value="$${o.description}" class="d--f jc--sb ai--c">
                                <span class="template-item truncate">$${o.description}</span>
                                ${get_svg('plus', 'class="svg-plus-2"')}
                            </li>`;}) : html`<li class="ta--c">No entries</li>`   }
                        </ul>
                    </div>
                </div>
            </div>`;
        case "select-multi-search":
            
            //parse the value
            const selected = JSON.parse(value) || {};
            //value format eg.{"people":[],"department":["2|sales","7|detail","5|parts"],"branch":["1|Fall River"],"company":["1|sales prep"]}
            const chips =  Object.entries(selected).reduce((accumulation, entity, i) =>{
                //add type,id,name to the chip
                const [key, val] = entity;

                //if there are no values, return an empty array
                if (val.length === 0) {
                    return accumulation;
                }

                //if there are values, add them to the array
                const values = val.map( v => {
                    const [id, name] = v.split("|");
                    return { id, name, type: key };
                });

                return accumulation.concat(values);
            } , []);

            const none_selected = chips.length === 0;
            
            if (!element?.options){
                element.options = [];
            }

            //Remove from the element.options any of the selected options
            const options = element.options.filter( o => {
                //console.log(element.options, chips, o)
                const selected = chips.find( c => Number(c.id) === Number(o.id) && c.type === o.type);
                //console.log(selected);
                return !selected;
            });

            return html`
                <div class="select-multi-search" style="width:fit-content">
                    <label for="${name}">${label.text}</label>
                    <input 
                        type="hidden" 
                        id="${name}" 
                        name="${name}" 
                        value='${value}'
                        ${element_attributes}
                    >
                    <div class="d--f g--400  multiselect-search">
                        <div class="multiselect-search-containor">
                            <input 
                                id="${id}"
                                placeholder="Search people, department, branch..." 
                                class="multiselect-search-input w--full"
                                ${element_attributes}
                                onkeyup="handle_search_input()"
                            >
                            <ul role="list" class="results">${options.map( r => html`
                                <li 
                                    data-id="${r.id}"
                                    data-type="${r.type}"
                                    data-name="${r.name}"
                                    class="d--f jc--sb ai--c"
                                    onclick="add_selection()"
                                >
                                    <div style="min-width: 28rem">
                                        <p class="d--f g--200 ai--c">
                                            ${get_svg(`${r.type}_chip`, 'class="svg-list"')}
                                            <span class="tt--c text-light">${r.name}</span>
                                        </p>
                                    </div>
                                    ${get_svg('plus', 'class="svg-plus-2"')}
                                </li>`)}
                            </ul>
                        </div>
                        <fieldset class="multiselect-search-selections">
                            <legend>Selected</legend>
                                <div class="multiselect-selected-containor ${!none_selected ? '' : 'ai--c d--f fd--c jc--c h--full pb--400 text-light'}">${!none_selected ? chips.map( s => html`
                                    <button 
                                        class="chip ${s.type}"
                                        data-id="${s.id}"
                                        data-type="${s.type}"
                                        data-name="${s.name}"
                                        ${element_attributes}
                                        onclick="remove_selection()">
                                        <p>${s.name}</p>${get_svg(`${s.type}_chip`, 'class="svg-chip"')}
                                    </button>`) : html`<p class="ta--c">No selections</p>`}
                                </div>
                        </fieldset>
                    </div>
                </div>`;
        default:
            break;
    }
}

function json_deep_parse(obj){
    if (typeof obj === "string") {
        try {
            return JSON.parse(obj);
        } catch (error) {
            return obj;
        }
    } else if (typeof obj === "object") {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = json_deep_parse(obj[key]);
            }
        }
        return obj;
    } else {
        return obj;
    }
}

function relations_package(relations_raw, relations_options){
    return Object.entries(relations_options).map(([key, val]) => {

        const relation_data = relations_raw[key];

        //print an error if the relation is not found
        if (!relation_data) {
            console.error(`Relation ${key} not found in relations object`, relations_raw);
            return;
        }
        //console.log(key, relation_data)
        return {
            key,
            header: val.header,
            module: val.module,
            count: relation_data.count,
            svg: val.svg,
            list: relation_data.list,
            controller: relation_data?.controller || val?.controller
        }
    });
}

function relation_builder(relation_data){

    const { header, count, key } = relation_data;

    return html`
        <section class="mb--300 relation" data-key="${key}">
            <h3 class="mb--200">${header} (${count})</h3>
            ${relation_module(relation_data, header, count)}
        </section>`;
}

function relation_module(data, header, count){

    const { module, list, svg, key } = data;

    const chip_class = relation_to_view[key].split("_")[0];
    switch (module) {
        case "one_to_many":
            return count > 0 
                ? html`
                    <ul role="list" class="d--f fw--w g--100 relation-list">${list.map( item => html`
                        <li class="relation-list-item">
                            <button 
                                class="relation-list-item-button-otm tt--c d--f ai--c g--200 chip ${chip_class}" 
                                data-id="${item.id}"
                                data-view=${relation_to_view[key]}
                                onclick="navigate_one()"
                            >
                                <span class="relation-list-item-name">${item.name}</span>
                                ${get_svg(svg, 'class="relation-list-item-svg"')}
                            </button>
                        </li>`)}
                    </ul>` 
                : html`                
                    <div class="d--f ai--c g--400">
                        <p class="tt--c">No ${header} found</p>
                    </div>`;
        case "many_to_many":
            return count > 0 
                ? html`
                    <div class="d--f ai--c g--400">
                        <button class="button-std" onclick="manage_relations()">Manage All</button>
                        <ul role="list" class="d--f fw--w g--100 relation-list">${list.map( item => html`
                            <li class="relation-list-item">
                                <button
                                    class="relation-list-item-button-mtm tt--c d--f ai--c g--200 chip ${chip_class}"
                                    data-view=${relation_to_view[key]}
                                    data-id="${item.id}"
                                    onclick="navigate_one()"
                                >
                                    <span class="relation-list-item-name">${item.name}</span>
                                    ${get_svg(svg, 'class="relation-list-item-svg"')}
                                </button>
                            </li>`)}
                        </ul>
                    </div>`
                : html`
                    <div class="d--f ai--c g--400">
                        <button class="button-std" onclick="manage_relations()">Manage All</button>
                        <p class="tt--c">No ${header} found</p>
                    </div>`;
        default:
            return html`<p>Relation module not found</p>`;
    }
}

//This will allow us to navigate to the correct view when a relation is clicked
const relation_to_view = {
    "companies": "company_manage",
    "branches": "branch_manage",
    "departments": "department_manage",
    "persons": "person_manage",
    "roles": "role_manage"
}

function get_svg(name, attributes = 'class="svg-std"'){

    switch (name) {
        case "alert-fill":
            return html`
            <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-bell-fill" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
            </svg>`;
        case "search":
            return html`
                <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>`;
        case "cancel":
            return html`
                <svg viewBox="0 0 13 12.911">
                    <path d="M4,11H7.8V5H4Zm0,7H7.8V12H4Zm4.557,0h3.8V12h-3.8Zm4.557,0h3.8V12h-3.8ZM8.557,11h3.8V5h-3.8Zm4.557-6v6h3.8V5Z" transform="translate(-5 16.911) rotate(-90)" fill="#8f959a"/>
                </svg>`;
        case "activity":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2Z"/>
                </svg>`;
        case "arrow-left":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>`;
        case "arrow-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                </svg>`;
        case "arrow-right-square":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
                </svg>`;
        case "caret-right":
            return html`
            <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
            <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
          </svg>`;
        case "caret-down-fill":
            return html`
                <svg ${attributes} fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16">
                    <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                </svg>`;
        case "chevron-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>`;
        case "user":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>`;
        case "lock":
            return html`
                <svg ${attributes} fill="currentColor" class="bi bi-lock-fill" viewBox="0 0 16 16">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2"/>
                </svg>
            `;
        case "locked":
            return html`
                <svg ${attributes} fill="#000000" viewBox="-6.98 0 54.281 54.281">
                    <path id="padlock_locked" data-name="padlock locked" d="M316.862,161.6H281.35l-2.861,0a.98.98,0,0,0-.973.972v29.716a.975.975,0,0,0,.971.969h38.376a.977.977,0,0,0,.973-.971V162.565A.978.978,0,0,0,316.862,161.6Zm-14.145,23.28.317,1.173H292.315l.32-1.173,1.741-6.438a5.395,5.395,0,1,1,6.6,0Zm-16.907-30.9a11.865,11.865,0,1,1,23.73,0v5.29H312.6V153.68a14.729,14.729,0,0,0-14.714-14.71h-.43a14.731,14.731,0,0,0-14.714,14.71v5.589h3.064Z" transform="translate(-277.516 -138.97)"/>
                </svg>`;
        case "unlocked":
            return html`
                <svg ${attributes} fill="#000000" viewBox="-6.98 0 54.281 54.281">
                    <path id="padlock_locked" data-name="padlock locked" d="M316.862,161.6H281.35l-2.861,0a.98.98,0,0,0-.973.972v29.716a.975.975,0,0,0,.971.969h38.376a.977.977,0,0,0,.973-.971V162.565A.978.978,0,0,0,316.862,161.6Zm-14.145,23.28.317,1.173H292.315l.32-1.173,1.741-6.438a5.395,5.395,0,1,1,6.6,0Zm-16.907-30.9a11.865,11.865,0,1,1,23.73,0v5.29H312.6V153.68a14.729,14.729,0,0,0-14.714-14.71h-.43a14.731,14.731,0,0,0-14.714,14.71v5.589h3.064Z" transform="translate(-277.516 -138.97)"/>
                </svg>`;
        case "email":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                </svg>`;
        case "user-fill":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                </svg>`;
        case "loading-a":
            return html`       
                <svg version="1.1" id="L7" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                    viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
                    <path fill="#fff" d="M31.6,3.5C5.9,13.6-6.6,42.7,3.5,68.4c10.1,25.7,39.2,38.3,64.9,28.1l-3.1-7.9c-21.3,8.4-45.4-2-53.8-23.3
                    c-8.4-21.3,2-45.4,23.3-53.8L31.6,3.5z">
                        <animateTransform 
                            attributeName="transform" 
                            attributeType="XML" 
                            type="rotate"
                            dur="2s" 
                            from="0 50 50"
                            to="360 50 50" 
                            repeatCount="indefinite" />
                    </path>
                    <path fill="#fff" d="M42.3,39.6c5.7-4.3,13.9-3.1,18.1,2.7c4.3,5.7,3.1,13.9-2.7,18.1l4.1,5.5c8.8-6.5,10.6-19,4.1-27.7
                    c-6.5-8.8-19-10.6-27.7-4.1L42.3,39.6z">
                        <animateTransform 
                            attributeName="transform" 
                            attributeType="XML" 
                            type="rotate"
                            dur="1s" 
                            from="0 50 50"
                            to="-360 50 50" 
                            repeatCount="indefinite" />
                    </path>
                    <path fill="#fff" d="M82,35.7C74.1,18,53.4,10.1,35.7,18S10.1,46.6,18,64.3l7.6-3.4c-6-13.5,0-29.3,13.5-35.3s29.3,0,35.3,13.5
                    L82,35.7z">
                        <animateTransform 
                            attributeName="transform" 
                            attributeType="XML" 
                            type="rotate"
                            dur="2s" 
                            from="0 50 50"
                            to="360 50 50" 
                            repeatCount="indefinite" />
                    </path>
                </svg>`;
        case "organization_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-buildings" viewBox="0 0 16 16">
                    <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022ZM6 8.694 1 10.36V15h5V8.694ZM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5V15Z"/>
                    <path d="M2 11h1v1H2v-1Zm2 0h1v1H4v-1Zm-2 2h1v1H2v-1Zm2 0h1v1H4v-1Zm4-4h1v1H8V9Zm2 0h1v1h-1V9Zm-2 2h1v1H8v-1Zm2 0h1v1h-1v-1Zm2-2h1v1h-1V9Zm0 2h1v1h-1v-1ZM8 7h1v1H8V7Zm2 0h1v1h-1V7Zm2 0h1v1h-1V7ZM8 5h1v1H8V5Zm2 0h1v1h-1V5Zm2 0h1v1h-1V5Zm0-2h1v1h-1V3Z"/>
                </svg>`;
        case "company_chip":
        case "company_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-building" viewBox="0 0 16 16">
                    <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1ZM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Z"/>
                    <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1Zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1Z"/>
                </svg>`;
        case "branch_chip":
        case "branch_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-diagram-3" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1zM0 11.5A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm4.5.5A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm4.5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/>
                </svg>`;
        case "nav-ufc-fight":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
                </svg>`;
        case "department_chip":
        case "department_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16">
                    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                </svg>`;
        case "role_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-person-vcard" viewBox="0 0 16 16">
                    <path d="M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm4-2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5ZM9 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 9 8Zm1 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z"/>
                    <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2ZM1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8.96c.026-.163.04-.33.04-.5C9 10.567 7.21 9 5 9c-2.086 0-3.8 1.398-3.984 3.181A1.006 1.006 0 0 1 1 12V4Z"/>
                </svg>`;
        case "nav-ufc-event":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-list-stars" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5"/>
                    <path d="M2.242 2.194a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.256-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194z"/>
                </svg>`;
        case "nav-ufc-fighter":
        case "person_chip":
        case "person_list":
            return html`
                <svg ${attributes}  fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>`;
        case "person_fill":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                </svg>`;
        case "person_add":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-person-add" viewBox="0 0 16 16">
                    <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0Zm-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                    <path d="M8.256 14a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256Z"/>
                </svg>`;
        case "person_circle":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                </svg>`;
        case "serti":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-cloud-arrow-up" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z"/>
                    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"/>
                </svg>`;
        case "selling_days":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-calendar-check" viewBox="0 0 16 16">
                    <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                </svg>`;
        case "prepsheet_list":
        case "prepsheet":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-file-earmark-spreadsheet" viewBox="0 0 16 16">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V9H3V2a1 1 0 0 1 1-1h5.5v2zM3 12v-2h2v2H3zm0 1h2v2H4a1 1 0 0 1-1-1v-1zm3 2v-2h3v2H6zm4 0v-2h3v1a1 1 0 0 1-1 1h-2zm3-3h-3v-2h3v2zm-7 0v-2h3v2H6z"/>
                </svg>`;
        case "invite_user":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-envelope-plus" viewBox="0 0 16 16">
                    <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"/>
                    <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-3.5-2a.5.5 0 0 0-.5.5v1h-1a.5.5 0 0 0 0 1h1v1a.5.5 0 0 0 1 0v-1h1a.5.5 0 0 0 0-1h-1v-1a.5.5 0 0 0-.5-.5Z"/>
                </svg>`;
        case "arrow_down":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-arrow-90deg-down" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.854 14.854a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V3.5A2.5 2.5 0 0 1 6.5 1h8a.5.5 0 0 1 0 1h-8A1.5 1.5 0 0 0 5 3.5v9.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4z"/>
                </svg>`;
        case "prepsheet-item":
        case "check":
            return html`
            <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>`;
        case "spedometer":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-speedometer" viewBox="0 0 16 16">
                    <path d="M8 2a.5.5 0 0 1 .5.5V4a.5.5 0 0 1-1 0V2.5A.5.5 0 0 1 8 2zM3.732 3.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 8a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 8zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 7.31A.91.91 0 1 0 8.85 8.569l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
                    <path fill-rule="evenodd" d="M6.664 15.889A8 8 0 1 1 9.336.11a8 8 0 0 1-2.672 15.78zm-4.665-4.283A11.945 11.945 0 0 1 8 10c2.186 0 4.236.585 6.001 1.606a7 7 0 1 0-12.002 0z"/>
                </svg>`;
        case "dot":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-circle-fill" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="8"/>
                </svg>`;
        case "event_type_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-globe" viewBox="0 0 16 16">
                    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
                </svg>`;
        case "x":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>`;
        case "notify-active":
        case "alert_list":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                </svg>`;
        case "notify-inactive":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-bell-slash" viewBox="0 0 16 16">
                    <path d="M5.164 14H15c-.299-.199-.557-.553-.78-1-.9-1.8-1.22-5.12-1.22-6 0-.264-.02-.523-.06-.776l-.938.938c.02.708.157 2.154.457 3.58.161.767.377 1.566.663 2.258H6.164l-1 1zm5.581-9.91a3.986 3.986 0 0 0-1.948-1.01L8 2.917l-.797.161A4.002 4.002 0 0 0 4 7c0 .628-.134 2.197-.459 3.742-.05.238-.105.479-.166.718l-1.653 1.653c.02-.037.04-.074.059-.113C2.679 11.2 3 7.88 3 7c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0c.942.19 1.788.645 2.457 1.284l-.707.707zM10 15a2 2 0 1 1-4 0h4zm-9.375.625a.53.53 0 0 0 .75.75l14.75-14.75a.53.53 0 0 0-.75-.75L.625 15.625z"/>
                </svg>`;
        case "geo":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-geo" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.319 1.319 0 0 0-.37.265.301.301 0 0 0-.057.09V14l.002.008a.147.147 0 0 0 .016.033.617.617 0 0 0 .145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.378-.126.648-.265.813-.395a.619.619 0 0 0 .146-.15.148.148 0 0 0 .015-.033L12 14v-.004a.301.301 0 0 0-.057-.09 1.318 1.318 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465-1.281 0-2.462-.172-3.34-.465-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411z"/>
                </svg>`;
        case "edit":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>`;
        case "arrow-expand":  
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-arrow-expand" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8ZM7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2ZM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10Z"/>
                </svg>`;
        case "arrow-collapse":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-arrow-collapse" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8Zm7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0Zm-.5 11.707-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0v-3.793Z"/>
                </svg>`;
        case "plus":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                </svg>`;
        case "arrow-short":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-arrow-up-short" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5"/>
                </svg>`;
        case "menu-button":
            return html`
                <svg id="i1" width="30" height="22.5" class="icon" viewBox="0 0 60 45">
                    <path id="top-line-1" d="M10,10 L50,10 Z"></path>
                    <path id="middle-line-1" d="M10,23 L50,23 Z"></path>
                    <path id="bottom-line-1" d="M10,36 L50,36 Z"></path>
                </svg>`;
        case "logo-mobile":
            return html`
                <svg width="14" height="14" viewBox="0 0 15.279 12.987">
                    <path d="M8.111,15.987V11.4h3.056v4.584h3.82V9.875h2.292L9.639,3,2,9.875H4.292v6.111Z" transform="translate(-2 -3)" fill="#8f959a"/>
                </svg>`;
        case "logo-dt":
            return html`
                <svg width="14" height="14" viewBox="0 0 15.279 12.987">
                    <path d="M8.111,15.987V11.4h3.056v4.584h3.82V9.875h2.292L9.639,3,2,9.875H4.292v6.111Z" transform="translate(-2 -3)" fill="#8f959a"/>
                </svg>`;
        case "search":
            return html`
                <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>`;
        case "cancel":
            return html`
                <svg viewBox="0 0 13 12.911">
                    <path d="M4,11H7.8V5H4Zm0,7H7.8V12H4Zm4.557,0h3.8V12h-3.8Zm4.557,0h3.8V12h-3.8ZM8.557,11h3.8V5h-3.8Zm4.557-6v6h3.8V5Z" transform="translate(-5 16.911) rotate(-90)" fill="#8f959a"/>
                </svg>`;
        case "activity":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2Z"/>
                </svg>`;
        case "search":
            return html`
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="25" y1="25" x2="16.65" y2="16.65"></line>
                </svg>`;
        case "arrow-left":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>`;
        case "arrow-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                </svg>`;
        case "arrow-right-square":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
                </svg>`;
        case "caret-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M6 12.796V3.204L11.481 8 6 12.796zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753z"/>
                </svg>`;
        case "chevron-right":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>`;
        case "twitter":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>`;
        case "instagram":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                </svg>`;
        case "user":
            return html`
                <svg ${attributes}  fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>`;
        case "lock":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/>
                    <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415z"/>
                </svg>`;
        case "email":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                </svg>
                `;
        case "user-fill":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                </svg>
                `;
        case "lock-fill":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5z"/>
                </svg>
                `;
        case "confirm-fill":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm2.146 5.146a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647z"/>
                </svg>
                `;
        case "inverse-smile":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0-1a8 8 0 1 1 0 16A8 8 0 0 1 8 0z"/>
                    <path d="M4.285 6.433a.5.5 0 0 0 .683-.183A3.498 3.498 0 0 1 8 4.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.498 4.498 0 0 0 8 3.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683zM7 9.5C7 8.672 6.552 8 6 8s-1 .672-1 1.5.448 1.5 1 1.5 1-.672 1-1.5zm4 0c0-.828-.448-1.5-1-1.5s-1 .672-1 1.5.448 1.5 1 1.5 1-.672 1-1.5z"/>
                </svg>`;
        case "anicon":
            return html`
                `;
        case "anicon":
            return html`
                `;
        case "anicon":
            return html`
                `;
        case "check":
            return html`
                <svg id="auth-check" class="auth-svg" viewBox="0 0 130.2 130.2">
                    <polyline class="check" points="100.2,40.2 51.5,88.8 29.8,67.5 "/>
                </svg>`;
        case "x":
            return html`
                <svg id="auth-x" class="auth-svg" viewBox="0 0 130.2 130.2">
                    <line class="x" x1="34.4" y1="37.9" x2="95.8" y2="92.3"/>
                    <line class="x" x1="95.8" y1="38" x2="34.4" y2="92.2"/>
                </svg>`;
        case "+":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                </svg>`;
        case "dot":
            return html`
                <svg ${attributes} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                </svg>`;
        case "trend-down":
            return html`
                <svg ${attributes} viewBox="0 0 512 512">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 368h112V256"/>
                    <path d="M48 144l121.37 121.37a32 32 0 0045.26 0l50.74-50.74a32 32 0 0145.26 0L448 352" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                </svg>`;

        case "trend-up":
            return html`
                <svg ${attributes} viewBox="0 0 512 512">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 144h112v112"/>
                    <path d="M48 368l121.37-121.37a32 32 0 0145.26 0l50.74 50.74a32 32 0 0045.26 0L448 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                </svg>`;
        case "trend-flat":
            return html`
                <svg ${attributes} viewBox="0 0 512 512">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M400 256H112"/>
                </svg>`;
        case "nav-home":
            return html`
                <svg ${attributes} viewBox="0 0 16 16" fill="none">
                    <path class="unselected" d="M8.35355 1.14645C8.15829 0.951184 7.84171 0.951184 7.64645 1.14645L1.64645 7.14645C1.55268 7.24021 1.5 7.36739 1.5 7.5V14.5C1.5 14.7761 1.72386 15 2 15H6.5C6.77614 15 7 14.7761 7 14.5V10.5H9V14.5C9 14.7761 9.22386 15 9.5 15H14C14.2761 15 14.5 14.7761 14.5 14.5V7.5C14.5 7.36739 14.4473 7.24021 14.3536 7.14645L13 5.79289V2.5C13 2.22386 12.7761 2 12.5 2H11.5C11.2239 2 11 2.22386 11 2.5V3.79289L8.35355 1.14645ZM2.5 14V7.70711L8 2.20711L13.5 7.70711V14H10V10C10 9.72386 9.77614 9.5 9.5 9.5H6.5C6.22386 9.5 6 9.72386 6 10V14H2.5Z"/>
                    <path class="selected" d="M6.5 14.5V10.9947C6.5 10.75 6.75 10.5 7 10.5H9C9.25 10.5 9.5 10.75 9.5 11V14.5C9.5 14.7761 9.72386 15 10 15H14C14.2761 15 14.5 14.7761 14.5 14.5V7.5C14.5 7.36739 14.4473 7.24021 14.3536 7.14645L13 5.79289V2.5C13 2.22386 12.7761 2 12.5 2H11.5C11.2239 2 11 2.22386 11 2.5V3.79289L8.35355 1.14645C8.15829 0.951184 7.84171 0.951184 7.64645 1.14645L1.64645 7.14645C1.55268 7.24021 1.5 7.36739 1.5 7.5V14.5C1.5 14.7761 1.72386 15 2 15H6C6.27614 15 6.5 14.7761 6.5 14.5Z"/>
                </svg>`;
        case "nav-ownership":
            return html`
                <svg ${attributes} viewBox="0 0 16 16">
                    <path class="stroked" fill-rule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5zm14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5z"/>
                </svg>`;
        case "nav-whale":
            return html`
                <svg ${attributes} viewBox="0 0 17 16" fill="none">
                    <path class="unselected" d="M8.00004 0L14.6099 3H15.5C15.7762 3 16 3.22386 16 3.5L16 5.5C16 5.77614 15.7761 6 15.5 6H15L15 13C15.2295 13 15.4295 13.1574 15.4851 13.38L15.9851 15.38C16.0224 15.5294 15.9889 15.6886 15.8941 15.81C15.7994 15.9314 15.654 16 15.5 16H0.500035C0.346068 16 0.200686 15.9314 0.105933 15.81C0.011179 15.6886 -0.0223786 15.5294 0.014964 15.38L0.514964 13.38C0.57061 13.1574 0.770601 13 1.00004 13L1 6H0.5C0.223858 6 0 5.77614 0 5.5L3.52859e-05 3.5C3.52859e-05 3.22386 0.223893 3 0.500035 3H1.39022L8.00004 0ZM3.77652 3H12.2235L8.00004 1L3.77652 3ZM2 6L2.00004 13H3.00004L3 6H2ZM4 6L4.00004 13H6.50004L6.5 6H4ZM7.5 6L7.50004 13H8.50004L8.5 6H7.5ZM9.5 6L9.50004 13H12L12 6H9.5ZM13 6L13 13H14V6H13ZM15 5V4H1.00004V5H15ZM14.6096 14H1.39042L1.14042 15H14.8596L14.6096 14Z"/>
                    <path class="selected" d="M8.00004 0L14.6099 3H15.5C15.7762 3 16 3.22386 16 3.5L16 5.5C16 5.77614 15.7761 6 15.5 6H15L15 13C15.2295 13 15.4295 13.1574 15.4851 13.38L15.9851 15.38C16.0224 15.5294 15.9889 15.6886 15.8941 15.81C15.7994 15.9314 15.654 16 15.5 16H0.500035C0.346068 16 0.200686 15.9314 0.105933 15.81C0.011179 15.6886 -0.0223786 15.5294 0.014964 15.38L0.514964 13.38C0.57061 13.1574 0.770601 13 1.00004 13L1 6H0.5C0.223858 6 0 5.77614 0 5.5L3.52859e-05 3.5C3.52859e-05 3.22386 0.223893 3 0.500035 3H1.39022L8.00004 0ZM3.5 6V13H6.70937V9.56254V6H3.5ZM9.30894 6V13H12.5V6H9.30894Z"/>
                </svg>`;
        case "nav-leader":
            return html`
                <svg ${attributes} viewBox="0 0 16 16" fill="none">
                    <path class="unselected" d="M15 14C15 14 16 14 16 13C16 12 15 9 11 9C7 9 6 12 6 13C6 14 7 14 7 14H15ZM7.02235 13C7.01888 12.9996 7.01403 12.999 7.00815 12.998C7.00538 12.9975 7.00266 12.997 7.00001 12.9965C7.00146 12.7325 7.16687 11.9669 7.75926 11.2758C8.31334 10.6294 9.28269 10 11 10C12.7173 10 13.6867 10.6294 14.2407 11.2758C14.8331 11.9669 14.9985 12.7325 15 12.9965C14.9973 12.997 14.9946 12.9975 14.9919 12.998C14.986 12.999 14.9811 12.9996 14.9777 13H7.02235Z"/>
                    <path class="unselected" d="M11 7C12.1046 7 13 6.10457 13 5C13 3.89543 12.1046 3 11 3C9.89543 3 9 3.89543 9 5C9 6.10457 9.89543 7 11 7ZM14 5C14 6.65685 12.6569 8 11 8C9.34315 8 8 6.65685 8 5C8 3.34315 9.34315 2 11 2C12.6569 2 14 3.34315 14 5Z"/>
                    <path class="unselected" d="M6.93593 9.27996C6.56813 9.16232 6.15954 9.07679 5.70628 9.03306C5.48195 9.01141 5.24668 9 5 9C1 9 0 12 0 13C0 13.6667 0.333333 14 1 14H5.21636C5.07556 13.7159 5 13.3791 5 13C5 11.9897 5.37724 10.958 6.08982 10.0962C6.33327 9.80174 6.61587 9.52713 6.93593 9.27996ZM4.92004 10.0005C4.32256 10.9136 4 11.9547 4 13H1C1 12.7393 1.16424 11.97 1.75926 11.2758C2.30468 10.6395 3.25249 10.0197 4.92004 10.0005Z"/>
                    <path class="unselected" d="M1.5 5.5C1.5 3.84315 2.84315 2.5 4.5 2.5C6.15685 2.5 7.5 3.84315 7.5 5.5C7.5 7.15685 6.15685 8.5 4.5 8.5C2.84315 8.5 1.5 7.15685 1.5 5.5ZM4.5 3.5C3.39543 3.5 2.5 4.39543 2.5 5.5C2.5 6.60457 3.39543 7.5 4.5 7.5C5.60457 7.5 6.5 6.60457 6.5 5.5C6.5 4.39543 5.60457 3.5 4.5 3.5Z"/>

                    <path class="selected" d="M7 14C7 14 6 14 6 13C6 12 7 9 11 9C15 9 16 12 16 13C16 14 15 14 15 14H7Z"/>
                    <path class="selected" d="M11 8C12.6569 8 14 6.65685 14 5C14 3.34315 12.6569 2 11 2C9.34315 2 8 3.34315 8 5C8 6.65685 9.34315 8 11 8Z"/>
                    <path class="selected" fill-rule="evenodd" clip-rule="evenodd" d="M5.21636 14C5.07556 13.7159 5 13.3791 5 13C5 11.6445 5.67905 10.2506 6.93593 9.27997C6.3861 9.10409 5.7451 9 5 9C1 9 0 12 0 13C0 14 1 14 1 14H5.21636Z"/>
                    <path class="selected" d="M4.5 8C5.88071 8 7 6.88071 7 5.5C7 4.11929 5.88071 3 4.5 3C3.11929 3 2 4.11929 2 5.5C2 6.88071 3.11929 8 4.5 8Z"/>
                </svg>`;
        case "✔":
            return html`
                <svg ${attributes} viewBox="0 0 130.2 130.2">
                    <polyline class="polyline-check" points="100.2,40.2 51.5,88.8 29.8,67.5 "/>
                </svg>`;
        case "✖":
            return html`
            <svg ${attributes} viewBox="0 0 130.2 130.2">
                <line class="line-x" x1="34.4" y1="37.9" x2="95.8" y2="92.3"/>
                <line class="line-x" x1="95.8" y1="38" x2="34.4" y2="92.2"/>
            </svg>`;
        case "date":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-calendar3" viewBox="0 0 16 16">
                    <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M1 3.857C1 3.384 1.448 3 2 3h12c.552 0 1 .384 1 .857v10.286c0 .473-.448.857-1 .857H2c-.552 0-1-.384-1-.857z"/>
                    <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                </svg>`;
        case "wreath":
            return html`
            <svg ${attributes} xmlns="http://www.w3.org/2000/svg" version="1.0" width="1197.000000pt" height="1280.000000pt" viewBox="0 0 1197.000000 1280.000000" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
            <path d="M3380 12683 c-36 -25 -236 -130 -445 -233 -209 -104 -421 -213 -472 -243 -193 -115 -313 -224 -369 -335 -25 -49 -29 -69 -29 -137 1 -54 6 -93 18 -119 l17 -39 108 6 c165 9 263 49 395 162 92 79 136 131 337 395 210 276 246 319 393 468 66 67 118 122 116 121 -2 0 -33 -21 -69 -46z"/>
            <path d="M8637 12609 c148 -151 186 -196 393 -469 200 -263 245 -316 337 -395 131 -112 230 -153 395 -162 l106 -6 18 34 c13 25 18 57 19 119 0 73 -4 93 -27 141 -56 114 -189 231 -401 353 -54 31 -261 137 -460 235 -199 99 -393 200 -432 226 l-70 47 122 -123z"/>
            <path d="M1869 12087 c-333 -297 -489 -604 -435 -857 17 -79 78 -220 96 -220 20 0 208 196 249 259 63 99 80 168 97 391 15 204 30 308 64 424 11 38 18 71 16 73 -2 3 -42 -29 -87 -70z"/>
            <path d="M10014 12143 c48 -160 62 -246 80 -483 17 -223 34 -293 97 -391 39 -61 230 -259 249 -259 12 0 62 99 86 170 25 74 25 232 0 315 -24 83 -102 228 -172 322 -61 80 -288 314 -325 334 -18 9 -20 8 -15 -8z"/>
            <path d="M1265 11393 c-378 -472 -466 -870 -256 -1165 66 -93 56 -90 112 -28 70 77 156 208 190 290 48 114 55 197 36 406 -20 205 -22 398 -6 509 6 42 8 79 6 81 -2 2 -39 -40 -82 -93z"/>
            <path d="M10624 11460 c18 -103 18 -349 1 -549 -21 -233 -16 -299 31 -416 39 -96 210 -343 239 -344 16 -1 86 99 120 174 132 285 31 642 -299 1055 -97 120 -100 123 -92 80z"/>
            <path d="M2605 11421 c-6 -5 -37 -19 -70 -31 -53 -21 -84 -24 -265 -29 l-205 -6 -75 -36 c-41 -20 -100 -59 -132 -85 -57 -50 -144 -143 -137 -147 17 -12 96 -40 149 -53 46 -12 91 -15 155 -12 103 6 174 30 270 93 61 40 348 314 330 315 -6 0 -15 -4 -20 -9z"/>
            <path d="M9475 11292 c209 -206 305 -261 470 -270 64 -3 109 0 155 12 53 13 132 41 149 52 7 6 -71 90 -132 143 -34 29 -96 70 -137 90 l-75 36 -205 6 c-181 5 -212 8 -265 29 -33 12 -64 26 -69 31 -6 5 -15 9 -20 9 -6 0 52 -62 129 -138z"/>
            <path d="M2180 10783 c-49 -35 -165 -88 -225 -102 -27 -6 -100 -18 -162 -26 -187 -24 -257 -58 -373 -182 -70 -73 -153 -190 -145 -203 3 -4 47 -16 97 -25 272 -50 468 47 689 340 72 96 163 226 157 225 -2 -1 -19 -12 -38 -27z"/>
            <path d="M9791 10749 c294 -436 495 -562 807 -504 50 9 94 21 97 25 8 13 -75 129 -145 204 -114 121 -189 157 -374 181 -188 25 -278 54 -382 125 l-47 33 44 -64z"/>
            <path d="M723 10535 c-82 -146 -146 -286 -192 -420 -61 -178 -75 -252 -76 -410 0 -155 13 -221 66 -331 34 -72 129 -195 184 -237 35 -28 37 -28 50 -10 35 47 127 238 157 323 30 88 32 104 33 225 0 127 -1 134 -57 340 -66 243 -87 351 -96 513 l-7 117 -62 -110z"/>
            <path d="M11176 10513 c-7 -154 -28 -264 -98 -517 -52 -186 -53 -194 -52 -321 0 -120 3 -137 33 -225 29 -85 121 -275 156 -324 13 -17 16 -16 61 20 102 84 188 227 225 374 19 73 21 103 16 215 -8 191 -56 364 -169 606 -42 90 -155 299 -162 299 -2 0 -6 -57 -10 -127z"/>
            <path d="M1819 10014 c-88 -93 -194 -149 -384 -206 -185 -56 -279 -122 -371 -259 -37 -57 -134 -245 -134 -261 0 -13 133 -17 210 -7 246 30 404 151 562 429 38 67 160 331 156 336 -3 2 -20 -12 -39 -32z"/>
            <path d="M10110 10045 c0 -10 128 -281 158 -335 158 -278 316 -399 562 -429 77 -10 210 -6 210 7 0 16 -97 204 -134 261 -92 137 -186 203 -371 259 -192 57 -268 97 -372 195 -29 28 -53 47 -53 42z"/>
            <path d="M282 9457 c-137 -433 -170 -754 -106 -1017 22 -89 92 -233 148 -302 54 -67 151 -150 229 -194 l55 -32 31 87 c90 254 112 463 66 636 -9 33 -70 170 -135 305 -117 242 -194 443 -220 578 -7 35 -16 64 -20 67 -4 2 -26 -55 -48 -128z"/>
            <path d="M11632 9555 c-6 -22 -18 -68 -27 -103 -33 -130 -102 -302 -201 -503 -143 -288 -158 -338 -158 -509 0 -148 21 -257 85 -440 l32 -90 36 22 c174 105 269 206 341 362 48 105 67 177 81 306 23 228 -30 559 -144 895 l-34 100 -11 -40z"/>
            <path d="M1598 9136 c-80 -124 -198 -219 -398 -322 -228 -117 -329 -261 -404 -576 l-23 -97 51 6 c88 9 208 42 281 77 197 94 324 254 413 521 34 104 115 413 110 425 -2 4 -15 -11 -30 -34z"/>
            <path d="M10340 9170 c0 -28 89 -355 120 -445 113 -318 285 -489 558 -554 67 -16 182 -34 182 -28 0 1 -13 52 -29 113 -82 310 -175 441 -393 554 -209 108 -316 194 -404 324 -19 28 -34 44 -34 36z"/>
            <path d="M40 8375 c0 -5 -7 -68 -15 -140 -55 -480 -12 -886 122 -1150 73 -146 194 -280 316 -353 66 -40 201 -99 244 -108 30 -6 30 -5 36 43 51 389 19 625 -112 826 -26 39 -101 140 -167 222 -191 238 -255 336 -361 545 -34 69 -63 121 -63 115z"/>
            <path d="M11890 8308 c-79 -178 -196 -358 -383 -593 -196 -245 -246 -334 -283 -506 -21 -93 -23 -333 -4 -482 l13 -109 30 6 c43 9 178 68 245 108 30 18 89 65 130 103 238 224 348 593 328 1105 -5 149 -31 428 -40 437 -2 2 -18 -29 -36 -69z"/>
            <path d="M1543 8210 c-11 -42 -86 -182 -130 -241 -41 -55 -129 -140 -283 -271 -127 -109 -188 -207 -229 -367 -24 -98 -44 -279 -39 -367 l3 -62 98 38 c186 72 322 175 412 309 113 171 157 362 175 761 9 204 7 254 -7 200z"/>
            <path d="M10415 8163 c2 -37 7 -135 10 -216 23 -597 180 -858 619 -1021 l69 -26 -6 142 c-9 198 -34 319 -89 435 -41 88 -93 150 -201 240 -135 114 -214 191 -260 252 -42 56 -127 216 -127 237 0 7 -5 16 -10 19 -7 4 -9 -17 -5 -62z"/>
            <path d="M1681 7067 c-29 -186 -96 -332 -240 -525 -44 -59 -96 -134 -116 -167 -106 -176 -121 -410 -49 -730 14 -60 27 -111 29 -113 2 -2 34 16 72 40 379 246 505 588 413 1123 -19 113 -88 447 -93 452 -2 1 -9 -35 -16 -80z"/>
            <path d="M10237 6979 c-72 -333 -93 -498 -83 -664 15 -280 121 -493 325 -658 74 -60 180 -131 187 -125 2 3 15 54 28 114 72 322 57 553 -48 727 -20 32 -71 106 -114 165 -158 215 -210 329 -245 537 l-13 78 -37 -174z"/>
            <path d="M24 6880 c3 -14 13 -79 21 -145 55 -412 163 -771 304 -1014 191 -326 444 -494 797 -531 54 -6 98 -9 99 -8 4 5 -24 206 -41 303 -23 126 -86 313 -135 399 -75 133 -168 227 -380 386 -261 197 -424 345 -567 515 -106 127 -104 125 -98 95z"/>
            <path d="M11889 6832 c-78 -97 -260 -283 -362 -368 -48 -41 -151 -122 -228 -180 -161 -121 -232 -183 -304 -266 -134 -153 -217 -386 -259 -728 -7 -58 -12 -106 -11 -108 1 -1 45 2 99 8 354 37 606 205 798 533 111 190 207 468 264 768 18 93 63 403 60 406 -2 2 -27 -27 -57 -65z"/>
            <path d="M2121 6053 c4 -27 8 -101 8 -165 1 -188 -19 -271 -148 -609 -59 -155 -76 -267 -61 -394 19 -157 89 -356 197 -555 l46 -84 45 49 c86 97 164 210 212 309 145 302 124 606 -75 1046 -52 115 -222 450 -229 450 -2 0 1 -21 5 -47z"/>
            <path d="M9767 5938 c-197 -379 -281 -606 -306 -831 -32 -283 68 -551 301 -812 l45 -49 46 84 c108 199 178 398 197 555 15 127 -2 239 -61 394 -127 333 -149 423 -148 603 0 62 4 136 9 163 4 28 7 51 5 53 -2 2 -41 -70 -88 -160z"/>
            <path d="M406 5327 c19 -62 125 -300 194 -437 338 -676 714 -1011 1189 -1060 103 -11 177 -7 319 17 61 10 92 19 89 27 -71 176 -96 234 -141 324 -109 217 -251 395 -391 489 -87 58 -215 120 -420 203 -319 128 -465 204 -706 366 -110 73 -139 89 -133 71z"/>
            <path d="M11510 5309 c-216 -156 -472 -294 -770 -414 -220 -88 -347 -149 -435 -208 -135 -91 -282 -272 -382 -472 -35 -68 -153 -340 -153 -351 0 -5 128 -25 215 -34 192 -20 379 15 560 105 344 169 636 529 900 1110 68 151 128 296 123 300 -2 2 -28 -14 -58 -36z"/>
            <path d="M2833 5140 c3 -8 19 -49 36 -90 87 -221 107 -408 75 -712 -19 -176 -14 -351 11 -443 52 -188 213 -432 423 -638 l69 -69 41 84 c52 108 84 192 113 303 33 128 34 360 2 486 -58 230 -201 466 -449 745 -135 151 -328 352 -321 334z"/>
            <path d="M9023 5032 c-348 -370 -499 -570 -594 -792 -67 -155 -84 -240 -83 -420 0 -135 3 -168 26 -255 27 -101 98 -283 135 -343 l20 -32 94 97 c208 215 344 425 394 608 25 93 29 258 11 439 -32 318 -13 497 79 726 19 46 33 85 31 87 -1 1 -52 -51 -113 -115z"/>
            <path d="M3810 4394 c0 -2 24 -33 53 -67 118 -139 214 -314 266 -482 17 -55 47 -179 66 -275 44 -216 67 -295 112 -385 91 -181 216 -313 438 -465 157 -106 348 -212 357 -197 4 7 14 67 23 132 25 173 16 405 -19 535 -62 234 -157 390 -348 576 -195 189 -343 289 -915 615 -18 10 -33 16 -33 13z"/>
            <path d="M7959 4285 c-384 -220 -568 -348 -738 -511 -219 -209 -331 -415 -377 -684 -24 -147 -15 -393 22 -558 5 -23 5 -23 82 19 382 209 599 401 712 628 48 96 70 172 115 391 43 212 81 337 135 450 61 126 147 255 223 337 17 18 29 34 26 36 -2 2 -92 -46 -200 -108z"/>
            <path d="M1246 3793 c283 -379 629 -724 916 -916 271 -181 530 -269 793 -270 133 -1 229 13 350 50 81 25 295 121 295 133 0 10 -171 222 -249 308 -135 152 -316 293 -455 357 -154 71 -264 96 -581 130 -132 14 -285 33 -340 41 -216 33 -474 100 -674 174 l-84 31 29 -38z"/>
            <path d="M10665 3799 c-189 -71 -453 -139 -670 -173 -55 -8 -208 -27 -340 -41 -326 -35 -433 -60 -590 -135 -183 -87 -384 -266 -588 -520 -59 -73 -107 -136 -107 -140 0 -12 214 -108 295 -133 121 -37 217 -51 350 -50 142 0 256 20 397 69 384 134 779 454 1199 974 94 116 143 180 138 179 -2 0 -40 -14 -84 -30z"/>
            <path d="M4022 2610 c-67 -10 -191 -33 -275 -49 -415 -83 -542 -96 -909 -96 -297 0 -307 -1 -285 -18 57 -46 405 -272 517 -337 359 -208 700 -346 983 -401 187 -35 404 -41 564 -13 271 46 541 190 741 396 l43 45 -108 75 c-233 163 -475 296 -643 352 -193 64 -413 80 -628 46z"/>
            <path d="M7530 2615 c-259 -44 -508 -162 -853 -403 l-108 -75 38 -40 c103 -106 261 -221 401 -291 285 -143 656 -167 1037 -67 354 93 777 301 1205 592 80 55 155 107 167 117 22 16 10 17 -285 17 -371 0 -478 11 -932 100 -338 66 -506 78 -670 50z"/>
            <path d="M5635 2024 c28 -25 93 -82 145 -126 52 -44 96 -83 97 -87 4 -10 -826 -404 -1177 -558 -501 -221 -789 -324 -970 -347 l-85 -11 106 -440 c92 -380 108 -435 114 -400 21 120 72 219 169 322 131 141 297 257 811 569 547 331 758 469 1041 681 61 46 114 83 118 83 4 0 51 -33 104 -73 271 -206 512 -364 1037 -682 513 -311 665 -416 806 -557 36 -36 83 -91 104 -123 43 -66 84 -174 85 -224 0 -19 2 -32 5 -29 4 4 215 861 215 873 0 1 -31 5 -68 8 -239 23 -803 250 -1772 714 -212 102 -387 187 -390 190 -3 2 9 16 25 30 116 98 264 228 262 230 -2 1 -95 -43 -207 -98 -193 -95 -205 -99 -234 -88 -17 7 -112 52 -211 101 l-180 89 50 -47z"/>
            </g>
            </svg>`;
        case "spinner":
            return html`
                <svg ${attributes} viewBox="0 0 48 48">
                    <circle cx="24" cy="4" r="4" fill="#fff"/>
                    <circle cx="12.19" cy="7.86" r="3.7" fill="#fffbf2"/>
                    <circle cx="5.02" cy="17.68" r="3.4" fill="#fef7e4"/>
                    <circle cx="5.02" cy="30.32" r="3.1" fill="#fef3d7"/>
                    <circle cx="12.19" cy="40.14" r="2.8" fill="#feefc9"/>
                    <circle cx="24" cy="44" r="2.5" fill="#feebbc"/>
                    <circle cx="35.81" cy="40.14" r="2.2" fill="#fde7af"/>
                    <circle cx="42.98" cy="30.32" r="1.9" fill="#fde3a1"/>
                    <circle cx="42.98" cy="17.68" r="1.6" fill="#fddf94"/>
                    <circle cx="35.81" cy="7.86" r="1.3" fill="#fcdb86"/>
                </svg>`;
        case "geo":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-geo" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.3 1.3 0 0 0-.37.265.3.3 0 0 0-.057.09V14l.002.008.016.033a.6.6 0 0 0 .145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.378-.126.648-.265.813-.395a.6.6 0 0 0 .146-.15l.015-.033L12 14v-.004a.3.3 0 0 0-.057-.09 1.3 1.3 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465s-2.462-.172-3.34-.465c-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411"/>
                </svg>`;
        case "clock":
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                </svg>`;
        case "background":
                return html`
                    <svg class="svg-background" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
                        <defs>
                            <linearGradient id="a">
                                <stop offset="0%" style="stop-color:rgba(130,158,249,.06)"/>
                                <stop offset="50%" style="stop-color:rgba(76,190,255,.6)"/>
                                <stop offset="100%" style="stop-color:rgba(115,209,72,.2)"/>
                            </linearGradient>
                            <path id="b" fill="url(#a)" d="M-363.852 502.589s236.988-41.997 505.475 0 371.981 38.998 575.971 0 293.985-39.278 505.474 5.859 493.475 48.368 716.963-4.995v560.106H-363.852v-560.97z"/>
                        </defs>
                        <use xlink:href="#b" opacity=".3">
                            <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="160s" calcMode="spline" values="270 230; -334 180; 270 230" keyTimes="0; .5; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite"/>
                        </use>
                        <use xlink:href="#b" opacity=".6">
                            <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="120s" calcMode="spline" values="-270 230;243 220;-270 230" keyTimes="0; .6; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite"/>
                        </use>
                        <use xlink:href="#b" opacity=".4">
                            <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="80s" calcMode="spline" values="0 230;-140 200;0 230" keyTimes="0; .4; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite"/>
                        </use>
                    </svg>`;
        default:
            return html`
                <svg ${attributes} width="16" height="16" fill="currentColor" class="bi bi-diamond" viewBox="0 0 16 16">
                    <path d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.482 1.482 0 0 1 0-2.098L6.95.435zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134z"/>
                </svg>`;
    }
}

// Step 1: Extract Keys from get_svg Function
function extract_svg_keys() {
    const keys = [];
    // Assuming get_svg is defined in the scope
    const get_svg_str = get_svg.toString();
    const case_regex = /case\s+"([^"]+)":/g;
    let match;

    while ((match = case_regex.exec(get_svg_str)) !== null) {
        keys.push(match[1]);
    }

    return keys;
}

// Step 2: Create Container Element Dynamically
function create_container_element() {
    const container = document.createElement('div');
    container.id = 'svg-container';
    document.body.appendChild(container);
    return container;
}

// Step 3: Retrieve SVG HTML and Inject into Container
function display_svgs() {
    const keys = extract_svg_keys();
    const container = create_container_element();

    keys.forEach(key => {
        const svg_html = get_svg(key);
        const svg_container = document.createElement('div');
        svg_container.innerHTML = `<h4>${key}</h4>${svg_html}`;
        svg_container.style.display = 'inline-block';
        svg_container.style.margin = '10px';
        container.appendChild(svg_container);
    });
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
